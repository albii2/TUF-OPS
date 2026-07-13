import { useEffect, useState } from 'react';
import { getStoredUser } from '../auth';
import { apiClient } from '../services/apiClient';

interface DashboardData {
  decisions: any[];
  hr: any[];
  overdue: any[];
  pipelineStats: { current_stage: string; count: number }[];
  revenueBlockers: any[];
}

const STAGE_LABELS: Record<string, string> = {
  application: '📋 Applied', interview: '🎙️ Interview', offer: '📝 Offer', acceptance: '✅ Accepted',
  documents: '📄 Docs', account_created: '🔑 Account', academy: '📚 Academy', certified: '🎓 Certified',
  territory_assigned: '🗺️ Territory', pipeline_assigned: '📊 Pipeline', first_appointment: '📅 1st Appt',
  first_proposal: '💰 1st Proposal', first_order: '🏆 1st Order',
};

export default function ExecutiveDashboard() {
  const user = getStoredUser();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient('/dashboard').then((d: any) => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (!user || user.role !== 'ADMIN') return <div className="p-6"><p className="text-slate-400">Admin access only.</p></div>;

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-4">
      <h1 className="text-xl font-bold text-white">Executive Dashboard</h1>
      <p className="text-sm text-slate-400">What requires your attention today.</p>

      {loading ? <p className="text-slate-500">Loading...</p> : data ? (
        <div className="grid grid-cols-2 gap-4">
          {/* Decisions */}
          <Section title="🔴 Executive Decisions" count={data.decisions.length} color="border-red-500">
            {data.decisions.map((d: any) => (
              <div key={d.id} className="text-sm py-1 border-b border-slate-800">
                <span className="text-red-300 font-semibold">{d.priority.toUpperCase()}</span>
                <span className="text-white ml-2">{d.title}</span>
                {d.owner && <span className="text-slate-500 ml-2">— {d.owner}</span>}
              </div>
            ))}
          </Section>

          {/* Revenue Blockers */}
          <Section title="💰 Revenue Blockers" count={data.revenueBlockers.length} color="border-orange-500">
            {data.revenueBlockers.map((d: any) => (
              <div key={d.id} className="text-sm py-1 border-b border-slate-800">
                <span className="text-white">{d.title}</span>
                {d.owner && <span className="text-slate-500 ml-2">— {d.owner}</span>}
              </div>
            ))}
          </Section>

          {/* HR Pipeline */}
          <Section title="👥 People Ops Pipeline" count={data.hr.length} color="border-cyan-500">
            {data.pipelineStats.map((s: any) => (
              <div key={s.current_stage} className="flex justify-between text-sm py-0.5">
                <span className="text-slate-400">{STAGE_LABELS[s.current_stage] || s.current_stage}</span>
                <span className="text-cyan-300 font-semibold">{s.count}</span>
              </div>
            ))}
          </Section>

          {/* Overdue */}
          <Section title="⏰ Overdue (>7 days)" count={data.overdue.length} color="border-yellow-500">
            {data.overdue.map((d: any) => (
              <div key={d.id} className="text-sm py-1 border-b border-slate-800">
                <span className="text-yellow-300">{new Date(d.created_at).toLocaleDateString()}</span>
                <span className="text-white ml-2">{d.title}</span>
              </div>
            ))}
          </Section>
        </div>
      ) : <p className="text-slate-500">Failed to load dashboard.</p>}
    </div>
  );
}

function Section({ title, count, color, children }: { title: string; count: number; color: string; children: any }) {
  return (
    <div className={`bg-slate-900 border-l-4 ${color} border border-slate-800 rounded-lg p-4`}>
      <h2 className="font-semibold text-white mb-2">{title} <span className="text-slate-500 text-sm">({count})</span></h2>
      {children}
      {count === 0 && <p className="text-slate-600 text-sm">Nothing to show.</p>}
    </div>
  );
}
