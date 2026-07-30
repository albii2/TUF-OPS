import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { pool } from '@packages/database';
import type {
  EmailAccount,
  SendEmailInput,
  EmailLogEntry,
  EmailTemplate,
} from './email.interface';

// ── Zoho SMTP Account Configurations ──────────────────────────────────

const ACCOUNTS: Record<string, EmailAccount> = {
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

const SMTP_CONFIG = {
  host: 'smtp.zoho.com',
  port: 587,
  secure: false, // TLS with STARTTLS on port 587
  authMethod: 'login',
};

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const rateLimitBuckets: Record<string, RateLimitBucket> = {};

// ── Transport Factory ─────────────────────────────────────────────────

function createTransporter(accountKey: string): Transporter {
  const envKey = `ZOHO_${accountKey.toUpperCase()}_APP_PASSWORD`;
  const password = process.env[envKey];

  if (!password) {
    throw new Error(
      `Missing environment variable: ${envKey}. Generate an App Password in Zoho Mail admin console.`,
    );
  }

  const account = ACCOUNTS[accountKey];
  if (!account) {
    throw new Error(`Unknown email account: ${accountKey}`);
  }

  return nodemailer.createTransport({
    host: SMTP_CONFIG.host,
    port: SMTP_CONFIG.port,
    secure: SMTP_CONFIG.secure,
    auth: {
      user: account.email,
      pass: password,
    },
    // Zoho rate limit advice: throttle to avoid hitting 150/day cap
  });
}

// Transport cache so we don't recreate per send
const transporterCache: Record<string, Transporter> = {};

function getTransporter(accountKey: string): Transporter {
  if (!transporterCache[accountKey]) {
    transporterCache[accountKey] = createTransporter(accountKey);
  }
  return transporterCache[accountKey];
}

// ── Rate Limiting (150/day per free-tier Zoho account) ────────────────

const DAILY_LIMIT = 150;
const DAILY_WINDOW_MS = 24 * 60 * 60 * 1000;

function checkRateLimit(accountKey: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const bucket = rateLimitBuckets[accountKey];

  if (!bucket || now >= bucket.resetAt) {
    rateLimitBuckets[accountKey] = { count: 0, resetAt: now + DAILY_WINDOW_MS };
    return { allowed: true, remaining: DAILY_LIMIT };
  }

  if (bucket.count >= DAILY_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: DAILY_LIMIT - bucket.count };
}

function recordSend(accountKey: string): void {
  const now = Date.now();
  const bucket = rateLimitBuckets[accountKey];
  if (!bucket || now >= bucket.resetAt) {
    rateLimitBuckets[accountKey] = { count: 1, resetAt: now + DAILY_WINDOW_MS };
    return;
  }
  bucket.count += 1;
}

// ── Template Engine ───────────────────────────────────────────────────

function applyTemplateVariables(
  template: string,
  vars: Record<string, string>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, varName: string) => {
    return vars[varName] !== undefined ? vars[varName] : match;
  });
}

// ── Email Logging ─────────────────────────────────────────────────────

async function logEmail(
  input: SendEmailInput,
  account: EmailAccount,
  status: 'sent' | 'failed',
  sentBy: number,
  errorMessage?: string,
): Promise<EmailLogEntry> {
  const result = await pool.query(
    `INSERT INTO email_log
       (from_account, from_email, to_email, subject, body_html, body_text,
        template_id, template_vars, status, error_message,
        entity_type, entity_id, sent_by, sent_at, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
     RETURNING *`,
    [
      input.from_account,
      account.email,
      input.to,
      input.subject,
      input.body_html || null,
      input.body_text || null,
      input.template_id || null,
      JSON.stringify(input.template_vars || {}),
      status,
      errorMessage || null,
      input.entity_type || null,
      input.entity_id || null,
      sentBy,
    ],
  );
  return result.rows[0];
}

// ── Public API ────────────────────────────────────────────────────────

export async function sendEmail(
  input: SendEmailInput,
  sentBy: number,
): Promise<EmailLogEntry> {
  const account = ACCOUNTS[input.from_account];
  if (!account) {
    throw new Error(
      `Unknown email account: ${input.from_account}. Available: ${Object.keys(ACCOUNTS).join(', ')}`,
    );
  }

  // Rate limit check
  const limit = checkRateLimit(input.from_account);
  if (!limit.allowed) {
    throw new Error(
      `Rate limit exceeded for ${account.email}. Daily limit is ${DAILY_LIMIT} emails. Resets in ~${Math.ceil((rateLimitBuckets[input.from_account].resetAt - Date.now()) / (60 * 60 * 1000))}h.`,
    );
  }

  let bodyHtml = input.body_html || '';
  let bodyText = input.body_text || '';
  let subject = input.subject;

  // If a template is specified, resolve it
  if (input.template_id) {
    const template = await getTemplate(input.template_id);
    if (template) {
      const vars = input.template_vars || {};
      subject = applyTemplateVariables(template.subject_template, vars);
      bodyHtml = applyTemplateVariables(template.body_html, vars);
      bodyText = bodyHtml.replace(/<[^>]*>/g, '');
    }
  }

  const transporter = getTransporter(input.from_account);

  try {
    await transporter.sendMail({
      from: `"${account.name}" <${account.email}>`,
      to: input.to,
      subject,
      html: bodyHtml,
      text: bodyText || undefined,
    });

    recordSend(input.from_account);

    const log = await logEmail(
      { ...input, subject, body_html: bodyHtml, body_text: bodyText },
      account,
      'sent',
      sentBy,
    );
    return log;
  } catch (error: any) {
    const errMsg = error?.message || String(error);
    console.error(`[email:send] Failed to send via ${account.email}:`, errMsg);

    const log = await logEmail(
      { ...input, subject, body_html: bodyHtml, body_text: bodyText },
      account,
      'failed',
      sentBy,
      errMsg,
    );
    throw new Error(`Email send failed: ${errMsg}`);
  }
}

// ── Templates ─────────────────────────────────────────────────────────

export async function getTemplates(
  category?: string,
): Promise<EmailTemplate[]> {
  let query = 'SELECT * FROM email_templates WHERE is_active = true';
  const params: any[] = [];
  if (category) {
    query += ' AND category = $1';
    params.push(category);
  }
  query += ' ORDER BY name ASC';
  const result = await pool.query(query, params);

  return result.rows.map((row) => ({
    ...row,
    variables: row.variables || [],
  }));
}

export async function getTemplate(id: number): Promise<EmailTemplate | null> {
  const result = await pool.query(
    'SELECT * FROM email_templates WHERE id = $1 AND is_active = true',
    [id],
  );
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    ...row,
    variables: row.variables || [],
  };
}

// ── Email Log ─────────────────────────────────────────────────────────

export async function getEmailLogs(params: {
  entity_type?: string;
  entity_id?: number;
  from_account?: string;
  limit?: number;
  offset?: number;
}): Promise<EmailLogEntry[]> {
  let query = 'SELECT * FROM email_log WHERE 1=1';
  const values: any[] = [];
  let i = 1;

  if (params.entity_type) {
    query += ` AND entity_type = $${i++}`;
    values.push(params.entity_type);
  }
  if (params.entity_id !== undefined) {
    query += ` AND entity_id = $${i++}`;
    values.push(params.entity_id);
  }
  if (params.from_account) {
    query += ` AND from_account = $${i++}`;
    values.push(params.from_account);
  }

  query += ' ORDER BY sent_at DESC';
  query += ` LIMIT $${i++} OFFSET $${i++}`;
  values.push(params.limit || 50, params.offset || 0);

  const result = await pool.query(query, values);
  return result.rows;
}

export async function getEmailLog(id: number): Promise<EmailLogEntry | null> {
  const result = await pool.query('SELECT * FROM email_log WHERE id = $1', [id]);
  return result.rows[0] || null;
}

// ── Account Info ──────────────────────────────────────────────────────

export function getAccounts(): EmailAccount[] {
  return Object.values(ACCOUNTS).map((a) => ({
    key: a.key,
    email: a.email,
    name: a.name,
  }));
}

export function getAccountStatus(): Array<EmailAccount & { configured: boolean; daily_remaining: number | null }> {
  return Object.values(ACCOUNTS).map((a) => {
    const envKey = `ZOHO_${a.key.toUpperCase()}_APP_PASSWORD`;
    const configured = Boolean(process.env[envKey]);
    const bucket = rateLimitBuckets[a.key];
    let dailyRemaining: number | null = null;
    if (bucket && Date.now() < bucket.resetAt) {
      dailyRemaining = Math.max(0, DAILY_LIMIT - bucket.count);
    } else {
      dailyRemaining = DAILY_LIMIT;
    }
    return {
      ...a,
      configured,
      daily_remaining: configured ? dailyRemaining : null,
    };
  });
}
