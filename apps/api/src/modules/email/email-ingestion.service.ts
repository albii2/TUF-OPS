import { pool } from '@packages/database';
import type { EmailInboxEntry, InboxAccount } from './email.interface';

// ── Zoho IMAP Account Configurations ──────────────────────────────

interface ImapAccount {
  key: string;
  email: string;
  name: string;
}

export const IMAP_ACCOUNTS: Record<string, ImapAccount> = {
  abradshaw: {
    key: 'abradshaw',
    email: 'abradshaw@tufsports.us',
    name: 'Alex Bradshaw',
  },
  hr: {
    key: 'hr',
    email: 'hr@tufsports.us',
    name: 'TUF Sports HR',
  },
  order: {
    key: 'order',
    email: 'order@tufsports.us',
    name: 'TUF Sports Orders',
  },
};

const IMAP_CONFIG = {
  host: 'imap.zoho.com',
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: true },
};

// ── Polling State ──────────────────────────────────────────────────

const pollingState: Record<string, { lastPolledAt: Date | null; running: boolean }> = {};

function getPollState(accountKey: string) {
  if (!pollingState[accountKey]) {
    pollingState[accountKey] = { lastPolledAt: null, running: false };
  }
  return pollingState[accountKey];
}

// ── IMAP Client (lazy-loaded to avoid requiring imapflow at import time) ──

let ImapFlow: any = null;

async function getImapFlow() {
  if (!ImapFlow) {
    try {
      const mod = await import('imapflow');
      ImapFlow = mod.ImapFlow;
    } catch {
      throw new Error(
        'imapflow package is required for email ingestion. Run: pnpm add imapflow',
      );
    }
  }
  return ImapFlow;
}

// ── Simple mail parser (no dependency on mailparser) ───────────────

interface ParsedEmail {
  messageId: string;
  senderEmail: string;
  senderName: string;
  subject: string;
  bodyText: string;
  bodyHtml: string;
  receivedAt: Date;
  hasAttachments: boolean;
  attachmentInfo: Array<{ filename: string; contentType: string; size: number }>;
}

function parseImapEnvelope(envelope: any, source: any): ParsedEmail {
  const fromAddr = envelope.from?.[0];
  const senderEmail = fromAddr?.address || 'unknown@unknown.com';
  const senderName = fromAddr?.name || '';

  const subject = envelope.subject || '(no subject)';
  const messageId = envelope.messageId || `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const receivedAt = envelope.date ? new Date(envelope.date) : new Date();

  // Extract body parts
  let bodyText = '';
  let bodyHtml = '';
  const attachmentInfo: Array<{ filename: string; contentType: string; size: number }> = [];
  let hasAttachments = false;

  if (source) {
    // Walk the MIME tree
    function walkParts(node: any) {
      if (!node) return;
      if (Array.isArray(node.childNodes)) {
        for (const child of node.childNodes) {
          walkParts(child);
        }
        return;
      }
      const contentType = (node.contentType || '').toLowerCase();
      const disposition = (node.disposition || '').toLowerCase();

      if (disposition === 'attachment' || contentType.includes('application/')) {
        hasAttachments = true;
        attachmentInfo.push({
          filename: node.filename || 'unnamed',
          contentType: node.contentType || 'application/octet-stream',
          size: node.size || 0,
        });
        return;
      }

      if (contentType.includes('text/plain') && !bodyText) {
        if (typeof node.content === 'string') {
          bodyText = node.content;
        } else if (Buffer.isBuffer(node.content)) {
          bodyText = node.content.toString('utf-8');
        }
      }
      if (contentType.includes('text/html') && !bodyHtml) {
        if (typeof node.content === 'string') {
          bodyHtml = node.content;
        } else if (Buffer.isBuffer(node.content)) {
          bodyHtml = node.content.toString('utf-8');
        }
      }
    }

    walkParts(source);
  }

  // Fallback: if no text/html part found but source has a direct text
  if (!bodyText && !bodyHtml && source?.text) {
    bodyText = source.text;
  }

  return {
    messageId,
    senderEmail,
    senderName,
    subject,
    bodyText,
    bodyHtml,
    receivedAt,
    hasAttachments,
    attachmentInfo,
  };
}

// ── Fetch emails from a single inbox ───────────────────────────────

async function fetchInbox(
  accountKey: string,
  account: ImapAccount,
): Promise<{ fetched: number; skipped: number; errors: string[] }> {
  const state = getPollState(accountKey);
  if (state.running) {
    return { fetched: 0, skipped: 0, errors: ['Already running'] };
  }

  const envKey = `ZOHO_${accountKey.toUpperCase()}_APP_PASSWORD`;
  const password = process.env[envKey];
  if (!password) {
    return { fetched: 0, skipped: 0, errors: [`Missing env: ${envKey}`] };
  }

  state.running = true;
  const errors: string[] = [];
  let fetched = 0;
  let skipped = 0;

  try {
    const ImapFlowClass = await getImapFlow();
    const client = new ImapFlowClass({
      host: IMAP_CONFIG.host,
      port: IMAP_CONFIG.port,
      secure: true,
      auth: {
        user: account.email,
        pass: password,
      },
      logger: false,
    });

    await client.connect();

    // Select INBOX
    const lock = await client.getMailboxLock('INBOX');
    try {
      // Search for UNSEEN messages (limit to 50 per poll to avoid overload)
      const unseenMessages: any[] = [];
      const list = client.fetch(
        { unseen: true },
        { envelope: true, source: true, bodyStructure: true },
      );
      for await (const msg of list) {
        unseenMessages.push(msg);
        if (unseenMessages.length >= 50) break;
      }

      for (const msg of unseenMessages) {
        try {
          const parsed = parseImapEnvelope(msg.envelope, msg.source);

          // Check if we already have this message_id for this account
          const existing = await pool.query(
            'SELECT id FROM email_inbox WHERE message_id = $1 AND account = $2',
            [parsed.messageId, accountKey],
          );

          if (existing.rows.length > 0) {
            skipped++;
            // Still mark as read on the server
            try { await client.messageFlagsSet(msg.seq.toString(), ['\\Seen']); } catch {}
            continue;
          }

          // Store in database
          await pool.query(
            `INSERT INTO email_inbox
               (account, message_id, sender_email, sender_name, recipient_email,
                subject, body_text, body_html, has_attachments, attachment_info,
                received_at, is_read, processed)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, false, false)
             ON CONFLICT (message_id, account) DO NOTHING`,
            [
              accountKey,
              parsed.messageId,
              parsed.senderEmail,
              parsed.senderName || null,
              account.email,
              parsed.subject,
              parsed.bodyText || null,
              parsed.bodyHtml || null,
              parsed.hasAttachments,
              JSON.stringify(parsed.attachmentInfo),
              parsed.receivedAt,
            ],
          );

          fetched++;

          // Mark as seen on the IMAP server
          try {
            await client.messageFlagsSet(msg.seq.toString(), ['\\Seen']);
          } catch {
            // Non-critical — we already stored it
          }
        } catch (err: any) {
          errors.push(`Failed to process message in ${accountKey}: ${err.message}`);
        }
      }
    } finally {
      lock.release();
    }

    await client.logout();
    state.lastPolledAt = new Date();
  } catch (err: any) {
    errors.push(`IMAP error for ${accountKey}: ${err.message}`);
  } finally {
    state.running = false;
  }

  return { fetched, skipped, errors };
}

// ── Poll All Inboxes ───────────────────────────────────────────────

export async function pollAllInboxes(): Promise<{
  accounts: Record<string, { fetched: number; skipped: number; errors: string[] }>;
  totalFetched: number;
}> {
  const results: Record<string, { fetched: number; skipped: number; errors: string[] }> = {};
  let totalFetched = 0;

  const entries = Object.entries(IMAP_ACCOUNTS);
  // Poll accounts sequentially to avoid rate limiting
  for (const [key, account] of entries) {
    const result = await fetchInbox(key, account);
    results[key] = result;
    totalFetched += result.fetched;
  }

  return { accounts: results, totalFetched };
}

// ── Polling Cron ───────────────────────────────────────────────────

let pollInterval: ReturnType<typeof setInterval> | null = null;

export function startEmailPolling(intervalMs: number = 5 * 60 * 1000): void {
  if (pollInterval) return;

  console.log(`[email:ingestion] Starting email polling every ${intervalMs / 1000}s`);

  // Do an immediate first poll
  pollAllInboxes().then((result) => {
    console.log(`[email:ingestion] Initial poll: ${result.totalFetched} new emails`);
  }).catch((err) => {
    console.error('[email:ingestion] Initial poll failed:', err.message);
  });

  pollInterval = setInterval(() => {
    pollAllInboxes().then((result) => {
      if (result.totalFetched > 0) {
        console.log(`[email:ingestion] Poll fetched ${result.totalFetched} new emails`);
      }
    }).catch((err) => {
      console.error('[email:ingestion] Poll error:', err.message);
    });
  }, intervalMs);
}

export function stopEmailPolling(): void {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
    console.log('[email:ingestion] Email polling stopped');
  }
}

// ── Account Status ─────────────────────────────────────────────────

export function getInboxAccountStatus(): InboxAccount[] {
  return Object.values(IMAP_ACCOUNTS).map((a) => {
    const envKey = `ZOHO_${a.key.toUpperCase()}_APP_PASSWORD`;
    const configured = Boolean(process.env[envKey]);
    const state = getPollState(a.key);
    return {
      key: a.key,
      email: a.email,
      name: a.name,
      configured,
      last_polled_at: state.lastPolledAt?.toISOString() || null,
      unread_count: null, // populated on demand
    };
  });
}

// ── Data Access ────────────────────────────────────────────────────

export async function getInboxEmails(params: {
  account?: string;
  processed?: boolean;
  limit?: number;
  offset?: number;
}): Promise<EmailInboxEntry[]> {
  const conditions: string[] = [];
  const values: any[] = [];
  let i = 1;

  if (params.account) {
    conditions.push(`account = $${i++}`);
    values.push(params.account);
  }
  if (params.processed !== undefined) {
    conditions.push(`processed = $${i++}`);
    values.push(params.processed);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await pool.query<EmailInboxEntry>(
    `SELECT * FROM email_inbox ${where} ORDER BY received_at DESC
     LIMIT $${i++} OFFSET $${i++}`,
    [...values, params.limit || 50, params.offset || 0],
  );
  return result.rows;
}

export async function getInboxEmailById(id: number): Promise<EmailInboxEntry | null> {
  const result = await pool.query<EmailInboxEntry>(
    'SELECT * FROM email_inbox WHERE id = $1',
    [id],
  );
  return result.rows[0] || null;
}

export async function markEmailProcessed(id: number): Promise<void> {
  await pool.query(
    'UPDATE email_inbox SET processed = true WHERE id = $1',
    [id],
  );
}
