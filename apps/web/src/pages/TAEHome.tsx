import { Link } from 'react-router-dom';
import { GlassCard } from '../components/ui';
import { useWorkItems } from '../hooks/useWorkItems';
import { useDashboardMetrics } from '../hooks/useDashboardMetrics';
import { useOpportunities } from '../hooks/useOpportunities';
import { useOrders } from '../hooks/useOrders';
import { useOrganizations } from '../hooks/useOrganizations';
import { getStoredUser } from '../auth';
import { getNearCloseOpportunities, getStaleOpportunities, getStaleAccounts } from '../services/businessSelectors';
import { formatCurrency } from '../utils/format';

const MONTHLY_ORDER_GOAL = 4;
const openStages = ['LEAD_ENGAGED', 'DISCOVERY', 'MOCKUP_STAGE', 'INVOICE_SENT'];
const pipelineStages = ['LEAD_ENGAGED', 'DISCOVERY', 'MOCKUP_STAGE', 'INVOICE_SENT', 'CLOSED_WON'] as const;

function MetricTile({ value, label, tone, to }: { value: string; label: string; tone: string; to: string }) {
  return (
    <Link to={to} className={`group rounded-lg border p-3 transition hover:-translate-y-0.5 hover:border-cyan-300/70 ${tone}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-2xl font-semibold text-slate-50">{value}</p>
        <span className="text-lg text-slate-200 transition group-hover:translate-x-1">›</span>
      </div>
      <p className="mt-1 text-sm text-slate-200">{label}</p>
    </Link>
  );
}

function WorkItemRow({ item }: { item: { id: number; title: string; priority: string; due_at: string | null; suggested_action: string | null; ai_summary: string | null; status: string; source: string } }) {
  const priorityColors: Record<string, string> = {
    critical: 'border-red-500/40 bg-red-500/10',
    high: 'border-orange-500/40 bg-orange-500/10',
    medium: 'border-amber-500/40 bg-amber-500/10',
    low: 'border-slate-500/40 bg-slate-500/10',
  };
  const tone = priorityColors[item.priority] || priorityColors.medium;

  const isOverdue = item.due_at && new Date(item.due_at) < new Date();

  return (
    <div className={`rounded-lg border p-3 transition hover:border-cyan-400/70 ${tone} ${isOverdue ? 'ring-1 ring-red-500/30' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{item.source.replace(/_/g, ' ')}</span>
            {isOverdue && <span className="text-[10px] font-bold uppercase bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded">Overdue</span>}
            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${item.priority === 'critical' ? 'bg-red-500/20 text-red-300' : item.priority === 'high' ? 'bg-orange-500/20 text-orange-300' : 'bg-amber-500/20 text-amber-300'}`}>
              {item.priority}
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-100">{item.title}</p>
          {item.ai_summary && <p className="mt-1 text-xs text-slate-400 line-clamp-2">{item.ai_summary}</p>}
          {item.suggested_action && <p className="mt-1 text-xs font-medium text-emerald-300">Next: {item.suggested_action}</p>}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {item.due_at && <span className={`text-[10px] uppercase tracking-wider ${isOverdue ? 'text-red-300 font-semibold' : 'text-slate-400'}`}>{new Date(item.due_at).toLocaleDateString()}</span>}
          <span className={`text-[10px] font-semibold uppercase ${item.status === 'open' ? 'text-cyan-300' : item.status === 'in_progress' ? 'text-emerald-300' : 'text-slate-500'}`}>{item.status.replace(/_/g, ' ')}</span>
        </div>
      </div>
    </div>
  );
}

function StagePipeline({ counts, values }: { counts: Record<string, number>; values: Record<string, number> }) {
  return (
    <div className="grid gap-2 md:grid-cols-5">
      {pipelineStages.map((stage) => (
        <div key={stage} className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{stage.replace(/_/g, ' ')}</p>
          <p className="mt-1 text-2xl font-bold text-white">{counts[stage] ?? 0}</p>
          <p className="text-xs text-cyan-200">{formatCurrency(values[stage] ?? 0)}</p>
        </div>
      ))}
    </div>
  );
}

export default function TAEHome() {
  const user = getStoredUser();
  const { data: opportunities = [] } = useOpportunities({});
  const { data: organizations = [] } = useOrganizations({});
  const { data: orders = [] } = useOrders({});
  const { metrics: backendMetrics, isApiBacked } = useDashboardMetrics('REP', user?.id, user?.email);

  // Work items from backend
  const { data: allOpenItems = [] } = useWorkItems({ status: 'open' });
  const { data: dailyCommandItems = [] } = useWorkItems({ source: 'daily_command', status: 'open' });
  const { data: academyItems = [] } = useWorkItems({ source: 'certification', status: 'open' });

  const openOpps = opportunities.filter((opp) => openStages.includes(opp.stage));
  const wonOpps = opportunities.filter((opp) => opp.stage === 'CLOSED_WON');
  const nearClose = getNearCloseOpportunities(opportunities);
  const staleOpps = getStaleOpportunities(opportunities, 14);
  const untouchedAccounts = organizations.filter((org) => org.coverageStatus === 'UNTOUCHED');
  const touchedAccounts = organizations.length - untouchedAccounts.length;
  const coveragePct = organizations.length ? Math.round((touchedAccounts / organizations.length) * 100) : 0;
  const pipelineValue = openOpps.reduce((sum, opp) => sum + opp.value, 0);
  const nearCloseValue = nearClose.reduce((sum, opp) => sum + opp.value, 0);
  const wonValue = wonOpps.reduce((sum, opp) => sum + opp.value, 0);
  const completedOrders = orders.filter((order) => order.productionStatus === 'COMPLETED');
  const orderPaceCount = isApiBacked ? (backendMetrics.paid_order_count ?? 0) : completedOrders.length;
  const monthlyOrderPct = Math.min(100, Math.round((orderPaceCount / MONTHLY_ORDER_GOAL) * 100));
  const stageCounts = Object.fromEntries(pipelineStages.map((stage) => [stage, opportunities.filter((opp) => opp.stage === stage).length]));
  const stageValues = Object.fromEntries(pipelineStages.map((stage) => [stage, opportunities.filter((opp) => opp.stage === stage).reduce((sum, opp) => sum + opp.value, 0)]));

  // Next actions prioritized
  const overdueItems = allOpenItems.filter((item) => item.due_at && new Date(item.due_at) < new Date());
  const nextActionItems = allOpenItems
    .filter((item) => !overdueItems.includes(item))
    .sort((a, b) => {
      const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      return (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2);
    });
  const urgentItems = allOpenItems.filter((item) => item.priority === 'critical' || item.priority === 'high').slice(0, 6);

  // Academy status
  const academyPendingCount = academyItems.length;
  const isAcademyBlocked = !user?.isCertified && academyPendingCount > 0;

  // TAE Mission
  const repMission = overdueItems.length
    ? { title: 'Clear overdue follow-ups now', reason: `${overdueItems.length} items are past due and need your immediate attention.`, to: '/my-opportunities', cta: 'Clear overdue items' }
    : staleOpps.length
      ? { title: 'Follow up stale opportunities', reason: `${staleOpps.length} deals haven\'t moved in 14+ days.`, to: '/my-opportunities', cta: 'Open my pipeline' }
      : nearClose.length
        ? { title: 'Close near-ready deals', reason: `${nearClose.length} deals are near close — push to order.`, to: '/my-opportunities', cta: 'Open close queue' }
        : { title: 'Expand account coverage', reason: `${untouchedAccounts.length} accounts need first touch.`, to: '/organizations', cta: 'Open accounts' };

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold text-white">TAE Pipeline Command</h1>

      {/* Mission Priority */}
      <GlassCard title="🎯 TODAY'S PRIORITY">
        <p className="text-sm font-semibold text-white">{repMission.title}</p>
        <p className="text-sm text-slate-300">{repMission.reason}</p>
        <Link to={repMission.to} className="mt-2 inline-block rounded-md border border-cyan-400/40 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100">{repMission.cta}</Link>
      </GlassCard>

      {/* Top Metrics */}
      <div className="grid gap-3 md:grid-cols-5">
        <MetricTile value={String(openOpps.length)} label="Active Opportunities" tone="border-cyan-500/40 bg-cyan-500/15" to="/my-opportunities" />
        <MetricTile value={formatCurrency(pipelineValue)} label="My Open Pipeline" tone="border-sky-500/40 bg-sky-500/15" to="/my-opportunities" />
        <MetricTile value={formatCurrency(nearCloseValue)} label="Close This Week" tone="border-emerald-500/40 bg-emerald-500/15" to="/my-opportunities" />
        <MetricTile value={`${orderPaceCount}/${MONTHLY_ORDER_GOAL}`} label={`${monthlyOrderPct}% of 4-Order Floor`} tone="border-violet-500/40 bg-violet-500/15" to="/orders" />
        <MetricTile value={`${coveragePct}%`} label="Account Coverage" tone="border-sky-500/40 bg-sky-500/15" to="/organizations" />
      </div>

      {/* Next Actions & Overdue Follow-ups */}
      <div className="grid gap-3 lg:grid-cols-2">
        <GlassCard title={`⚡ NEXT ACTIONS (${nextActionItems.length})`}>
          {nextActionItems.length ? (
            <div className="space-y-2">
              {nextActionItems.slice(0, 8).map((item) => (
                <WorkItemRow key={item.id} item={item} />
              ))}
            </div>
          ) : <p className="text-sm text-slate-400">No pending actions. Great job!</p>}
        </GlassCard>

        <GlassCard title={`⚠️ OVERDUE FOLLOW-UPS (${overdueItems.length})`}>
          {overdueItems.length ? (
            <div className="space-y-2">
              {overdueItems.slice(0, 8).map((item) => (
                <WorkItemRow key={item.id} item={item} />
              ))}
            </div>
          ) : <p className="text-sm text-emerald-400">No overdue items. Keep it up!</p>}
        </GlassCard>
      </div>

      {/* My Pipeline */}
      <GlassCard title="📊 MY PIPELINE">
        <StagePipeline counts={stageCounts} values={stageValues} />
      </GlassCard>

      {/* Assigned Organizations & Academy Status */}
      <div className="grid gap-3 lg:grid-cols-2">
        <GlassCard title={`🏢 ASSIGNED ORGANIZATIONS (${organizations.length})`}>
          <div className="space-y-2">
            {organizations.slice(0, 6).map((org) => (
              <Link key={org.id} to={`/organizations/${org.id}`} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 transition hover:border-cyan-400/70">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-100 truncate">{org.name}</p>
                  <p className="text-xs text-slate-400">{org.city}{org.state ? `, ${org.state}` : ''} · {org.coverageStatus?.replace(/_/g, ' ') || 'Active'}</p>
                </div>
                <span className="text-lg text-slate-600">›</span>
              </Link>
            ))}
          </div>
          <Link to="/organizations" className="mt-2 inline-block rounded-md border border-cyan-400/40 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100">View All Organizations ›</Link>
        </GlassCard>

        <GlassCard title={`📚 ACADEMY STATUS${isAcademyBlocked ? ' ⚠️' : ''}`}>
          {user?.isCertified ? (
            <div>
              <p className="text-sm font-semibold text-emerald-300">✓ Fully Certified</p>
              <p className="text-xs text-slate-400 mt-1">All certifications complete. You have full CRM access.</p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-semibold text-amber-300">⚠ Certification Required</p>
              <p className="text-xs text-slate-400 mt-1">Complete your Academy training to unlock full CRM access.</p>
              {academyPendingCount > 0 && (
                <div className="mt-2 space-y-2">
                  {academyItems.slice(0, 4).map((item) => (
                    <WorkItemRow key={item.id} item={item} />
                  ))}
                </div>
              )}
            </div>
          )}
          <Link to="/academy" className="mt-2 inline-block rounded-md border border-cyan-400/40 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100">
            {user?.isCertified ? 'View Academy ›' : 'Continue Training ›'}
          </Link>
        </GlassCard>
      </div>

      {/* Daily Command Items */}
      {dailyCommandItems.length > 0 && (
        <GlassCard title={`📅 DAILY COMMAND ITEMS (${dailyCommandItems.length})`}>
          <div className="space-y-2">
            {dailyCommandItems.slice(0, 6).map((item) => (
              <WorkItemRow key={item.id} item={item} />
            ))}
          </div>
        </GlassCard>
      )}

      {/* Prioritized Work Queue */}
      {urgentItems.length > 0 && (
        <GlassCard title="📋 HIGH PRIORITY ITEMS">
          <div className="space-y-2">
            {urgentItems.map((item) => (
              <WorkItemRow key={item.id} item={item} />
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
