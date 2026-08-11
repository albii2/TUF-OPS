import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '../services/apiClient';
import type { Issue, IssueStatus, IssueSeverity } from '../types/issues';
import { ISSUE_STATUSES } from '../types/issues';

const STATUS_FLOW_MAP: Record<IssueStatus, IssueStatus[]> = {
  NEW: ['TRIAGED'],
  TRIAGED: ['NEW', 'ASSIGNED'],
  ASSIGNED: ['TRIAGED', 'IN_PROGRESS'],
  IN_PROGRESS: ['ASSIGNED', 'READY_FOR_VERIFICATION'],
  READY_FOR_VERIFICATION: ['IN_PROGRESS', 'RESOLVED'],
  RESOLVED: ['READY_FOR_VERIFICATION', 'CLOSED'],
  CLOSED: ['RESOLVED'],
};

const STATUS_COLORS: Record<IssueStatus, string> = {
  NEW: 'border-blue-500 bg-blue-500/10 text-blue-200',
  TRIAGED: 'border-purple-500 bg-purple-500/10 text-purple-200',
  ASSIGNED: 'border-indigo-500 bg-indigo-500/10 text-indigo-200',
  IN_PROGRESS: 'border-yellow-500 bg-yellow-500/10 text-yellow-200',
  READY_FOR_VERIFICATION: 'border-cyan-500 bg-cyan-500/10 text-cyan-200',
  RESOLVED: 'border-emerald-500 bg-emerald-500/10 text-emerald-200',
  CLOSED: 'border-slate-500 bg-slate-500/10 text-slate-400',
};

const SEVERITY_COLORS: Record<IssueSeverity, string> = {
  critical: 'border-red-500 bg-red-500/10 text-red-200',
  high: 'border-orange-500 bg-orange-500/10 text-orange-200',
  medium: 'border-yellow-500 bg-yellow-500/10 text-yellow-200',
  low: 'border-slate-500 bg-slate-500/10 text-slate-300',
};

export default function IssueDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchIssue = async () => {
    try {
      const res = await apiClient(`/issues/${id}`) as { item: Issue };
      setIssue(res.item);
    } catch (e: any) {
      setError(e?.message || 'Failed to load issue.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchIssue();
  }, [id]);

  const advanceStatus = async (newStatus: IssueStatus) => {
    if (!issue) return;
    setUpdating(true);
    setError('');
    try {
      const res = await apiClient(`/issues/${issue.id}/status`, {
        method: 'PUT',
        body: { status: newStatus },
      }) as { item: Issue };
      setIssue(res.item);
    } catch (e: any) {
      setError(e?.message || 'Failed to update status.');
    }
    setUpdating(false);
  };

  if (loading) {
    return <p className="p-4 text-sm text-slate-500">Loading...</p>;
  }

  if (error && !issue) {
    return (
      <div className="p-4">
        <p className="text-red-300">{error}</p>
        <button onClick={() => navigate('/issues')} className="mt-2 text-sm text-cyan-400 hover:text-cyan-300">
          ← Back to Issues
        </button>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="p-4">
        <p className="text-slate-400">Issue not found.</p>
        <button onClick={() => navigate('/issues')} className="mt-2 text-sm text-cyan-400 hover:text-cyan-300">
          ← Back to Issues
        </button>
      </div>
    );
  }

  const availableTransitions = STATUS_FLOW_MAP[issue.status] || [];
  const severityColor = SEVERITY_COLORS[issue.severity] || SEVERITY_COLORS.medium;
  const statusColor = STATUS_COLORS[issue.status] || '';

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4">
      <button
        onClick={() => navigate('/issues')}
        className="text-sm text-slate-400 hover:text-slate-200"
      >
        ← Back to Issues
      </button>

      <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
        {/* Header */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusColor}`}>
            {issue.status.replace(/_/g, ' ')}
          </span>
          <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${severityColor}`}>
            {issue.severity}
          </span>
          <span className="rounded-full border border-slate-600 px-2 py-0.5 text-[11px] text-slate-400">
            {issue.category.replace(/_/g, ' ')}
          </span>
          {issue.is_blocking && (
            <span className="rounded-full border border-red-500 bg-red-500/10 px-2 py-0.5 text-[11px] font-semibold text-red-200">
              BLOCKING
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-lg font-bold text-white">{issue.title}</h1>

        {/* Meta */}
        <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
          <span>ID: #{issue.id}</span>
          <span>Submitted: {new Date(issue.created_at).toLocaleString()}</span>
          <span>Updated: {new Date(issue.updated_at).toLocaleString()}</span>
          {issue.resolved_at && <span className="text-emerald-400">Resolved: {new Date(issue.resolved_at).toLocaleString()}</span>}
          {issue.affected_module && <span>Module: {issue.affected_module}</span>}
        </div>
      </div>

      {/* Description */}
      {issue.description && (
        <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-300">Description</h2>
          <p className="whitespace-pre-wrap text-sm text-slate-200">{issue.description}</p>
        </div>
      )}

      {/* Steps to Reproduce */}
      {issue.steps_to_reproduce && (
        <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-300">Steps to Reproduce</h2>
          <pre className="whitespace-pre-wrap text-sm text-slate-200 font-sans">{issue.steps_to_reproduce}</pre>
        </div>
      )}

      {/* Screenshot */}
      {issue.screenshot_url && (
        <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-300">Screenshot</h2>
          <a
            href={issue.screenshot_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-cyan-400 hover:text-cyan-300 underline break-all"
          >
            {issue.screenshot_url}
          </a>
        </div>
      )}

      {/* Status Actions */}
      <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-300">Update Status</h2>
        {availableTransitions.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {availableTransitions.map((nextStatus) => (
              <button
                key={nextStatus}
                onClick={() => advanceStatus(nextStatus)}
                disabled={updating}
                className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition hover:opacity-80 disabled:opacity-50 ${
                  STATUS_COLORS[nextStatus] || 'border-slate-500 text-slate-300'
                }`}
              >
                {updating ? '...' : `→ ${nextStatus.replace(/_/g, ' ')}`}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500">
            {issue.status === 'CLOSED'
              ? 'This issue is closed.'
              : 'No status transitions available from current state.'}
          </p>
        )}
      </div>

      {error && (
        <p className="rounded-md border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p>
      )}
    </div>
  );
}
