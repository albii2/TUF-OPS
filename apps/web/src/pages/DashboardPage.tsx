import { GlassCard } from '../components/ui';
import type { Role } from '../types';
import { useOpportunities } from '../hooks/useOpportunities';
import { useOrders } from '../hooks/useOrders';
import { useActivities } from '../hooks/useReports';
import { formatCurrency } from '../utils/format';
import { getNearCloseOpportunities } from '../services/businessSelectors';

function FocusPill({ label, value, tone }: { label: string; value: string; tone: 'blue' | 'teal' | 'red' }) {
  const toneClass = tone === 'blue' ? 'from-blue-500/20 to-indigo-500/10 border-blue-400/40' : tone === 'teal' ? 'from-cyan-500/20 to-emerald-500/10 border-cyan-400/40' : 'from-rose-500/18 to-red-500/10 border-rose-400/40';
  return <div className={`rounded-lg border bg-gradient-to-r p-3 ${toneClass}`}><p className="text-2xl font-semibold text-slate-100">{value}</p><p className="text-sm text-slate-200">{label}</p></div>;
}

function ActionRow({ title, subtitle, value }: { title: string; subtitle: string; value: string }) {
  return <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2"><div><p className="text-sm font-semibold text-slate-100">{title}</p><p className="text-xs text-slate-400">{subtitle}</p></div><div className="text-right"><p className="text-sm font-semibold text-slate-100">{value}</p><p className="text-xs text-slate-500">›</p></div></div>;
}

function RepDashboard() {
  const opportunities = useOpportunities({});
  const nearClose = getNearCloseOpportunities(opportunities);
  const activities = useActivities({ limit: 4 });
  const revenue = opportunities.filter((o) => o.stage === 'CLOSED_WON').reduce((a, b) => a + b.value, 0);

  return (
    <div className="space-y-3">
      <h2 className="text-3xl font-semibold tracking-tight">Today’s Focus</h2>
      <div className="grid gap-2 md:grid-cols-3">
        <FocusPill label="Deals Need Action" value={String(opportunities.length)} tone="blue" />
        <FocusPill label="Near Close" value={String(nearClose.length)} tone="teal" />
        <FocusPill label="Payments Pending" value={String(opportunities.filter((o) => o.stage === 'INVOICE_SENT').length)} tone="red" />
      </div>

      <div className="grid gap-2 lg:grid-cols-3">
        <GlassCard title="NEXT ACTIONS" className="lg:col-span-1">
          <div className="space-y-2">
            {opportunities.slice(0, 3).map((opp) => (
              <ActionRow key={opp.id} title={opp.nextAction} subtitle={opp.organizationName} value={formatCurrency(opp.value)} />
            ))}
          </div>
        </GlassCard>

        <GlassCard title="PIPELINE SNAPSHOT" className="lg:col-span-1">
          <div className="space-y-2 text-sm">
            {['CONTACTED', 'MOCKUP_DELIVERED', 'INVOICE_SENT', 'CLOSED_WON'].map((stage) => {
              const stageValue = opportunities.filter((o) => o.stage === stage).reduce((a, b) => a + b.value, 0);
              return <div key={stage}><div className="mb-1 flex justify-between text-slate-300"><span>{stage.replace('_', ' ')}</span><span>{formatCurrency(stageValue)}</span></div><div className="h-1.5 rounded bg-slate-800"><div className="h-1.5 rounded bg-cyan-400" style={{ width: `${Math.min(100, (stageValue / 42000) * 100)}%` }} /></div></div>;
            })}
          </div>
        </GlassCard>

        <GlassCard title="REVENUE" className="lg:col-span-1">
          <div className="space-y-3 text-sm">
            <div><p className="text-slate-300">Closed</p><p className="text-2xl font-semibold text-slate-100">{formatCurrency(revenue)}</p></div>
            <div><p className="text-slate-300">Pending</p><p className="text-xl font-semibold text-cyan-300">{formatCurrency(opportunities.filter((o) => o.stage === 'INVOICE_SENT').reduce((a, b) => a + b.value, 0))}</p></div>
          </div>
        </GlassCard>
      </div>

      <div className="grid gap-2 lg:grid-cols-3">
        <GlassCard title="DEALS NEAR CLOSE">
          <div className="space-y-2">{nearClose.slice(0, 3).map((opp) => <ActionRow key={opp.id} title={opp.organizationName} subtitle={opp.nextAction} value={formatCurrency(opp.value)} />)}</div>
        </GlassCard>
        <GlassCard title="RECENT ACTIVITY" className="lg:col-span-2">
          <div className="space-y-2">{activities.map((a) => <div key={a.id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm"><span className="text-slate-200">• {a.message}</span><span className="text-xs text-slate-400">{a.user}</span></div>)}</div>
        </GlassCard>
      </div>
      <GlassCard title="THIS MONTH"><p className="text-sm text-slate-300">2 / 4 Orders</p></GlassCard>
    </div>
  );
}

function SimpleRoleDashboard({ title }: { title: string }) { return <div className="space-y-3"><h2 className="text-3xl font-semibold">Today’s Focus</h2><GlassCard title={title}><p className="text-sm text-slate-300">Role-specific dashboard summary follows same command-center layout pattern.</p></GlassCard></div>; }

export function DashboardPage({ role }: { role: Role }) { if (role === 'REP') return <RepDashboard />; if (role === 'OWNER') return <SimpleRoleDashboard title="Revenue at Risk / Near Close / Payments Pending" />; if (role === 'DIRECTOR') return <SimpleRoleDashboard title="Stuck Deals / Coaching / Territory" />; return <SimpleRoleDashboard title="New Orders / Missing Info / Blockers" />; }
