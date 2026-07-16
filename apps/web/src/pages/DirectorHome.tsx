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

  return (
    <div className={`rounded-lg border p-3 transition hover:border-cyan-400/70 ${tone}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{item.source.replace(/_/g, ' ')}</span>
            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${item.priority === 'critical' ? 'bg-red-500/20 text-red-300' : item.priority === 'high' ? 'bg-orange-500/20 text-orange-300' : 'bg-amber-500/20 text-amber-300'}`}>
              {item.priority}
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-100">{item.title}</p>
          {item.ai_summary && <p className="mt-1 text-xs text-slate-400 line-clamp-2">{item.ai_summary}</p>}
          {item.suggested_action && <p className="mt-1 text-xs font-medium text-cyan-300">Action: {item.suggested_action}</p>}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {item.due_at && <span className="text-[10px] uppercase tracking-wider text-slate-400">{new Date(item.due_at).toLocaleDateString()}</span>}
          <span className={`text-[10px] font-semibold uppercase ${item.status === 'open' ? 'text-cyan-300' : item.status === 'in_progress' ? 'text-emerald-300' : 'text-slate-500'}`}>{item.status.replace(/_/g, ' ')}</span>
        </div>
      </div>
    </div>
  );
}

function RepCoachingCard({ rep, open, stale, nearClose, pipeline }: { rep: string; open: number; stale: number; nearClose: number; pipeline: number }) {
  const needsAttention = stale > 0 || nearClose > 0;
  return (
    <Link to="/team-opportunities" className={`block rounded-lg border p-3 transition hover:border-cyan-400/70 ${needsAttention ? 'border-amber-500/40 bg-amber-500/5' : 'border-slate-800 bg-slate-950/70'}`}>
      <div className="flex items-center justify-between">
        <p className="font-semibold text-slate-100">{rep}</p>
        {needsAttention && <span className="text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">Needs Attention</span>}
      </div>
      <div className="mt-1.5 grid grid-cols-3 gap-1 text-center">
        <div><p className="text-lg font-bold text-white">{open}</p><p className="text-[9px] uppercase text-slate-500">Open</p></div>
        <div><p className={`text-lg font-bold ${stale > 0 ? 'text-amber-300' : 'text-white'}`}>{stale}</p><p className="text-[9px] uppercase text-slate-500">Stale</p></div>
        <div><p className={`text-lg font-bold ${nearClose > 0 ? 'text-emerald-300' : 'text-white'}`}>{nearClose}</p><p className="text-[9px] uppercase text-slate-500">Near Close</p></div>
      </div>
      <p className="mt-1.5 text-xs text-cyan-200 text-right">Pipeline: {formatCurrency(pipeline)}</p>
    </Link>
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

export default function DirectorHome() {
  const user = getStoredUser();
  const { data: opportunities = [] } = useOpportunities({});
  const { data: organizations = [] } = useOrganizations({});
  const { data: orders = [] } = useOrders({});
  const { metrics: backendMetrics, isApiBacked } = useDashboardMetrics('DIRECTOR', user?.id, user?.email);

  // Work items: certifications pending, blocked orders, accounts needing assignment
  const { data: certificationItems = [] } = useWorkItems({ source: 'certification', status: 'open' });
  const { data: blockerItems = [] } = useWorkItems({ source: 'order_blocker', status: 'open' });
  const { data: assignmentItems = [] } = useWorkItems({ source: 'executive_intake', status: 'open' });
  const { data: allOpenItems = [] } = useWorkItems({ status: 'open' });

  const openOpps = opportunities.filter((opp) => openStages.includes(opp.stage));
  const nearClose = getNearCloseOpportunities(opportunities);
  const staleOpps = getStaleOpportunities(opportunities, 14);
  const staleAccounts = getStaleAccounts(organizations, 14);
  const untouchedAccounts = organizations.filter((org) => org.coverageStatus === 'UNTOUCHED');
  const touchedAccounts = organizations.length - untouchedAccounts.length;
  const coveragePct = organizations.length ? Math.round((touchedAccounts / organizations.length) * 100) : 0;
  const pipelineValue = openOpps.reduce((sum, opp) => sum + opp.value, 0);
  const nearCloseValue = nearClose.reduce((sum, opp) => sum + opp.value, 0);
  const blockedOrders = orders.filter((order) => order.productionStatus === 'BLOCKED');
  const stageCounts = Object.fromEntries(pipelineStages.map((stage) => [stage, opportunities.filter((opp) => opp.stage === stage).length]));
  const stageValues = Object.fromEntries(pipelineStages.map((stage) => [stage, opportunities.filter((opp) => opp.stage === stage).reduce((sum, opp) => sum + opp.value, 0)]));

  // Rep coaching rows
  const reps = Array.from(new Set(opportunities.map((opp) => opp.assignedRep))).filter(Boolean);
  const repCoachingRows = reps.map((rep) => {
    const repOpps = opportunities.filter((opp) => opp.assignedRep === rep);
    const repOpen = repOpps.filter((opp) => openStages.includes(opp.stage));
    const repStale = staleOpps.filter((opp) => opp.assignedRep === rep);
    const repNearClose = nearClose.filter((opp) => opp.assignedRep === rep);
    return {
      rep,
      open: repOpen.length,
      stale: repStale.length,
      nearClose: repNearClose.length,
      pipeline: repOpen.reduce((sum, opp) => sum + opp.value, 0),
    };
  }).sort((a, b) => (b.stale + b.nearClose) - (a.stale + a.nearClose));

  // Accounts needing assignment
  const unassignedOrgs = organizations.filter((org) => !org.assignedRep && !org.assignedDirector);
  const coachableReps = repCoachingRows.filter((r) => r.stale > 0 || r.nearClose > 0);
  const certificationCount = certificationItems.length;
  const blockerCount = blockerItems.length;

  // Prioritized work queue
  const urgentItems = allOpenItems
    .filter((item) => item.priority === 'critical' || item.priority === 'high')
    .slice(0, 6);
  const upcomingItems = allOpenItems
    .filter((item) => item.priority !== 'critical' && item.priority !== 'high')
    .slice(0, 6);

  // Director mission
  const directorMission = coachableReps.length
    ? { title: 'Coach reps on active deals', reason: `${coachableReps.length} reps have stale or near-close deals needing your attention.`, to: '/team-opportunities', cta: 'Open team pipeline' }
    : unassignedOrgs.length
      ? { title: 'Assign uncovered accounts', reason: `${unassignedOrgs.length} accounts need rep assignment.`, to: '/organizations', cta: 'Assign accounts' }
      : { title: 'Everything is on track', reason: 'All reps are moving deals and accounts are covered.', to: '/dashboard', cta: 'View dashboard' };

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold text-white">Director Command Center</h1>

      {/* Mission Priority */}
      <GlassCard title="🎯 MISSION PRIORITY">
        <p className="text-sm font-semibold text-white">{directorMission.title}</p>
        <p className="text-sm text-slate-300">{directorMission.reason}</p>
        <Link to={directorMission.to} className="mt-2 inline-block rounded-md border border-cyan-400/40 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100">{directorMission.cta}</Link>
      </GlassCard>

      {/* Top Metrics */}
      <div className="grid gap-3 md:grid-cols-5">
        <MetricTile value={String(coachableReps.length)} label="Reps Needing Attention" tone="border-amber-500/40 bg-amber-500/15" to="/team-opportunities" />
        <MetricTile value={String(reps.length)} label="Active Reps" tone="border-cyan-500/40 bg-cyan-500/15" to="/team-performance" />
        <MetricTile value={formatCurrency(nearCloseValue)} label="Coach to Close" tone="border-emerald-500/40 bg-emerald-500/15" to="/team-opportunities" />
        <MetricTile value={`${coveragePct}%`} label="Territory Coverage" tone="border-sky-500/40 bg-sky-500/15" to="/territory" />
        <MetricTile value={String(blockedOrders.length + blockerCount)} label="Blocked Orders" tone="border-rose-500/40 bg-rose-500/15" to="/orders" />
      </div>

      {/* Rep Attention & Team Pipeline */}
      <div className="grid gap-3 lg:grid-cols-2">
        <GlassCard title={`👥 REPS NEEDING ATTENTION (${coachableReps.length})`}>
          {coachableReps.length ? (
            <div className="space-y-2">
              {coachableReps.slice(0, 8).map((row) => (
                <RepCoachingCard key={row.rep} {...row} />
              ))}
            </div>
          ) : <p className="text-sm text-slate-400">All reps are moving deals. Great work.</p>}
        </GlassCard>

        <GlassCard title="📊 TEAM PIPELINE">
          <StagePipeline counts={stageCounts} values={stageValues} />
        </GlassCard>
      </div>

      {/* Certifications & Accounts Needing Assignment */}
      <div className="grid gap-3 lg:grid-cols-2">
        <GlassCard title={`🎓 CERTIFICATION ITEMS (${certificationCount})`}>
          {certificationCount ? (
            <div className="space-y-2">
              {certificationItems.slice(0, 6).map((item) => (
                <WorkItemRow key={item.id} item={item} />
              ))}
            </div>
          ) : <p className="text-sm text-slate-400">No certifications pending review.</p>}
          <Link to="/admin/certification" className="mt-2 inline-block rounded-md border border-cyan-400/40 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100">Review Certifications ›</Link>
        </GlassCard>

        <GlassCard title={`📋 ACCOUNTS NEEDING ASSIGNMENT (${unassignedOrgs.length})`}>
          {unassignedOrgs.length ? (
            <div className="space-y-2">
              {unassignedOrgs.slice(0, 6).map((org) => (
                <Link key={org.id} to={`/organizations/${org.id}`} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 transition hover:border-cyan-400/70">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-100 truncate">{org.name}</p>
                    <p className="text-xs text-slate-400">{org.city}{org.state ? `, ${org.state}` : ''}</p>
                  </div>
                  <span className="text-[10px] font-semibold uppercase text-amber-300">Unassigned</span>
                </Link>
              ))}
            </div>
          ) : <p className="text-sm text-slate-400">All accounts are assigned.</p>}
          <Link to="/organizations" className="mt-2 inline-block rounded-md border border-cyan-400/40 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100">Manage Accounts ›</Link>
        </GlassCard>
      </div>

      {/* Prioritized Work Queue */}
      <GlassCard title="📋 PRIORITIZED WORK QUEUE">
        {urgentItems.length ? (
          <div className="space-y-2 mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-red-400">Critical / High Priority</p>
            {urgentItems.map((item) => (
              <WorkItemRow key={item.id} item={item} />
            ))}
          </div>
        ) : null}
        {upcomingItems.length ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Upcoming</p>
            {upcomingItems.map((item) => (
              <WorkItemRow key={item.id} item={item} />
            ))}
          </div>
        ) : null}
        {!urgentItems.length && !upcomingItems.length && <p className="text-sm text-slate-400">All clear — no work items pending.</p>}
      </GlassCard>
    </div>
  );
}
