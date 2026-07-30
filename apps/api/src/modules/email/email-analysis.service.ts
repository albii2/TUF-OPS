import { pool } from '@packages/database';
import type {
  EmailInboxEntry,
  EmailAnalysisEntry,
  EmailClassification,
  EmailPriority,
  EmailInboxWithAnalysis,
  InboxListQuery,
} from './email.interface';
import { getInboxEmailById, markEmailProcessed } from './email-ingestion.service';

// ── Classification Keywords ────────────────────────────────────────

const CLASSIFICATION_RULES: Array<{
  classification: EmailClassification;
  keywords: RegExp[];
  subjectPatterns: RegExp[];
}> = [
  {
    classification: 'order_related',
    keywords: [
      /\b(?:order|PO|purchase order|invoice|shipment|tracking|delivery|quote|SKU|product)\b/i,
      /\b(?:order #|order number|order_id)\b/i,
      /\b(?:size|quantity|color|custom|uniform|jersey|apparel)\b/i,
    ],
    subjectPatterns: [
      /order/i,
      /purchase/i,
      /invoice/i,
      /ship/i,
      /delivery/i,
      /quote/i,
      /PO\b/i,
    ],
  },
  {
    classification: 'hr_related',
    keywords: [
      /\b(?:resign|resignation|two weeks|notice|HR|human resources|benefits|payroll|salary|time off|PTO|sick|leave)\b/i,
      /\b(?:hiring|interview|candidate|application|onboarding|offer letter|contract)\b/i,
      /\b(?:complaint|harassment|discrimination|grievance|policy)\b/i,
    ],
    subjectPatterns: [
      /resign/i,
      /notice/i,
      /HR/i,
      /benefits/i,
      /payroll/i,
      /salary/i,
      /leave/i,
      /hiring/i,
      /interview/i,
      /complaint/i,
    ],
  },
  {
    classification: 'sales_related',
    keywords: [
      /\b(?:demo|pricing|proposal|quote|interested|learn more|tell me about|information|brochure|catalog)\b/i,
      /\b(?:team store|spirit wear|fundraiser|program|season)\b/i,
      /\b(?:referral|recommended|referred by|introduction)\b/i,
    ],
    subjectPatterns: [
      /demo/i,
      /pricing/i,
      /proposal/i,
      /interest/i,
      /information/i,
      /question/i,
      /referral/i,
      /introduction/i,
    ],
  },
  {
    classification: 'urgent',
    keywords: [
      /\b(?:urgent|ASAP|as soon as possible|emergency|critical|immediately|right away|NOW)\b/i,
      /\b(?:deadline|due|overdue|past due|late|delay|delayed|rushed)\b/i,
    ],
    subjectPatterns: [
      /urgent/i,
      /ASAP/i,
      /emergency/i,
      /critical/i,
      /immediately/i,
      /deadline/i,
    ],
  },
];

// ── Priority Detection ─────────────────────────────────────────────

const PRIORITY_KEYWORDS: Record<EmailPriority, RegExp[]> = {
  critical: [
    /\burgent\b/i, /\bASAP\b/i, /\bemergency\b/i, /\bcritical\b/i,
    /\bimmediately\b/i, /\bNOW\b/i, /\bdeadline\b/i,
    /\bresignation\b/i, /\bcomplaint\b/i, /\bgrievance\b/i,
    /\bcancelled\b/i, /\bcancellation\b/i, /\brefund\b/i,
    /\blegal\b/i, /\battorney\b/i, /\blawsuit\b/i,
  ],
  high: [
    /\bPO\b/i, /\bpurchase order\b/i,
    /\boverdue\b/i, /\bdue\b/i, /\blate\b/i,
    /\bissue\b/i, /\bproblem\b/i, /\berror\b/i, /\bbroken\b/i,
    /\bwrong\b/i, /\bincorrect\b/i, /\bmistake\b/i,
  ],
  medium: [
    /\bquestion\b/i, /\binquiry\b/i, /\binfo\b/i, /\binformation\b/i,
    /\bquote\b/i, /\bpricing\b/i, /\bdemo\b/i,
    /\binterested\b/i, /\blearn more\b/i, /\btell me\b/i,
    /\border\b/i, /\bship\b/i, /\btracking\b/i,
    /\bmeeting\b/i, /\bcall\b/i, /\bdiscuss\b/i,
  ],
  low: [
    /\bnewsletter\b/i, /\bupdate\b/i, /\bFYI\b/i, /\bnotification\b/i,
    /\bautomated\b/i, /\bno-reply\b/i, /\bdo not reply\b/i,
    /\bconfirm\b/i, /\bwelcome\b/i, /\bthanks\b/i, /\bthank you\b/i,
  ],
};

// ── Organization Detection ─────────────────────────────────────────

async function detectOrganization(
  text: string,
): Promise<{ name: string | null; id: number | null }> {
  if (!text || text.length < 3) return { name: null, id: null };

  // Search organizations table for name matches in the email body
  const cleanText = text.replace(/[^\w\s@.-]/g, ' ').replace(/\s+/g, ' ').trim();

  try {
    // Try exact match first
    const result = await pool.query<{ id: number; name: string }>(
      `SELECT id, name FROM organizations
       WHERE $1 ILIKE '%' || name || '%'
          OR name ILIKE '%' || $2 || '%'
       ORDER BY LENGTH(name) DESC
       LIMIT 1`,
      [cleanText, cleanText.substring(0, 100)],
    );

    if (result.rows.length > 0) {
      return { name: result.rows[0].name, id: result.rows[0].id };
    }

    // Try partial word match for longer org names
    const words = cleanText.split(/\s+/).filter((w) => w.length > 3);
    if (words.length > 0) {
      const partialResult = await pool.query<{ id: number; name: string }>(
        `SELECT id, name FROM organizations
         WHERE ${words.slice(0, 5).map((_, i) => `name ILIKE $${i + 1}`).join(' OR ')}
         ORDER BY LENGTH(name) DESC
         LIMIT 1`,
        words.slice(0, 5).map((w) => `%${w}%`),
      );
      if (partialResult.rows.length > 0) {
        return { name: partialResult.rows[0].name, id: partialResult.rows[0].id };
      }
    }
  } catch {
    // Non-critical — org detection is best-effort
  }

  return { name: null, id: null };
}

function detectContact(text: string, senderName: string, senderEmail: string): string | null {
  // Extract potential contact name from email body or use sender info
  const namePatterns = [
    // "Hi FirstName" or "Dear FirstName LastName"
    /(?:Hi|Hello|Dear|Hey|Good (?:morning|afternoon|evening))\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]*)?)/,
    // "My name is FirstName LastName"
    /(?:my name is|I am|I'm)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
    // Signature: "Best,\nFirstName" or "Thanks,\nFirstName LastName"
    /(?:Best|Thanks|Regards|Sincerely|Cheers)[,\s]*\n\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/,
  ];

  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match && match[1] && !match[1].match(/^(Hi|Hello|Dear|Hey|Good)$/i)) {
      return match[1].trim();
    }
  }

  // Fallback: use sender name if it looks like a real person name (not generic)
  if (senderName && senderName.length > 2 && !senderName.match(/^(team|info|support|sales|admin|no.?reply|noreply|help|contact|hello|mailer|notification)/i)) {
    return senderName;
  }

  return senderEmail;
}

// ── AI-style Summary Generation ────────────────────────────────────

function generateSummary(email: EmailInboxEntry): string {
  const subject = email.subject || '(no subject)';
  const bodyPreview = (email.body_text || email.body_html || '')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 300);

  // Extract key points
  const lines = bodyPreview.split(/[.!?]+/).filter((l) => l.trim().length > 10).slice(0, 3);
  const keyPoints = lines.map((l) => l.trim()).join('. ') || bodyPreview;

  return `Email from ${email.sender_name || email.sender_email} re: "${subject}". ${keyPoints}`;
}

function generateSuggestedAction(classification: EmailClassification, priority: EmailPriority): string {
  switch (classification) {
    case 'order_related':
      return priority === 'critical' || priority === 'high'
        ? 'Review order immediately and respond within 1 hour'
        : 'Review order details and respond within 24 hours';
    case 'hr_related':
      return priority === 'critical'
        ? 'ESCALATE to leadership immediately — HR critical issue'
        : 'Forward to HR for review and response within 24 hours';
    case 'sales_related':
      return priority === 'high'
        ? 'Prioritize lead — respond within 4 hours'
        : 'Assign to territory rep for follow-up within 24 hours';
    case 'urgent':
      return 'IMMEDIATE ACTION REQUIRED — review and escalate as needed';
    default:
      return 'Review and categorize for appropriate follow-up';
  }
}

// ── Main Analysis Pipeline ─────────────────────────────────────────

export async function analyzeEmail(emailId: number): Promise<EmailAnalysisEntry | null> {
  const email = await getInboxEmailById(emailId);
  if (!email) return null;

  const combinedText = [
    email.subject || '',
    email.body_text || '',
    (email.body_html || '').replace(/<[^>]*>/g, ''),
  ].join(' ');

  // ── Classification ──────────────────────────────────────────
  let classification: EmailClassification = 'general_inquiry';
  const classificationScores: Record<string, number> = {};

  for (const rule of CLASSIFICATION_RULES) {
    let score = 0;
    for (const kw of rule.keywords) {
      const matches = combinedText.match(new RegExp(kw.source, 'gi'));
      if (matches) score += matches.length;
    }
    for (const sp of rule.subjectPatterns) {
      if (sp.test(email.subject || '')) score += 2; // subject matches weighted higher
    }
    if (score > 0) {
      classificationScores[rule.classification] = score;
    }
  }

  // Pick the highest scoring classification
  const sorted = Object.entries(classificationScores).sort((a, b) => b[1] - a[1]);
  if (sorted.length > 0) {
    classification = sorted[0][0] as EmailClassification;
  }

  // ── Priority ─────────────────────────────────────────────────
  let priority: EmailPriority = 'low';
  const priorityScores: Record<string, number> = {};

  for (const [level, keywords] of Object.entries(PRIORITY_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      const matches = combinedText.match(new RegExp(kw.source, 'gi'));
      if (matches) score += matches.length;
    }
    // Subject matches weighted higher
    for (const kw of keywords) {
      if ((email.subject || '').match(new RegExp(kw.source, 'i'))) score += 2;
    }
    if (score > 0) {
      priorityScores[level] = score;
    }
  }

  const prioritySorted = Object.entries(priorityScores).sort((a, b) => b[1] - a[1]);
  if (prioritySorted.length > 0) {
    priority = prioritySorted[0][0] as EmailPriority;
  }

  // ── Urgency Signals ──────────────────────────────────────────
  const urgencySignals: string[] = [];
  const allUrgencyPatterns = [
    ...PRIORITY_KEYWORDS.critical,
    ...PRIORITY_KEYWORDS.high,
  ];
  for (const pattern of allUrgencyPatterns) {
    if (pattern.test(combinedText)) {
      const signal = pattern.source.replace(/\\b/g, '');
      if (!urgencySignals.includes(signal)) {
        urgencySignals.push(signal);
      }
    }
  }

  // ── Organization and Contact Detection ───────────────────────
  const orgResult = await detectOrganization(combinedText);
  const contact = detectContact(combinedText, email.sender_name || '', email.sender_email);

  // ── Summary and Action ───────────────────────────────────────
  const summary = generateSummary(email);
  const suggestedAction = generateSuggestedAction(classification, priority);

  // ── Store Analysis ───────────────────────────────────────────
  const result = await pool.query<EmailAnalysisEntry>(
    `INSERT INTO email_analysis
       (email_inbox_id, classification, priority, urgency_signals,
        detected_org_name, detected_org_id, detected_contact,
        ai_summary, suggested_action)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT DO NOTHING
     RETURNING *`,
    [
      emailId,
      classification,
      priority,
      JSON.stringify(urgencySignals.slice(0, 10)),
      orgResult.name,
      orgResult.id,
      contact,
      summary,
      suggestedAction,
    ],
  );

  const analysis = result.rows[0] || null;

  // ── Issue Creation Pipeline ──────────────────────────────────
  if (analysis) {
    await createIssueFromAnalysis(email, analysis);
  }

  // Mark email as processed
  await markEmailProcessed(emailId);

  return analysis;
}

// ── Issue / Work-Item Creation ─────────────────────────────────────

async function createIssueFromAnalysis(
  email: EmailInboxEntry,
  analysis: EmailAnalysisEntry,
): Promise<void> {
  const { classification, priority } = analysis;

  // Determine the "submitted by" user — use system user if no match
  const systemUserResult = await pool.query<{ id: number }>(
    'SELECT id FROM users WHERE email = $1 LIMIT 1',
    [email.sender_email],
  );
  const submittedBy = systemUserResult.rows[0]?.id || 1; // fallback to admin

  const sourceRef = `Email from ${email.sender_email} (Inbox #${email.id})`;
  const description = [
    `**Source:** ${sourceRef}`,
    `**Subject:** ${email.subject || '(no subject)'}`,
    `**Classification:** ${classification}`,
    `**Detected Priority:** ${priority}`,
    `**Urgency Signals:** ${(analysis.urgency_signals || []).join(', ') || 'none'}`,
    '',
    '---',
    '',
    '**Original Email:**',
    email.body_text || email.body_html || '(no body)',
  ].join('\n');

  if (priority === 'critical' || priority === 'high') {
    // ── Create Issue ──────────────────────────────────────────
    try {
      const issueResult = await pool.query<{ id: number }>(
        `INSERT INTO issues
           (title, description, category, severity, affected_module, is_blocking, status, submitted_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [
          `[Email] ${email.subject || '(no subject)'}`.substring(0, 255),
          description,
          classification === 'hr_related' ? 'process_improvement' :
          classification === 'order_related' ? 'bug' :
          'other',
          priority,
          'email-ingestion',
          priority === 'critical',
          'NEW',
          submittedBy,
        ],
      );

      const issueId = issueResult.rows[0]?.id;
      if (issueId) {
        await pool.query(
          'UPDATE email_analysis SET linked_issue_id = $1 WHERE id = $2',
          [issueId, analysis.id],
        );
        console.log(`[email:analysis] Created issue #${issueId} for email #${email.id} (${priority})`);
      }
    } catch (err: any) {
      console.error(`[email:analysis] Failed to create issue for email #${email.id}:`, err.message);
    }
  } else if (priority === 'medium') {
    // ── Create Work Item ───────────────────────────────────────
    try {
      const workItemResult = await pool.query<{ id: number }>(
        `INSERT INTO work_items
           (owner_id, source, item_type, priority, title, description,
            linked_entity_type, linked_entity_id, suggested_action, ai_summary)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id`,
        [
          submittedBy,
          'email_inbound',
          classification === 'order_related' ? 'order_followup' :
          classification === 'sales_related' ? 'lead_followup' :
          'general_task',
          'medium',
          `${email.subject || '(no subject)'}`.substring(0, 255),
          description,
          'email_inbox',
          email.id,
          analysis.suggested_action || 'Review and respond',
          analysis.ai_summary || null,
        ],
      );

      const workItemId = workItemResult.rows[0]?.id;
      if (workItemId) {
        await pool.query(
          'UPDATE email_analysis SET linked_work_item_id = $1 WHERE id = $2',
          [workItemId, analysis.id],
        );
        console.log(`[email:analysis] Created work-item #${workItemId} for email #${email.id} (medium)`);
      }
    } catch (err: any) {
      console.error(`[email:analysis] Failed to create work-item for email #${email.id}:`, err.message);
    }
  } else {
    // Low priority — log only, no issue/task created
    console.log(`[email:analysis] Email #${email.id} classified as low priority — logged only`);
  }
}

// ── Process All Unprocessed Emails ─────────────────────────────────

export async function processUnprocessedEmails(limit = 25): Promise<{
  processed: number;
  errors: string[];
}> {
  const result = await pool.query<{ id: number }>(
    'SELECT id FROM email_inbox WHERE processed = false ORDER BY received_at ASC LIMIT $1',
    [limit],
  );

  let processed = 0;
  const errors: string[] = [];

  for (const row of result.rows) {
    try {
      await analyzeEmail(row.id);
      processed++;
    } catch (err: any) {
      errors.push(`Failed to analyze email #${row.id}: ${err.message}`);
    }
  }

  return { processed, errors };
}

// ── Data Access ────────────────────────────────────────────────────

export async function getAnalysisByEmailId(
  emailInboxId: number,
): Promise<EmailAnalysisEntry | null> {
  const result = await pool.query<EmailAnalysisEntry>(
    'SELECT * FROM email_analysis WHERE email_inbox_id = $1',
    [emailInboxId],
  );
  return result.rows[0] || null;
}

export async function getInboxWithAnalysis(
  query: InboxListQuery = {},
): Promise<EmailInboxWithAnalysis[]> {
  const conditions: string[] = [];
  const values: any[] = [];
  let i = 1;

  if (query.account) {
    conditions.push(`ei.account = $${i++}`);
    values.push(query.account);
  }
  if (query.classification) {
    // Join required if filtering by analysis fields
    conditions.push(`ea.classification = $${i++}`);
    values.push(query.classification);
  }
  if (query.priority) {
    conditions.push(`ea.priority = $${i++}`);
    values.push(query.priority);
  }
  if (query.processed !== undefined) {
    conditions.push(`ei.processed = $${i++}`);
    values.push(query.processed);
  }

  // Only join analysis table if filtering on it
  const needsJoin = query.classification || query.priority;
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const queryStr = `
    SELECT
      ei.*,
      ea.id as analysis_id,
      ea.classification,
      ea.priority,
      ea.urgency_signals,
      ea.detected_org_name,
      ea.detected_org_id,
      ea.detected_contact,
      ea.ai_summary,
      ea.suggested_action,
      ea.linked_issue_id,
      ea.linked_work_item_id,
      ea.created_at as analysis_created_at
    FROM email_inbox ei
    ${needsJoin ? 'JOIN email_analysis ea ON ei.id = ea.email_inbox_id' : 'LEFT JOIN email_analysis ea ON ei.id = ea.email_inbox_id'}
    ${where}
    ORDER BY ei.received_at DESC
    LIMIT $${i++} OFFSET $${i++}
  `;

  const result = await pool.query(queryStr, [
    ...values,
    query.limit || 50,
    query.offset || 0,
  ]);

  return result.rows.map((row: any) => ({
    id: row.id,
    account: row.account,
    message_id: row.message_id,
    sender_email: row.sender_email,
    sender_name: row.sender_name,
    recipient_email: row.recipient_email,
    subject: row.subject,
    body_text: row.body_text,
    body_html: row.body_html,
    has_attachments: row.has_attachments,
    attachment_info: row.attachment_info || [],
    received_at: row.received_at,
    is_read: row.is_read,
    processed: row.processed,
    created_at: row.created_at,
    analysis: row.analysis_id
      ? {
          id: row.analysis_id,
          email_inbox_id: row.id,
          classification: row.classification,
          priority: row.priority,
          urgency_signals: row.urgency_signals || [],
          detected_org_name: row.detected_org_name,
          detected_org_id: row.detected_org_id,
          detected_contact: row.detected_contact,
          ai_summary: row.ai_summary,
          suggested_action: row.suggested_action,
          linked_issue_id: row.linked_issue_id,
          linked_work_item_id: row.linked_work_item_id,
          created_at: row.analysis_created_at,
        }
      : null,
  }));
}

export async function getInboxStats(): Promise<{
  total: number;
  unprocessed: number;
  byPriority: Record<string, number>;
  byClassification: Record<string, number>;
  byAccount: Record<string, number>;
}> {
  const [totalR, unprocessedR, priorityR, classR, accountR] = await Promise.all([
    pool.query('SELECT COUNT(*)::int as count FROM email_inbox'),
    pool.query('SELECT COUNT(*)::int as count FROM email_inbox WHERE processed = false'),
    pool.query(`SELECT ea.priority, COUNT(*)::int as count FROM email_analysis ea GROUP BY ea.priority`),
    pool.query(`SELECT ea.classification, COUNT(*)::int as count FROM email_analysis ea GROUP BY ea.classification`),
    pool.query(`SELECT account, COUNT(*)::int as count FROM email_inbox GROUP BY account`),
  ]);

  const byPriority: Record<string, number> = {};
  for (const r of priorityR.rows) byPriority[r.priority] = r.count;

  const byClassification: Record<string, number> = {};
  for (const r of classR.rows) byClassification[r.classification] = r.count;

  const byAccount: Record<string, number> = {};
  for (const r of accountR.rows) byAccount[r.account] = r.count;

  return {
    total: totalR.rows[0]?.count || 0,
    unprocessed: unprocessedR.rows[0]?.count || 0,
    byPriority,
    byClassification,
    byAccount,
  };
}
