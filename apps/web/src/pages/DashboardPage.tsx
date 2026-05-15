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

function DealRow({ title, meta, value, to }: { title: string; meta: string; value: number; to: string }) {
  return (
    <Link to={to} className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 transition hover:border-cyan-400/70 hover:bg-slate-900">
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-slate-100">{title}</span>
        <span className="block truncate text-xs text-slate-400">{meta}</span>
      </span>
      <span className="shrink-0 text-sm font-semibold text-slate-100">{formatCurrency(value)}</span>
    </Link>
  );
}

function GoalRing({ count, role }: { count: number, role: Role }) {
  const activeReps = teamMembers.filter((m) => m.role === 'REP' && m.active).length;
  const totalGoal = role === 'OWNER' ? MONTHLY_ORDER_GOAL * activeReps : MONTHLY_ORDER_GOAL;
  const pct = Math.min(100, Math.round((count / Math.max(totalGoal, 1)) * 100));
  const remaining = Math.max(totalGoal - count, 0);

  return (
    <div className="flex items-center gap-4">
      <div className="grid h-24 w-24 place-items-center rounded-full" style={{ background: `conic-gradient(#22d3ee ${pct}%, #1e293b ${pct}% 100%)` }}>
        <div className="grid h-16 w-16 place-items-center rounded-full bg-[#07101a] text-center">
          <span className="text-xl font-bold text-white">{count}/{totalGoal}</span>
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold text-white">{totalGoal} orders/month pace</p>
        <p className="text-sm text-slate-300">{remaining} more order{remaining === 1 ? '' : 's'} to hit the floor.</p>
        <p className="mt-1 text-xs text-cyan-200">Next most important KPI: lane penetration.</p>
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

  const mission = unassignedOrgs.length
    ? { title: 'Assign imported leads now', reason: `${unassignedOrgs.length} accounts are unowned and cannot move.` , cta: 'Go to Organizations', to: '/organizations' }
    : blockedOrders.length
      ? { title: 'Review blocked handoffs', reason: `${blockedOrders.length} orders are blocked in production.` , cta: 'Review Orders', to: '/orders' }
      : staleAccounts.length
        ? { title: 'Pressure stale territory accounts', reason: `${staleAccounts.length} accounts are stale and need owner escalation.` , cta: 'View Territory', to: '/territory' }
        : { title: 'Push near-close opportunities', reason: `${nearClose.length} deals are close and need owner pressure this week.` , cta: 'Go to Organizations', to: '/team-opportunities' };

  const ownerActions = [
    { title: 'Assign imported leads', reason: `${unassignedOrgs.length} accounts still unassigned`, impact: formatCurrency(unassignedOrgs.reduce((sum, o) => sum + o.pipelineValue, 0)), to: '/organizations' },
    { title: 'Review stale accounts', reason: `${staleAccounts.length} accounts past activity threshold`, impact: `${coveragePct}% coverage`, to: '/territory' },
    { title: 'Review blocked orders', reason: `${blockedOrders.length} blocked production handoffs`, impact: formatCurrency(blockedOrders.reduce((sum, o) => sum + o.value, 0)), to: '/orders' },
    { title: 'Balance rep workload', reason: `${new Set(stuckDeals.map((o) => o.assignedRep)).size} reps have stuck deals`, impact: `${stuckDeals.length} stuck deals`, to: '/team-performance' },
    { title: 'Push near-close opportunities', reason: `${nearClose.length} opportunities ready`, impact: formatCurrency(closeThisWeekValue), to: '/team-opportunities' },
    { title: 'Review low lane penetration territory', reason: `Territory health: ${territoryHealth}`, impact: `${Object.values(lanePenetration).reduce((a,b)=>a+b,0)} active lanes`, to: '/territory/map' },
  ];

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
              <DealRow key={order.id} title={`${order.id} — ${order.organizationName}`} meta={`Blocker: ${order.missingInfo.join(', ') || 'Vendor clarification'} · Next: collect package + release to vendor`} value={order.value} to={`/orders/${order.id}`} />
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
    const mission = staleOpps.length
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
        <GlassCard title="MISSION PRIORITY"><div className="space-y-2"><p className="text-base font-semibold text-white">{mission.title}</p><p className="text-sm text-slate-300">{mission.reason}</p><div className="flex flex-wrap gap-2"><Link to={mission.to} className="rounded-md border border-cyan-400/40 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100">{mission.cta}</Link><Link to="/my-opportunities" className="rounded-md border border-slate-700 px-3 py-2 text-xs text-slate-200">My Opportunities</Link><Link to="/territory" className="rounded-md border border-slate-700 px-3 py-2 text-xs text-slate-200">Territory</Link><Link to="/reports" className="rounded-md border border-slate-700 px-3 py-2 text-xs text-slate-200">Reports</Link></div></div></GlassCard>
        <div className="safe-grid grid gap-3 lg:grid-cols-2">
          <GlassCard title="COACHING QUEUE"><div className="space-y-2">{repCoachingGrid.slice(0,6).map((row)=><Link key={row.rep} to="/team-opportunities" className="block rounded-lg border border-slate-800 bg-slate-950/70 p-3"><p className="font-semibold text-slate-100">{row.rep}</p><p className="text-xs text-slate-400">Issue: stale {row.stale} · stuck {row.stuck} · near-close {row.nearClose}</p><p className="text-xs text-cyan-200">Action: coach next action + invoice pressure · Impact {formatCurrency(row.pipeline)}</p></Link>)}</div></GlassCard>
          <GlassCard title="MY SELLING PANEL"><p className="text-sm text-slate-300">My opportunities: {myOpps.length} · Near-close: {myNearClose.length} · Pipeline: {formatCurrency(myPipeline)}</p><div className="mt-2 space-y-2">{myOpps.slice(0,4).map((opp)=><DealRow key={opp.id} title={opp.nextAction} meta={`${opp.organizationName} · ${opp.stage}`} value={opp.value} to={`/opportunities/${opp.id}`} />)}</div></GlassCard>
        </div>
        <GlassCard title="TERRITORY WAR TABLE"><p className="text-sm text-slate-300">Coverage {coveragePct}% · Untouched {organizations.filter((o) => o.coverageStatus === 'UNTOUCHED').length} · Stale accounts {staleAccounts.length} · Near-close {nearClose.length} · Stuck deals {stuckDeals.length}</p><div className="mt-2 grid gap-2 sm:grid-cols-2">{Object.entries(lanePenetration).map(([lane,count])=><p key={lane} className="text-xs text-slate-300">{lane}: {count} active lanes</p>)}</div></GlassCard>
      </div>
    );
  }

  return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold text-white">Rep Mission Brief</h1>
        <div className="safe-grid grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <MetricTile value={String(stuckDeals.length)} label="Today’s Mission" tone="border-sky-500/40 bg-sky-500/15" to="/my-opportunities" />
          <MetricTile value={formatCurrency(nearClose.reduce((sum,opp)=>sum+opp.value,0))} label="Close This Week" tone="border-emerald-500/40 bg-emerald-500/15" to="/my-opportunities" />
          <MetricTile value={formatCurrency(pendingPayments.reduce((sum,opp)=>sum+opp.value,0))} label="Cash to Collect" tone="border-rose-500/40 bg-rose-500/15" to="/orders" />
          <MetricTile value={momentum} label="Momentum" tone="border-cyan-500/40 bg-cyan-500/15" to="/my-opportunities" />
        </div>
        <GlassCard title="MISSION PRIORITY"><div className="space-y-2"><p className="text-base font-semibold text-white">{staleOpps.length ? 'Follow up stale opportunity now' : pendingPayments.length ? 'Push near-close invoice follow-up' : 'Contact untouched assigned account'}</p><p className="text-sm text-slate-300">{staleOpps.length ? `${staleOpps.length} opportunities are stale and need activity today.` : pendingPayments.length ? `${pendingPayments.length} deals are waiting on invoice/payment pressure.` : 'Activate account coverage and lane expansion from your assigned book.'}</p><Link to={staleOpps.length ? '/my-opportunities' : pendingPayments.length ? '/orders' : '/organizations'} className="inline-block rounded-md border border-cyan-400/40 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100">Open priority queue</Link></div></GlassCard>

        <GlassCard title="NEXT-ACTION EXECUTION QUEUE"><div className="space-y-2">{openOpps.filter((opp)=>opp.assignedRep === (currentUser?.role === 'REP' ? currentUser.name : opp.assignedRep)).slice(0,6).map((opp)=><DealRow key={opp.id} title={opp.nextAction} meta={`${opp.organizationName} · ${opp.sport} · ${opp.lane}`} value={opp.value} to={`/opportunities/${opp.id}`} />)}</div></GlassCard>

        <div className="safe-grid grid gap-3 lg:grid-cols-2">
          <GlassCard title="MONTHLY STANDARD"><GoalRing count={completedOrders.length} role={role} /></GlassCard>
          <GlassCard title="LANE PENETRATION OPPORTUNITY"><div className="space-y-1 text-sm text-slate-300">{Object.entries(lanePenetration).map(([lane,count])=><p key={lane}>{lane}: active/won in {count} accounts</p>)}</div><p className="mt-2 text-xs text-cyan-200">Recommended next lane: Team Store where Uniform is already active.</p></GlassCard>
        </div>

        <GlassCard title="MOMENTUM SYSTEM"><p className="text-sm text-slate-300">Status: {momentum} · Movement streak: {movementStreak} days · Stale opportunities: {staleOpps.length} · Follow-up pressure: {pendingPayments.length} payment/invoice deals.</p></GlassCard>
      </div>
    );
  }
