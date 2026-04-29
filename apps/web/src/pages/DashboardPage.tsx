import { roleConfig } from '../config/roles';
import type { Role } from '../types';
import { GlassCard, StatCard } from '../components/ui';
import { useOrganizations } from '../hooks/useOrganizations';
import { useOpportunities } from '../hooks/useOpportunities';
import { useOrders } from '../hooks/useOrders';
import { getLanePenetration, getNearCloseOpportunities, getOpenPipelineValue, getStuckOpportunities } from '../services/businessSelectors';
import { formatCurrency } from '../utils/format';

function RepDashboard() {
  const opportunities = useOpportunities({});
  const orders = useOrders({});
  const nearClose = getNearCloseOpportunities(opportunities);
  const needsAction = opportunities.filter((opp) => !['CLOSED_WON', 'CLOSED_LOST'].includes(opp.stage));
  const paymentsPending = opportunities.filter((opp) => opp.stage === 'INVOICE_SENT').length;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Deals Need Action" value={String(needsAction.length)} />
        <StatCard label="Near Close" value={String(nearClose.length)} />
        <StatCard label="Payments Pending" value={String(paymentsPending)} />
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        <GlassCard title="Next Actions" className="lg:col-span-2">
          <div className="space-y-2">
            {needsAction.slice(0, 3).map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/70 p-3 text-sm">
                <div>
                  <p className="font-medium text-slate-100">{item.organizationName}</p>
                  <p className="text-xs text-slate-400">{item.nextAction}</p>
                </div>
                <span className="text-xs text-cyan-300">{item.stage}</span>
              </div>
            ))}
          </div>
        </GlassCard>
        <GlassCard title="Deals Near Close">
          <ul className="space-y-2 text-sm text-slate-300">
            {nearClose.slice(0, 3).map((opp) => (
              <li key={opp.id}>{opp.organizationName} — {opp.stage} — {formatCurrency(opp.value)}</li>
            ))}
          </ul>
        </GlassCard>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        <GlassCard title="Pipeline Snapshot">
          <p className="text-3xl font-semibold text-cyan-300">{formatCurrency(getOpenPipelineValue(opportunities))}</p>
          <p className="mt-1 text-xs text-slate-400">Open opportunities</p>
        </GlassCard>
        <GlassCard title="Revenue">
          <p className="text-3xl font-semibold text-cyan-300">{formatCurrency(opportunities.filter((o) => o.stage === 'CLOSED_WON').reduce((t, o) => t + o.value, 0))}</p>
          <p className="mt-1 text-xs text-slate-400">Closed won value</p>
        </GlassCard>
        <GlassCard title="Ops Impact">
          <p className="text-sm text-slate-300">{orders.filter((o) => o.productionStatus === 'BLOCKED').length} blocked orders require follow-up.</p>
        </GlassCard>
      </div>
    </div>
  );
}

function OwnerDashboard() {
  const organizations = useOrganizations({});
  const opportunities = useOpportunities({});
  const lanePenetration = getLanePenetration(organizations);
  const stuckDeals = getStuckOpportunities(opportunities);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Total Pipeline" value={formatCurrency(getOpenPipelineValue(opportunities))} />
        <StatCard label="Closed Won MTD" value={formatCurrency(opportunities.filter((o) => o.stage === 'CLOSED_WON').reduce((t, o) => t + o.value, 0))} />
        <StatCard label="Active Organizations" value={String(organizations.length)} />
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        <GlassCard title="Lane Penetration" className="lg:col-span-2">
          <p className="text-sm text-slate-300">Uniform: {lanePenetration.UNIFORM} · Travel Gear: {lanePenetration.TRAVEL_GEAR} · Team Store: {lanePenetration.TEAM_STORE} · Letterman: {lanePenetration.LETTERMAN}</p>
        </GlassCard>
        <GlassCard title="Stuck Deals">
          <p className="text-2xl font-semibold text-cyan-300">{stuckDeals.length}</p>
          <p className="text-xs text-slate-400">Decision pending at risk</p>
        </GlassCard>
      </div>
    </div>
  );
}

function GenericDashboard({ role }: { role: Role }) {
  const widgets = roleConfig[role].dashboardWidgets;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {widgets.map((w) => (
          <GlassCard key={w} title={w}>
            <p className="text-sm text-slate-300">Role-specific metric module</p>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

export function DashboardPage({ role }: { role: Role }) {
  if (role === 'REP') return <RepDashboard />;
  if (role === 'OWNER') return <OwnerDashboard />;
  return <GenericDashboard role={role} />;
}
