import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, EmptyState, SmallKpi } from '../components/primitives';
import { formatCurrency } from '../utils/format';
import { useOpsWorkspaceQueues } from '../hooks/useOrders';
const QUEUE_CONFIG = {
    NEEDS_REVIEW: {
        label: 'Needs Review',
        description: 'Awaiting initial ops review',
        color: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
        icon: '●',
    },
    READY_FOR_VENDOR: {
        label: 'Ready for Vendor',
        description: 'Cleared for vendor handoff',
        color: 'border-blue-500/30 bg-blue-500/10 text-blue-200',
        icon: '●',
    },
    IN_PRODUCTION: {
        label: 'In Production',
        description: 'Actively being manufactured',
        color: 'border-purple-500/30 bg-purple-500/10 text-purple-200',
        icon: '●',
    },
    BLOCKED: {
        label: 'Blocked',
        description: 'On hold — needs attention',
        color: 'border-red-500/30 bg-red-500/10 text-red-200',
        icon: '●',
    },
    COMPLETED: {
        label: 'Completed',
        description: 'Delivered and closed',
        color: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
        icon: '●',
    },
};
export function OpsWorkspacePage() {
    const navigate = useNavigate();
    const { data: queues = { NEEDS_REVIEW: [], READY_FOR_VENDOR: [], IN_PRODUCTION: [], BLOCKED: [], COMPLETED: [] } } = useOpsWorkspaceQueues();
    const [expandedQueue, setExpandedQueue] = useState(null);
    const metrics = useMemo(() => {
        const active = queues.NEEDS_REVIEW.length +
            queues.READY_FOR_VENDOR.length +
            queues.IN_PRODUCTION.length;
        const blocked = queues.BLOCKED.length;
        const completed = queues.COMPLETED.length;
        // Completed this week (within last 7 days)
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const completedThisWeek = queues.COMPLETED.filter((o) => {
            const d = o.completedDate || o.updatedAt || o.createdAt;
            return d && new Date(d) >= weekAgo;
        }).length;
        const totalActiveValue = [
            ...queues.NEEDS_REVIEW,
            ...queues.READY_FOR_VENDOR,
            ...queues.IN_PRODUCTION,
        ].reduce((sum, o) => sum + (o.value || 0), 0);
        return {
            activeCount: active,
            inProduction: queues.IN_PRODUCTION.length,
            blocked,
            completedThisWeek,
            completedTotal: completed,
            totalActiveValue,
        };
    }, [queues]);
    const queueOrder = ['NEEDS_REVIEW', 'READY_FOR_VENDOR', 'IN_PRODUCTION', 'BLOCKED', 'COMPLETED'];
    return (<div className="min-w-0 space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
            Operations Center
          </h1>
          <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
            Production pipeline overview and order queue management
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-xs text-[var(--text-secondary)]">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400"/>
            {metrics.activeCount} active
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-red-400"/>
            {metrics.blocked} blocked
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"/>
            {metrics.completedTotal} completed
          </span>
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <SmallKpi label="Active Orders" value={String(metrics.activeCount)} note={`${formatCurrency(metrics.totalActiveValue)} in pipeline`}/>
        <SmallKpi label="In Production" value={String(metrics.inProduction)} note="Currently manufacturing"/>
        <SmallKpi label="Blocked" value={String(metrics.blocked)} note={metrics.blocked > 0 ? 'Needs immediate attention' : 'No blockers'}/>
        <SmallKpi label="Completed This Week" value={String(metrics.completedThisWeek)} note={`${metrics.completedTotal} total completed`}/>
      </div>

      {/* ── Production Pipeline ── */}
      <Card title="Production Pipeline">
        {queueOrder.every((key) => queues[key].length === 0) ? (<EmptyState title="No orders in pipeline" description="Orders will appear here as deals move into production."/>) : (<div className="space-y-1.5">
            {queueOrder.map((key) => {
                const cfg = QUEUE_CONFIG[key];
                const items = queues[key];
                const isExpanded = expandedQueue === key;
                const queueValue = items.reduce((sum, o) => sum + (o.value || 0), 0);
                return (<div key={key}>
                  {/* Queue header row */}
                  <button onClick={() => setExpandedQueue(isExpanded ? null : key)} className="w-full flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-950/70 px-4 py-3 text-left transition hover:border-[var(--blue-1)]/40 hover:bg-slate-900/80">
                    {/* Count badge */}
                    <span className={`inline-flex items-center justify-center min-w-[2rem] h-8 rounded-lg border text-xs font-bold ${cfg.color}`}>
                      {items.length}
                    </span>

                    {/* Label and description */}
                    <div className="flex-1 min-w-0 mr-2">
                      <span className="block text-sm font-semibold text-[var(--text-primary)]">
                        {cfg.label}
                      </span>
                      <span className="block text-xs text-[var(--text-secondary)]">
                        {items.length === 0
                        ? cfg.description
                        : `${items.length} order${items.length !== 1 ? 's' : ''} · ${formatCurrency(queueValue)}`}
                      </span>
                    </div>

                    {/* Progress bar */}
                    {items.length > 0 && (<div className="hidden sm:block w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${key === 'COMPLETED'
                            ? 'bg-emerald-500'
                            : key === 'BLOCKED'
                                ? 'bg-red-500'
                                : 'bg-[var(--blue-1)]'}`} style={{
                            width: `${Math.min(100, (items.length /
                                Math.max(1, ...queueOrder.map((k) => queues[k].length))) *
                                100)}%`,
                        }}/>
                      </div>)}

                    {/* Expand chevron */}
                    <span className="text-sm text-[var(--text-secondary)]">
                      {isExpanded ? '▴' : '▾'}
                    </span>
                  </button>

                  {/* Expanded items */}
                  {isExpanded && items.length > 0 && (<div className="ml-11 mt-1.5 space-y-1 mb-1">
                      {items.map((order) => (<button key={order.id} onClick={() => navigate(`/orders/${order.id}`)} className="w-full flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2 text-left transition hover:border-[var(--blue-1)]/30 hover:bg-slate-900/60">
                          <div className="min-w-0 flex-1">
                            <span className="block truncate text-xs font-semibold text-[var(--text-primary)]">
                              {order.id}
                            </span>
                            <span className="block truncate text-xs text-[var(--text-secondary)]">
                              {order.organizationName}
                            </span>
                          </div>
                          <div className="shrink-0 flex flex-col items-end gap-0.5">
                            <span className="text-xs font-semibold text-[var(--blue-1)]">
                              {formatCurrency(order.value)}
                            </span>
                            <span className="text-[10px] text-[var(--text-secondary)]">
                              {order.lane}
                              {order.vendor ? ` · ${order.vendor}` : ''}
                            </span>
                          </div>
                          <span className="shrink-0 text-sm text-slate-600">
                            ›
                          </span>
                        </button>))}
                    </div>)}
                </div>);
            })}
          </div>)}
      </Card>

      {/* ── Quick Stats Footer ── */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        {queueOrder.map((key) => {
            const cfg = QUEUE_CONFIG[key];
            const value = queues[key].reduce((sum, o) => sum + (o.value || 0), 0);
            return (<div key={key} className="rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2.5">
              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider ${cfg.color.split(' ')[2]}`}>
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${cfg.color.split(' ')[2].replace('text-', 'bg-')}`}/>
                {cfg.label}
              </span>
              <p className="mt-1 text-lg font-bold text-[var(--text-primary)]">
                {queues[key].length}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                {formatCurrency(value)}
              </p>
            </div>);
        })}
      </div>
    </div>);
}
//# sourceMappingURL=OpsWorkspacePage.js.map