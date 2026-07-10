import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCandidate, updateCandidate, getCandidateActivities, STAGES, STAGE_LABELS, STAGE_COLORS, type Candidate, type CandidateActivity } from '../services/recruitingService';

const SCORECARD_FIELDS = [
  { key: 'communication', label: 'Communication' },
  { key: 'coachability', label: 'Coachability' },
  { key: 'competitive_mindset', label: 'Competitive Mindset' },
  { key: 'availability', label: 'Availability' },
  { key: 'sales_experience', label: 'Sales Experience' },
  { key: 'athletics_background', label: 'Athletics Background' },
];

export default function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [activities, setActivities] = useState<CandidateActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [scorecard, setScorecard] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [c, a] = await Promise.all([getCandidate(Number(id)), getCandidateActivities(Number(id))]);
      setCandidate(c);
      setActivities(a);
      setScorecard(c.interview_scorecard || {});
      setNotes(c.notes || '');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const advanceStage = async (newStage: string) => {
    if (!candidate) return;
    setSaving(true);
    try {
      const updated = await updateCandidate(candidate.id, { stage: newStage } as any);
      setCandidate(updated);
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const saveScorecard = async () => {
    if (!candidate) return;
    setSaving(true);
    try {
      const updated = await updateCandidate(candidate.id, { interview_scorecard: scorecard } as any);
      setCandidate(updated);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const saveNotes = async () => {
    if (!candidate) return;
    setSaving(true);
    try {
      const updated = await updateCandidate(candidate.id, { notes } as any);
      setCandidate(updated);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-gray-400">Loading...</div>;
  if (!candidate) return <div className="p-8 text-red-400">Candidate not found.</div>;

  const currentStageIdx = STAGES.indexOf(candidate.stage as any);
  const nextStages = STAGES.slice(currentStageIdx + 1, currentStageIdx + 4);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button onClick={() => navigate('/recruiting')} className="text-gray-400 hover:text-white text-sm mb-4 block">
        ← Back to Pipeline
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{candidate.first_name} {candidate.last_name}</h1>
          <p className="text-gray-400">{candidate.email} {candidate.phone ? `· ${candidate.phone}` : ''}</p>
          <p className="text-gray-500 text-sm capitalize">Source: {candidate.source}</p>
        </div>
        <span className={`${STAGE_COLORS[candidate.stage] || 'bg-gray-600'} text-white text-sm px-4 py-1 rounded-full font-semibold`}>
          {STAGE_LABELS[candidate.stage] || candidate.stage}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Stage Advancement + Scorecard */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stage Advancement */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <h2 className="text-sm font-semibold text-gray-300 mb-3">Advance Stage</h2>
            <div className="flex flex-wrap gap-2">
              {nextStages.map(stage => (
                <button
                  key={stage}
                  onClick={() => advanceStage(stage)}
                  disabled={saving}
                  className={`${STAGE_COLORS[stage]} hover:opacity-80 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded font-medium`}
                >
                  → {STAGE_LABELS[stage]}
                </button>
              ))}
              {candidate.stage !== 'rejected' && (
                <button
                  onClick={() => advanceStage('rejected')}
                  disabled={saving}
                  className="bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded font-medium"
                >
                  ✕ Reject
                </button>
              )}
            </div>
            {nextStages.length === 0 && candidate.stage !== 'rejected' && candidate.stage !== 'active_tae' && (
              <p className="text-gray-500 text-xs mt-2">Final stage reached.</p>
            )}
          </div>

          {/* Interview Scorecard */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <h2 className="text-sm font-semibold text-gray-300 mb-3">Interview Scorecard</h2>
            <div className="space-y-3">
              {SCORECARD_FIELDS.map(({ key, label }) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-gray-400 text-sm w-40">{label}</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button
                        key={n}
                        onClick={() => setScorecard({ ...scorecard, [key]: n })}
                        className={`w-8 h-8 rounded text-sm font-bold ${
                          (scorecard[key] || 0) >= n
                            ? 'bg-yellow-500 text-black'
                            : 'bg-gray-700 text-gray-500'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={saveScorecard}
              disabled={saving}
              className="mt-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded"
            >
              Save Scorecard
            </button>
          </div>

          {/* Notes */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <h2 className="text-sm font-semibold text-gray-300 mb-3">Notes</h2>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={4}
              className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white text-sm"
              placeholder="Interview notes, observations, follow-up items..."
            />
            <button
              onClick={saveNotes}
              disabled={saving}
              className="mt-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded"
            >
              Save Notes
            </button>
          </div>
        </div>

        {/* Right: Resume + Activity Timeline */}
        <div className="space-y-6">
          {/* Resume */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <h2 className="text-sm font-semibold text-gray-300 mb-3">Resume</h2>
            {candidate.resume_url ? (
              <a href={candidate.resume_url} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline text-sm">
                View Resume →
              </a>
            ) : (
              <p className="text-gray-500 text-sm">No resume uploaded.</p>
            )}
          </div>

          {/* Activity Timeline */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <h2 className="text-sm font-semibold text-gray-300 mb-3">Activity Timeline</h2>
            <div className="space-y-3">
              {activities.map(a => (
                <div key={a.id} className="border-l-2 border-gray-700 pl-3">
                  <p className="text-gray-300 text-sm">{a.description || a.type}</p>
                  <p className="text-gray-600 text-xs mt-0.5">
                    {new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </p>
                </div>
              ))}
              {activities.length === 0 && (
                <p className="text-gray-500 text-sm">No activity yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
