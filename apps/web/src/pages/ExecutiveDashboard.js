import { useEffect, useState } from 'react';
import { getStoredUser } from '../auth';
import { apiClient } from '../services/apiClient';
const STAGE_LABELS = {
    application: '📋 Applied', interview: '🎙️ Interview', offer: '📝 Offer', acceptance: '✅ Accepted',
    documents: '📄 Docs', account_created: '🔑 Account', academy: '📚 Academy', certified: '🎓 Certified',
    territory_assigned: '🗺️ Territory', pipeline_assigned: '📊 Pipeline', first_appointment: '📅 1st Appt',
    first_proposal: '💰 1st Proposal', first_order: '🏆 1st Order',
};
const OPS_STAGE_LABELS = {
    ready_for_ops: '🚀 Ready for Ops', in_production: '🏭 In Production',
    quality_control: '🔍 QC', shipped: '📦 Shipped',
    READY_FOR_OPS: '🚀 Ready for Ops', IN_PRODUCTION: '🏭 In Production',
    QUALITY_CONTROL: '🔍 QC', SHIPPED: '📦 Shipped',
    ORDER_ASSEMBLY: '🧩 Assembly', order_assembly: '🧩 Assembly',
};
export default function ExecutiveDashboard() {
    const user = getStoredUser();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        apiClient('/dashboard').then((d) => { setData(d); setLoading(false); }).catch(() => setLoading(false));
    }, []);
    if (!user || (user.role !== 'ADMIN' && user.role !== 'REGIONAL_DIRECTOR')) {
        return <div className="p-6"><p className="text-slate-400">Leadership access only.</p></div>;
    }
    return (<div className="p-4 max-w-7xl mx-auto space-y-4">
      <h1 className="text-xl font-bold text-white">Executive Dashboard</h1>
      <p className="text-sm text-slate-400">What requires your attention today.</p>

      {loading ? <p className="text-slate-500">Loading...</p> : data ? (<>
          {/* Daily Brief — always first */}
          <DailyBriefCard brief={data.dailyBrief || {}}/>

          <div className="grid grid-cols-2 gap-4">
            {/* 🔴 Decisions */}
            <Section title="🔴 Executive Decisions" count={(data.decisions || []).length} color="border-red-500">
              {(data.decisions || []).map((d) => (<div key={d.id} className="text-sm py-1 border-b border-slate-800">
                  <span className="text-red-300 font-semibold">{d.priority?.toUpperCase?.() || ''}</span>
                  <span className="text-white ml-2">{d.title}</span>
                  {d.owner && <span className="text-slate-500 ml-2">— {d.owner}</span>}
                </div>))}
            </Section>

            {/* 💰 Revenue Blockers */}
            <Section title="💰 Revenue Blockers" count={(data.revenueBlockers || []).length} color="border-orange-500">
              {(data.revenueBlockers || []).map((d) => (<div key={d.id} className="text-sm py-1 border-b border-slate-800">
                  <span className="text-white">{d.title}</span>
                  {d.owner && <span className="text-slate-500 ml-2">— {d.owner}</span>}
                </div>))}
            </Section>

            {/* 👥 People Ops Pipeline */}
            <Section title="👥 People Ops Pipeline" count={data.pipelineStats?.reduce((s, x) => s + Number(x.count), 0) || 0} color="border-cyan-500">
              {(data.pipelineStats || []).map((s) => (<div key={s.current_stage} className="flex justify-between text-sm py-0.5">
                  <span className="text-slate-400">{STAGE_LABELS[s.current_stage] || s.current_stage}</span>
                  <span className="text-cyan-300 font-semibold">{s.count}</span>
                </div>))}
            </Section>

            {/* 🎯 Recruiting */}
            <Section title="🎯 Recruiting Pipeline" count={(data.recruiting || []).length} color="border-purple-500">
              {(data.recruiting || []).map((r) => (<div key={r.name + r.stage} className="flex justify-between text-sm py-1 border-b border-slate-800">
                  <span className="text-white">{r.name}</span>
                  <span className="text-purple-300">{r.stage?.replace(/_/g, ' ') || 'Active'}</span>
                </div>))}
            </Section>

            {/* 📊 Sales */}
            <Section title="📊 Near-Close Pipeline" count={(data.sales || []).length} color="border-emerald-500">
              {(data.sales || []).map((s) => (<div key={s.id} className="text-sm py-1 border-b border-slate-800">
                  <span className="text-white">{s.title || `Deal #${s.id}`}</span>
                  <span className="text-emerald-300 ml-2">{s.stage?.replace(/_/g, ' ')}</span>
                  {s.expected_value && (<span className="text-slate-500 ml-2">${Number(s.expected_value).toLocaleString()}</span>)}
                </div>))}
            </Section>

            {/* ⚙️ Ops */}
            <Section title="⚙️ Active Operations" count={(data.ops || []).length} color="border-blue-500">
              {(data.ops || []).map((o) => (<div key={o.id} className="text-sm py-1 border-b border-slate-800">
                  <span className="text-white">{o.opportunity_name || `Order #${o.id}`}</span>
                  <span className="text-blue-300 ml-2">{OPS_STAGE_LABELS[o.status] || o.status}</span>
                </div>))}
            </Section>

            {/* ⏳ Waiting */}
            <Section title="⏳ Unassigned Items" count={(data.waiting || []).length} color="border-pink-500">
              {(data.waiting || []).map((w) => (<div key={w.id} className="text-sm py-1 border-b border-slate-800">
                  <span className="text-white">{w.title}</span>
                  <span className="text-slate-500 ml-2">{new Date(w.created_at).toLocaleDateString()}</span>
                </div>))}
            </Section>

            {/* ⏰ Overdue */}
            <Section title="⏰ Overdue (>7 days)" count={(data.overdue || []).length} color="border-yellow-500">
              {(data.overdue || []).map((d) => (<div key={d.id} className="text-sm py-1 border-b border-slate-800">
                  <span className="text-yellow-300">{new Date(d.created_at).toLocaleDateString()}</span>
                  <span className="text-white ml-2">{d.title}</span>
                </div>))}
            </Section>
          </div>
        </>) : <p className="text-slate-500">Failed to load dashboard.</p>}
    </div>);
}
function DailyBriefCard({ brief }) {
    const items = [
        { label: 'Open Decisions', count: brief.open_decisions || 0, color: 'text-red-300' },
        { label: 'Revenue Blockers', count: brief.revenue_blockers || 0, color: 'text-orange-300' },
        { label: 'Active Candidates', count: brief.active_candidates || 0, color: 'text-cyan-300' },
        { label: 'Active Recruits', count: brief.active_recruits || 0, color: 'text-purple-300' },
        { label: 'Near Close Deals', count: brief.near_close_deals || 0, color: 'text-emerald-300' },
        { label: 'Active Orders', count: brief.active_orders || 0, color: 'text-blue-300' },
        { label: 'Overdue Items', count: brief.overdue_items || 0, color: 'text-yellow-300' },
        { label: 'Waiting Assignment', count: brief.waiting_items || 0, color: 'text-pink-300' },
    ];
    const total = items.reduce((s, i) => s + i.count, 0);
    return (<div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
      <h2 className="font-semibold text-white mb-2">📋 Daily Brief</h2>
      <div className="grid grid-cols-4 gap-2">
        {items.map(i => (<div key={i.label} className="text-center bg-slate-800 rounded p-2">
            <p className={`text-lg font-bold ${i.color}`}>{i.count}</p>
            <p className="text-[10px] text-slate-400">{i.label}</p>
          </div>))}
      </div>
      {total === 0 && <p className="text-emerald-400 text-sm mt-2">✓ All clear — nothing needs attention.</p>}
    </div>);
}
function Section({ title, count, color, children }) {
    return (<div className={`bg-slate-900 border-l-4 ${color} border border-slate-800 rounded-lg p-4`}>
      <h2 className="font-semibold text-white mb-2">{title} <span className="text-slate-500 text-sm">({count})</span></h2>
      {children}
      {count === 0 && <p className="text-slate-600 text-sm">Nothing to show.</p>}
    </div>);
}
//# sourceMappingURL=ExecutiveDashboard.js.map