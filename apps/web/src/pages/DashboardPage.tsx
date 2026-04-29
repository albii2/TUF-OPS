import { GlassCard, StatCard } from '../components/ui';
import type { Role } from '../types';
import { useOpportunities } from '../hooks/useOpportunities';
import { useOrders } from '../hooks/useOrders';
import { useOrganizations } from '../hooks/useOrganizations';
import { useActivities } from '../hooks/useReports';
import { formatCurrency } from '../utils/format';
import { getLanePenetration, getNearCloseOpportunities, getOpenPipelineValue, getStuckOpportunities } from '../services/businessSelectors';

function RepDashboard() {
  const opportunities = useOpportunities({});
  const nearClose = getNearCloseOpportunities(opportunities);
  const paymentsPending = opportunities.filter((o) => o.stage === 'INVOICE_SENT').length;
  const activities = useActivities({ limit: 4 });

  return (
    <div className="space-y-3">
      <h2 className="text-3xl font-semibold tracking-tight text-slate-100">Today’s Focus</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Deals Need Action" value={String(opportunities.length)} />
        <StatCard label="Near Close" value={String(nearClose.length)} />
        <StatCard label="Payments Pending" value={String(paymentsPending)} />
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        <GlassCard title="Next Actions" className="lg:col-span-2">
          {opportunities.slice(0, 3).map((opp) => <div key={opp.id} className="mb-2 rounded-lg border border-slate-800 bg-slate-950/70 p-2.5 text-sm"><p className="font-medium">{opp.organizationName}</p><p className="text-slate-300">{opp.nextAction}</p></div>)}
        </GlassCard>
        <GlassCard title="Deals Near Close">
          {nearClose.slice(0, 3).map((opp) => <p key={opp.id} className="mb-2 text-sm text-slate-200">{opp.organizationName} · {formatCurrency(opp.value)}</p>)}
        </GlassCard>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        <GlassCard title="Pipeline Snapshot"><p className="text-2xl font-semibold text-cyan-300">{formatCurrency(getOpenPipelineValue(opportunities))}</p></GlassCard>
        <GlassCard title="Revenue"><p className="text-2xl font-semibold text-cyan-300">{formatCurrency(opportunities.filter((o) => o.stage === 'CLOSED_WON').reduce((a, b) => a + b.value, 0))}</p></GlassCard>
        <GlassCard title="This Month Progress"><p className="text-sm text-slate-300">This Month: {opportunities.filter((o) => o.stage === 'CLOSED_WON').length} / 4 Orders</p></GlassCard>
      </div>
      <GlassCard title="Recent Activity">{activities.map((a) => <p key={a.id} className="mb-2 text-sm text-slate-300">• {a.message}</p>)}</GlassCard>
    </div>
  );
}

function OwnerDashboard() {
  const opportunities = useOpportunities({});
  const organizations = useOrganizations({});
  const lane = getLanePenetration(organizations);
  const nearClose = getNearCloseOpportunities(opportunities);
  const stuck = getStuckOpportunities(opportunities);
  const activities = useActivities({ limit: 4 });

  return <div className="space-y-3"><h2 className="text-3xl font-semibold tracking-tight">Today’s Focus</h2><div className="grid gap-3 sm:grid-cols-3"><StatCard label="Revenue at Risk" value={formatCurrency(stuck.reduce((t, o) => t + o.value, 0))} /><StatCard label="Near Close Pipeline" value={formatCurrency(nearClose.reduce((t, o) => t + o.value, 0))} /><StatCard label="Payments Pending" value={String(opportunities.filter((o) => o.stage === 'INVOICE_SENT').length)} /></div><div className="grid gap-3 lg:grid-cols-3"><GlassCard title="Next Actions / Strategic Alerts" className="lg:col-span-2"><p className="text-sm text-slate-300">{stuck.length} stuck deals and {nearClose.length} near-close deals require leadership action.</p></GlassCard><GlassCard title="Revenue Snapshot"><p className="text-2xl font-semibold text-cyan-300">{formatCurrency(getOpenPipelineValue(opportunities))}</p></GlassCard></div><div className="grid gap-3 lg:grid-cols-3"><GlassCard title="Lane Penetration" className="lg:col-span-2"><p className="text-sm text-slate-300">U {lane.UNIFORM} · T {lane.TRAVEL_GEAR} · S {lane.TEAM_STORE} · L {lane.LETTERMAN}</p></GlassCard><GlassCard title="Rep/Director Performance"><p className="text-sm text-slate-300">Top opportunities: {nearClose.slice(0, 2).map((o) => o.organizationName).join(', ') || 'No near-close deals'}</p></GlassCard></div><GlassCard title="Recent Activity">{activities.map((a) => <p key={a.id} className="mb-2 text-sm text-slate-300">• {a.message}</p>)}</GlassCard></div>;
}

function DirectorDashboard() {
  const opportunities = useOpportunities({});
  const stuck = getStuckOpportunities(opportunities);
  const nearClose = getNearCloseOpportunities(opportunities);
  const activities = useActivities({ limit: 4 });

  return <div className="space-y-3"><h2 className="text-3xl font-semibold tracking-tight">Today’s Focus</h2><div className="grid gap-3 sm:grid-cols-3"><StatCard label="Stuck Deals" value={String(stuck.length)} /><StatCard label="Reps Needing Coaching" value={String(Math.min(3, stuck.length + 1))} /><StatCard label="Near Close" value={String(nearClose.length)} /></div><div className="grid gap-3 lg:grid-cols-3"><GlassCard title="Rep Performance" className="lg:col-span-2"><p className="text-sm text-slate-300">Coach follow-up on decision pending and invoice stage deals.</p></GlassCard><GlassCard title="Territory Coverage"><p className="text-sm text-slate-300">Accounts Needing Action: {stuck.length + nearClose.length}</p></GlassCard></div><div className="grid gap-3 lg:grid-cols-3"><GlassCard title="Pipeline Snapshot"><p className="text-2xl font-semibold text-cyan-300">{formatCurrency(getOpenPipelineValue(opportunities))}</p></GlassCard><GlassCard title="Accounts Needing Action" className="lg:col-span-2">{stuck.slice(0, 3).map((o) => <p key={o.id} className="mb-2 text-sm text-slate-300">• {o.organizationName} — {o.nextAction}</p>)}</GlassCard></div><GlassCard title="Recent Activity">{activities.map((a) => <p key={a.id} className="mb-2 text-sm text-slate-300">• {a.message}</p>)}</GlassCard></div>;
}

function OpsDashboard() {
  const orders = useOrders({});
  const activities = useActivities({ limit: 4 });
  const newOrders = orders.filter((o) => o.productionStatus === 'NEEDS_REVIEW');
  const blocked = orders.filter((o) => o.productionStatus === 'BLOCKED');
  const ready = orders.filter((o) => o.productionStatus === 'READY_FOR_VENDOR');
  const inProduction = orders.filter((o) => o.productionStatus === 'IN_PRODUCTION');

  return <div className="space-y-3"><h2 className="text-3xl font-semibold tracking-tight">Today’s Focus</h2><div className="grid gap-3 sm:grid-cols-3"><StatCard label="New Orders" value={String(newOrders.length)} /><StatCard label="Missing Info" value={String(orders.filter((o) => o.missingInfo.length).length)} /><StatCard label="Blocked Orders" value={String(blocked.length)} /></div><div className="grid gap-3 lg:grid-cols-3"><GlassCard title="Ready for Vendor">{ready.map((o) => <p key={o.id} className="mb-2 text-sm text-slate-300">• {o.organizationName}</p>)}</GlassCard><GlassCard title="In Production">{inProduction.map((o) => <p key={o.id} className="mb-2 text-sm text-slate-300">• {o.organizationName}</p>)}</GlassCard><GlassCard title="Blockers">{blocked.map((o) => <p key={o.id} className="mb-2 text-sm text-slate-300">• {o.organizationName}</p>)}</GlassCard></div><GlassCard title="Recent Handoffs">{activities.map((a) => <p key={a.id} className="mb-2 text-sm text-slate-300">• {a.message}</p>)}</GlassCard></div>;
}

export function DashboardPage({ role }: { role: Role }) {
  if (role === 'REP') return <RepDashboard />;
  if (role === 'OWNER') return <OwnerDashboard />;
  if (role === 'DIRECTOR') return <DirectorDashboard />;
  return <OpsDashboard />;
}
