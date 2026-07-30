import { useState, useEffect, useCallback, type FormEvent } from 'react';
import {
  getEmailTemplates,
  getEmailAccounts,
  sendEmail,
  previewTemplate,
  type EmailTemplate,
  type EmailAccount,
} from '../services/emailService';

interface EmailComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTo?: string;
  defaultSubject?: string;
  entityType?: string;
  entityId?: string;
  contextVars?: Record<string, string>;
}

export function EmailComposeModal({
  isOpen,
  onClose,
  defaultTo = '',
  defaultSubject = '',
  entityType,
  entityId,
  contextVars = {},
}: EmailComposeModalProps) {
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [fromAccount, setFromAccount] = useState('');
  const [to, setTo] = useState(defaultTo);
  const [subject, setSubject] = useState(defaultSubject);
  const [bodyHtml, setBodyHtml] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | ''>('');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch accounts and templates on mount
  useEffect(() => {
    if (!isOpen) return;
    getEmailAccounts().then(setAccounts).catch(console.error);
    getEmailTemplates().then(setTemplates).catch(console.error);
  }, [isOpen]);

  // Auto-select first configured account
  useEffect(() => {
    if (accounts.length > 0 && !fromAccount) {
      setFromAccount(accounts[0].key);
    }
  }, [accounts, fromAccount]);

  // When template changes, populate subject and body
  const handleTemplateChange = useCallback(
    (templateId: string) => {
      const id = templateId ? Number(templateId) : '';
      setSelectedTemplateId(id);

      if (!id) {
        setSubject(defaultSubject);
        setBodyHtml('');
        return;
      }

      const template = templates.find((t) => t.id === id);
      if (template) {
        const preview = previewTemplate(
          template.subject_template,
          template.body_html,
          contextVars,
        );
        setSubject(preview.subject);
        setBodyHtml(preview.body);
      }
    },
    [templates, contextVars, defaultSubject],
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!fromAccount || !to.trim() || !subject.trim()) return;

    setSending(true);
    setStatus(null);

    try {
      await sendEmail({
        from_account: fromAccount,
        to: to.trim(),
        subject: subject.trim(),
        body_html: bodyHtml,
        template_id: selectedTemplateId ? Number(selectedTemplateId) : undefined,
        template_vars: contextVars,
        entity_type: entityType,
        entity_id: entityId ? Number(entityId) : undefined,
      });
      setStatus({ type: 'success', message: 'Email sent successfully!' });
      // Close after brief success display
      setTimeout(() => {
        onClose();
        setStatus(null);
        setTo('');
        setSubject('');
        setBodyHtml('');
        setSelectedTemplateId('');
      }, 1500);
    } catch (err: any) {
      setStatus({
        type: 'error',
        message: err?.message || 'Failed to send email',
      });
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-xl border border-slate-700 bg-[#0a121b] p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Send Email
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:text-slate-200"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* From Account */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">
              From
            </label>
            <select
              value={fromAccount}
              onChange={(e) => setFromAccount(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-[var(--text-primary)]"
            >
              {accounts.map((a) => (
                <option key={a.key} value={a.key}>
                  {a.name} &lt;{a.email}&gt;
                </option>
              ))}
            </select>
          </div>

          {/* To */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">
              To
            </label>
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@example.com"
              required
              className="h-10 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-[var(--text-primary)] placeholder:text-slate-500"
            />
          </div>

          {/* Template Selector */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">
              Template (optional)
            </label>
            <select
              value={String(selectedTemplateId)}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-[var(--text-primary)]"
            >
              <option value="">— No template —</option>
              {templates.map((t) => (
                <option key={t.id} value={String(t.id)}>
                  {t.name} ({t.category})
                </option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject line"
              required
              className="h-10 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-[var(--text-primary)] placeholder:text-slate-500"
            />
          </div>

          {/* Body (HTML) */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">
              Body (HTML)
            </label>
            <textarea
              value={bodyHtml}
              onChange={(e) => setBodyHtml(e.target.value)}
              rows={10}
              placeholder="Write your email here... (supports HTML)"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-slate-500 font-mono"
            />
          </div>

          {/* Status */}
          {status && (
            <div
              className={`rounded-lg px-3 py-2 text-sm ${
                status.type === 'success'
                  ? 'border border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                  : 'border border-rose-500/50 bg-rose-500/10 text-rose-300'
              }`}
            >
              {status.message}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending || !fromAccount || !to.trim() || !subject.trim()}
              className="rounded-lg border border-cyan-500/60 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-300 hover:bg-cyan-500/20 disabled:opacity-50"
            >
              {sending ? 'Sending…' : 'Send Email'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
