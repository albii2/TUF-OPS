import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GlassCard } from '../components/ui';
import { getStoredUser } from '../auth';
import { markPageVisited } from '../lib/academy';
import { ForgePanel } from '../components/ForgePanel';
import type { Role } from '../types';
import { useActivities } from '../hooks/useReports';
import { useDashboardMetrics } from '../hooks/useDashboardMetrics';
import { useOpportunities } from '../hooks/useOpportunities';
import { useOrders } from '../hooks/useOrders';
import { useOrganizations } from '../hooks/useOrganizations';
import { getLanePenetration, getNearCloseOpportunities, getStaleAccounts, getStaleOpportunities, getStuckOpportunities } from '../services/businessSelectors';
import { getEcosystemReferralSummary } from '../services/ecosystemReferralsService';
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

function DealRow({ title, meta, value, to, nextAction, dueDate }: { title: string; meta: string; value: number; to: string; nextAction?: string; dueDate?: string }) {
  return (
    <Link to={to} className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 transition hover:border-cyan-400/70 hover:bg-slate-900">
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-slate-100">{title}</span>
        <span className="block truncate text-xs text-slate-400">{meta}</span>
        {nextAction && <span className="mt-1 block truncate text-xs font-medium text-cyan-300">Action: {nextAction}</span>}
      </span>
      <div className="flex shrink-0 flex-col items-end">
        <span className="text-sm font-semibold text-slate-100">{formatCurrency(value)}</span>
        {dueDate && <span className="text-[10px] uppercase tracking-wider text-slate-400">{dueDate}</span>}
      </div>
      <span className="ml-2 shrink-0 text-lg text-slate-600 transition group-hover:text-cyan-400">›</span>
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

function ActivityFeed({ title, activities }: { title: string; activities: ReturnType<typeof useActivities> }) {
  return (
    <GlassCard title={title}>
      <div className="space-y-2">
        {activities.length ? activities.map((activity) => (
          <div key={activity.id} className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
            <p className="text-sm text-slate-200">{activity.message}</p>
            <p className="text-xs text-slate-500">{activity.timestamp} · {activity.user}</p>
          </div>
        )) : <p className="text-sm text-slate-400">No activity logged yet.</p>}
      </div>
    </GlassCard>
  );
}

export function DashboardPage({ role }: { role: Role }) {
  useEffect(() => { markPageVisited('dashboard'); }, []);
  const opportunities = useOpportunities({});
  const organizations = useOrganizations({});
  const orders = useOrders({});
  const activities = useActivities({ limit: 8 });
  const currentUser = getStoredUser();
  const { metrics: backendMetrics, error: dashboardMetricsError, isApiBacked } = useDashboardMetrics(role, currentUser?.id, currentUser?.email);

  const openOpps = opportunities.filter((opp) => openStages.includes(opp.stage));
  const wonOpps = opportunities.filter((opp) => opp.stage === 'CLOSED_WON');
  const nearClose = getNearCloseOpportunities(opportunities);
  const staleOpps = getStaleOpportunities(opportunities, 14);
  const stuckDeals = getStuckOpportunities(opportunities);
  const staleAccounts = getStaleAccounts(organizations, 14);
  const untouchedAccounts = organizations.filter((org) => org.coverageStatus === 'UNTOUCHED');
  const touchedAccounts = organizations.length - untouchedAccounts.length;
  const coveragePct = organizations.length ? Math.round((touchedAccounts / organizations.length) * 100) : 0;
  const pipelineValue = openOpps.reduce((sum, opp) => sum + opp.value, 0);
  const nearCloseValue = nearClose.reduce((sum, opp) => sum + opp.value, 0);
  const wonValue = wonOpps.reduce((sum, opp) => sum + opp.value, 0);
  const lanePenetration = getLanePenetration(organizations);
  const ecosystemSummary = getEcosystemReferralSummary();
  const completedOrders = orders.filter((order) => order.productionStatus === 'COMPLETED');
  const blockedOrders = orders.filter((order) => order.productionStatus === 'BLOCKED');
  const needsReviewOrders = orders.filter((order) => order.productionStatus === 'NEEDS_REVIEW');
  const readyForVendorOrders = orders.filter((order) => order.productionStatus === 'READY_FOR_VENDOR');
  const stageCounts = Object.fromEntries(pipelineStages.map((stage) => [stage, opportunities.filter((opp) => opp.stage === stage).length]));
  const stageValues = Object.fromEntries(pipelineStages.map((stage) => [stage, opportunities.filter((opp) => opp.stage === stage).reduce((sum, opp) => sum + opp.value, 0)]));
  const orderPaceCount = isApiBacked ? (backendMetrics.paid_order_count ?? 0) : completedOrders.length;
  const monthlyOrderPct = Math.min(100, Math.round((orderPaceCount / MONTHLY_ORDER_GOAL) * 100));

  if (role === 'REGIONAL_DIRECTOR') {
    const opsMission = blockedOrders.length
      ? { title: 'Unblock production immediately', reason: `${blockedOrders.length} blocked orders are waiting on missing package items.`, to: '/orders', cta: 'Open blocked orders' }
      : needsReviewOrders.length
        ? { title: 'Collect missing handoff information', reason: `${needsReviewOrders.length} orders need review before vendor routing.`, to: '/ops-workspace', cta: 'Open ops workspace' }
        : { title: 'Prepare vendor packets', reason: `${readyForVendorOrders.length} orders are ready for vendor release.`, to: '/ops-workspace', cta: 'Open ops workspace' };

    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold text-white">Ops Fulfillment Control</h1>
        <div className="grid gap-3 md:grid-cols-4">
          <MetricTile value={String(needsReviewOrders.length)} label="Needs Handoff Review" tone="border-amber-500/40 bg-amber-500/10" to="/ops-workspace" />
          <MetricTile value={String(readyForVendorOrders.length)} label="Ready for Vendor" tone="border-emerald-500/40 bg-emerald-500/10" to="/ops-workspace" />
          <MetricTile value={String(blockedOrders.length)} label="Blocked Orders" tone="border-rose-500/40 bg-rose-500/10" to="/orders" />
          <MetricTile value={String(completedOrders.length)} label="Completed Orders" tone="border-cyan-500/40 bg-cyan-500/10" to="/orders" />
        </div>
        <GlassCard title="MISSION PRIORITY"><p className="text-sm font-semibold text-white">{opsMission.title}</p><p className="text-sm text-slate-300">{opsMission.reason}</p><Link to={opsMission.to} className="mt-2 inline-block rounded-md border border-cyan-400/40 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100">{opsMission.cta}</Link></GlassCard>
      </div>
    );
  }

  if (role === 'ADMIN') {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold text-white">Admin Coverage & Revenue Command</h1>
        <div className="grid gap-3 md:grid-cols-4">
          <MetricTile value={`${coveragePct}%`} label="Account Coverage" tone="border-cyan-500/40 bg-cyan-500/15" to="/organizations" />
          <MetricTile value={formatCurrency(pipelineValue)} label="Open Pipeline" tone="border-sky-500/40 bg-sky-500/15" to="/team-opportunities" />
          <MetricTile value={formatCurrency(nearCloseValue)} label="Near-Close Revenue" tone="border-emerald-500/40 bg-emerald-500/15" to="/team-opportunities" />
          <MetricTile value={formatCurrency(wonValue)} label="Closed-Won Revenue" tone="border-violet-500/40 bg-violet-500/15" to="/orders" />
        </div>
        {isApiBacked && dashboardMetricsError ? <GlassCard title="DASHBOARD API WARNING"><p className="text-sm text-amber-200">{dashboardMetricsError}</p></GlassCard> : null}
        <GlassCard title="PIPELINE FROM COVERAGE TO CASH"><StagePipeline counts={stageCounts} values={stageValues} /></GlassCard>
        <div className="grid gap-3 lg:grid-cols-2">
          <GlassCard title="COVERAGE GAPS"><p className="text-sm text-slate-300">Untouched accounts: {isApiBacked ? backendMetrics.untouched_schools : untouchedAccounts.length} · Stale accounts: {staleAccounts.length} · Ecosystem referrals: {ecosystemSummary.created}</p><div className="mt-2 grid gap-2 sm:grid-cols-2">{Object.entries(lanePenetration).map(([lane, count]) => <p key={lane} className="text-xs text-slate-300">{lane.replace(/_/g, ' ')}: {count} active accounts</p>)}</div></GlassCard>
          <GlassCard title="REVENUE RISK"><p className="text-sm text-slate-300">Stale opportunities: {staleOpps.length} · Stuck deals: {stuckDeals.length} · Blocked orders: {blockedOrders.length}</p><div className="mt-2 space-y-2">{nearClose.slice(0, 4).map((opp) => <DealRow key={opp.id} title={opp.title} meta={`${opp.organizationName} · ${opp.assignedRep}`} value={opp.value} to={`/opportunities/${opp.id}`} nextAction={opp.nextAction} />)}</div></GlassCard>
        </div>
      </div>
    );
  }

  if (role === 'DIRECTOR') {
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
    const directorMission = staleOpps.length
      ? { title: 'Coach stale deal movement today', reason: `${staleOpps.length} opportunities need rep activity or next-step coaching.`, to: '/team-opportunities', cta: 'Open team pipeline' }
      : nearClose.length
        ? { title: 'Coach invoice pressure', reason: `${nearClose.length} deals are near close and should convert to orders.`, to: '/team-opportunities', cta: 'Open near-close deals' }
        : { title: 'Increase account coverage', reason: `${untouchedAccounts.length} accounts still need first touch or lane activation.`, to: '/organizations', cta: 'Open organizations' };

    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold text-white">Director Coaching Dashboard</h1>
        <div className="grid gap-3 md:grid-cols-4">
          <MetricTile value={String(staleOpps.length)} label="Deals Needing Coaching" tone="border-amber-500/40 bg-amber-500/15" to="/team-opportunities" />
          <MetricTile value={String(reps.length)} label="Active Reps" tone="border-cyan-500/40 bg-cyan-500/15" to="/team-performance" />
          <MetricTile value={formatCurrency(nearCloseValue)} label="Coach to Close" tone="border-emerald-500/40 bg-emerald-500/15" to="/team-opportunities" />
          <MetricTile value={`${coveragePct}%`} label="Territory Coverage" tone="border-sky-500/40 bg-sky-500/15" to="/territory" />
        </div>
        <GlassCard title="COACHING PRIORITY"><p className="text-sm font-semibold text-white">{directorMission.title}</p><p className="text-sm text-slate-300">{directorMission.reason}</p><Link to={directorMission.to} className="mt-2 inline-block rounded-md border border-cyan-400/40 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100">{directorMission.cta}</Link></GlassCard>
        <GlassCard title="TEAM PIPELINE"><StagePipeline counts={stageCounts} values={stageValues} /></GlassCard>
        <div className="grid gap-3 lg:grid-cols-2">
          <GlassCard title="REP COACHING QUEUE"><div className="space-y-2">{repCoachingRows.slice(0, 8).map((row) => <Link key={row.rep} to="/team-opportunities" className="block rounded-lg border border-slate-800 bg-slate-950/70 p-3"><p className="font-semibold text-slate-100">{row.rep}</p><p className="text-xs text-slate-400">Open {row.open} · stale {row.stale} · near-close {row.nearClose}</p><p className="text-xs text-cyan-200">Pipeline: {formatCurrency(row.pipeline)}</p></Link>)}</div></GlassCard>
          <ActivityFeed title="RECENT TEAM ACTIVITY" activities={activities} />
        </div>
      </div>
    );
  }

  const repMission = staleOpps.length
    ? { title: 'Follow up stale opportunity now', reason: `${staleOpps.length} opportunities are stale and need activity today.`, to: '/my-opportunities', cta: 'Open my pipeline' }
    : nearClose.length
      ? { title: 'Close near-ready deal', reason: `${nearClose.length} deals are in invoice or mockup pressure and can become orders.`, to: '/my-opportunities', cta: 'Open close queue' }
      : { title: 'Attack account coverage', reason: `${untouchedAccounts.length} accounts need first touch or lane expansion.`, to: '/organizations', cta: 'Open accounts' };

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold text-white">Rep Pipeline Dashboard</h1>
      <div className="grid gap-3 md:grid-cols-4">
        <MetricTile value={String(openOpps.length)} label="Active Opportunities" tone="border-cyan-500/40 bg-cyan-500/15" to="/my-opportunities" />
        <MetricTile value={formatCurrency(pipelineValue)} label="My Open Pipeline" tone="border-sky-500/40 bg-sky-500/15" to="/my-opportunities" />
        <MetricTile value={formatCurrency(nearCloseValue)} label="Close This Week" tone="border-emerald-500/40 bg-emerald-500/15" to="/my-opportunities" />
        <MetricTile value={`${orderPaceCount}/${MONTHLY_ORDER_GOAL}`} label={`${monthlyOrderPct}% of 4-Order Floor`} tone="border-violet-500/40 bg-violet-500/15" to="/orders" />
      </div>
      <GlassCard title="TODAY'S PRIORITY"><p className="text-sm font-semibold text-white">{repMission.title}</p><p className="text-sm text-slate-300">{repMission.reason}</p><Link to={repMission.to} className="mt-2 inline-block rounded-md border border-cyan-400/40 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100">{repMission.cta}</Link></GlassCard>
      <GlassCard title="MY PIPELINE FROM LEAD TO ORDER"><StagePipeline counts={stageCounts} values={stageValues} /></GlassCard>
      <div className="grid gap-3 lg:grid-cols-2">
        <GlassCard title="NEXT DEALS TO MOVE"><div className="space-y-2">{[...staleOpps, ...nearClose, ...openOpps].slice(0, 6).map((opp) => <DealRow key={opp.id} title={opp.title} meta={`${opp.organizationName} · ${opp.stage}`} value={opp.value} to={`/opportunities/${opp.id}`} nextAction={opp.nextAction} dueDate={opp.nextActionDueDate} />)}</div></GlassCard>
        <ActivityFeed title="MY RECENT ACTIVITY" activities={activities} />
      </div>
      <div className="mt-6">
        <ForgePanel />
      </div>
    </div>
  );
}
