import { useEffect, useState } from 'react';
import { getStoredUser } from '../../auth';
import { getApiBaseUrl } from '../../services/apiBaseUrl';

interface PendingMission {
  id: number;
  user_id: number;
  mission_number: number;
  title: string;
  description: string;
  status: string;
  started_at: string | null;
  submitted_at: string | null;
  latestReview: DirectorReview | null;
}

interface DirectorReview {
  id: number;
  mission_id: number;
  reviewer_id: number;
  status: 'pending' | 'approved' | 'rejected';
  strengths: string;
  corrections: string;
  coaching_notes: string;
  reviewed_at: string;
}

export default function AcademyDirectorReview() {
  const user = getStoredUser();
  const [pending, setPending] = useState<PendingMission[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingMission, setReviewingMission] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Review form state
  const [strengths, setStrengths] = useState('');
  const [corrections, setCorrections] = useState('');
  const [coachingNotes, setCoachingNotes] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    loadPending();
  }, []);

  const loadPending = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${getApiBaseUrl()}/academy/reviews/pending`);
      if (!res.ok) throw new Error('Failed to load pending reviews');
      const data = await res.json();
      setPending(data);
    } catch (e) {
      console.error('Failed to load pending reviews:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (missionId: number) => {
    if (!user) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/academy/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          missionId,
          reviewerId: user.id,
          status: 'approved',
          strengths,
          corrections,
          coachingNotes,
        }),
      });
      if (!res.ok) throw new Error('Failed to submit review');
      setFeedback('Mission approved successfully!');
      setReviewingMission(null);
      resetForm();
      await loadPending();
    } catch (e: any) {
      setFeedback(`Error: ${e.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (missionId: number) => {
    if (!user) return;
    if (!corrections.trim()) {
      setFeedback('Please provide corrections when rejecting a mission.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/academy/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          missionId,
          reviewerId: user.id,
          status: 'rejected',
          strengths,
          corrections,
          coachingNotes,
        }),
      });
      if (!res.ok) throw new Error('Failed to submit review');
      setFeedback('Mission rejected. TAE will be notified to make corrections.');
      setReviewingMission(null);
      resetForm();
      await loadPending();
    } catch (e: any) {
      setFeedback(`Error: ${e.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const startReview = (missionId: number) => {
    setReviewingMission(missionId);
    setStrengths('');
    setCorrections('');
    setCoachingNotes('');
    setFeedback(null);
  };

  const resetForm = () => {
    setStrengths('');
    setCorrections('');
    setCoachingNotes('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-slate-400 animate-pulse">Loading pending reviews...</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-purple-300 mb-2">Director Dashboard</p>
        <h1 className="text-3xl font-black text-white mb-2">TAE Mission Reviews</h1>
        <p className="text-slate-400 max-w-2xl">
          Review submitted missions from your TAEs. Each mission represents real CRM work — organizations, contacts, opportunities, and activities that need your approval before the TAE can advance.
        </p>
        <div className="mt-3 rounded-lg border border-purple-400/20 bg-purple-400/5 p-3 inline-block">
          <p className="text-xs text-purple-200">
            <span className="font-black">{pending.length}</span> pending review{pending.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Pending Missions */}
      {pending.length === 0 ? (
        <div className="rounded-2xl border border-slate-700 bg-slate-950/50 p-8 text-center">
          <p className="text-lg font-black text-slate-300 mb-2">No Pending Reviews</p>
          <p className="text-sm text-slate-500">All missions have been reviewed. Check back when TAEs submit new work.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {pending.map((mission) => (
            <div
              key={mission.id}
              className="rounded-2xl border border-slate-700 bg-slate-950/50 p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-sm font-black text-slate-500">Mission {mission.mission_number}</span>
                    <span className="rounded-full bg-purple-400/10 px-2.5 py-0.5 text-xs font-bold text-purple-300">
                      Pending Review
                    </span>
                    {mission.submitted_at && (
                      <span className="text-xs text-slate-500">
                        Submitted {new Date(mission.submitted_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-black text-white mb-1">{mission.title}</h3>
                  <p className="text-sm text-slate-400">{mission.description}</p>
                </div>
                <button
                  onClick={() => startReview(mission.id)}
                  className="rounded-lg border border-purple-400/40 bg-purple-400/10 px-4 py-2 text-xs font-bold text-purple-200 hover:bg-purple-400/20 transition-colors shrink-0"
                >
                  {reviewingMission === mission.id ? 'Reviewing...' : 'Review'}
                </button>
              </div>

              {/* Review Form */}
              {reviewingMission === mission.id && (
                <div className="mt-5 rounded-xl border border-purple-400/20 bg-slate-900/40 p-5">
                  <h3 className="text-sm font-black text-purple-200 mb-4">Director Review — {mission.title}</h3>

                  {/* Strengths */}
                  <div className="mb-4">
                    <label className="block text-xs font-black uppercase tracking-wider text-emerald-300 mb-2">
                      Strengths — What did the TAE do well?
                    </label>
                    <textarea
                      value={strengths}
                      onChange={(e) => setStrengths(e.target.value)}
                      placeholder="E.g., 'All 5 organizations have complete details with enrollment numbers and sports programs listed...'"
                      rows={3}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950/60 p-3 text-sm text-slate-200 placeholder-slate-600 focus:border-emerald-400/40 focus:outline-none resize-vertical"
                    />
                  </div>

                  {/* Corrections */}
                  <div className="mb-4">
                    <label className="block text-xs font-black uppercase tracking-wider text-amber-300 mb-2">
                      Corrections — What must change?
                    </label>
                    <textarea
                      value={corrections}
                      onChange={(e) => setCorrections(e.target.value)}
                      placeholder="E.g., 'Mission 3 organizations are missing the Activities Director contact. Add that before resubmitting...'"
                      rows={3}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950/60 p-3 text-sm text-slate-200 placeholder-slate-600 focus:border-amber-400/40 focus:outline-none resize-vertical"
                    />
                  </div>

                  {/* Coaching Notes */}
                  <div className="mb-4">
                    <label className="block text-xs font-black uppercase tracking-wider text-cyan-300 mb-2">
                      Coaching Notes — Big-picture guidance
                    </label>
                    <textarea
                      value={coachingNotes}
                      onChange={(e) => setCoachingNotes(e.target.value)}
                      placeholder="E.g., 'Great start on territory building. Focus next on getting coach phone numbers for warmer outreach...'"
                      rows={3}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950/60 p-3 text-sm text-slate-200 placeholder-slate-600 focus:border-cyan-400/40 focus:outline-none resize-vertical"
                    />
                  </div>

                  {/* Feedback */}
                  {feedback && (
                    <div className={`mb-4 rounded-lg border p-3 text-xs ${
                      feedback.startsWith('Error')
                        ? 'border-red-400/20 bg-red-400/5 text-red-300'
                        : 'border-emerald-400/20 bg-emerald-400/5 text-emerald-300'
                    }`}>
                      {feedback}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(mission.id)}
                      disabled={submitting}
                      className="rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-5 py-2.5 text-sm font-bold text-emerald-200 hover:bg-emerald-400/20 disabled:opacity-50 transition-colors"
                    >
                      {submitting ? 'Submitting...' : '✓ Approve'}
                    </button>
                    <button
                      onClick={() => handleReject(mission.id)}
                      disabled={submitting}
                      className="rounded-lg border border-red-400/40 bg-red-400/10 px-5 py-2.5 text-sm font-bold text-red-200 hover:bg-red-400/20 disabled:opacity-50 transition-colors"
                    >
                      {submitting ? 'Submitting...' : '✗ Reject — Needs Corrections'}
                    </button>
                    <button
                      onClick={() => setReviewingMission(null)}
                      className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Philosophy */}
      <div className="mt-8 rounded-2xl border border-purple-400/20 bg-gradient-to-r from-purple-950/30 to-slate-950/30 p-6 text-center">
        <p className="text-sm font-black text-purple-200 mb-1">The Director QA Question</p>
        <p className="text-xs text-slate-400">
          "Would I trust this TAE with one of our schools?" If the answer is no, do not sign off. Send them back with a specific correction and a specific next step.
        </p>
      </div>
    </div>
  );
}
