import { apiClient } from './apiClient';

export interface EmailAccount {
  key: string;
  email: string;
  name: string;
}

export interface EmailAccountStatus extends EmailAccount {
  configured: boolean;
  daily_remaining: number | null;
}

export interface EmailTemplate {
  id: number;
  name: string;
  description?: string;
  subject_template: string;
  body_html: string;
  category: string;
  variables: string[];
  is_active: boolean;
}

export interface EmailLogEntry {
  id: number;
  from_account: string;
  from_email: string;
  to_email: string;
  subject: string;
  body_html?: string;
  body_text?: string;
  template_id?: number;
  status: 'sent' | 'failed';
  error_message?: string;
  entity_type?: string;
  entity_id?: number;
  sent_by: number;
  sent_at: string;
}

export interface SendEmailInput {
  from_account: string;
  to: string;
  subject: string;
  body_html?: string;
  body_text?: string;
  template_id?: number;
  template_vars?: Record<string, string>;
  entity_type?: string;
  entity_id?: number;
}

// ── Send Email ────────────────────────────────────────────────────

export async function sendEmail(
  input: SendEmailInput,
): Promise<EmailLogEntry> {
  return apiClient<EmailLogEntry>('/api/v1/email/send', {
    method: 'POST',
    body: input,
  });
}

// ── Templates ─────────────────────────────────────────────────────

export async function getEmailTemplates(
  category?: string,
): Promise<EmailTemplate[]> {
  const query: Record<string, string | undefined> = {};
  if (category) query.category = category;
  const result = await apiClient<{ templates: EmailTemplate[] }>(
    '/api/v1/email/templates',
    { query },
  );
  return result.templates || [];
}

// ── Email Log ─────────────────────────────────────────────────────

export async function getEmailLogs(params?: {
  entity_type?: string;
  entity_id?: number;
  from_account?: string;
  limit?: number;
  offset?: number;
}): Promise<EmailLogEntry[]> {
  const query: Record<string, string | undefined> = {};
  if (params?.entity_type) query.entity_type = params.entity_type;
  if (params?.entity_id !== undefined)
    query.entity_id = String(params.entity_id);
  if (params?.from_account) query.from_account = params.from_account;
  if (params?.limit !== undefined) query.limit = String(params.limit);
  if (params?.offset !== undefined) query.offset = String(params.offset);
  const result = await apiClient<{ logs: EmailLogEntry[] }>(
    '/api/v1/email/log',
    { query },
  );
  return result.logs || [];
}

// ── Accounts ──────────────────────────────────────────────────────

export async function getEmailAccounts(): Promise<EmailAccount[]> {
  const result = await apiClient<{ accounts: EmailAccount[] }>(
    '/api/v1/email/accounts',
  );
  return result.accounts || [];
}

export async function getEmailAccountStatus(): Promise<EmailAccountStatus[]> {
  const result = await apiClient<{ accounts: EmailAccountStatus[] }>(
    '/api/v1/email/accounts/status',
  );
  return result.accounts || [];
}

// ── Template Variable Substitution (client-side preview) ──────────

export function previewTemplate(
  subjectTemplate: string,
  bodyTemplate: string,
  vars: Record<string, string>,
): { subject: string; body: string } {
  const subject = subjectTemplate.replace(
    /\{\{(\w+)\}\}/g,
    (_, name) => vars[name] || `{{${name}}}`,
  );
  const body = bodyTemplate.replace(
    /\{\{(\w+)\}\}/g,
    (_, name) => vars[name] || `{{${name}}}`,
  );
  return { subject, body };
}
