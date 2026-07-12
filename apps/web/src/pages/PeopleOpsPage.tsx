import { useState } from 'react';
import { getStoredUser } from '../auth';
import { apiClient } from '../services/apiClient';

const ALL_STAGES = ['application','interview','offer','acceptance','documents','account_created','academy','certified','territory_assigned','pipeline_assigned','first_appointment','first_proposal','first_order'];
const STAGE_EMOJI: Record<string,string> = {
  application:'📋', interview:'🎙️', offer:'📝', acceptance:'✅', documents:'📄', account_created:'🔑', academy:'📚', certified:'🎓', territory_assigned:'🗺️', pipeline_assigned:'📊', first_appointment:'📅', first_proposal:'💰', first_order:'🏆',
};

export default function PeopleOpsPage() {
  const user = getStoredUser();
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Record<string,number>>({});
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ candidate_name:'', email:'', phone:'', role:'REP', territory:'', assigned_director:'' });

  const fetchData = async () => {
    try {
      const [cRes, sRes] = await Promise.all([
        apiClient('/people') as Promise<{candidates:any[]}>,
        apiClient('/people/stats') as Promise<{stats:Record<string,number>}>,
      ]);
      setCandidates(cRes.candidates || []);
      setStats(sRes.stats || {});
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  useState(() => { fetchData(); });

  const handleCreate = async () => {
    if (!form.candidate_name.trim()) return;
    await apiClient('/people', { method:'POST', body:form });
    setForm({ candidate_name:'', email:'', phone:'', role:'REP', territory:'', assigned_director:'' });
    setShowForm(false);
    fetchData();
  };

  const handleAdvance = async (id:number, stage:string) => {
    await apiClient(`/people/${id}/advance`, { method:'PUT', body:{ stage } });
    fetchData();
  };

  if (!user || user.role !== 'ADMIN') return <div className="p-6"><p className="text-slate-400">Admin access only.</p></div>;

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-4">
      <h1 className="text-xl font-bold text-white">People Operations</h1>
      <p className="text-sm text-slate-400">Brittany's operating system — every candidate from Application to First Order.</p>

      {/* Pipeline funnel */}
      <div className="grid grid-cols-7 gap-1">
        {ALL_STAGES.slice(0,7).map(s => (
          <div key={s} className="bg-slate-900 border border-slate-800 rounded p-2 text-center">
            <p className="text-lg">{STAGE_EMOJI[s]}</p>
            <p className="text-xs text-slate-400 mt-1">{s.replace(/_/g,' ')}</p>
            <p className="text-lg font-bold text-cyan-200">{stats[s] || 0}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-6 gap-1">
        {ALL_STAGES.slice(7).map(s => (
          <div key={s} className="bg-slate-900 border border-slate-800 rounded p-2 text-center">
            <p className="text-lg">{STAGE_EMOJI[s]}</p>
            <p className="text-xs text-slate-400 mt-1">{s.replace(/_/g,' ')}</p>
            <p className="text-lg font-bold text-cyan-200">{stats[s] || 0}</p>
          </div>
        ))}
      </div>

      <button onClick={()=>setShowForm(!showForm)} className="px-3 py-1.5 bg-cyan-600 text-white rounded text-sm font-semibold">+ Add Candidate</button>

      {showForm && (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 space-y-2 grid grid-cols-2 gap-2">
          <input placeholder="Name" value={form.candidate_name} onChange={e=>setForm({...form,candidate_name:e.target.value})} className="bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white col-span-2" />
          <input placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white" />
          <input placeholder="Phone" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} className="bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white" />
          <select value={form.role} onChange={e=>setForm({...form,role:e.target.value})} className="bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white">
            <option value="REP">REP</option><option value="DIRECTOR">DIRECTOR</option><option value="REGIONAL_DIRECTOR">REGIONAL DIRECTOR</option>
          </select>
          <input placeholder="Territory" value={form.territory} onChange={e=>setForm({...form,territory:e.target.value})} className="bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white" />
          <button onClick={handleCreate} className="px-4 py-1 bg-emerald-600 text-white rounded text-sm">Add</button>
          <button onClick={()=>setShowForm(false)} className="px-4 py-1 bg-slate-700 text-slate-300 rounded text-sm">Cancel</button>
        </div>
      )}

      <div className="space-y-2">
        {candidates.map(c => {
          const stageIdx = ALL_STAGES.indexOf(c.current_stage);
          const pct = Math.round((stageIdx / (ALL_STAGES.length - 1)) * 100);
          return (
            <div key={c.id} className="bg-slate-900 border border-slate-800 rounded-lg p-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-white">{c.candidate_name}</p>
                  <p className="text-xs text-slate-400">{c.role} · {c.territory || 'Unassigned'} · Owner: {c.assigned_hr}</p>
                </div>
                <span className="text-xs text-slate-500">Stage {stageIdx+1}/13</span>
              </div>
              <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-400 rounded-full" style={{width:`${pct}%`}} />
              </div>
              <div className="flex gap-1 mt-2 flex-wrap">
                {ALL_STAGES.map(s => (
                  <button key={s} onClick={()=>handleAdvance(c.id, s)}
                    className={`text-[10px] px-1.5 py-0.5 rounded ${c.current_stage === s ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-500 hover:text-white'}`}>
                    {STAGE_EMOJI[s]}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
