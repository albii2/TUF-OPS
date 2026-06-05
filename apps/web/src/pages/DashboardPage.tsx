import { Link } from 'react-router-dom';
import { teamMembers } from '../data/mockSalesData';
import { GlassCard } from '../components/ui';
import { getStoredUser } from '../auth';
import type { Role } from '../types';
import { useActivities } from '../hooks/useReports';
import { useOpportunities } from '../hooks/useOpportunities';
import { useOrders } from '../hooks/useOrders';
import { useOrganizations } from '../hooks/useOrganizations';
import { getLanePenetration, getMomentumState, getNearCloseOpportunities, getStaleAccounts, getStaleOpportunities, getStuckOpportunities, getTerritoryHealthLabel } from '../services/businessSelectors';
import { formatCurrency } from '../utils/format';

const MONTHLY_ORDER_GOAL = 4;
const openStages = ['LEAD_ASSIGNED', 'CONTACTED', 'DISCOVERY', 'MOCKUP_REQUESTED', 'MOCKUP_DELIVERED', 'INVOICE_SENT', 'DECISION_PENDING'];
const pipelineStages = ['CONTACTED', 'MOCKUP_REQUESTED', 'INVOICE_SENT', 'CLOSED_WON'] as const;

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

function ProgressLine({ label, value, total, amount }: { label: string; value: number; total: number; amount: number }) {
  const pct = Math.min(100, Math.round((value / Math.max(total, 1)) * 100));
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="text-slate-300">{label}</span>
        <span className="font-semibold text-slate-100">{formatCurrency(amount)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
        <div className="h-full rounded-full bg-cyan-400" style={{ width: `${pct}%` }} />
      </div>
    </div>
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
      <div className="flex flex-col items-end shrink-0">
        <span className="text-sm font-semibold text-slate-100">{formatCurrency(value)}</span>
        {dueDate && <span className="text-[10px] text-slate-400 uppercase tracking-wider">{dueDate}</span>}
      </div>
      <span className="shrink-0 text-lg text-slate-600 group-hover:text-cyan-400 transition ml-2">›</span>
    </Link>
  );
}

function ProgressBar({ count, total, label, projectedPace }: { count: number; total: number; label: string; projectedPace: number }) {
  const pct = Math.min(100, Math.round((count / Math.max(total, 1)) * 100));
  const projectedPct = Math.min(100, Math.round((projectedPace / Math.max(total, 1)) * 100));
  
  let colorClass = 'bg-rose-500';
  if (count >= total) colorClass = 'bg-emerald-500';
  else if (count >= 2) colorClass = 'bg-amber-500';

  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold text-white">{count} <span className="text-sm font-normal text-slate-400">/ {total} {label}</span></p>
          <p className="text-xs text-slate-400">Projected pace: <span className="font-semibold text-slate-200">{projectedPace.toFixed(1)} orders</span></p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Monthly Standard</p>
          <p className={`text-sm font-bold ${count >= total ? 'text-emerald-400' : count >= 2 ? 'text-amber-400' : 'text-rose-400'}`}>
            {pct}% of Floor
          </p>
        </div>
      </div>
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-800/50 border border-slate-700/50">
        <div className="absolute h-full rounded-full opacity-30 bg-slate-400" style={{ width: `${projectedPct}%` }} />
        <div className={`absolute h-full rounded-full transition-all duration-500 ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function DashboardPage({ role }: { role: Role }) {
  const opportunities = useOpportunities({});
  const currentUser = getStoredUser();
  const organizations = useOrganizations({});
  const orders = useOrders({});
  const activities = useActivities({ limit: 4 });

  const nearClose = getNearCloseOpportunities(opportunities);
  const stuckDeals = getStuckOpportunities(opportunities);
  const openOpps = opportunities.filter((opp) => openStages.includes(opp.stage));
  const pendingPayments = opportunities.filter((opp) => ['INVOICE_SENT', 'DECISION_PENDING'].includes(opp.stage));
  const completedOrders = orders.filter((order) => order.productionStatus === 'COMPLETED');
  const blockedOrders = orders.filter((order) => order.productionStatus === 'BLOCKED');
  const pipelineTotal = openOpps.reduce((sum, opp) => sum + opp.value, 0);
  const closedValue = opportunities.filter((opp) => opp.stage === 'CLOSED_WON').reduce((sum, opp) => sum + opp.value, 0);
  const pendingValue = pendingPayments.reduce((sum, opp) => sum + opp.value, 0);
  const lanePenetration = getLanePenetration(organizations);
  const staleOpps = getStaleOpportunities(opportunities, 14);
  const staleAccounts = getStaleAccounts(organizations, 14);
  const touchedAccounts = organizations.length - organizations.filter((o) => o.coverageStatus === 'UNTOUCHED').length;
  const momentum = getMomentumState({ nearClose: nearClose.length, stuck: stuckDeals.length, stale: staleOpps.length, touched: touchedAccounts });
  const coveragePct = organizations.length ? Math.round((touchedAccounts / organizations.length) * 100) : 0;
  const territoryHealth = getTerritoryHealthLabel(coveragePct);
  const movementStreak = Math.min(7, Math.max(1, activities.length + nearClose.length));

  const unassignedOrgs = organizations.filter((o) => o.assignedRep === 'Unassigned' || o.assignedDirector === 'Unassigned' || !o.territory);
  const closeThisWeekValue = nearClose.reduce((sum, opp) => sum + opp.value, 0);
  const cashBlockedValue = pendingPayments.reduce((sum, opp) => sum + opp.value, 0) + blockedOrders.reduce((sum, order) => sum + order.value, 0);
  const zoneRisk = staleAccounts.length + organizations.filter((o) => o.coverageStatus === 'UNTOUCHED').length;

  // Pace calculation: Assume 22 business days/month, estimate based on current completion
  const dayOfMonth = new Date().getDate();
  const daysInMonth = 30;
  const projectedPace = (completedOrders.length / dayOfMonth) * daysInMonth;
  const avgDealValue = openOpps.length ? pipelineTotal / openOpps.length : 1500;
  const estimatedEarnings = projectedPace * avgDealValue * 0.1; // 10% commission mock

  const mission = staleOpps.length
    ? { title: 'Follow up stale opportunity now', reason: `${staleOpps.length} opportunities are stale and need activity today.`, to: '/my-opportunities', cta: 'Open priority queue' }
    : pendingPayments.length
      ? { title: 'Push near-close invoice follow-up', reason: `${pendingPayments.length} deals are waiting on invoice/payment pressure.`, to: '/orders', cta: 'Open priority queue' }
      : { title: 'Contact untouched assigned account', reason: 'Activate account coverage and lane expansion from your assigned book.', to: '/organizations', cta: 'Open priority queue' };

  if (role === 'OPS') {
    const newOrders = orders.filter((o) => o.productionStatus === 'NEEDS_REVIEW').length;
    const needsReview = orders.filter((o) => o.productionStatus === 'NEEDS_REVIEW');
    const readyForVendor = orders.filter((o) => o.productionStatus === 'READY_FOR_VENDOR');
    const inProduction = orders.filter((o) => o.productionStatus === 'IN_PRODUCTION');
    const delayed = inProduction.filter((o) => o.missingInfo.length > 0);
    const opsMission = blockedOrders.length
      ? { title: 'Unblock production immediately', reason: `${blockedOrders.length} blocked orders are waiting on missing package items.`, to: '/orders', cta: 'Orders' }
      : needsReview.length
        ? { title: 'Collect missing handoff information', reason: `${needsReview.length} orders need review before vendor routing.`, to: '/ops-workspace', cta: 'Ops Workspace' }
        : { title: 'Prepare vendor packets', reason: `${readyForVendor.length} orders are ready for vendor release.`, to: '/ops-workspace', cta: 'Ops Workspace' };

    return (
      <div className="space-y-3">
        <div className="grid gap-3 md:grid-cols-4">
          <MetricTile value={String(newOrders)} label="New Orders" tone="border-cyan-500/40 bg-cyan-500/10" to="/ops-workspace" />
          <MetricTile value={String(blockedOrders.length)} label="Blocked Orders" tone="border-rose-500/40 bg-rose-500/10" to="/orders" />
          <MetricTile value={String(needsReview.length)} label="Needs Review" tone="border-amber-500/40 bg-amber-500/10" to="/ops-workspace" />
          <MetricTile value={String(readyForVendor.length)} label="Ready for Vendor" tone="border-emerald-500/40 bg-emerald-500/10" to="/ops-workspace" />
        </div>
        <GlassCard title="MISSION PRIORITY"><p className="text-sm text-slate-300">{opsMission.title}</p><p className="text-xs text-slate-400">{opsMission.reason}</p><div className="mt-2 flex gap-2"><Link to={opsMission.to} className="rounded-md border border-cyan-400/40 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100">{opsMission.cta}</Link><Link to="/reports" className="rounded-md border border-slate-700 px-3 py-2 text-xs text-slate-200">Reports</Link></div></GlassCard>
        <GlassCard title="BLOCKER RESOLUTION QUEUE">
          <div className="grid gap-2 md:grid-cols-2">
            {blockedOrders.slice(0, 8).map((order) => (
              <DealRow key={order.id} title={`${order.id} — ${order.organizationName}`} meta={`Blocker: ${order.missingInfo.join(', ') || 'Vendor clarification'}`} value={order.value} to={`/orders/${order.id}`} />
            ))}
          </div>
        </GlassCard>
        <GlassCard title="FULFILLMENT CONTROL BOARD"><p className="text-sm text-slate-300">Needs Review {needsReview.length} · Ready for Vendor {readyForVendor.length} · In Production {inProduction.length} · Delayed {delayed.length}.</p></GlassCard>
      </div>
    );
  }


  if (role === 'OWNER') {
    return (
      <div className="space-y-3"> 
        <h1 className="text-2xl font-semibold text-white">Owner Command Center</h1>
        <div className="safe-grid grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"> 
          <MetricTile value={String(organizations.filter((o) => o.coverageStatus === 'UNTOUCHED').length)} label="Untouched Accounts" tone="border-amber-500/40 bg-amber-500/15" to="/territory" />
          <MetricTile value={formatCurrency(cashBlockedValue)} label="Cash Blocked" tone="border-rose-500/40 bg-rose-500/15" to="/orders" />
          <MetricTile value={formatCurrency(closeThisWeekValue)} label="Close This Week" tone="border-emerald-500/40 bg-emerald-500/15" to="/team-opportunities" />
          <MetricTile value={String(zoneRisk)} label="Territory Risk" tone="border-cyan-500/40 bg-cyan-500/15" to="/territory/map" />
        </div>
        <GlassCard title="MISSION PRIORITY"><div className="space-y-2"><p className="text-base font-semibold text-white">{mission.title}</p><p className="text-sm text-slate-300">{mission.reason}</p><Link to={mission.to} className="inline-block rounded-md border border-cyan-400/40 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-100">{mission.cta}</Link></div></GlassCard>
        <GlassCard title="OWNER ACTION QUEUE"><div className="space-y-2">{ownerActions.map((action)=> <Link key={action.title} to={action.to} className="block rounded-lg border border-slate-800 bg-slate-950/70 p-3 hover:border-cyan-400/60"><p className="font-semibold text-slate-100">{action.title}</p><p className="text-xs text-slate-400">{action.reason}</p><p className="text-xs text-cyan-200">Impact: {action.impact}</p></Link>)}</div></GlassCard>
      </div>
    );
  }

  if (role === 'DIRECTOR') {
    const repCoachingGrid = Array.from(new Set(stuckDeals.map((o) => o.assignedRep))).map((rep) => ({
      rep,
      stuck: stuckDeals.filter((o) => o.assignedRep === rep).length,
      nearClose: nearClose.filter((o) => o.assignedRep === rep).length,
      stale: staleOpps.filter((o) => o.assignedRep === rep).length,
      pipeline: opportunities.filter((o) => o.assignedRep === rep && !['CLOSED_WON','CLOSED_LOST'].includes(o.stage)).reduce((sum,o)=>sum+o.value,0),
    }));
    const directorName = currentUser?.role === 'DIRECTOR' ? currentUser.name : '';
    const myOpps = opportunities.filter((o) => o.assignedRep === directorName);
    const myNearClose = getNearCloseOpportunities(myOpps);
    const myPipeline = myOpps.filter((o) => !['CLOSED_WON','CLOSED_LOST'].includes(o.stage)).reduce((sum,o)=>sum+o.value,0);
    const untouchedAccounts = organizations.filter((o)=>o.coverageStatus==='UNTOUCHED').length;
    const directorMission = staleOpps.length
      ? { title: 'Rescue stale opportunities', reason: `${staleOpps.length} deals are stale and need coaching intervention today.`, to:'/team-opportunities', cta:'All Opportunities' }
      : untouchedAccounts
        ? { title: 'Assign untouched accounts', reason: `${untouchedAccounts} accounts remain untouched in your territory scope.`, to:'/organizations', cta:'Organizations' }
        : { title: 'Push near-close deals', reason: `${nearClose.length} near-close deals need invoice pressure this week.`, to:'/my-opportunities', cta:'My Opportunities' };

    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold text-white">Director Coaching Room</h1>
        <div className="safe-grid grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <MetricTile value={String(stuckDeals.length)} label="Stuck Deals" tone="border-sky-500/40 bg-sky-500/15" to="/team-opportunities" />
          <MetricTile value={String(new Set(stuckDeals.map((o) => o.assignedRep)).size)} label="Reps Needing Coaching" tone="border-amber-500/40 bg-amber-500/15" to="/team-performance" />
          <MetricTile value={formatCurrency(nearClose.reduce((sum,o)=>sum+o.value,0))} label="Close This Week" tone="border-emerald-500/40 bg-emerald-500/15" to="/team-opportunities" />
          <MetricTile value={`${coveragePct}%`} label="Territory Coverage" tone="border-cyan-500/40 bg-cyan-500/15" to="/territory" />
        </div>
        <GlassCard title="MISSION PRIORITY"><div className="space-y-2"><p className="text-base font-semibold text-white">{directorMission.title}</p><p className="text-sm text-slate-300">{directorMission.reason}</p><div className="flex flex-wrap gap-2"><Link to={directorMission.to} className="rounded-md border border-cyan-400/40 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100">{directorMission.cta}</Link><Link to="/my-opportunities" className="rounded-md border border-slate-700 px-3 py-2 text-xs text-slate-200">My Opportunities</Link><Link to="/territory" className="rounded-md border border-slate-700 px-3 py-2 text-xs text-slate-200">Territory</Link><Link to="/reports" className="rounded-md border border-slate-700 px-3 py-2 text-xs text-slate-200">Reports</Link></div></div></GlassCard>
        <div className="safe-grid grid gap-3 lg:grid-cols-2">
          <GlassCard title="COACHING QUEUE"><div className="space-y-2">{repCoachingGrid.slice(0,6).map((row)=><Link key={row.rep} to="/team-opportunities" className="block rounded-lg border border-slate-800 bg-slate-950/70 p-3"><p className="font-semibold text-slate-100">{row.rep}</p><p className="text-xs text-slate-400">Issue: stale {row.stale} · stuck {row.stuck} · near-close {row.nearClose}</p><p className="text-xs text-cyan-200">Action: coach next action + invoice pressure · Impact {formatCurrency(row.pipeline)}</p></Link>)}</div></GlassCard>
          <GlassCard title="MY SELLING PANEL"><p className="text-sm text-slate-300">My opportunities: {myOpps.length} · Near-close: {myNearClose.length} · Pipeline: {formatCurrency(myPipeline)}</p><div className="mt-2 space-y-2">{myOpps.slice(0,4).map((opp)=><DealRow key={opp.id} title={opp.nextAction} meta={`${opp.organizationName} · ${opp.stage}`} value={opp.value} to={`/opportunities/${opp.id}`} />)}</div></GlassCard>
        </div>
        <GlassCard title="TERRITORY WAR TABLE"><p className="text-sm text-slate-300">Coverage {coveragePct}% · Untouched {organizations.filter((o) => o.coverageStatus === 'UNTOUCHED').length} · Stale accounts {staleAccounts.length} · Near-close {nearClose.length} · Stuck deals {stuckDeals.length}</p><div className="mt-2 grid gap-2 sm:grid-cols-2">{Object.entries(lanePenetration).map(([lane,count])=><p key={lane} className="text-xs text-slate-300">{lane}: {count} active lanes</p>)}</div></GlassCard>
      </div>
    );
  }

  const myActions = [...staleOpps, ...pendingPayments].slice(0, 5);

  return (
      <div className="space-y-4">
        {/* SECTION 1: MY ACTIONS TODAY */}
        <GlassCard title="MY ACTIONS TODAY">
          <div className="space-y-2">
            {myActions.length ? (
              myActions.map((opp) => (
                <DealRow 
                  key={opp.id} 
                  title={opp.organizationName} 
                  meta={`${opp.sport} · ${opp.lane} · ${opp.stage.replace(/_/g, ' ')}`} 
                  value={opp.value} 
                  to={`/opportunities/${opp.id}`} 
                  nextAction={opp.nextAction}
                  dueDate={opp.id.startsWith('opp-1') ? 'Due Today' : 'Overdue'}
                />
              ))
            ) : (
              <p className="py-4 text-center text-sm text-slate-400">All caught up! No urgent actions needed.</p>
            )}
          </div>
        </GlassCard>

        {/* SECTION 2: 4 ORDER MONTHLY STANDARD */}
        <div className="grid gap-3 lg:grid-cols-3">
          <GlassCard title="4 ORDER MONTHLY STANDARD" className="lg:col-span-2">
            <div className="flex flex-col gap-6 md:flex-row md:items-center">
              <div className="flex-1">
                <ProgressBar 
                  count={completedOrders.length} 
                  total={MONTHLY_ORDER_GOAL} 
                  label="Orders" 
                  projectedPace={projectedPace}
                />
              </div>
              <div className="shrink-0 border-l border-slate-800 pl-6 md:w-48">
                <p className="text-xs text-slate-400">Estimated Earnings</p>
                <p className="text-xl font-bold text-emerald-400">{formatCurrency(estimatedEarnings)}</p>
                <p className="text-[10px] text-slate-500 mt-1">Based on {projectedPace.toFixed(1)} projected orders at {formatCurrency(avgDealValue)} avg.</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard title="MISSION PRIORITY">
            <div className="flex h-full flex-col justify-between">
              <div>
                <p className="text-base font-bold text-white uppercase tracking-tight">{mission.title}</p>
                <p className="mt-1 text-sm text-slate-300">{mission.reason}</p>
                <p className="mt-2 text-xs font-semibold text-rose-400 uppercase">Due Today</p>
              </div>
              <Link to={mission.to} className="mt-4 inline-block w-full rounded-md bg-cyan-500/10 border border-cyan-400/40 py-2.5 text-center text-sm font-bold text-cyan-100 transition hover:bg-cyan-500/20">
                {mission.cta}
              </Link>
            </div>
          </GlassCard>
        </div>

        {/* SECTION 3: PIPELINE HEALTH */}
        <GlassCard title="PIPELINE HEALTH">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <p className="text-xs text-slate-400">Total Active</p>
              <p className="text-xl font-bold text-white">{openOpps.length}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Near Close</p>
              <p className="text-xl font-bold text-emerald-400">{nearClose.length}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Stalled</p>
              <p className="text-xl font-bold text-amber-400">{stuckDeals.length}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Pipeline Value</p>
              <p className="text-xl font-bold text-cyan-400">{formatCurrency(pipelineTotal)}</p>
            </div>
          </div>
        </GlassCard>

        {/* SECTION 4: EXPANSION OPPORTUNITIES */}
        <GlassCard title="EXPANSION OPPORTUNITIES">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Object.entries(lanePenetration).map(([lane, count]) => (
              <div key={lane}>
                <p className="text-xs text-slate-400 truncate">{lane.replace(/_/g, ' ')}</p>
                <p className="text-xl font-bold text-slate-100">{count} <span className="text-[10px] font-normal text-slate-500">accounts</span></p>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* SECTION 5: ADDITIONAL INSIGHTS */}
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest hover:text-slate-300 transition-colors">
            <span className="transition-transform group-open:rotate-90">›</span>
            Additional Insights
          </summary>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <GlassCard title="MOMENTUM SYSTEM">
              <p className="text-sm text-slate-300">Status: {momentum} · Movement streak: {movementStreak} days · Stale opportunities: {staleOpps.length} · Follow-up pressure: {pendingPayments.length} payment/invoice deals.</p>
            </GlassCard>
            <GlassCard title="LANE PENETRATION OPPORTUNITY">
              <p className="text-xs text-cyan-200">Recommended next lane: Team Store where Uniform is already active.</p>
            </GlassCard>
          </div>
        </details>
      </div>
    );
  }

