import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { GlassCard } from '../components/ui';
import { getStoredUser } from '../auth';
import type { Role } from '../types';
import { useActivities } from '../hooks/useReports';
import { useDashboardMetrics } from '../hooks/useDashboardMetrics';
import { useOpportunities } from '../hooks/useOpportunities';
import { useOrders } from '../hooks/useOrders';
import { useOrganizations } from '../hooks/useOrganizations';
import { getLanePenetration, getMomentumState, getNearCloseOpportunities, getStaleAccounts, getStaleOpportunities, getStuckOpportunities, getTerritoryHealthLabel } from '../services/businessSelectors';
import { getEcosystemReferralSummary } from '../services/ecosystemReferralsService';
import { formatCurrency } from '../utils/format';
import { listUsers, toggleUserHrDocs, toggleUserDirectorSignoff, toggleUserPracticalExercise } from '../services/usersService';

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
      <div className="flex items-center justify-between gap-3 text-xs">
        <p className="truncate text-slate-400">Projected pace: <span className="font-semibold text-slate-200">{projectedPace.toFixed(1)} {label.toLowerCase()}</span></p>
        <p className={`shrink-0 font-bold ${count >= total ? 'text-emerald-400' : count >= 2 ? 'text-amber-400' : 'text-rose-400'}`}>
          {pct}% floor
        </p>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full border border-slate-700/50 bg-slate-800/50">
        <div className="absolute h-full rounded-full bg-slate-400 opacity-30" style={{ width: `${projectedPct}%` }} />
        <div className={`absolute h-full rounded-full transition-all duration-500 ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function DashboardPage({ role }: { role: Role }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const opportunities = useOpportunities({});
  const currentUser = getStoredUser();
  const organizations = useOrganizations({});
  const orders = useOrders({});
  const activities = useActivities({ limit: 4 });
  const ecosystemSummary = getEcosystemReferralSummary();
  const { metrics: backendMetrics, error: dashboardMetricsError, isApiBacked } = useDashboardMetrics(role, currentUser?.id, currentUser?.email);

  const nearClose = getNearCloseOpportunities(opportunities);
  const stuckDeals = getStuckOpportunities(opportunities);
  const openOpps = opportunities.filter((opp) => openStages.includes(opp.stage));
  const pendingPayments = opportunities.filter((opp) => opp.stage === 'INVOICE_SENT');
  const paymentReceived = opportunities.filter((opp) => opp.stage === 'INVOICE_SENT');
  const completedOrders = orders.filter((order) => order.productionStatus === 'COMPLETED');
  const blockedOrders = orders.filter((order) => order.productionStatus === 'BLOCKED');
  const pipelineTotal = openOpps.reduce((sum, opp) => sum + opp.value, 0);
  const lanePenetration = getLanePenetration(organizations);
  const staleOpps = getStaleOpportunities(opportunities, 14);
  const staleAccounts = getStaleAccounts(organizations, 14);
  const touchedAccounts = organizations.length - organizations.filter((o) => o.coverageStatus === 'UNTOUCHED').length;
  const momentum = getMomentumState({ nearClose: nearClose.length, stuck: stuckDeals.length, stale: staleOpps.length, touched: touchedAccounts });
  const coveragePct = organizations.length ? Math.round((touchedAccounts / organizations.length) * 100) : 0;
  const territoryHealth = getTerritoryHealthLabel(coveragePct);
  const movementStreak = Math.min(7, Math.max(1, activities.length + nearClose.length));

  const closeThisWeekValue = nearClose.reduce((sum, opp) => sum + opp.value, 0);
  const cashBlockedValue = pendingPayments.reduce((sum, opp) => sum + opp.value, 0) + blockedOrders.reduce((sum, order) => sum + order.value, 0);
  const zoneRisk = staleAccounts.length + organizations.filter((o) => o.coverageStatus === 'UNTOUCHED').length;

  // Pace calculation: Assume 22 business days/month, estimate based on current completion
  const dayOfMonth = new Date().getDate();
  const daysInMonth = 30;
  const projectedPace = (completedOrders.length / dayOfMonth) * daysInMonth;
  const avgDealValue = openOpps.length ? pipelineTotal / openOpps.length : 1500;
  const estimatedEarnings = projectedPace * avgDealValue * 0.1; // 10% commission mock
  const apiCompletedOrders = backendMetrics.paid_order_count;
  const orderPaceCount = isApiBacked ? apiCompletedOrders : completedOrders.length;
  const monthlyOrderPct = Math.min(100, Math.round((orderPaceCount / Math.max(MONTHLY_ORDER_GOAL, 1)) * 100));

  const mission = staleOpps.length
    ? { title: 'Follow up stale opportunity now', reason: `${staleOpps.length} opportunities are stale and need activity today.`, to: '/my-opportunities', cta: 'Open priority queue' }
    : pendingPayments.length
      ? { title: 'Push near-close invoice follow-up', reason: `${pendingPayments.length} deals are waiting on invoice/payment pressure.`, to: '/orders', cta: 'Open priority queue' }
      : { title: 'Contact untouched assigned account', reason: 'Activate account coverage and lane expansion from your assigned book.', to: '/organizations', cta: 'Open priority queue' };

  if (role === 'REGIONAL_DIRECTOR') {
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


  if (role === 'ADMIN') {
    return (
      <div className="space-y-3"> 
        <h1 className="text-2xl font-semibold text-white">Owner Command Center</h1>
        <div className="safe-grid grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"> 
          <MetricTile value={String(isApiBacked ? backendMetrics.untouched_schools : organizations.filter((o) => o.coverageStatus === 'UNTOUCHED').length)} label="Untouched Accounts" tone="border-amber-500/40 bg-amber-500/15" to="/organizations?coverageStatus=UNTOUCHED" />
          <MetricTile value={formatCurrency(isApiBacked ? backendMetrics.paid_revenue : cashBlockedValue)} label="Paid Revenue" tone="border-rose-500/40 bg-rose-500/15" to="/orders" />
          <MetricTile value={formatCurrency(closeThisWeekValue)} label="Close This Week" tone="border-emerald-500/40 bg-emerald-500/15" to="/team-opportunities" />
          <MetricTile value={String(zoneRisk)} label="Territory Risk" tone="border-cyan-500/40 bg-cyan-500/15" to="/territory/map" />
          <MetricTile value={String(ecosystemSummary.created)} label="Ecosystem Referrals" tone="border-violet-500/40 bg-violet-500/15" to="/ecosystem-pipeline" />
        </div>
        <GlassCard title="MISSION PRIORITY"><div className="space-y-2"><p className="text-base font-semibold text-white">{mission.title}</p><p className="text-sm text-slate-300">{mission.reason}</p><Link to={mission.to} className="inline-block rounded-md border border-cyan-400/40 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-100">{mission.cta}</Link></div></GlassCard>
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

    const allUsers = useMemo(() => listUsers(), [refreshKey]);
    const directReps = useMemo(() => allUsers.filter(u => u.role === 'REP' && u.assignedDirectorId === currentUser?.id), [allUsers, currentUser]);

    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold text-white">Director Coaching Room</h1>
        <div className="safe-grid grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <MetricTile value={String(isApiBacked ? backendMetrics.action_needed_items : stuckDeals.length)} label="Action Needed" tone="border-sky-500/40 bg-sky-500/15" to="/team-opportunities" />
          <MetricTile value={String(new Set(stuckDeals.map((o) => o.assignedRep)).size)} label="Reps Needing Coaching" tone="border-amber-500/40 bg-amber-500/15" to="/team-performance" />
          <MetricTile value={formatCurrency(nearClose.reduce((sum,o)=>sum+o.value,0))} label="Close This Week" tone="border-emerald-500/40 bg-emerald-500/15" to="/team-opportunities" />
          <MetricTile value={isApiBacked ? `${backendMetrics.touched_schools}/${backendMetrics.assigned_schools}` : `${coveragePct}%`} label="Territory Coverage" tone="border-cyan-500/40 bg-cyan-500/15" to="/territory" />
        </div>
        <GlassCard title="MISSION PRIORITY"><div className="space-y-2"><p className="text-base font-semibold text-white">{directorMission.title}</p><p className="text-sm text-slate-300">{directorMission.reason}</p><div className="flex flex-wrap gap-2"><Link to={directorMission.to} className="rounded-md border border-cyan-400/40 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100">{directorMission.cta}</Link><Link to="/my-opportunities" className="rounded-md border border-slate-700 px-3 py-2 text-xs text-slate-200">My Opportunities</Link><Link to="/territory" className="rounded-md border border-slate-700 px-3 py-2 text-xs text-slate-200">Territory</Link><Link to="/reports" className="rounded-md border border-slate-700 px-3 py-2 text-xs text-slate-200">Reports</Link></div></div></GlassCard>
        
        {/* Onboarding & Sign-off Management */}
        {directReps.length > 0 && (
          <GlassCard title="REPS ONBOARDING & SIGN-OFF">
            <p className="text-xs text-slate-400 mb-3 font-semibold uppercase tracking-wider">Verify onboarding progress and authorize core systems access</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {directReps.map((rep) => (
                <div key={rep.id} className="rounded-lg border border-slate-800 bg-[#070c13]/60 p-3 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-sm text-slate-100">{rep.displayName}</p>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${rep.isCertified ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                        {rep.isCertified ? 'Certified' : 'Blocked'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 truncate">Territory: {rep.territory}</p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <button
                      onClick={async () => {
                        await toggleUserHrDocs(rep.id, !rep.hrDocsCompleted);
                        setRefreshKey((k) => k + 1);
                      }}
                      className={`rounded py-1.5 text-xs font-bold transition border ${
                        rep.hrDocsCompleted 
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35 hover:bg-emerald-500/25' 
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {rep.hrDocsCompleted ? 'HR Approved ✓' : 'Verify HR docs'}
                    </button>
                    <button
                      onClick={async () => {
                        await toggleUserPracticalExercise(rep.id, !rep.practicalExerciseCompleted);
                        setRefreshKey((k) => k + 1);
                      }}
                      className={`rounded py-1.5 text-xs font-bold transition border ${
                        rep.practicalExerciseCompleted
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35 hover:bg-emerald-500/25'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {rep.practicalExerciseCompleted ? 'Practical ✓' : 'Mark Practical'}
                    </button>
                    <button
                      onClick={async () => {
                        await toggleUserDirectorSignoff(rep.id, !rep.directorSignedOff);
                        setRefreshKey((k) => k + 1);
                      }}
                      className={`rounded py-1.5 text-xs font-bold transition border ${
                        rep.directorSignedOff 
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35 hover:bg-emerald-500/25' 
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {rep.directorSignedOff ? 'Signed Off ✓' : 'Sign Off Rep'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

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
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold text-white">Rep Mission Brief</h1>
        {isApiBacked && dashboardMetricsError ? <GlassCard title="DASHBOARD API WARNING"><p className="text-sm text-amber-200">{dashboardMetricsError}</p></GlassCard> : null}
        <div className="safe-grid grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <MetricTile value={String(stuckDeals.length)} label="Today’s Mission" tone="border-sky-500/40 bg-sky-500/15" to="/my-opportunities" />
          <MetricTile value={formatCurrency(nearClose.reduce((sum,opp)=>sum+opp.value,0))} label="Close This Week" tone="border-emerald-500/40 bg-emerald-500/15" to="/my-opportunities" />
          <MetricTile value={formatCurrency(pendingPayments.reduce((sum,opp)=>sum+opp.value,0))} label="Cash to Collect" tone="border-rose-500/40 bg-rose-500/15" to="/orders" />
          <MetricTile value={String(paymentReceived.length)} label="Payment Received" tone="border-violet-500/40 bg-violet-500/15" to="/my-opportunities" />
          <MetricTile value={momentum} label="Momentum" tone="border-cyan-500/40 bg-cyan-500/15" to="/my-opportunities" />
        </div>
        <GlassCard title="MISSION PRIORITY"><div className="space-y-2"><p className="text-base font-semibold text-white">{staleOpps.length ? 'Follow up stale opportunity now' : pendingPayments.length ? 'Push near-close invoice follow-up' : 'Contact untouched assigned account'}</p><p className="text-sm text-slate-300">{staleOpps.length ? `${staleOpps.length} opportunities are stale and need activity today.` : pendingPayments.length ? `${pendingPayments.length} deals are waiting on invoice/payment pressure.` : 'Activate account coverage and lane expansion from your assigned book.'}</p><Link to={staleOpps.length ? '/my-opportunities' : pendingPayments.length ? '/orders' : '/organizations'} className="inline-block rounded-md border border-cyan-400/40 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100">Open priority queue</Link></div></GlassCard>

        {/* SECTION 2: REP COMMAND CENTER KPIS */}
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <GlassCard title="4 ORDER STANDARD" className="min-w-0">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-3xl font-bold leading-none text-white">
                    {orderPaceCount}
                    <span className="text-base font-normal text-slate-400"> / {MONTHLY_ORDER_GOAL}</span>
                  </p>
                  <p className="mt-1 truncate text-xs text-slate-400">Completed monthly orders</p>
                </div>
                <div className="shrink-0 rounded-lg border border-slate-800 bg-slate-950/60 px-2.5 py-1.5 text-right">
                  <p className={`text-sm font-bold ${orderPaceCount >= MONTHLY_ORDER_GOAL ? 'text-emerald-400' : orderPaceCount >= 2 ? 'text-amber-400' : 'text-rose-400'}`}>
                    {monthlyOrderPct}%
                  </p>
                  <p className="text-[10px] uppercase tracking-wide text-slate-500">of floor</p>
                </div>
              </div>
              <ProgressBar 
                count={orderPaceCount} 
                total={MONTHLY_ORDER_GOAL} 
                label="Orders" 
                projectedPace={projectedPace}
              />
            </div>
          </GlassCard>

          <GlassCard title="MISSION PRIORITY" className="min-w-0">
            <div className="space-y-3">
              <div className="min-w-0">
                <p className="break-words text-sm font-bold uppercase tracking-tight text-white">{mission.title}</p>
                <p className="mt-1 text-sm leading-5 text-slate-300">{mission.reason}</p>
                <p className="mt-2 text-xs font-semibold uppercase text-rose-400">Due Today</p>
              </div>
              <Link to={mission.to} className="inline-flex w-full items-center justify-center rounded-md border border-cyan-400/40 bg-cyan-500/10 px-3 py-2 text-center text-sm font-bold text-cyan-100 transition hover:bg-cyan-500/20 sm:w-auto">
                {mission.cta}
              </Link>
            </div>
          </GlassCard>

          <GlassCard title="ESTIMATED EARNINGS" className="min-w-0 md:col-span-2 lg:col-span-1">
            <div className="space-y-3">
              <div>
                <p className="text-3xl font-bold leading-none text-emerald-400">{formatCurrency(isApiBacked ? backendMetrics.rep_commission_estimate : estimatedEarnings)}</p>
                <p className="mt-1 text-xs text-slate-400">Projected from current monthly pace</p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2">
                <p className="text-xs leading-5 text-slate-300">
                  Based on <span className="font-semibold text-slate-100">{isApiBacked ? orderPaceCount.toFixed(1) : projectedPace.toFixed(1)}</span> projected orders at <span className="font-semibold text-slate-100">{formatCurrency(avgDealValue)}</span> average deal value.
                </p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* SECTION 3: PIPELINE HEALTH */}
        <GlassCard title="PIPELINE HEALTH">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <p className="text-xs text-slate-400">Total Active</p>
              <p className="text-xl font-bold text-white">{isApiBacked ? backendMetrics.active_opportunities : openOpps.length}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Near Close</p>
              <p className="text-xl font-bold text-emerald-400">{nearClose.length}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Stalled</p>
              <p className="text-xl font-bold text-amber-400">{isApiBacked ? backendMetrics.action_needed_items : stuckDeals.length}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Pipeline Value</p>
              <p className="text-xl font-bold text-cyan-400">{formatCurrency(isApiBacked ? backendMetrics.total_actual_revenue : pipelineTotal)}</p>
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
