import { useEffect, useState } from 'react';
import { getStoredUser } from '../../auth';
import { getApiBaseUrl } from '../../services/apiBaseUrl';

interface AcademyProgress {
  progress: {
    id: number;
    user_id: number;
    phase1_completed: boolean;
    phase2_completed: boolean;
    phase3_completed: boolean;
    graduated: boolean;
    director_approved: boolean;
    approved_by: number | null;
    approved_at: string | null;
    started_at: string;
    completed_at: string | null;
    updated_at: string;
  } | null;
  missions: Array<{
    id: number;
    mission_number: number;
    title: string;
    status: string;
    started_at: string | null;
    submitted_at: string | null;
  }>;
  checklist: {
    orgs_created: number;
    orgs_required: number;
    contacts_added: number;
    contacts_required: number;
    opportunities_created: number;
    opportunities_required: number;
    activities_logged: number;
    activities_required: number;
    all_opps_have_details: boolean;
    territory_approved: boolean;
  } | null;
  graduationReady: boolean;
  missingRequirements: string[];
}

export default function AcademyProgressPage() {
  const user = getStoredUser();
  const [data, setData] = useState<AcademyProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const userId = user?.id ?? '';

  useEffect(() => {
    loadProgress();
  }, [userId]);

  const loadProgress = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const res = await fetch(`${getApiBaseUrl()}/academy/progress?userId=${userId}`);
      if (!res.ok) throw new Error('Failed to load progress');
      const data = await res.json();
      setData(data);
    } catch (e) {
      console.error('Failed to load academy progress:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await fetch(`${getApiBaseUrl()}/academy/checklist/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      await loadProgress();
    } catch (e) {
      console.error('Sync failed:', e);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-slate-400 animate-pulse">Loading progress...</div>
      </div>
    );
  }

  const checklist = data?.checklist;

  const phaseConfig = [
    {
      label: 'Phase 1 — Foundations',
      description: 'Quizzes on TUF, products, sales philosophy, territory model',
      completed: data?.progress?.phase1_completed || false,
      icon: '📚',
    },
    {
      label: 'Phase 2 — CRM Orientation',
      description: 'Interactive walkthrough of the live CRM',
      completed: data?.progress?.phase2_completed || false,
      icon: '🖥️',
    },
    {
      label: 'Phase 3 — Territory Development',
      description: 'Build real territory with orgs, contacts, opps, activities',
      completed: data?.progress?.phase3_completed || false,
      icon: '🏗️',
    },
  ];

  const progressPercent = data?.progress
    ? ((data.progress.phase1_completed ? 33 : 0) +
       (data.progress.phase2_completed ? 33 : 0) +
       (data.progress.phase3_completed ? 34 : 0))
    : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300 mb-2">Academy Progress</p>
            <h1 className="text-3xl font-black text-white mb-2">Your Certification Journey</h1>
            <p className="text-slate-400 max-w-2xl">
              Track your progress through all three phases. Graduate with a pipeline, not a certificate.
            </p>
          </div>
          {data?.progress?.graduated && (
            <div className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-5 py-2 shrink-0">
              <span className="text-sm font-black text-emerald-300">🎓 Graduated</span>
            </div>
          )}
        </div>
      </div>

      {/* Overall Progress Bar */}
      <div className="mb-8 rounded-2xl border border-slate-700 bg-slate-950/50 p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-black text-white">Overall Progress</span>
          <span className="text-sm font-bold text-cyan-300">{progressPercent}%</span>
        </div>
        <div className="h-3 rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Phase Cards */}
      <div className="grid gap-4 mb-8">
        {phaseConfig.map((phase, i) => (
          <div
            key={i}
            className={`rounded-2xl border p-5 ${
              phase.completed
                ? 'border-emerald-400/20 bg-emerald-950/10'
                : 'border-slate-700 bg-slate-950/50'
            }`}
          >
            <div className="flex items-center gap-4">
              <span className="text-2xl">{phase.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-black text-white">{phase.label}</h3>
                  {phase.completed && (
                    <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-xs font-bold text-emerald-300">
                      ✓ Complete
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-400 mt-0.5">{phase.description}</p>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                phase.completed
                  ? 'border-emerald-400 bg-emerald-400'
                  : 'border-slate-600'
              }`}>
                {phase.completed && <span className="text-xs text-slate-950 font-black">✓</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Graduation Checklist */}
      {checklist && (
        <div className="mb-8 rounded-2xl border border-slate-700 bg-slate-950/50 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-white">Graduation Requirements</h2>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="rounded-lg border border-cyan-400/40 bg-cyan-400/10 px-3 py-1.5 text-xs font-bold text-cyan-200 hover:bg-cyan-400/20 disabled:opacity-50 transition-colors"
            >
              {syncing ? 'Syncing...' : 'Sync CRM Data'}
            </button>
          </div>

          {/* Requirement Bars */}
          <div className="space-y-4">
            <RequirementBar
              label="Organizations Created"
              current={checklist.orgs_created}
              required={checklist.orgs_required}
            />
            <RequirementBar
              label="Contacts Added"
              current={checklist.contacts_added}
              required={checklist.contacts_required}
            />
            <RequirementBar
              label="Opportunities Created"
              current={checklist.opportunities_created}
              required={checklist.opportunities_required}
            />
            <RequirementBar
              label="Activities Logged"
              current={checklist.activities_logged}
              required={checklist.activities_required}
            />
            <CheckItem label="Every opportunity has estimated value, stage, next action, and notes" met={checklist.all_opps_have_details} />
            <CheckItem label="Territory approved by Director" met={checklist.territory_approved} />
          </div>

          {/* Graduation Status */}
          <div className={`mt-5 rounded-lg border p-4 ${
            data?.graduationReady
              ? 'border-emerald-400/20 bg-emerald-400/5'
              : 'border-amber-400/20 bg-amber-400/5'
          }`}>
            <p className={`text-sm font-black ${data?.graduationReady ? 'text-emerald-300' : 'text-amber-300'}`}>
              {data?.graduationReady ? '🎓 Ready to Graduate!' : 'Still working toward graduation'}
            </p>
            {data?.missingRequirements && data.missingRequirements.length > 0 && (
              <ul className="mt-2 space-y-1">
                {data.missingRequirements.map((req, i) => (
                  <li key={i} className="text-xs text-slate-400 flex items-center gap-2">
                    <span className="text-amber-400">▸</span> {req}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Timeline */}
      {data?.progress && (
        <div className="rounded-2xl border border-slate-700 bg-slate-950/50 p-5">
          <h2 className="text-lg font-black text-white mb-3">Timeline</h2>
          <div className="space-y-2 text-sm">
            <TimelineItem
              label="Started Academy"
              date={data.progress.started_at}
              icon="🚀"
            />
            {data.progress.phase1_completed && (
              <TimelineItem label="Phase 1 Complete" date={data.progress.updated_at} icon="📚" />
            )}
            {data.progress.phase2_completed && (
              <TimelineItem label="Phase 2 Complete" date={data.progress.updated_at} icon="🖥️" />
            )}
            {data.progress.director_approved && (
              <TimelineItem label="Director Approved" date={data.progress.approved_at} icon="✅" />
            )}
            {data.progress.graduated && (
              <TimelineItem label="Graduated" date={data.progress.completed_at} icon="🎓" />
            )}
          </div>
        </div>
      )}

      {/* Philosophy */}
      <div className="mt-8 rounded-2xl border border-cyan-400/20 bg-gradient-to-r from-cyan-950/30 to-slate-950/30 p-6 text-center">
        <p className="text-sm font-black text-cyan-200 mb-1">Learn → Build → Review → Correct → Continue</p>
        <p className="text-xs text-slate-400">
          Every lesson requires immediate action in the live CRM. Your certification proves you can operate — not just answer questions.
        </p>
      </div>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────

function RequirementBar({ label, current, required }: { label: string; current: number; required: number }) {
  const pct = Math.min(100, Math.round((current / required) * 100));
  const met = current >= required;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-slate-300">{label}</span>
        <span className={`text-xs font-bold ${met ? 'text-emerald-400' : 'text-slate-400'}`}>
          {current} / {required} {met && '✓'}
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${met ? 'bg-emerald-400' : 'bg-cyan-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function CheckItem({ label, met }: { label: string; met: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
        met ? 'border-emerald-400 bg-emerald-400' : 'border-slate-600'
      }`}>
        {met && <span className="text-xs text-slate-950 font-black">✓</span>}
      </div>
      <span className="text-sm text-slate-300">{label}</span>
    </div>
  );
}

function TimelineItem({ label, date, icon }: { label: string; date: string | null; icon: string }) {
  const formattedDate = date ? new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }) : '—';

  return (
    <div className="flex items-center gap-3">
      <span className="text-lg">{icon}</span>
      <span className="text-slate-300 font-medium">{label}</span>
      <span className="text-slate-500 text-xs">{formattedDate}</span>
    </div>
  );
}
