import { useEffect, useState } from 'react';
import { getStoredUser } from '../auth';
import { useDailyActivities } from '../hooks/useDailyActivities';
const METRICS = [
    { key: 'calls', label: 'Calls', emoji: '📞', highlight: false },
    { key: 'emails', label: 'Emails', emoji: '✉️', highlight: false },
    { key: 'texts', label: 'Texts', emoji: '💬', highlight: false },
    { key: 'linkedin_msgs', label: 'LinkedIn', emoji: '🔗', highlight: false },
    { key: 'conversations', label: 'Conversations', emoji: '🗣️', highlight: true },
    { key: 'meetings', label: 'Meetings', emoji: '🤝', highlight: true },
    { key: 'quotes', label: 'Quotes', emoji: '📋', highlight: true },
    { key: 'follow_ups', label: 'Follow-ups', emoji: '🔄', highlight: false },
    { key: 'new_opps', label: 'New Opps', emoji: '🏈', highlight: false },
];
export default function DailyActivityCommand() {
    const user = getStoredUser();
    const { today, myEntry, loading, saving, fetchToday, saveActivity } = useDailyActivities();
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'DIRECTOR' || user?.role === 'REGIONAL_DIRECTOR';
    const [counts, setCounts] = useState({});
    useEffect(() => {
        fetchToday();
    }, [fetchToday]);
    useEffect(() => {
        if (myEntry) {
            const c = {};
            METRICS.forEach(({ key }) => { c[key] = String(myEntry[key] || 0); });
            setCounts(c);
        }
    }, [myEntry]);
    const handleSubmit = async (e) => {
        e.preventDefault();
        const input = {};
        METRICS.forEach(({ key }) => {
            const val = parseInt(counts[key] || '0', 10);
            if (!isNaN(val))
                input[key] = val;
        });
        await saveActivity(input);
    };
    const totalConversations = today.reduce((sum, e) => sum + e.conversations, 0);
    const totalCalls = today.reduce((sum, e) => sum + e.calls, 0);
    const totalMeetings = today.reduce((sum, e) => sum + e.meetings, 0);
    if (loading && !today.length) {
        return <div className="p-8 text-gray-400">Loading...</div>;
    }
    return (<div className="max-w-5xl mx-auto p-6">
      {/* ── HEADER ── */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Daily Activity Command</h1>
        <p className="text-gray-400 mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* ── ADMIN/DIRECTOR VIEW: TEAM COMMAND ── */}
      {isAdmin && (<div className="mb-8 bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
            Team Activity — Today
          </h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-gray-800 rounded p-3 text-center">
              <div className="text-2xl font-bold text-cyan-400">{totalCalls}</div>
              <div className="text-xs text-gray-500">Calls</div>
            </div>
            <div className="bg-gray-800 rounded p-3 text-center">
              <div className="text-2xl font-bold text-green-400">{totalConversations}</div>
              <div className="text-xs text-gray-500">Conversations</div>
            </div>
            <div className="bg-gray-800 rounded p-3 text-center">
              <div className="text-2xl font-bold text-yellow-400">{totalMeetings}</div>
              <div className="text-xs text-gray-500">Meetings</div>
            </div>
          </div>
          {today.length === 0 ? (<p className="text-gray-500 text-sm">No activity logged yet today. Reps — get your numbers in.</p>) : (<div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-800">
                    <th className="text-left py-2 font-medium">Rep</th>
                    {METRICS.map(({ key, label }) => (<th key={key} className="text-center py-2 px-1 font-medium">{label.slice(0, 4)}</th>))}
                  </tr>
                </thead>
                <tbody>
                  {today.map((entry) => (<tr key={entry.id} className="border-b border-gray-800/50">
                      <td className="py-2 text-white font-medium">{entry.user_name}</td>
                      {METRICS.map(({ key }) => (<td key={key} className={`text-center py-2 ${key === 'conversations' || key === 'meetings' ? 'text-green-400 font-bold' : 'text-gray-300'}`}>
                          {entry[key] || 0}
                        </td>))}
                    </tr>))}
                </tbody>
              </table>
            </div>)}
        </div>)}

      {/* ── REP INPUT FORM ── */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-1">
          Log Today's Activity
        </h2>
        <p className="text-xs text-gray-600 mb-4">
          {isAdmin ? 'Enter your numbers. Reps log their own below.' : 'Enter your numbers as you go. Update anytime.'}
        </p>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-4">
            {METRICS.map(({ key, label, emoji, highlight }) => (<div key={key}>
                <label className={`block text-xs mb-1 ${highlight ? 'text-green-400 font-semibold' : 'text-gray-500'}`}>
                  {emoji} {label}
                </label>
                <input type="number" min="0" value={counts[key] || '0'} onChange={(e) => setCounts((prev) => ({ ...prev, [key]: e.target.value }))} className={`w-full bg-gray-800 border rounded px-2 py-1.5 text-center text-white text-sm
                    ${highlight ? 'border-green-700 focus:border-green-500' : 'border-gray-700 focus:border-cyan-600'}
                    focus:outline-none`}/>
              </div>))}
          </div>
          <button type="submit" disabled={saving} className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white px-6 py-2 rounded text-sm font-semibold transition">
            {saving ? 'Saving...' : 'Log Activity'}
          </button>
        </form>
      </div>

      {/* ── THE POINT ── */}
      <div className="mt-8 p-4 bg-gray-900/50 border border-gray-800 rounded text-sm text-gray-500">
        <strong className="text-gray-400">Pipeline first.</strong> The only metric that validates the business
        is conversations → meetings → quotes. If today's numbers are zero, fix that before anything else.
      </div>
    </div>);
}
//# sourceMappingURL=DailyActivityCommand.js.map