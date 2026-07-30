import { apiClient } from './apiClient';

// ── Inbound Email Types ─────────────────────────────────────────────

export type EmailClassification =
  | 'order_related'
  | 'hr_related'
  | 'sales_related'
  | 'general_inquiry'
  | 'urgent';

export type EmailPriority = 'low' | 'medium' | 'high' | 'critical';

export interface EmailInboxEntry {
  id: number;
  account: string;
  sender_email: string;
  sender_name: string | null;
  recipient_email: string;
  subject: string | null;
  body_text: string | null;
  body_html: string | null;
  has_attachments: boolean;
  attachment_info: Array<{ filename: string; contentType: string; size: number }>;
  received_at: string;
  is_read: boolean;
  processed: boolean;
}

export interface EmailAnalysisEntry {
  id: number;
  email_inbox_id: number;
  classification: EmailClassification;
  priority: EmailPriority;
  urgency_signals: string[];
  detected_org_name: string | null;
  detected_org_id: number | null;
  detected_contact: string | null;
  ai_summary: string | null;
  suggested_action: string | null;
  linked_issue_id: number | null;
  linked_work_item_id: number | null;
}

export interface EmailInboxWithAnalysis extends EmailInboxEntry {
  analysis: EmailAnalysisEntry | null;
}

export interface InboxAccountStatus {
  key: string;
  email: string;
  name: string;
  configured: boolean;
  last_polled_at: string | null;
  unread_count: number | null;
}

export interface InboxStats {
  total: number;
  unprocessed: number;
  byPriority: Record<string, number>;
  byClassification: Record<string, number>;
  byAccount: Record<string, number>;
}

// ── Inbox API ──────────────────────────────────────────────────────

export async function getInboxEmails(params?: {
  account?: string;
  classification?: EmailClassification;
  priority?: EmailPriority;
  processed?: boolean;
  limit?: number;
  offset?: number;
}): Promise<EmailInboxWithAnalysis[]> {
  const query: Record<string, string | undefined> = {};
  if (params?.account) query.account = params.account;
  if (params?.classification) query.classification = params.classification;
  if (params?.priority) query.priority = params.priority;
  if (params?.processed !== undefined) query.processed = String(params.processed);
  if (params?.limit !== undefined) query.limit = String(params.limit);
  if (params?.offset !== undefined) query.offset = String(params.offset);

  const result = await apiClient<{ emails: EmailInboxWithAnalysis[] }>(
    '/api/v1/email/inbox',
    { query },
  );
  return result.emails || [];
}

export async function getInboxEmail(id: number): Promise<{
  email: EmailInboxEntry;
  analysis: EmailAnalysisEntry | null;
}> {
  return apiClient(`/api/v1/email/inbox/${id}`);
}

export async function analyzeEmail(id: number): Promise<{
  analysis: EmailAnalysisEntry;
}> {
  return apiClient(`/api/v1/email/inbox/${id}/analyze`, { method: 'POST' });
}

export async function pollInboxes(): Promise<{
  poll: { accounts: Record<string, unknown>; totalFetched: number };
  processed: { processed: number; errors: string[] };
}> {
  return apiClient('/api/v1/email/inbox/poll', { method: 'POST' });
}

export async function processPendingEmails(limit?: number): Promise<{
  processed: number;
  errors: string[];
}> {
  const query: Record<string, string | undefined> = {};
  if (limit) query.limit = String(limit);
  return apiClient('/api/v1/email/inbox/process', { method: 'POST', query });
}

export async function getInboxStats(): Promise<InboxStats> {
  return apiClient('/api/v1/email/inbox/stats');
}

export async function getInboxAccountStatus(): Promise<InboxAccountStatus[]> {
  const result = await apiClient<{ accounts: InboxAccountStatus[] }>(
    '/api/v1/email/inbox/accounts/status',
  );
  return result.accounts || [];
}

// ── Priority Color Helpers ─────────────────────────────────────────

export function getPriorityColor(priority: EmailPriority): string {
  switch (priority) {
    case 'critical': return '#dc2626'; // red-600
    case 'high': return '#ea580c';     // orange-600
    case 'medium': return '#ca8a04';   // yellow-600
    case 'low': return '#16a34a';      // green-600
    default: return '#6b7280';         // gray-500
  }
}

export function getPriorityBgColor(priority: EmailPriority): string {
  switch (priority) {
    case 'critical': return '#fef2f2'; // red-50
    case 'high': return '#fff7ed';     // orange-50
    case 'medium': return '#fefce8';   // yellow-50
    case 'low': return '#f0fdf4';      // green-50
    default: return '#f9fafb';         // gray-50
  }
}

export function getClassificationLabel(classification: EmailClassification): string {
  switch (classification) {
    case 'order_related': return 'Order';
    case 'hr_related': return 'HR';
    case 'sales_related': return 'Sales';
    case 'general_inquiry': return 'General';
    case 'urgent': return '⚠️ Urgent';
    default: return 'Unknown';
  }
}

export function getClassificationColor(classification: EmailClassification): string {
  switch (classification) {
    case 'order_related': return '#7c3aed'; // purple
    case 'hr_related': return '#db2777';    // pink
    case 'sales_related': return '#2563eb'; // blue
    case 'urgent': return '#dc2626';        // red
    default: return '#6b7280';              // gray
  }
}
