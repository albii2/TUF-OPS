import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCandidates, getRecruitingDashboard, createCandidate, STAGES, STAGE_LABELS, STAGE_COLORS, type Candidate, type RecruitingDashboard, type CreateCandidateInput } from '../services/recruitingService';

const SOURCES = ['indeed', 'linkedin', 'referral', 'website', 'other'] as const;

export default function RecruitingPage() {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [dashboard, setDashboard] = useState<RecruitingDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateCandidateInput>({ first_name: '', last_name: '', email: '', phone: '', source: 'linkedin', notes: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cands, dash] = await Promise.all([getCandidates(), getRecruitingDashboard()]);
      setCandidates(cands);
      setDashboard(dash);
    } catch (e) {
      console.error('Failed to load recruiting data', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name.trim() || !form.last_name.trim() || !form.email.trim()) return;
    setSaving(true);
    try {
      await createCandidate(form);
      setForm({ first_name: '', last_name: '', email: '', phone: '', source: 'linkedin', notes: '' });
      setShowForm(false);
      await load();
    } catch (e) {
      console.error('Failed to create candidate', e);
    } finally {
      setSaving(false);
    }
  };

  const byStage: Record<string, Candidate[]> = {};
  STAGES.forEach(s => { byStage[s] = []; });
  candidates.forEach(c => {
    if (byStage[c.stage]) byStage[c.stage].push(c);
  });

  if (loading) return <div className="p-8 text-gray-400">Loading pipeline...</div>;

  return (
    <div className="p-6 max-w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Recruiting Pipeline</h1>
          <p className="text-gray-400 text-sm mt-1">
            {candidates.length} candidate{candidates.length !== 1 ? 's' : ''} in pipeline
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded text-sm font-semibold"
        >
          + New Candidate
        </button>
      </div>

      {/* New Candidate Form */}
      {showForm && (
        <div className="mb-6 bg-gray-900 border border-gray-700 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-gray-300 mb-3">Add Candidate from External Application</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <input
              placeholder="First Name *" value={form.first_name}
              onChange={e => setForm({ ...form, first_name: e.target.value })}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
              required
            />
            <input
              placeholder="Last Name *" value={form.last_name}
              onChange={e => setForm({ ...form, last_name: e.target.value })}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
              required
            />
            <input
              placeholder="Email *" type="email" value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
              required
            />
            <input
              placeholder="Phone" value={form.phone || ''}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
            />
            <select
              value={form.source}
              onChange={e => setForm({ ...form, source: e.target.value })}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
            >
              {SOURCES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
            <input
              placeholder="Resume URL (link to file)" value={(form as any).resume_url || ''}
              onChange={e => setForm({ ...form, resume_url: e.target.value } as any)}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
            />
            <input
              placeholder="Notes" value={form.notes || ''}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm col-span-2"
            />
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white px-4 py-2 rounded text-sm">
                {saving ? 'Saving...' : 'Add to Pipeline'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-2 rounded text-sm">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Dashboard Summary */}
      {dashboard && (
        <div className="mb-6 flex flex-wrap gap-2">
          {STAGES.filter(s => s !== 'rejected').map(stage => {
            const count = dashboard.stages.find(s => s.stage === stage)?.count || 0;
            return (
              <div key={stage} className={`${STAGE_COLORS[stage]} text-white text-xs px-3 py-1 rounded-full font-medium`}>
                {STAGE_LABELS[stage]}: {count}
              </div>
            );
          })}
        </div>
      )}

      {/* Kanban Board */}
      <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: '60vh' }}>
        {STAGES.filter(s => s !== 'rejected').map(stage => (
          <div key={stage} className="flex-shrink-0 w-64 bg-gray-900 border border-gray-800 rounded-lg">
            <div className={`${STAGE_COLORS[stage]} text-white text-xs font-bold px-3 py-2 rounded-t-lg uppercase tracking-wide`}>
              {STAGE_LABELS[stage]} ({byStage[stage].length})
            </div>
            <div className="p-2 space-y-2">
              {byStage[stage].map(c => (
                <div
                  key={c.id}
                  onClick={() => navigate(`/recruiting/${c.id}`)}
                  className="bg-gray-800 border border-gray-700 rounded p-3 cursor-pointer hover:border-gray-500 transition"
                >
                  <div className="text-white font-medium text-sm">{c.first_name} {c.last_name}</div>
                  <div className="text-gray-400 text-xs mt-1">{c.email}</div>
                  <div className="text-gray-500 text-xs mt-1 capitalize">{c.source}</div>
                </div>
              ))}
              {byStage[stage].length === 0 && (
                <div className="text-gray-600 text-xs text-center py-4">No candidates</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
