import { useEffect, useState } from 'react';
import { getStoredUser } from '../auth';
import { apiClient } from '../services/apiClient';
const RECIPIENTS = [
    { name: 'Primeau Hill', role: 'Vice President of Sales', key: 'Primeau' },
    { name: 'Brandon Jeffries', role: 'Director of Operations', key: 'Brandon' },
    { name: 'Maggie Betts', role: 'Director of Sales', key: 'Maggie' },
    { name: 'Ryan Denzer', role: 'Regional Director', key: 'Ryan' },
    { name: 'William Conroy', role: 'Business Development', key: 'William' },
    { name: 'Brittany Denzer', role: 'People Operations Lead', key: 'Brittany' },
    { name: 'Narena Johnson', role: 'Sales Representative', key: 'Narena' },
    { name: 'All Leadership', role: 'Company-Wide', key: 'All' },
];
const COMM_TYPES = [
    { key: 'offer', label: 'Job Offer', template: 'I am pleased to formally offer you the position of [ROLE] at TUF Sports Apparel...' },
    { key: 'direction', label: 'Direction & Expectations', template: 'Here is the strategic direction for [FOCUS AREA] over the next [TIMEFRAME]...' },
    { key: 'onboarding', label: 'Onboarding Plan', template: 'Welcome to TUF Sports Apparel. Your onboarding plan for the next [DAYS] days covers...' },
    { key: 'reset', label: 'Company Reset', template: 'Effective immediately, here are the updated priorities and expectations...' },
    { key: 'performance', label: 'Performance Review', template: 'Following our review period, here is your performance summary...' },
    { key: 'announcement', label: 'Announcement', template: 'I am excited to announce that...' },
];
export default function LeadershipCommsPage() {
    const user = getStoredUser();
    const [comms, setComms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [commType, setCommType] = useState('');
    const [form, setForm] = useState({
        subject: '', recipient: 'Primeau', body: '', status: 'draft', scheduled_for: '', notes: '',
    });
    const [filter, setFilter] = useState('all');
    const fetchComms = async () => {
        try {
            const params = filter !== 'all' ? `?status=${filter}` : '';
            const res = await apiClient(`/comms${params}`);
            setComms(res.comms || []);
        }
        catch (e) {
            console.error(e);
        }
        setLoading(false);
    };
    useEffect(() => { fetchComms(); }, [filter]);
    const handleTemplate = (type) => {
        setCommType(type);
        const tpl = COMM_TYPES.find(t => t.key === type);
        const recipient = RECIPIENTS.find(r => r.key === form.recipient);
        if (tpl) {
            setForm(prev => ({
                ...prev,
                body: tpl.template.replace('[ROLE]', recipient?.role || '').replace('[FOCUS AREA]', '').replace('[TIMEFRAME]', '').replace('[DAYS]', ''),
            }));
        }
    };
    const handleCreate = async () => {
        if (!form.subject.trim() || !form.body.trim())
            return;
        try {
            await apiClient('/comms', { method: 'POST', body: form });
            setForm({ subject: '', recipient: 'Primeau', body: '', status: 'draft', scheduled_for: '', notes: '' });
            setShowForm(false);
            setCommType('');
            fetchComms();
        }
        catch (e) {
            console.error(e);
        }
    };
    const handleUpdate = async (id, updates) => {
        try {
            await apiClient(`/comms/${id}`, { method: 'PUT', body: updates });
            fetchComms();
        }
        catch (e) {
            console.error(e);
        }
    };
    const scheduleForMorning = () => {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(6, 0, 0, 0);
        // If it's before 6 AM today, use today at 6 AM
        if (now.getHours() < 6) {
            const today6am = new Date(now);
            today6am.setHours(6, 0, 0, 0);
            setForm(prev => ({ ...prev, scheduled_for: today6am.toISOString().slice(0, 16) }));
        }
        else {
            setForm(prev => ({ ...prev, scheduled_for: tomorrow.toISOString().slice(0, 16) }));
        }
    };
    if (!user || (user.role !== 'ADMIN' && user.role !== 'REGIONAL_DIRECTOR')) {
        return <div className="p-6"><p className="text-slate-400">Leadership access only.</p></div>;
    }
    return (<div className="p-4 max-w-6xl mx-auto space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-white">Leadership Communications</h1>
          <p className="text-sm text-slate-400">Draft, schedule, and track leadership communications.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="px-3 py-1.5 bg-cyan-600 text-white rounded text-sm font-semibold hover:bg-cyan-500">
          + New Communication
        </button>
      </div>

      {/* Status filter */}
      <div className="flex gap-1">
        {['all', 'draft', 'scheduled', 'sent', 'cancelled'].map(s => (<button key={s} onClick={() => setFilter(s)} className={`px-2 py-1 text-xs rounded ${filter === s ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>))}
      </div>

      {/* Create form */}
      {showForm && (<div className="bg-slate-900 border border-slate-700 rounded-lg p-4 space-y-3">
          {/* Recipient */}
          <div className="grid grid-cols-3 gap-2">
            <select value={form.recipient} onChange={e => setForm({ ...form, recipient: e.target.value })} className="bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white">
              {RECIPIENTS.map(r => <option key={r.key} value={r.key}>{r.name} ({r.role})</option>)}
            </select>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white">
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="sent">Sent</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <input type="text" placeholder="Subject" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white"/>
          </div>

          {/* Template picker */}
          <div className="flex gap-1 flex-wrap">
            <span className="text-xs text-slate-500 mr-1">Templates:</span>
            {COMM_TYPES.map(t => (<button key={t.key} onClick={() => handleTemplate(t.key)} className={`text-[10px] px-1.5 py-0.5 rounded ${commType === t.key ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
                {t.label}
              </button>))}
          </div>

          {/* Body */}
          <textarea placeholder="Communication body..." value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white font-mono" rows={8}/>

          {/* Schedule + Notes */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2">
              <input type="datetime-local" value={form.scheduled_for} onChange={e => setForm({ ...form, scheduled_for: e.target.value })} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-white flex-1"/>
              <button onClick={scheduleForMorning} className="px-2 py-1 bg-purple-600 text-white rounded text-[10px] whitespace-nowrap">
                6:00 AM
              </button>
            </div>
            <input type="text" placeholder="Notes (internal only)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white"/>
          </div>

          <div className="flex gap-2">
            <button onClick={handleCreate} className="px-4 py-1.5 bg-emerald-600 text-white rounded text-sm font-semibold">Save</button>
            <button onClick={() => { setShowForm(false); setCommType(''); }} className="px-4 py-1.5 bg-slate-700 text-slate-300 rounded text-sm">Cancel</button>
          </div>
        </div>)}

      {/* Comms list */}
      {loading ? (<p className="text-slate-500 text-sm">Loading...</p>) : (<div className="space-y-2">
          {comms.map(c => {
                const recipient = RECIPIENTS.find(r => r.key === c.recipient);
                const statusColors = {
                    draft: 'border-slate-500 bg-slate-500/10 text-slate-300',
                    scheduled: 'border-purple-500 bg-purple-500/10 text-purple-200',
                    sent: 'border-emerald-500 bg-emerald-500/10 text-emerald-200',
                    cancelled: 'border-red-500 bg-red-500/10 text-red-200',
                };
                return (<div key={c.id} className="bg-slate-900 border border-slate-800 rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${statusColors[c.status] || ''}`}>
                        {c.status}
                      </span>
                      <span className="text-sm font-semibold text-white truncate">{c.subject}</span>
                    </div>
                    <div className="flex gap-2 mt-1 text-xs text-slate-500">
                      <span>To: {recipient?.name || c.recipient}</span>
                      {c.scheduled_for && (<span className="text-purple-300">⚡ {new Date(c.scheduled_for).toLocaleString()}</span>)}
                      <span>{new Date(c.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{c.body.slice(0, 200)}</p>
                  </div>
                  <div className="flex gap-1 shrink-0 ml-2">
                    {c.status === 'draft' && (<button onClick={() => handleUpdate(c.id, { status: 'scheduled' })} className="text-[10px] px-1.5 py-0.5 bg-purple-600 text-white rounded">Schedule</button>)}
                    {c.status === 'scheduled' && (<>
                        <button onClick={() => handleUpdate(c.id, { status: 'sent', sent_at: new Date().toISOString() })} className="text-[10px] px-1.5 py-0.5 bg-emerald-600 text-white rounded">Mark Sent</button>
                        <button onClick={() => handleUpdate(c.id, { status: 'draft', scheduled_for: undefined })} className="text-[10px] px-1.5 py-0.5 bg-slate-600 text-white rounded">Unschedule</button>
                      </>)}
                    {(c.status === 'draft' || c.status === 'scheduled') && (<button onClick={() => handleUpdate(c.id, { status: 'cancelled' })} className="text-[10px] px-1.5 py-0.5 bg-red-600 text-white rounded">Cancel</button>)}
                  </div>
                </div>
              </div>);
            })}
          {comms.length === 0 && <p className="text-slate-500 text-sm">No communications yet.</p>}
        </div>)}
    </div>);
}
//# sourceMappingURL=LeadershipCommsPage.js.map