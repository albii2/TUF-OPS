import { roleConfig } from '../config/roles';
import { nextActions } from '../data/mock';
import type { Role } from '../types';
import { GlassCard, StatCard } from '../components/ui';

function RepDashboard() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Deals Need Action" value="12" />
        <StatCard label="Near Close" value="6" />
        <StatCard label="Payments Pending" value="4" />
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        <GlassCard title="Next Actions" className="lg:col-span-2">
          <div className="space-y-2">
            {nextActions.map((item) => (
              <div key={item.name} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/70 p-3 text-sm">
                <div>
                  <p className="font-medium text-slate-100">{item.name}</p>
                  <p className="text-xs text-slate-400">{item.action}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-cyan-300">{item.due}</span>
                  <div className="hidden gap-1 sm:flex">
                    {['Call', 'Text', 'Email', 'Done'].map((cta) => (
                      <button key={cta} className="rounded-md border border-slate-700 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-slate-300 hover:border-cyan-400">
                        {cta}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
        <GlassCard title="Deals Near Close">
          <ul className="space-y-2 text-sm text-slate-300">
            <li>Hawkins HS — Invoice Sent — $18,240</li>
            <li>Granite Bay — Decision Pending — $11,480</li>
            <li>Eastpoint — Mockup Delivered — $9,990</li>
          </ul>
        </GlassCard>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        <GlassCard title="Pipeline Snapshot">
          <p className="text-3xl font-semibold text-cyan-300">$286K</p>
          <p className="mt-1 text-xs text-slate-400">Open across 28 opportunities</p>
        </GlassCard>
        <GlassCard title="Revenue">
          <p className="text-3xl font-semibold text-cyan-300">$74K</p>
          <p className="mt-1 text-xs text-slate-400">Closed won MTD</p>
        </GlassCard>
        <GlassCard title="This Month">
          <p className="text-sm text-slate-300">Win Rate 41% · Avg Deal $12.2K · 3 New Logos</p>
        </GlassCard>
      </div>
      <GlassCard title="Recent Activity">
        <p className="text-sm text-slate-300">09:10 AM — Mockup requested by Northview · 10:02 AM — Invoice viewed by Cedar Hill · 11:41 AM — Follow-up logged at Liberty Prep.</p>
      </GlassCard>
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
            <p className="text-2xl font-semibold text-cyan-300">{Math.floor(Math.random() * 90) + 10}</p>
            <p className="text-xs text-slate-400">Live role metric</p>
          </GlassCard>
        ))}
      </div>
      <GlassCard title={`${role} Priority Queue`}>
        <p className="text-sm text-slate-300">Focused operational queue aligned to {role.toLowerCase()} actions and blockers.</p>
      </GlassCard>
    </div>
  );
}

export function DashboardPage({ role }: { role: Role }) {
  return role === 'REP' ? <RepDashboard /> : <GenericDashboard role={role} />;
}
