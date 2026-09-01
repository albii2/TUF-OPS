import { useEffect, useState, useCallback, useMemo } from 'react';
import { getStoredUser } from '../auth';
import { apiClient } from '../services/apiClient';
import type { AppUser } from '../types';
import TufAcademyLogo from '../assets/tuf-academy.png';

// ─── Types ──────────────────────────────────────────────────────────────────

type ParticipantStatus =
  | 'ON_TRACK'
  | 'NEEDS_ATTENTION'
  | 'STALLED'
  | 'AWAITING_REVIEW'
  | 'ACADEMY_COMPLETE'
  | 'CERTIFIED';

interface ParticipantSummary {
  userId: number;
  name: string;
  email: string;
  role: string;
  territory: string | null;
  cohort: string | null;
  enrollmentDate: string | null;
  currentPhase: string;
  currentModule: string | null;
  completionPercent: number;
  academyStatus: ParticipantStatus;
  lastLogin: string | null;
  loginCount: number;
  lastAcademyActivity: string | null;
  lastSalesActivity: string | null;
  daysSinceMeaningfulActivity: number;
  knowledgeProgress: number;
  productionProgress: number;
  prospectsCreated: number;
  outreachAttempts: number;
  meetings: number;
  opportunities: number;
  orders: number;
  pipelineValue: number;
  certificationStatus: string;
  isCertified: boolean;
  certifiedAt: string | null;
  // ── Personnel state machine (Sept 2026 directive) ──
  activationStatus: string;
  ndaCompleted: boolean;
  enrollment: { cohort: string | null; date: string | null };
  modulesCompleted: number;
  modulesTotal: number;
  moduleCompletionPercent: number;
  quizScores: Array<{ quiz_id: string; score: number; passed: boolean; attempted_at: string }>;
  fieldReady: boolean;
  accountsAssigned: number;
  launchClusters: string[];
  currentCampaign: string;
  attentionFlags: string[];
}

interface ParticipantDetail extends ParticipantSummary {
  stateMarket: string | null;
  division: string | null;
  rank: string | null;
  phaseProgress: Record<string, { completed: number; total: number }>;
  quizResults: Array<{
    module: string;
    score: number;
    passed: boolean;
    attempts: number;
    lastAttempt: string | null;
  }>;
  coachReviews: Array<{ module: string; reviewedBy: string; reviewedAt: string | null }>;
  acknowledgments: number;
  recentActivity: Array<{
    id: number;
    user_id: number;
    event_type: string;
    entity_type: string | null;
    created_at: string;
  }>;
  organizationsCount: number;
  opportunitiesByStage: Record<string, number>;
  activitiesByType: Record<string, number>;
  hrDocsCompleted: boolean;
  directorSignedOff: boolean;
  practicalExerciseCompleted: boolean;
  certificationDate: string | null;
  attentionFlags: string[];
}

interface CohortStats {
  totalEnrolled: number;
  activeThisWeek: number;
  stalled: number;
  academyComplete: number;
  certificationPending: number;
  certified: number;
}

interface ActivityEvent {
  id: number;
  userName: string;
  eventType: string;
  description: string;
  timestamp: string;
}

interface ExecutiveSummary {
  activeCohort: CohortStats;
  averageCohortProgress: number;
  totalProspectingActivity: number;
  meetingsGenerated: number;
  qualifiedOpportunitiesCreated: number;
  ordersGenerated: number;
  participants: ParticipantSummary[];
  attentionRequired: ParticipantSummary[];
  recentActivity: ActivityEvent[];
}

// ─── Status Badge ───────────────────────────────────────────────────────────

const STATUS_STYLES: Record<ParticipantStatus, string> = {
  ON_TRACK: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  NEEDS_ATTENTION: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  STALLED: 'bg-red-500/10 text-red-300 border-red-500/20',
  AWAITING_REVIEW: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
  ACADEMY_COMPLETE: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
  CERTIFIED: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
};

const STATUS_LABELS: Record<ParticipantStatus, string> = {
  ON_TRACK: 'ON TRACK',
  NEEDS_ATTENTION: 'NEEDS ATTENTION',
  STALLED: 'STALLED',
  AWAITING_REVIEW: 'AWAITING REVIEW',
  ACADEMY_COMPLETE: 'ACADEMY COMPLETE',
  CERTIFIED: 'CERTIFIED',
};

function StatusBadge({ status }: { status: ParticipantStatus }) {
  return (
    <span
      className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
        STATUS_STYLES[status] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'
      }`}
    >
      {STATUS_LABELS[status] || status}
    </span>
  );
}

// ─── Activation Status Badge (personnel state machine) ─────────────────────

const ACTIVATION_STYLES: Record<string, string> = {
  ACTIVE: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  ACTIVATION_PENDING: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  CERTIFICATION_COMPLETE: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
  FIELD_READY: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
  INACTIVE: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  CLOSED: 'bg-red-500/10 text-red-300 border-red-500/20',
};

function ActivationBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
        ACTIVATION_STYLES[status] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'
      }`}
    >
      {status?.replace(/_/g, ' ') || 'UNKNOWN'}
    </span>
  );
}

// ─── Attention Flags ────────────────────────────────────────────────────────

const FLAG_STYLES: Record<string, string> = {
  ACTIVATED_NOT_STARTED: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  NO_ACTIVITY_72H: 'bg-orange-500/10 text-orange-300 border-orange-500/30',
  FAILED_MODULE_RETRY: 'bg-red-500/10 text-red-300 border-red-500/30',
  OVER_7D_INCOMPLETE: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
  CERT_PENDING_APPROVAL: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
};

const FLAG_LABELS: Record<string, string> = {
  ACTIVATED_NOT_STARTED: 'Activated, not started',
  NO_ACTIVITY_72H: 'No activity 72h+',
  FAILED_MODULE_RETRY: 'Failed module',
  OVER_7D_INCOMPLETE: '7d+ incomplete',
  CERT_PENDING_APPROVAL: 'Cert pending approval',
};

function FlagTag({ flag }: { flag: string }) {
  return (
    <span
      className={`inline-block rounded border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${
        FLAG_STYLES[flag] || 'bg-slate-500/10 text-slate-400 border-slate-500/30'
      }`}
      title={flag}
    >
      {FLAG_LABELS[flag] || flag}
    </span>
  );
}

// ─── Progress Bar ───────────────────────────────────────────────────────────

function ProgressBar({ value, color = 'cyan' }: { value: number; color?: string }) {
  const pct = Math.min(100, Math.max(0, value));
  const colors: Record<string, string> = {
    cyan: 'bg-cyan-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    purple: 'bg-purple-500',
  };
  return (
    <div className="h-1.5 w-full rounded-full bg-slate-700/50 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${colors[color] || 'bg-cyan-500'}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ─── Number Metric ──────────────────────────────────────────────────────────

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-slate-700/50 bg-[#0b1118] p-3 text-center">
      <div className="text-lg font-black text-white">{value}</div>
      <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
        {label}
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function AcademyCommandPage() {
  const [user, setUser] = useState<AppUser | null>(() => getStoredUser());
  const [data, setData] = useState<ExecutiveSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [detail, setDetail] = useState<ParticipantDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activityFilter, setActivityFilter] = useState<string>('all');
  const [attentionFilter, setAttentionFilter] = useState<'all' | 'attention'>('all');

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      const result = await apiClient<ExecutiveSummary>('/academy/executive-summary');
      setData(result);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load Academy Command');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    if (selectedUserId) {
      setDetailLoading(true);
      apiClient<ParticipantDetail>(`/academy/participants/${selectedUserId}`)
        .then(setDetail)
        .catch(() => setDetail(null))
        .finally(() => setDetailLoading(false));
    }
  }, [selectedUserId]);

  // Hooks must be unconditional — computed before any early return below
  const roster = data?.participants ?? [];
  const visibleParticipants = useMemo(() => {
    const sorted = [...roster].sort((a, b) => {
      const statusOrder: Record<string, number> = {
        STALLED: 0,
        NEEDS_ATTENTION: 1,
        AWAITING_REVIEW: 2,
        ON_TRACK: 3,
        ACADEMY_COMPLETE: 4,
        CERTIFIED: 5,
      };
      return (statusOrder[a.academyStatus] ?? 9) - (statusOrder[b.academyStatus] ?? 9);
    });
    if (attentionFilter === 'attention') {
      return sorted.filter((p) => (p.attentionFlags?.length ?? 0) > 0);
    }
    return sorted;
  }, [roster, attentionFilter]);
  const flaggedCount = roster.filter((p) => (p.attentionFlags?.length ?? 0) > 0).length;
  const fieldReadyCount = roster.filter((p) => p.fieldReady).length;

  // ─── Not Leadership → redirect ─────────────────────────────────────────
  if (user && !['ADMIN', 'REGIONAL_DIRECTOR', 'DIRECTOR'].includes(user.role)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-8 text-center">
          <p className="text-red-300 font-bold">Access Restricted</p>
          <p className="text-slate-400 text-sm mt-2">Academy Command is for leadership only.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        {/* Header with logo */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-white">Academy Command</h1>
            <p className="text-xs text-slate-400 mt-0.5">Executive visibility over TUF Academy</p>
          </div>
        </div>
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-6 text-center">
          <p className="text-red-300">{error}</p>
          <button
            onClick={fetchSummary}
            className="mt-3 rounded border border-red-500/30 px-4 py-1.5 text-xs text-red-300 hover:bg-red-500/10 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { activeCohort, attentionRequired, recentActivity } = data;

  // Filter activities
  const filteredActivity = activityFilter === 'all'
    ? recentActivity
    : recentActivity.filter((a) => {
        if (activityFilter === 'academy')
          return ['QUIZ_PASSED', 'QUIZ_FAILED', 'MODULE_OPENED', 'MODULE_ACKNOWLEDGED', 'MISSION_STATEMENT_SAVED'].includes(a.eventType);
        if (activityFilter === 'pipeline')
          return a.description.includes('opportunity') || a.description.includes('meeting');
        return a.eventType.toLowerCase().includes(activityFilter);
      });

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-white">Academy Command</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {activeCohort.totalEnrolled} enrolled · {activeCohort.certified} certified · {fieldReadyCount} field ready
          </p>
        </div>
        <button
          onClick={fetchSummary}
          className="self-start rounded border border-slate-600 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-800 transition"
        >
          Refresh
        </button>
      </div>

      {/* ── Current Campaign ── */}
      {data.participants[0]?.currentCampaign && (
        <div className="flex items-center gap-2 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-4 py-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">Campaign</span>
          <span className="text-xs text-slate-200">{data.participants[0].currentCampaign}</span>
        </div>
      )}

      {/* ── Attention Required ── */}
      {attentionRequired.length > 0 && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <h2 className="text-sm font-bold text-red-300 mb-3 flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            ATTENTION REQUIRED
            <span className="text-xs font-normal text-red-400">({attentionRequired.length})</span>
          </h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {attentionRequired.map((p) => (
              <button
                key={p.userId}
                onClick={() => setSelectedUserId(p.userId)}
                className="flex items-center justify-between rounded-lg border border-red-500/10 bg-[#0b1118] p-3 text-left hover:bg-red-500/5 transition"
              >
                <div>
                  <div className="text-sm font-semibold text-white">{p.name}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {p.academyStatus === 'STALLED'
                      ? `${p.daysSinceMeaningfulActivity} days inactive`
                      : p.academyStatus === 'AWAITING_REVIEW'
                      ? 'Waiting for review'
                      : 'Needs attention'}
                  </div>
                </div>
                <StatusBadge status={p.academyStatus} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Cohort Stats Bar ── */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        <Metric label="Enrolled" value={activeCohort.totalEnrolled} />
        <Metric label="Active Week" value={activeCohort.activeThisWeek} />
        <Metric label="Stalled" value={activeCohort.stalled} />
        <Metric label="Complete" value={activeCohort.academyComplete} />
        <Metric label="Pending Cert" value={activeCohort.certificationPending} />
        <Metric label="Certified" value={activeCohort.certified} />
      </div>

      {/* ── Cohort Activity Bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <Metric label="Avg Progress" value={`${data.averageCohortProgress}%`} />
        <Metric label="Prospecting" value={data.totalProspectingActivity} />
        <Metric label="Meetings" value={data.meetingsGenerated} />
        <Metric label="Opportunities" value={data.qualifiedOpportunitiesCreated} />
        <Metric label="Orders" value={data.ordersGenerated} />
      </div>

      {/* ── Two Column Layout ── */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* ── Left: Participant Roster ── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
              Participant Roster
              {attentionFilter === 'attention' && (
                <span className="ml-2 text-amber-400 normal-case">({visibleParticipants.length} flagged)</span>
              )}
            </h2>
            <select
              value={attentionFilter}
              onChange={(e) => setAttentionFilter(e.target.value as 'all' | 'attention')}
              className="rounded border border-slate-700 bg-[#050b12] px-2 py-1 text-[10px] text-slate-400"
            >
              <option value="all">All ({roster.length})</option>
              <option value="attention">⚠ Attention ({flaggedCount})</option>
            </select>
          </div>

          {/* Mobile: card view */}
          <div className="block lg:hidden space-y-3">
            {visibleParticipants.map((p) => (
              <button
                key={p.userId}
                onClick={() => setSelectedUserId(p.userId)}
                className={`w-full rounded-xl border p-4 text-left transition ${
                  selectedUserId === p.userId
                    ? 'border-cyan-500/40 bg-cyan-500/5'
                    : 'border-slate-700/50 bg-[#0b1118] hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold text-white text-sm">{p.name}</div>
                  <div className="flex items-center gap-1.5">
                    <ActivationBadge status={p.activationStatus} />
                    {p.fieldReady && (
                      <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-300">
                        FIELD READY
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <StatusBadge status={p.academyStatus} />
                  <span className="text-[10px] text-slate-500">
                    {p.ndaCompleted ? (
                      <span className="text-emerald-300">NDA ✓</span>
                    ) : (
                      <span className="text-slate-600">NDA —</span>
                    )}
                    {' · '}
                    Modules {p.modulesCompleted}/{p.modulesTotal} ({p.moduleCompletionPercent}%)
                  </span>
                </div>
                {p.attentionFlags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {p.attentionFlags.map((flag, i) => (
                      <FlagTag key={i} flag={flag} />
                    ))}
                  </div>
                )}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-500">Knowledge</span>
                    <span className="text-slate-300">{p.knowledgeProgress}%</span>
                  </div>
                  <ProgressBar value={p.knowledgeProgress} color="cyan" />
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-500">Production</span>
                    <span className="text-slate-300">{p.productionProgress}%</span>
                  </div>
                  <ProgressBar value={p.productionProgress} color="emerald" />
                </div>
                <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-500">
                  <span>{p.accountsAssigned} accounts</span>
                  <span>{p.meetings} meetings</span>
                  <span>{p.opportunities} opps</span>
                  <span>{p.orders} orders</span>
                </div>
                {p.launchClusters.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2 text-[9px] text-slate-500">
                    {p.launchClusters.map((c) => (
                      <span key={c} className="rounded border border-slate-700 px-1.5 py-0.5">
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Desktop: table view */}
          <div className="hidden lg:block overflow-x-auto rounded-xl border border-slate-700/50">
            <table className="w-full text-xs">
              <thead className="bg-[#0b1118] border-b border-slate-700/50">
                <tr className="text-left text-slate-400 font-medium">
                  <th className="p-3">Participant</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Activation</th>
                  <th className="p-3">NDA</th>
                  <th className="p-3">Modules</th>
                  <th className="p-3">Flags</th>
                  <th className="p-3">Accounts</th>
                  <th className="p-3">Meetings</th>
                  <th className="p-3">Opps</th>
                  <th className="p-3">Orders</th>
                  <th className="p-3">Last Active</th>
                </tr>
              </thead>
              <tbody>
                {visibleParticipants.map((p) => (
                  <tr
                    key={p.userId}
                    onClick={() => setSelectedUserId(p.userId)}
                    className={`border-b border-slate-800 cursor-pointer transition hover:bg-slate-800/50 ${
                      selectedUserId === p.userId ? 'bg-cyan-500/5' : ''
                    }`}
                  >
                    <td className="p-3">
                      <div className="font-semibold text-white">{p.name}</div>
                      <div className="text-slate-500 text-[10px]">
                        {p.territory || 'No territory'} · {p.cohort || 'No cohort'}
                      </div>
                    </td>
                    <td className="p-3">
                      <StatusBadge status={p.academyStatus} />
                      {p.fieldReady && (
                        <div className="mt-1">
                          <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-1.5 py-0.5 text-[9px] font-bold text-purple-300">
                            FIELD READY
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <ActivationBadge status={p.activationStatus} />
                    </td>
                    <td className="p-3">
                      {p.ndaCompleted ? (
                        <span className="text-emerald-300 font-bold">✓</span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="p-3">
                      <details className="group">
                        <summary className="cursor-pointer list-none text-slate-300">
                          {p.modulesCompleted}/{p.modulesTotal}{' '}
                          <span className="text-slate-500">({p.moduleCompletionPercent}%)</span>
                          {p.quizScores.length > 0 && (
                            <span className="ml-1 text-cyan-400 group-open:hidden">▸</span>
                          )}
                        </summary>
                        {p.quizScores.length > 0 && (
                          <div className="mt-1 space-y-0.5 max-w-[220px]">
                            {p.quizScores.map((q, i) => (
                              <div key={i} className="flex items-center justify-between gap-2 text-[9px]">
                                <span className="truncate text-slate-500">{q.quiz_id}</span>
                                <span className={q.passed ? 'text-emerald-300' : 'text-red-300'}>
                                  {q.score}%{q.passed ? '' : ' ✗'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </details>
                    </td>
                    <td className="p-3">
                      {p.attentionFlags.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-[180px]">
                          {p.attentionFlags.map((flag, i) => (
                            <FlagTag key={i} flag={flag} />
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="p-3 text-slate-300">{p.accountsAssigned}</td>
                    <td className="p-3 text-slate-300">{p.meetings}</td>
                    <td className="p-3 text-slate-300">{p.opportunities}</td>
                    <td className="p-3 text-slate-300">{p.orders}</td>
                    <td className="p-3 text-slate-500">
                      {p.daysSinceMeaningfulActivity <= 0
                        ? 'Today'
                        : `${p.daysSinceMeaningfulActivity}d ago`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Right: Activity Feed + Detail Panel ── */}
        <div className="space-y-4">
          {/* Activity Feed */}
          <div className="rounded-xl border border-slate-700/50 bg-[#0b1118] p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Recent Activity
              </h3>
              <select
                value={activityFilter}
                onChange={(e) => setActivityFilter(e.target.value)}
                className="rounded border border-slate-700 bg-[#050b12] px-2 py-1 text-[10px] text-slate-400"
              >
                <option value="all">All</option>
                <option value="academy">Academy</option>
                <option value="pipeline">Pipeline</option>
                <option value="meetings">Meetings</option>
                <option value="orders">Orders</option>
              </select>
            </div>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {filteredActivity.length === 0 ? (
                <p className="text-[10px] text-slate-500 text-center py-4">
                  No activity yet. Events will appear as reps use the Academy.
                </p>
              ) : (
                filteredActivity.slice(0, 20).map((a) => (
                  <div
                    key={a.id}
                    className="flex items-start gap-2 rounded border border-slate-800 bg-[#050b12] p-2"
                  >
                    <div className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-500" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-semibold text-white">{a.userName}</span>
                        <span className="text-[10px] text-slate-400">{a.description}</span>
                      </div>
                      <div className="text-[9px] text-slate-600 mt-0.5">
                        {formatTimeAgo(a.timestamp)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Detail Panel */}
          {selectedUserId && (
            <DetailPanel
              userId={selectedUserId}
              detail={detail}
              loading={detailLoading}
              onClose={() => setSelectedUserId(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Detail Panel ────────────────────────────────────────────────────────────

function DetailPanel({
  userId,
  detail,
  loading,
  onClose,
}: {
  userId: number;
  detail: ParticipantDetail | null;
  loading: boolean;
  onClose: () => void;
}) {
  if (loading) {
    return (
      <div className="rounded-xl border border-slate-700/50 bg-[#0b1118] p-6">
        <div className="flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center">
        <p className="text-red-300 text-sm">Failed to load participant detail</p>
        <button onClick={onClose} className="mt-2 text-xs text-slate-400 hover:text-white transition">
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-cyan-500/20 bg-[#0b1118] p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-bold text-white">{detail.name}</h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-slate-400">{detail.role}</span>
            <span className="text-slate-600">·</span>
            <span className="text-[10px] text-slate-400">{detail.territory || 'No territory'}</span>
            <span className="text-slate-600">·</span>
            <span className="text-[10px] text-slate-400">{detail.cohort || 'No cohort'}</span>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition text-lg">
          ✕
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <StatusBadge status={detail.academyStatus} />
        <ActivationBadge status={detail.activationStatus} />
        {detail.fieldReady && (
          <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-300">
            FIELD READY
          </span>
        )}
      </div>

      {/* Attention Flags */}
      {detail.attentionFlags.length > 0 && (
        <div className="rounded-lg border border-red-500/10 bg-red-500/5 p-2 space-y-1">
          {detail.attentionFlags.map((flag, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <FlagTag flag={flag} />
            </div>
          ))}
        </div>
      )}

      {/* Progress Bars */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="flex justify-between text-[10px] mb-1">
            <span className="text-slate-500">Knowledge</span>
            <span className="text-slate-300">{detail.knowledgeProgress}%</span>
          </div>
          <ProgressBar value={detail.knowledgeProgress} color="cyan" />
        </div>
        <div>
          <div className="flex justify-between text-[10px] mb-1">
            <span className="text-slate-500">Production</span>
            <span className="text-slate-300">{detail.productionProgress}%</span>
          </div>
          <ProgressBar value={detail.productionProgress} color="emerald" />
        </div>
      </div>

      {/* Modules + Quiz Scores */}
      <div className="rounded-lg border border-slate-700/50 p-2">
        <div className="flex items-center justify-between text-[10px] mb-1">
          <span className="text-slate-500">Modules Completed</span>
          <span className="text-white font-bold">
            {detail.modulesCompleted}/{detail.modulesTotal} ({detail.moduleCompletionPercent}%)
          </span>
        </div>
        <ProgressBar value={detail.moduleCompletionPercent} color="amber" />
        {detail.quizScores.length > 0 && (
          <details className="group mt-2">
            <summary className="cursor-pointer list-none text-[10px] font-bold text-cyan-300 uppercase tracking-wider">
              Quiz Scores ({detail.quizScores.length}) <span className="text-cyan-400">▸</span>
            </summary>
            <div className="mt-1.5 space-y-1">
              {detail.quizScores.map((q, i) => (
                <div key={i} className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 truncate max-w-[150px]">{q.quiz_id}</span>
                  <div className="flex items-center gap-2">
                    <span className={q.passed ? 'text-emerald-300' : 'text-red-300'}>{q.score}%</span>
                    <span className="text-slate-600">{q.passed ? 'PASS' : 'FAIL'}</span>
                    <span className="text-slate-600">{formatDate(q.attempted_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-4 gap-2">
        <div className="text-center">
          <div className="text-sm font-bold text-white">{detail.prospectsCreated}</div>
          <div className="text-[9px] text-slate-500">Prospects</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-bold text-white">{detail.outreachAttempts}</div>
          <div className="text-[9px] text-slate-500">Outreach</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-bold text-white">{detail.meetings}</div>
          <div className="text-[9px] text-slate-500">Meetings</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-bold text-white">{detail.orders}</div>
          <div className="text-[9px] text-slate-500">Orders</div>
        </div>
      </div>

      {/* Opportunities + Pipeline */}
      <div>
        <div className="flex justify-between text-[10px] mb-1">
          <span className="text-slate-500">Opportunities</span>
          <span className="text-white font-bold">{detail.opportunities}</span>
        </div>
        {Object.keys(detail.opportunitiesByStage).length > 0 && (
          <div className="space-y-1">
            {Object.entries(detail.opportunitiesByStage)
              .sort(([, a], [, b]) => b - a)
              .map(([stage, count]) => (
                <div key={stage} className="flex justify-between text-[10px]">
                  <span className="text-slate-500">{stage}</span>
                  <span className="text-slate-300">{count}</span>
                </div>
              ))}
          </div>
        )}
        {detail.pipelineValue > 0 && (
          <div className="flex justify-between text-[10px] mt-1">
            <span className="text-slate-500">Pipeline Value</span>
            <span className="text-emerald-300 font-bold">
              ${detail.pipelineValue.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* Activity Info */}
      <div className="grid grid-cols-2 gap-2 text-[10px]">
        <div>
          <span className="text-slate-500">Last Login</span>
          <div className="text-slate-300">
            {detail.lastLogin ? formatTimeAgo(detail.lastLogin) : 'Never'}
          </div>
        </div>
        <div>
          <span className="text-slate-500">Login Count</span>
          <div className="text-slate-300">{detail.loginCount}</div>
        </div>
        <div>
          <span className="text-slate-500">Last Academy Activity</span>
          <div className="text-slate-300">
            {detail.lastAcademyActivity ? formatTimeAgo(detail.lastAcademyActivity) : 'Never'}
          </div>
        </div>
        <div>
          <span className="text-slate-500">Days Since Activity</span>
          <div className={`${detail.daysSinceMeaningfulActivity >= 4 ? 'text-red-300 font-bold' : 'text-slate-300'}`}>
            {detail.daysSinceMeaningfulActivity}
          </div>
        </div>
        <div>
          <span className="text-slate-500">Enrolled</span>
          <div className="text-slate-300">
            {detail.enrollment.date ? formatDate(detail.enrollment.date) : 'Unknown'}
            {detail.enrollment.cohort ? ` · ${detail.enrollment.cohort}` : ''}
          </div>
        </div>
        <div>
          <span className="text-slate-500">Certified At</span>
          <div className="text-slate-300">
            {detail.certifiedAt ? formatDate(detail.certifiedAt) : '—'}
          </div>
        </div>
      </div>

      {/* Accounts + Launch Clusters + Campaign */}
      <div className="rounded-lg border border-slate-700/50 p-2 space-y-1">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-slate-500">Accounts Assigned</span>
          <span className="text-slate-300">{detail.accountsAssigned}</span>
        </div>
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-slate-500">Launch Clusters</span>
          <span className="text-slate-300">
            {detail.launchClusters.length > 0 ? detail.launchClusters.join(', ') : '—'}
          </span>
        </div>
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-slate-500">Campaign</span>
          <span className="text-slate-300 truncate max-w-[180px]">{detail.currentCampaign}</span>
        </div>
      </div>

      {/* Certification Status */}
      <div className="rounded-lg border border-slate-700/50 p-2 space-y-1">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-slate-500">NDA (HR Docs)</span>
          <span className={detail.ndaCompleted ? 'text-emerald-300' : 'text-slate-600'}>
            {detail.ndaCompleted ? '✓' : '—'}
          </span>
        </div>
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-slate-500">HR Docs</span>
          <span className={detail.hrDocsCompleted ? 'text-emerald-300' : 'text-slate-600'}>
            {detail.hrDocsCompleted ? '✓' : '—'}
          </span>
        </div>
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-slate-500">Practical Exercise</span>
          <span className={detail.practicalExerciseCompleted ? 'text-emerald-300' : 'text-slate-600'}>
            {detail.practicalExerciseCompleted ? '✓' : '—'}
          </span>
        </div>
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-slate-500">Director Sign-off</span>
          <span className={detail.directorSignedOff ? 'text-emerald-300' : 'text-slate-600'}>
            {detail.directorSignedOff ? '✓' : '—'}
          </span>
        </div>
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-slate-500">Certified</span>
          <span className={detail.isCertified ? 'text-purple-300 font-bold' : 'text-slate-600'}>
            {detail.isCertified ? `✓ ${detail.certificationDate ? formatDate(detail.certificationDate) : ''}` : '—'}
          </span>
        </div>
      </div>

      {/* Quiz Results */}
      {detail.quizResults.length > 0 && (
        <div>
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Quiz Results
          </h4>
          <div className="space-y-1">
            {detail.quizResults.map((q, i) => (
              <div key={i} className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400 truncate max-w-[150px]">{q.module}</span>
                <div className="flex items-center gap-2">
                  <span className={q.passed ? 'text-emerald-300' : 'text-red-300'}>
                    {q.score}%
                  </span>
                  <span className="text-slate-600">{q.attempts} attempt{q.attempts !== 1 ? 's' : ''}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTimeAgo(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diff = now - then;

  if (diff < 0) return 'just now';
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return formatDate(isoString);
}

function formatDate(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
