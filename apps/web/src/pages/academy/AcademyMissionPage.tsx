import { useEffect, useState } from 'react';
import { getStoredUser } from '../../auth';
import { getApiBaseUrl } from '../../services/apiBaseUrl';

// ─── Types ─────────────────────────────────────────────────────────

interface Mission {
  id: number;
  user_id: number;
  mission_number: number;
  title: string;
  description: string;
  status: 'locked' | 'available' | 'in_progress' | 'submitted' | 'approved' | 'rejected';
  started_at: string | null;
  submitted_at: string | null;
  completed_at: string | null;
  rejection_reason: string | null;
  latestReview?: DirectorReview | null;
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

interface MissionDefinition {
  mission_number: number;
  title: string;
  description: string;
  instructions: string;
  requiredActions: string[];
}

const MISSION_DEFS: MissionDefinition[] = [
  {
    mission_number: 1,
    title: 'Find 5 Schools',
    description: 'Research enrollment, sports, AD, coaches, existing provider. Create organizations.',
    instructions: `Research 5 high schools in your territory. For each school:
1. Find enrollment numbers
2. List all sports programs offered
3. Identify the Athletic Director
4. List head coaches (Football, Volleyball at minimum)
5. Identify their current uniform/apparel provider
6. Create the organization in TUF Ops with all details`,
    requiredActions: ['Create 5 organizations', 'Add enrollment data', 'Add sports programs', 'Note current provider'],
  },
  {
    mission_number: 2,
    title: 'Create Contacts',
    description: 'Create contacts (Principal, AD, Football Coach, Volleyball Coach, Activities Director) for each org.',
    instructions: `For each of your 5 organizations, create contacts:
• Principal
• Athletic Director
• Football Coach
• Volleyball Coach
• Activities Director

Add email, phone, and any notes from your research. These are real people at real schools.`,
    requiredActions: ['Create 15-20 contacts across 5 orgs', 'Add emails and phone numbers', 'Include role/title for each contact'],
  },
  {
    mission_number: 3,
    title: 'Create First Opportunity',
    description: 'Create first real opportunity with estimated value, close date, lane, stage.',
    instructions: `Create your first real opportunity. Select one of your organizations and one sport.

Required fields:
• Organization and sport
• Lane (Uniforms, Travel Gear, Team Store, Letterman)
• Stage (LEAD → LEAD_ENGAGED minimum)
• Estimated value
• Target close date
• Notes about the program's needs
• Next action with date`,
    requiredActions: ['Create 5 opportunities', 'Set estimated value on each', 'Set stage on each', 'Add notes on each', 'Set next action with date'],
  },
  {
    mission_number: 4,
    title: 'Schedule First Outreach',
    description: 'Schedule first outreach (phone/email/visit), log activity.',
    instructions: `Schedule and log your first outreach activities:
• Phone calls to your contacts
• Emails introducing TUF
• Planned school visits

Log every activity in TUF Ops. Each activity should include:
• Type (call, email, meeting, visit)
• Date/time
• Notes about the conversation or plan
• Linked to the correct opportunity or organization`,
    requiredActions: ['Log 15 activities', 'Include activity type and date', 'Link activities to orgs/opps', 'Add meaningful notes'],
  },
  {
    mission_number: 5,
    title: 'Director Review',
    description: 'Director reviews all work before advancing.',
    instructions: `Your Director will review your territory:
• All 5 organizations with complete details
• All contacts with roles and contact info
• All 5 opportunities with values, stages, and notes
• All 15 activities with dates and notes

Your Director must approve each component before you graduate.`,
    requiredActions: ['All orgs verified', 'All contacts verified', 'All opportunities verified', 'All activities verified', 'Director approval'],
  },
];

// ─── Component ─────────────────────────────────────────────────────

export default function AcademyMissionPage() {
  const user = getStoredUser();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [activeMission, setActiveMission] = useState<MissionDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const userId = user?.id ?? '';

  useEffect(() => {
    loadMissions();
  }, [userId]);

  const loadMissions = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const res = await fetch(`${getApiBaseUrl()}/academy/missions/reviews?userId=${userId}`);
      if (!res.ok) throw new Error('Failed to load missions');
      const data = await res.json();
      setMissions(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartMission = async (missionNumber: number) => {
    setSubmitting(missionNumber);
    try {
      const res = await fetch(`${getApiBaseUrl()}/academy/missions/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, missionNumber }),
      });
      if (!res.ok) throw new Error('Failed to start mission');
      await loadMissions();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(null);
    }
  };

  const handleSubmitMission = async (missionNumber: number) => {
    setSubmitting(missionNumber);
    try {
      const res = await fetch(`${getApiBaseUrl()}/academy/missions/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, missionNumber }),
      });
      if (!res.ok) throw new Error('Failed to submit mission');
      await loadMissions();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(null);
    }
  };

  const getMissionByNumber = (num: number) => missions.find((m) => m.mission_number === num);

  const statusConfig: Record<string, { bg: string; text: string; label: string; icon: string }> = {
    locked: { bg: 'bg-slate-800/50', text: 'text-slate-500', label: 'Locked', icon: '🔒' },
    available: { bg: 'bg-blue-400/10', text: 'text-blue-300', label: 'Available', icon: '🔓' },
    in_progress: { bg: 'bg-amber-400/10', text: 'text-amber-300', label: 'In Progress', icon: '⚡' },
    submitted: { bg: 'bg-purple-400/10', text: 'text-purple-300', label: 'Submitted for Review', icon: '📤' },
    approved: { bg: 'bg-emerald-400/10', text: 'text-emerald-300', label: 'Approved ✓', icon: '✅' },
    rejected: { bg: 'bg-red-400/10', text: 'text-red-300', label: 'Revisions Needed', icon: '↩️' },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-slate-400 animate-pulse">Loading missions...</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300 mb-2">Phase 3</p>
        <h1 className="text-3xl font-black text-white mb-2">Territory Development Missions</h1>
        <p className="text-slate-400 max-w-2xl">
          Complete each mission by performing real work in the live CRM. You will build your territory from scratch — creating organizations, contacts, opportunities, and logging activities.
        </p>
      </div>

      {/* Mission Grid */}
      <div className="grid gap-4">
        {MISSION_DEFS.map((def) => {
          const mission = getMissionByNumber(def.mission_number);
          const status = mission?.status || 'locked';
          const config = statusConfig[status];
          const review = (mission as any)?.latestReview;

          return (
            <div
              key={def.mission_number}
              className={`rounded-2xl border p-5 transition-all ${
                status === 'locked'
                  ? 'border-slate-800 bg-slate-950/30 opacity-60'
                  : status === 'approved'
                  ? 'border-emerald-400/20 bg-emerald-950/10'
                  : 'border-slate-700 bg-slate-950/50 hover:border-cyan-400/20'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-sm font-black text-slate-500">Mission {def.mission_number}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${config.bg} ${config.text}`}>
                      {config.icon} {config.label}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-white mb-1">{def.title}</h3>
                  <p className="text-sm text-slate-400 mb-3">{def.description}</p>

                  {/* Required Actions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                    {def.requiredActions.map((action, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="text-cyan-400">▸</span>
                        {action}
                      </div>
                    ))}
                  </div>

                  {/* Instructions (expandable) */}
                  {activeMission?.mission_number === def.mission_number && (
                    <div className="mt-3 rounded-lg border border-slate-700 bg-slate-900/40 p-4">
                      <p className="text-xs font-black uppercase tracking-wider text-cyan-300 mb-2">Instructions</p>
                      <p className="text-sm text-slate-300 whitespace-pre-line">{def.instructions}</p>
                    </div>
                  )}

                  {/* Review Feedback */}
                  {review && (
                    <div className={`mt-3 rounded-lg border p-3 ${
                      review.status === 'approved'
                        ? 'border-emerald-400/20 bg-emerald-400/5'
                        : 'border-red-400/20 bg-red-400/5'
                    }`}>
                      <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1">
                        Director Review — {review.status === 'approved' ? 'Approved ✓' : 'Revisions Needed'}
                      </p>
                      {review.strengths && (
                        <p className="text-xs text-slate-300 mt-1">
                          <span className="text-emerald-400 font-bold">Strengths: </span>
                          {review.strengths}
                        </p>
                      )}
                      {review.corrections && (
                        <p className="text-xs text-slate-300 mt-1">
                          <span className="text-amber-400 font-bold">Corrections: </span>
                          {review.corrections}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 shrink-0">
                  {status === 'available' && (
                    <button
                      onClick={() => handleStartMission(def.mission_number)}
                      disabled={submitting === def.mission_number}
                      className="rounded-lg border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 text-xs font-bold text-cyan-200 hover:bg-cyan-400/20 disabled:opacity-50 transition-colors whitespace-nowrap"
                    >
                      {submitting === def.mission_number ? 'Starting...' : 'Start Mission'}
                    </button>
                  )}
                  {status === 'in_progress' && (
                    <button
                      onClick={() => handleSubmitMission(def.mission_number)}
                      disabled={submitting === def.mission_number}
                      className="rounded-lg border border-purple-400/40 bg-purple-400/10 px-4 py-2 text-xs font-bold text-purple-200 hover:bg-purple-400/20 disabled:opacity-50 transition-colors whitespace-nowrap"
                    >
                      {submitting === def.mission_number ? 'Submitting...' : 'Submit for Review'}
                    </button>
                  )}
                  {status === 'rejected' && (
                    <button
                      onClick={() => handleStartMission(def.mission_number)}
                      disabled={submitting === def.mission_number}
                      className="rounded-lg border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-xs font-bold text-amber-200 hover:bg-amber-400/20 disabled:opacity-50 transition-colors whitespace-nowrap"
                    >
                      Retry Mission
                    </button>
                  )}
                  <button
                    onClick={() =>
                      setActiveMission(
                        activeMission?.mission_number === def.mission_number ? null : def
                      )
                    }
                    className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors whitespace-nowrap"
                  >
                    {activeMission?.mission_number === def.mission_number ? 'Hide Details' : 'View Details'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="mt-6 rounded-lg border border-red-400/20 bg-red-400/5 p-3">
          <p className="text-xs text-red-300">{error}</p>
        </div>
      )}

      {/* Philosophy Reminder */}
      <div className="mt-8 rounded-2xl border border-cyan-400/20 bg-gradient-to-r from-cyan-950/30 to-slate-950/30 p-6 text-center">
        <p className="text-sm font-black text-cyan-200 mb-1">Graduate with a pipeline, not a certificate.</p>
        <p className="text-xs text-slate-400">
          Every mission produces real CRM assets. By the time you graduate, you will have a working territory.
        </p>
      </div>
    </div>
  );
}
