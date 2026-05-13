import { Link } from 'react-router-dom';
import { teamMembers } from '../data/mockSalesData';
import { GlassCard } from '../components/ui';
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

  if (role === 'OPS') {
    return (
      <div className="space-y-3">
        <div className="grid gap-3 md:grid-cols-4">
          <MetricTile value={String(orders.filter((o) => o.productionStatus === 'NEEDS_REVIEW').length)} label="Needs Review" tone="border-cyan-500/40 bg-cyan-500/10" to="/ops-workspace" />
          <MetricTile value={String(blockedOrders.length)} label="Blocked Orders" tone="border-rose-500/40 bg-rose-500/10" to="/orders" />
          <MetricTile value={String(orders.filter((o) => o.productionStatus === 'READY_FOR_VENDOR').length)} label="Ready for Vendor" tone="border-emerald-500/40 bg-emerald-500/10" to="/ops-workspace" />
          <MetricTile value={String(orders.filter((o) => o.productionStatus === 'IN_PRODUCTION').length)} label="In Production" tone="border-sky-500/40 bg-sky-500/10" to="/ops-workspace" />
        </div>
        <GlassCard title="PRODUCTION COMMAND">
          <div className="grid gap-2 md:grid-cols-2">
            {blockedOrders.slice(0, 6).map((order) => (
              <DealRow key={order.id} title={order.organizationName} meta={order.missingInfo.join(', ') || order.vendorNotes} value={order.value} to={`/orders/${order.id}`} />
            ))}
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-2xl font-semibold text-white">Today’s Focus</h1>
        <div className="safe-grid mt-3 grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <MetricTile value={String(stuckDeals.length)} label="Deals Need Action" tone="border-sky-500/40 bg-sky-500/15" to="/my-opportunities" />
          <MetricTile value={String(nearClose.length)} label="Near Close" tone="border-emerald-500/40 bg-emerald-500/15" to="/opportunities" />
          <MetricTile value={String(pendingPayments.length)} label="Payments Pending" tone="border-rose-500/40 bg-rose-500/15" to="/opportunities" />
          <MetricTile value={String(organizations.filter((o) => o.coverageStatus === 'UNTOUCHED').length)} label="Territory Exposure" tone="border-amber-500/40 bg-amber-500/15" to={role === 'REP' ? '/organizations' : '/territory'} />
        </div>
      </div>

      <GlassCard title="Momentum">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <p className="font-semibold text-cyan-200">{momentum} · {territoryHealth}</p>
          <p className="text-slate-300">Coverage: {coveragePct}% · Stale: {staleOpps.length} deals, {staleAccounts.length} accounts</p>
        </div>
      </GlassCard>

      <div className="safe-grid grid gap-3 xl:grid-cols-[1fr_1.05fr_0.85fr]">
        <div className="space-y-3 order-1 xl:order-none">
          <GlassCard title={role === 'REP' ? "TODAY'S MISSION" : 'NEXT ACTIONS'}>
            <div className="space-y-2">
              {stuckDeals.slice(0, 4).map((opp) => (
                <DealRow key={opp.id} title={opp.nextAction} meta={`${opp.organizationName} · ${opp.sport}`} value={opp.value} to={`/opportunities/${opp.id}`} />
              ))}
            </div>
          </GlassCard>
          <GlassCard title="DEALS NEAR CLOSE">
            <div className="space-y-2">
              {nearClose.slice(0, 4).map((opp) => (
                <DealRow key={opp.id} title={opp.organizationName} meta={`${opp.stage.replace(/_/g, ' ')} · ${opp.closeProbability}%`} value={opp.value} to={`/opportunities/${opp.id}`} />
              ))}
            </div>
          </GlassCard>
        </div>

        <div className="space-y-3">
          <GlassCard title={role === 'REP' ? 'My Pipeline' : 'Pipeline'}>
            <div className="space-y-3">
              {pipelineStages.map((stage) => {
                const stageOpps = opportunities.filter((opp) => opp.stage === stage);
                return <ProgressLine key={stage} label={stage.replace(/_/g, ' ')} value={stageOpps.length} total={opportunities.length} amount={stageOpps.reduce((sum, opp) => sum + opp.value, 0)} />;
              })}
            </div>
            <Link className="mt-3 block rounded-md border border-slate-800 bg-slate-950/70 py-2 text-center text-xs text-slate-200 hover:border-cyan-400" to="/opportunities">View Pipeline</Link>
          </GlassCard>
          <GlassCard title="Activity">
            <div className="space-y-2">
              {activities.map((activity) => (
                <p key={activity.id} className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-sm text-slate-300">{activity.message}</p>
              ))}
            </div>
          </GlassCard>
        </div>

        <div className="space-y-3">
          <GlassCard title="REVENUE">
            <p className="text-2xl font-semibold text-white">{formatCurrency(closedValue)}</p>
            <ProgressLine label="Open pipeline" value={openOpps.length} total={opportunities.length} amount={pipelineTotal} />
            <ProgressLine label="Payment pending" value={pendingPayments.length} total={opportunities.length} amount={pendingValue} />
            <ProgressLine label="Blocked handoff" value={blockedOrders.length} total={Math.max(orders.length, 1)} amount={blockedOrders.reduce((sum, order) => sum + order.value, 0)} />
          </GlassCard>
          <GlassCard title="MONTHLY STANDARD">
            <GoalRing count={Math.min(completedOrders.length, MONTHLY_ORDER_GOAL)} role={role} />
          </GlassCard>
          <GlassCard title="LANE PENETRATION">
            <div className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(lanePenetration).map(([lane, count]) => (
                <Link key={lane} to="/organizations" className="rounded-lg border border-slate-800 bg-slate-950/70 p-2 hover:border-cyan-400">
                  <span className="block text-xs text-slate-400">{lane.replace(/_/g, ' ')}</span>
                  <span className="text-lg font-semibold text-cyan-200">{count}</span>
                </Link>
              ))}
            </div>
          </GlassCard>
          <GlassCard title="AT-RISK / STALE">
            <div className="space-y-2 text-sm text-slate-300">
              <p>Stale opportunities (14+ days): {staleOpps.length}</p>
              <p>Stale accounts (14+ days): {staleAccounts.length}</p>
              <p>Late-stage payment risk: {pendingPayments.length}</p>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
