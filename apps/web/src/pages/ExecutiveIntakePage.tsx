import { useEffect, useState } from 'react';
import { getStoredUser } from '../auth';
import { apiClient } from '../services/apiClient';

interface IntakeItem {
  id: number;
  title: string;
  description: string;
  source: string;
  priority: string;
  status: string;
  owner: string;
  next_action: string;
  ai_summary: string;
  tags: string[];
  created_at: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'border-red-500 bg-red-500/10 text-red-200',
  high: 'border-orange-500 bg-orange-500/10 text-orange-200',
  medium: 'border-yellow-500 bg-yellow-500/10 text-yellow-200',
  low: 'border-slate-500 bg-slate-500/10 text-slate-300',
};

const SOURCES = ['email', 'recruiting', 'hr', 'sales', 'operations', 'leadership', 'technology', 'other'];
const FALLBACK_OWNERS = ['Bradshaw', 'Primeau', 'Denzer', 'Ryan', 'Brandon'];

export default function ExecutiveIntakePage() {
  const user = getStoredUser();
  const [items, setItems] = useState<IntakeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', source: 'other', priority: 'medium', owner: '' });
  const [filter, setFilter] = useState('all');

  const fetchItems = async () => {
    try {
      const res = await apiClient('/intake') as { items: IntakeItem[] };
      setItems(res.items || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    try {
      await apiClient('/intake', { method: 'POST', body: form });
      setForm({ title: '', description: '', source: 'other', priority: 'medium', owner: '' });
      setShowForm(false);
      fetchItems();
    } catch (e) { console.error(e); }
  };

  const handleUpdate = async (id: number, updates: Partial<IntakeItem>) => {
    try {
      await apiClient(`/intake/${id}`, { method: 'PUT', body: updates });
      fetchItems();
    } catch (e) { console.error(e); }
  };

  const filtered = filter === 'all' ? items : items.filter(i => i.status === filter);
  const decisions = items.filter(i => i.status === 'open' && (i.priority === 'critical' || i.priority === 'high'));
  const overdue = items.filter(i => i.status === 'open' && new Date(i.created_at) < new Date(Date.now() - 7 * 86400000));

  if (!user || user.role !== 'ADMIN') {
    return <div className="p-6"><p className="text-slate-400">Admin access only.</p></div>;
  }

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-4">
      <h1 className="text-xl font-bold text-white">Executive Intake</h1>
      <p className="text-sm text-slate-400">Decision engine — every operational event becomes an owned, tracked issue.</p>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-2">
        <StatCard label="Open" value={items.filter(i => i.status === 'open').length} color="text-yellow-200" />
        <StatCard label="Decisions Needed" value={decisions.length} color="text-red-200" />
        <StatCard label="Overdue (>7d)" value={overdue.length} color="text-orange-200" />
        <StatCard label="Total" value={items.length} color="text-cyan-200" />
      </div>

      {/* Actions */}
      <div className="flex gap-2 items-center">
        <button onClick={() => setShowForm(!showForm)} className="px-3 py-1.5 bg-cyan-600 text-white rounded text-sm font-semibold hover:bg-cyan-500">
          + New Intake
        </button>
        <select value={filter} onChange={e => setFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-slate-200">
          <option value="all">All</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="review">Review</option>
          <option value="approved">Approved</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 space-y-3">
          <input placeholder="Issue title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white" />
          <textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white" rows={2} />
          <div className="flex gap-2">
            <select value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}
              className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-white">
              {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}
              className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-white">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <select value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })}
              className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-white">
              <option value="">Unassigned</option>
              {FALLBACK_OWNERS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <button onClick={handleCreate} className="px-4 py-1 bg-emerald-600 text-white rounded text-sm">Create</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-1 bg-slate-700 text-slate-300 rounded text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Items list */}
      {loading ? (
        <p className="text-slate-500 text-sm">Loading...</p>
      ) : (
        <div className="space-y-2">
          {filtered.map(item => (
            <IntakeCard key={item.id} item={item} onUpdate={handleUpdate} />
          ))}
          {filtered.length === 0 && <p className="text-slate-500 text-sm">No items.</p>}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-slate-400">{label}</p>
    </div>
  );
}

function IntakeCard({ item, onUpdate }: { item: IntakeItem; onUpdate: (id: number, u: Partial<IntakeItem>) => void }) {
  const pc = PRIORITY_COLORS[item.priority] || PRIORITY_COLORS.medium;
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex justify-between items-start gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${pc}`}>{item.priority}</span>
          <span className="text-xs text-slate-500">{item.source}</span>
          {item.status !== 'open' && <span className="text-xs text-slate-500">· {item.status}</span>}
        </div>
        <p className="font-semibold text-white text-sm mt-1">{item.title}</p>
        {item.description && <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{item.description}</p>}
        <div className="flex gap-3 mt-1 text-xs text-slate-500">
          {item.owner && <span>👤 {item.owner}</span>}
          <span>{new Date(item.created_at).toLocaleDateString()}</span>
        </div>
      </div>
      <select value={item.status} onChange={e => onUpdate(item.id, { status: e.target.value })}
        className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white shrink-0">
        <option value="open">Open</option>
        <option value="in_progress">In Progress</option>
        <option value="review">Review</option>
        <option value="approved">Approved</option>
        <option value="closed">Closed</option>
      </select>
    </div>
  );
}
