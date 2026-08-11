import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/apiClient';
import {
  ISSUE_CATEGORIES,
  ISSUE_SEVERITIES,
} from '../types/issues';

const AFFECTED_MODULES = [
  'CRM / Pipeline',
  'Orders / Fulfillment',
  'Recruiting',
  'Training / Academy',
  'People / HR',
  'Comms / Messaging',
  'Reporting',
  'Territory Map',
  'Settings / Admin',
  'Mobile / PWA',
  'Other',
];

export default function IssueNewPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'other' as string,
    severity: 'medium' as string,
    affected_module: '' as string,
    steps_to_reproduce: '',
    is_blocking: false,
    screenshot_url: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Title is required.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        severity: form.severity,
        affected_module: form.affected_module || null,
        steps_to_reproduce: form.steps_to_reproduce.trim() || null,
        is_blocking: form.is_blocking,
        screenshot_url: form.screenshot_url.trim() || null,
      };
      const res = await apiClient('/issues', { method: 'POST', body: payload }) as { item: { id: number } };
      navigate(`/issues/${res.item.id}`);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit issue.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Report an Issue</h1>
        <button
          onClick={() => navigate('/issues')}
          className="rounded-md border border-slate-600 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800"
        >
          ← Back to Issues
        </button>
      </div>
      <p className="text-sm text-slate-400">
        Found a bug? Have a suggestion for improving TUF Ops tools? Let us know.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-700 bg-slate-900 p-4">
        {/* Title */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-300">Title *</label>
          <input
            type="text"
            placeholder="Brief summary of the issue..."
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        {/* Description */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-300">Description</label>
          <textarea
            placeholder="Describe what's happening, what you expected, and any context..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={4}
            className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        {/* Category + Severity */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
            >
              {ISSUE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Severity</label>
            <select
              value={form.severity}
              onChange={(e) => setForm({ ...form, severity: e.target.value })}
              className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
            >
              {ISSUE_SEVERITIES.map((sev) => (
                <option key={sev} value={sev}>
                  {sev.charAt(0).toUpperCase() + sev.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Affected Module */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-300">Affected Module</label>
          <select
            value={form.affected_module}
            onChange={(e) => setForm({ ...form, affected_module: e.target.value })}
            className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
          >
            <option value="">-- Select (optional) --</option>
            {AFFECTED_MODULES.map((mod) => (
              <option key={mod} value={mod}>
                {mod}
              </option>
            ))}
          </select>
        </div>

        {/* Steps to Reproduce */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-300">Steps to Reproduce</label>
          <textarea
            placeholder="1. Go to...\n2. Click on...\n3. See error..."
            value={form.steps_to_reproduce}
            onChange={(e) => setForm({ ...form, steps_to_reproduce: e.target.value })}
            rows={3}
            className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        {/* Screenshot URL */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-300">Screenshot URL</label>
          <input
            type="url"
            placeholder="https://..."
            value={form.screenshot_url}
            onChange={(e) => setForm({ ...form, screenshot_url: e.target.value })}
            className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        {/* Blocking checkbox */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_blocking"
            checked={form.is_blocking}
            onChange={(e) => setForm({ ...form, is_blocking: e.target.checked })}
            className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
          />
          <label htmlFor="is_blocking" className="text-sm text-slate-300">
            This issue is blocking my work
          </label>
        </div>

        {/* Error */}
        {error && <p className="rounded-md border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p>}

        {/* Submit */}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500 disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Issue'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/issues')}
            className="rounded-md border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
