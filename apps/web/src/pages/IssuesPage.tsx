import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiClient } from '../services/apiClient';
import type { Issue, IssueSeverity, IssueStatus } from '../types/issues';
import { ISSUE_STATUSES, ISSUE_SEVERITIES, ISSUE_CATEGORIES } from '../types/issues';

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

export default function IssuesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  const statusFilter = searchParams.get('status') || '';
  const severityFilter = searchParams.get('severity') || '';

  const fetchItems = async () => {
    try {
      const query: Record<string, string> = {};
      if (statusFilter) query.status = statusFilter;
      if (severityFilter) query.severity = severityFilter;
      const res = await apiClient('/issues', { query: Object.keys(query).length ? query : undefined }) as { items: Issue[] };
      setItems(res.items || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, [statusFilter, severityFilter]);

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    setSearchParams(next);
  };

  const stats = useMemo(() => {
    const open = items.filter((i) => !['RESOLVED', 'CLOSED'].includes(i.status));
    const blocking = items.filter((i) => i.is_blocking && !['RESOLVED', 'CLOSED'].includes(i.status));
    const critical = items.filter((i) => i.severity === 'critical' && !['RESOLVED', 'CLOSED'].includes(i.status));
    return { open: open.length, blocking: blocking.length, critical: critical.length, total: items.length };
  }, [items]);

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Employee Issues</h1>
        <button
          onClick={() => navigate('/issues/new')}
          className="rounded-md bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500"
        >
          + Report Issue
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        <StatCard label="Open" value={stats.open} color="text-yellow-200" />
        <StatCard label="Blocking" value={stats.blocking} color="text-red-200" />
        <StatCard label="Critical" value={stats.critical} color="text-orange-200" />
        <StatCard label="Total" value={stats.total} color="text-cyan-200" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select
          value={statusFilter}
          onChange={(e) => setFilter('status', e.target.value)}
          className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-slate-200"
        >
          <option value="">All Statuses</option>
          {ISSUE_STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <select
          value={severityFilter}
          onChange={(e) => setFilter('severity', e.target.value)}
          className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-slate-200"
        >
          <option value="">All Severities</option>
          {ISSUE_SEVERITIES.map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        {(statusFilter || severityFilter) && (
          <button
            onClick={() => setSearchParams({})}
            className="rounded-md border border-slate-600 px-2 py-1.5 text-xs text-slate-400 hover:text-slate-200"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Items list */}
      {loading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-slate-700 bg-slate-900 p-8 text-center">
          <p className="text-slate-400">No issues found.</p>
          <button
            onClick={() => navigate('/issues/new')}
            className="mt-2 text-sm text-cyan-400 hover:text-cyan-300"
          >
            Report the first issue →
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((issue) => (
            <IssueCard key={issue.id} issue={issue} onClick={() => navigate(`/issues/${issue.id}`)} />
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-3 text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-slate-400">{label}</p>
    </div>
  );
}

function IssueCard({ issue, onClick }: { issue: Issue; onClick: () => void }) {
  const statusColor = STATUS_COLORS[issue.status] || 'border-slate-500 bg-slate-500/10 text-slate-300';
  const severityColor = SEVERITY_COLORS[issue.severity] || SEVERITY_COLORS.medium;

  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-lg border border-slate-800 bg-slate-900 p-3 transition hover:border-slate-700"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusColor}`}>
              {issue.status.replace(/_/g, ' ')}
            </span>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${severityColor}`}>
              {issue.severity}
            </span>
            <span className="text-[10px] text-slate-500">{issue.category.replace(/_/g, ' ')}</span>
            {issue.is_blocking && (
              <span className="rounded-full border border-red-500 bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-200">
                BLOCKING
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-white">{issue.title}</p>
          {issue.description && (
            <p className="mt-0.5 line-clamp-2 text-xs text-slate-400">{issue.description}</p>
          )}
          <div className="mt-1 flex gap-3 text-xs text-slate-500">
            {issue.affected_module && <span>📦 {issue.affected_module}</span>}
            <span>{new Date(issue.created_at).toLocaleDateString()}</span>
          </div>
        </div>
        <svg className="mt-1 h-4 w-4 shrink-0 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
}
