export interface EmailAccount {
  key: string;
  email: string;
  name: string;
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

export interface EmailLogEntry {
  id: number;
  from_account: string;
  from_email: string;
  to_email: string;
  subject: string;
  body_html?: string;
  body_text?: string;
  template_id?: number;
  template_vars?: Record<string, string>;
  status: 'sent' | 'failed';
  error_message?: string;
  entity_type?: string;
  entity_id?: number;
  sent_by: number;
  sent_at: string;
  created_at: string;
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
  created_by?: number;
  created_at: string;
  updated_at: string;
}

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
  message_id: string;
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
  created_at: string;
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
  created_at: string;
}

export interface EmailInboxWithAnalysis extends EmailInboxEntry {
  analysis: EmailAnalysisEntry | null;
}

export interface InboxListQuery {
  account?: string;
  classification?: EmailClassification;
  priority?: EmailPriority;
  processed?: boolean;
  limit?: number;
  offset?: number;
}

export interface InboxAccount {
  key: string;
  email: string;
  name: string;
  configured: boolean;
  last_polled_at: string | null;
  unread_count: number | null;
}
