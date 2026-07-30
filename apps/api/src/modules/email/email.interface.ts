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
