import { useEffect, useState } from 'react';
import { getStoredUser } from '../auth';
import { listUsers } from '../services/usersService';
import {
  MODULE_ORDER,
  LEVEL_1_MODULES,
  CERTIFICATION_TITLE,
  getAllCertificationRecords,
  getAllSubmissions,
  directorApproveRep,
  saveCoachReview,
  getCoachReview,
  getQuizResults,
  getMissionStatement,
  type CertificationRecord,
  type CertificationSubmission,
  type ModuleProgress,
  type AcademyModuleCode,
  type CoachReview,
} from '../lib/academy';
import type { ManagedUser } from '../services/usersService';

// ─── Coach Review Form Component ──────────────────────────────────────────

function CoachReviewForm({
  moduleCode,
  moduleName,
  repName,
  existingReview,
  onSave,
  onCancel,
  saving,
}: {
  moduleCode: AcademyModuleCode;
  moduleName: string;
  repName: string;
  existingReview: CoachReview | null;
  onSave: (review: CoachReview) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [strengths, setStrengths] = useState(existingReview?.strengths ?? '');
  const [corrections, setCorrections] = useState(existingReview?.corrections ?? '');
  const [coachingNotes, setCoachingNotes] = useState(existingReview?.coachingNotes ?? '');

  const user = getStoredUser();
  const directorName = user?.name ?? 'Director';

  const handleSave = () => {
    onSave({
      strengths: strengths.trim(),
      corrections: corrections.trim(),
      coachingNotes: coachingNotes.trim(),
      reviewedBy: directorName,
      reviewedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="rounded-xl border border-purple-400/20 bg-[#0d1520] p-5 mt-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-black text-white">
          Coach Review: {moduleName} ({moduleCode}) — {repName}
        </h3>
        <button
          onClick={onCancel}
          className="rounded-lg border border-slate-600 px-3 py-1 text-xs text-slate-400 hover:bg-slate-800 transition-colors"
        >
          Cancel
        </button>
      </div>

      <div className="space-y-4">
        {/* Strengths */}
        <div>
          <label className="block text-xs font-bold text-emerald-300 uppercase tracking-wider mb-1.5">
            💪 Strengths — What the rep did well
          </label>
          <textarea
            value={strengths}
            onChange={(e) => setStrengths(e.target.value)}
            placeholder="E.g., The mission statement showed a clear understanding of TUF's purpose..."
            rows={3}
            className="w-full rounded-lg border border-slate-700 bg-slate-900/60 p-3 text-sm text-slate-200 placeholder-slate-600 focus:border-emerald-400/40 focus:outline-none resize-vertical"
          />
        </div>

        {/* Corrections */}
        <div>
          <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider mb-1.5">
            🔧 Corrections — What needs improvement
          </label>
          <textarea
            value={corrections}
            onChange={(e) => setCorrections(e.target.value)}
            placeholder="E.g., The proposal needs more detail on pricing options..."
            rows={3}
            className="w-full rounded-lg border border-slate-700 bg-slate-900/60 p-3 text-sm text-slate-200 placeholder-slate-600 focus:border-amber-400/40 focus:outline-none resize-vertical"
          />
        </div>

        {/* Coaching Notes */}
        <div>
          <label className="block text-xs font-bold text-cyan-300 uppercase tracking-wider mb-1.5">
            📝 Coaching Notes — General guidance
          </label>
          <textarea
            value={coachingNotes}
            onChange={(e) => setCoachingNotes(e.target.value)}
            placeholder="E.g., Keep practicing discovery conversations. Remember to ask about ALL lanes..."
            rows={3}
            className="w-full rounded-lg border border-slate-700 bg-slate-900/60 p-3 text-sm text-slate-200 placeholder-slate-600 focus:border-cyan-400/40 focus:outline-none resize-vertical"
          />
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="rounded-lg border border-slate-600 px-4 py-2 text-xs font-bold text-slate-400 hover:bg-slate-800 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !strengths.trim() || !corrections.trim() || !coachingNotes.trim()}
          className="rounded-lg border border-purple-400/40 bg-purple-400/10 px-4 py-2 text-xs font-bold text-purple-200 hover:bg-purple-400/20 disabled:opacity-40 transition-colors"
        >
          {saving ? 'Saving...' : 'Save Coach Review'}
        </button>
      </div>
    </div>
  );
}

// ─── Main Admin Certification Page ────────────────────────────────────────

export default function AdminCertificationPage() {
  const user = getStoredUser();
  const isDirectorOrAdmin =
    user?.role === 'DIRECTOR' || user?.role === 'REGIONAL_DIRECTOR' || user?.role === 'ADMIN';
  const [records, setRecords] = useState<CertificationRecord[]>([]);
  const [submissions, setSubmissions] = useState<CertificationSubmission[]>([]);
  const [allUsers, setAllUsers] = useState<ManagedUser[]>([]);
  const [approving, setApproving] = useState<string | null>(null);
  const [selectedRep, setSelectedRep] = useState<ManagedUser | null>(null);
  const [pendingCoachReview, setPendingCoachReview] = useState<{
    repId: string;
    repName: string;
    moduleCode: AcademyModuleCode;
    moduleName: string;
  } | null>(null);
  const [savingReview, setSavingReview] = useState(false);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    const loadedUsers = listUsers();
    setAllUsers(loadedUsers);
    const loadedRecords = getAllCertificationRecords();
    setRecords(loadedRecords);
    const loadedSubmissions = getAllSubmissions();
    setSubmissions(loadedSubmissions);
  };

  const handleApprove = async (repUser: ManagedUser) => {
    if (!user) return;
    setApproving(repUser.id);
    try {
      const result = directorApproveRep(repUser.id, repUser.displayName, user.name);
      if (!result) {
        alert(
          'Cannot approve: the rep must have a valid submission with all quizzes passed and exercises verified.'
        );
      }
      refreshData();
    } finally {
      setApproving(null);
    }
  };

  const handleSaveCoachReview = (review: CoachReview) => {
    if (!pendingCoachReview) return;
    setSavingReview(true);
    try {
      saveCoachReview(pendingCoachReview.moduleCode, review);
      refreshData();
      setPendingCoachReview(null);
    } finally {
      setSavingReview(false);
    }
  };

  const reps = allUsers.filter((u) => u.role === 'REP' && u.status === 'ACTIVE');
  const directors = allUsers.filter(
    (u) =>
      (u.role === 'DIRECTOR' || u.role === 'REGIONAL_DIRECTOR' || u.role === 'ADMIN') &&
      u.status === 'ACTIVE'
  );

  const getRepRecord = (userId: string): CertificationRecord | undefined =>
    records.find((r) => r.userId === userId);

  const getRepSubmission = (userId: string): CertificationSubmission | undefined =>
    submissions.find((s) => s.userId === userId);

  const getRepMission = (userId: string): string => {
    return getMissionStatement(userId);
  };

  const getStatusBadge = (rep: ManagedUser) => {
    const record = getRepRecord(rep.id);
    const submission = getRepSubmission(rep.id);

    if (record?.isLevel1Certified) {
      return {
        label: `🎉 ${CERTIFICATION_TITLE.split(' ').slice(0, 3).join(' ')} ✓`,
        className: 'bg-emerald-400/20 text-emerald-200 border-emerald-400/30',
        detail: record.certifiedBy ? `Approved by ${record.certifiedBy}` : undefined,
      };
    }
    if (submission) {
      return {
        label: 'Submitted ◆',
        className: 'bg-purple-400/20 text-purple-200 border-purple-400/30',
        detail: `Submitted ${new Date(submission.submittedAt).toLocaleDateString()}`,
      };
    }
    // Check module progress from record
    const verified =
      record?.moduleProgress.filter(
        (m) =>
          m.phase === 'awaiting_coach' ||
          m.phase === 'coach_review' ||
          m.phase === 'acknowledged' ||
          m.phase === 'certified'
      ).length ?? 0;
    if (record && verified > 0) {
      return {
        label: `${verified}/5 In Review`,
        className: 'bg-amber-400/20 text-amber-200 border-amber-400/30',
        detail: undefined,
      };
    }
    if (record) {
      return {
        label: 'In Progress',
        className: 'bg-cyan-400/20 text-cyan-200 border-cyan-400/30',
        detail: undefined,
      };
    }
    return {
      label: 'Not Enrolled',
      className: 'bg-slate-700/40 text-slate-400 border-slate-600/30',
      detail: undefined,
    };
  };

  const getModulePhaseClass = (phase: ModuleProgress['phase']) => {
    switch (phase) {
      case 'certified':
      case 'acknowledged':
        return 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30';
      case 'coach_review':
        return 'bg-purple-400/20 text-purple-300 border-purple-400/30';
      case 'awaiting_coach':
        return 'bg-amber-400/20 text-amber-300 border-amber-400/30';
      case 'demonstrate':
      case 'quiz_passed':
        return 'bg-cyan-400/20 text-cyan-300 border-cyan-400/30';
      case 'learn':
        return 'bg-blue-400/20 text-blue-300 border-blue-400/30';
      case 'locked':
        return 'bg-slate-700/40 text-slate-500 border-slate-600/30';
      default:
        return 'bg-slate-700/40 text-slate-500 border-slate-600/30';
    }
  };

  const getModulePhaseLabel = (phase: ModuleProgress['phase']) => {
    switch (phase) {
      case 'certified':
        return '🎉';
      case 'acknowledged':
        return '✓';
      case 'coach_review':
        return '◆';
      case 'awaiting_coach':
        return '⏳';
      case 'demonstrate':
      case 'quiz_passed':
        return 'Q';
      case 'learn':
        return '📖';
      case 'locked':
        return '—';
      default:
        return '○';
    }
  };

  const getModulePhaseTitle = (phase: ModuleProgress['phase'], code: string) => {
    switch (phase) {
      case 'certified':
        return `${code}: Deploy — Certified`;
      case 'acknowledged':
        return `${code}: Coach Review Acknowledged`;
      case 'coach_review':
        return `${code}: Coach Review Ready (Rep must acknowledge)`;
      case 'awaiting_coach':
        return `${code}: Exercise Complete — Needs Coach Review`;
      case 'demonstrate':
        return `${code}: Demonstrate — Exercise in Progress`;
      case 'quiz_passed':
        return `${code}: Quiz Passed`;
      case 'learn':
        return `${code}: Learn — Available`;
      case 'locked':
        return `${code}: Locked`;
      default:
        return `${code}: Not started`;
    }
  };

  const getQuizScoreForModule = (repId: string, moduleCode: string): number | null => {
    const submission = getRepSubmission(repId);
    if (!submission) return null;
    const detail = submission.moduleProgress.find((m) => m.code === moduleCode);
    return detail?.quizScore ?? null;
  };

  if (!isDirectorOrAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-2xl font-black text-white mb-2">Access Denied</h1>
          <p className="text-slate-400">
            Only Directors and Administrators can access the certification review page.
          </p>
        </div>
      </div>
    );
  }

  const isRepActionable = (rep: ManagedUser): boolean => {
    const record = getRepRecord(rep.id);
    const submission = getRepSubmission(rep.id);
    return !!submission && !record?.isLevel1Certified;
  };

  return (
    <div className="min-h-screen text-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">
              TAE Certification Review — {CERTIFICATION_TITLE}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Review quiz scores, exercise verification, provide Coach Review (Strengths, Corrections,
              Coaching Notes), and certify Territory Account Executives.{' '}
              {user?.name ? `Signed in as ${user.name}.` : ''}
            </p>
          </div>
          <button
            onClick={refreshData}
            className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800 transition-colors"
          >
            ↻ Refresh
          </button>
        </div>

        {/* TAEs Table */}
        <div className="rounded-xl border border-slate-800 bg-[#070c13]/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50">
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    TAE
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Territory
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    ACAD-101
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    ACAD-102
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    ACAD-103
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    ACAD-104
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    ACAD-105
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {reps.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                      No active TAEs found.
                    </td>
                  </tr>
                ) : (
                  reps.map((rep) => {
                    const record = getRepRecord(rep.id);
                    const submission = getRepSubmission(rep.id);
                    const statusBadge = getStatusBadge(rep);
                    const isAlreadyCertified = record?.isLevel1Certified === true;
                    const hasSubmission = !!submission;
                    const canApprove = isRepActionable(rep);

                    return (
                      <tr key={rep.id} className="hover:bg-slate-900/30 transition-colors">
                        <td className="px-4 py-3">
                          <button
                            onClick={() =>
                              setSelectedRep(selectedRep?.id === rep.id ? null : rep)
                            }
                            className="text-left hover:text-cyan-300 transition-colors"
                          >
                            <p className="font-bold text-white">{rep.displayName}</p>
                            <p className="text-xs text-slate-500">{rep.email}</p>
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs text-slate-300">
                            {rep.subterritory || rep.territory || '—'}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusBadge.className}`}
                          >
                            {statusBadge.label}
                          </span>
                          {statusBadge.detail && (
                            <p className="text-[10px] text-slate-500 mt-1">
                              {statusBadge.detail}
                            </p>
                          )}
                        </td>
                        {MODULE_ORDER.map((code) => {
                          const mod = record?.moduleProgress.find((m) => m.code === code);
                          const phase = mod?.phase ?? 'locked';
                          const quizScore = getQuizScoreForModule(rep.id, code);
                          const coachReview = getCoachReview(code);

                          return (
                            <td key={code} className="px-2 py-3 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <span
                                  className={`inline-flex items-center justify-center w-8 h-8 rounded-full border text-xs font-bold ${getModulePhaseClass(phase)}`}
                                  title={getModulePhaseTitle(phase, code)}
                                >
                                  {getModulePhaseLabel(phase)}
                                </span>
                                {quizScore !== null && quizScore > 0 && (
                                  <span className="text-[9px] text-slate-500 font-mono">
                                    {quizScore}%
                                  </span>
                                )}
                                {coachReview && (
                                  <span className="text-[9px] text-purple-400" title="Has Coach Review">
                                    CR
                                  </span>
                                )}
                              </div>
                            </td>
                          );
                        })}
                        <td className="px-4 py-3 text-center">
                          {isAlreadyCertified ? (
                            <span className="text-xs text-emerald-400 font-bold">
                              {CERTIFICATION_TITLE.split(' ').slice(-2).join(' ')} ✓
                            </span>
                          ) : hasSubmission && !isAlreadyCertified ? (
                            <button
                              onClick={() => handleApprove(rep)}
                              disabled={approving === rep.id}
                              className="rounded-lg border border-purple-400/40 bg-purple-400/10 px-3 py-1.5 text-[10px] font-bold text-purple-200 hover:bg-purple-400/20 hover:border-purple-400/60 transition-colors disabled:opacity-50"
                            >
                              {approving === rep.id ? '...' : 'Approve'}
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-600">
                              {record ? 'Not submitted' : '—'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ─── Expanded Rep Detail with Coach Review ─── */}
        {selectedRep && (
          <div className="rounded-xl border border-cyan-400/15 bg-[#0d1520] p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-black text-white">
                  {selectedRep.displayName} — Module Details
                </h2>
                <p className="text-xs text-slate-400">
                  {selectedRep.territory || 'No territory'} · {selectedRep.email}
                </p>
              </div>
              <button
                onClick={() => setSelectedRep(null)}
                className="rounded-lg border border-slate-600 px-3 py-1 text-xs text-slate-400 hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
            </div>

            {/* Mission Statement for ACAD-101 */}
            <div className="mb-4 rounded-lg border border-emerald-400/15 bg-emerald-400/5 p-4">
              <h3 className="text-sm font-black text-emerald-300 mb-2">
                Mission Statement (ACAD-101 Demonstrate)
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                {getRepMission(selectedRep.id) || 'No mission statement submitted yet.'}
              </p>
            </div>

            {/* Module Progress Cards */}
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {MODULE_ORDER.map((code) => {
                const record = getRepRecord(selectedRep.id);
                const mod = record?.moduleProgress.find((m) => m.code === code);
                const phase = mod?.phase ?? 'locked';
                const moduleDef = LEVEL_1_MODULES.find((m) => m.code === code);
                const coachReview = getCoachReview(code);

                return (
                  <div
                    key={code}
                    className="rounded-lg border border-slate-800 bg-slate-900/40 p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-cyan-400 uppercase">
                        {code}
                      </span>
                      <span
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-full border text-xs font-bold ${getModulePhaseClass(phase)}`}
                        title={getModulePhaseTitle(phase, code)}
                      >
                        {getModulePhaseLabel(phase)}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-white mb-1">
                      {moduleDef?.name ?? code}
                    </p>

                    {/* Coach Review Status */}
                    {coachReview ? (
                      <div className="mt-2 rounded-lg border border-purple-400/20 bg-purple-400/5 p-2.5">
                        <p className="text-[10px] font-bold text-purple-300 mb-1">
                          ✓ Coach Review Done
                        </p>
                        <p className="text-[10px] text-slate-400">
                          By {coachReview.reviewedBy} on{' '}
                          {new Date(coachReview.reviewedAt).toLocaleDateString()}
                        </p>
                        <details className="mt-2">
                          <summary className="text-[10px] text-slate-500 cursor-pointer hover:text-slate-300">
                            View feedback
                          </summary>
                          <div className="mt-2 space-y-2">
                            <div>
                              <p className="text-[9px] font-bold text-emerald-400">Strengths:</p>
                              <p className="text-[10px] text-slate-300 whitespace-pre-wrap">
                                {coachReview.strengths}
                              </p>
                            </div>
                            <div>
                              <p className="text-[9px] font-bold text-amber-400">Corrections:</p>
                              <p className="text-[10px] text-slate-300 whitespace-pre-wrap">
                                {coachReview.corrections}
                              </p>
                            </div>
                            <div>
                              <p className="text-[9px] font-bold text-cyan-400">Coaching Notes:</p>
                              <p className="text-[10px] text-slate-300 whitespace-pre-wrap">
                                {coachReview.coachingNotes}
                              </p>
                            </div>
                          </div>
                        </details>
                      </div>
                    ) : phase === 'awaiting_coach' ? (
                      <div className="mt-2">
                        <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 p-2.5 mb-2">
                          <p className="text-[10px] text-amber-300 font-bold">
                            ⏳ Needs Coach Review
                          </p>
                        </div>
                        {pendingCoachReview &&
                        pendingCoachReview.repId === selectedRep.id &&
                        pendingCoachReview.moduleCode === code ? (
                          <CoachReviewForm
                            moduleCode={code}
                            moduleName={moduleDef?.name ?? code}
                            repName={selectedRep.displayName}
                            existingReview={null}
                            onSave={handleSaveCoachReview}
                            onCancel={() => setPendingCoachReview(null)}
                            saving={savingReview}
                          />
                        ) : (
                          <button
                            onClick={() =>
                              setPendingCoachReview({
                                repId: selectedRep.id,
                                repName: selectedRep.displayName,
                                moduleCode: code,
                                moduleName: moduleDef?.name ?? code,
                              })
                            }
                            className="w-full rounded-lg border border-purple-400/40 bg-purple-400/10 px-3 py-1.5 text-xs font-bold text-purple-200 hover:bg-purple-400/20 transition-colors"
                          >
                            Provide Coach Review
                          </button>
                        )}
                      </div>
                    ) : coachReview && phase === 'coach_review' ? (
                      <div className="mt-2">
                        <div className="rounded-lg border border-purple-400/20 bg-purple-400/5 p-2.5 mb-2">
                          <p className="text-[10px] text-purple-300 font-bold">
                            ◆ Awaiting Rep Acknowledgment
                          </p>
                        </div>
                        {pendingCoachReview &&
                        pendingCoachReview.repId === selectedRep.id &&
                        pendingCoachReview.moduleCode === code ? (
                          <CoachReviewForm
                            moduleCode={code}
                            moduleName={moduleDef?.name ?? code}
                            repName={selectedRep.displayName}
                            existingReview={coachReview}
                            onSave={handleSaveCoachReview}
                            onCancel={() => setPendingCoachReview(null)}
                            saving={savingReview}
                          />
                        ) : (
                          <button
                            onClick={() =>
                              setPendingCoachReview({
                                repId: selectedRep.id,
                                repName: selectedRep.displayName,
                                moduleCode: code,
                                moduleName: moduleDef?.name ?? code,
                              })
                            }
                            className="w-full rounded-lg border border-purple-400/40 bg-purple-400/10 px-3 py-1.5 text-xs font-bold text-purple-200 hover:bg-purple-400/20 transition-colors"
                          >
                            Update Coach Review
                          </button>
                        )}
                      </div>
                    ) : phase === 'demonstrate' || phase === 'quiz_passed' ? (
                      <div className="mt-2 rounded-lg border border-cyan-400/20 bg-cyan-400/5 p-2.5">
                        <p className="text-[10px] text-cyan-300">
                          Exercise in progress
                        </p>
                      </div>
                    ) : phase === 'acknowledged' || phase === 'certified' ? (
                      <div className="mt-2 rounded-lg border border-emerald-400/20 bg-emerald-400/5 p-2.5">
                        <p className="text-[10px] text-emerald-300">
                          ✓ Module Complete
                        </p>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Submitted Details (expanded view) */}
        {submissions.length > 0 && (
          <div>
            <h3 className="text-lg font-black text-white mb-3">
              Submission Details — Director Review
            </h3>
            <div className="space-y-4">
              {submissions
                .filter((s) => !getRepRecord(s.userId)?.isLevel1Certified)
                .map((sub) => {
                  const rep = reps.find((r) => r.id === sub.userId);
                  return (
                    <div
                      key={sub.userId}
                      className="rounded-xl border border-purple-400/15 bg-[#0d1520] p-5"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="font-bold text-white text-lg">{sub.userName}</p>
                          <p className="text-xs text-slate-400">
                            Submitted {new Date(sub.submittedAt).toLocaleDateString()} at{' '}
                            {new Date(sub.submittedAt).toLocaleTimeString()}
                          </p>
                        </div>
                        <div className="rounded-lg border border-purple-400/20 bg-purple-400/5 px-3 py-1.5 text-xs text-purple-200 font-bold">
                          Director QA: &ldquo;Would I trust this person with one of our
                          schools?&rdquo;
                        </div>
                      </div>

                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-800">
                            <th className="text-left px-3 py-2 text-xs font-bold text-slate-400 uppercase">
                              Module
                            </th>
                            <th className="text-center px-3 py-2 text-xs font-bold text-slate-400 uppercase">
                              Quiz Score
                            </th>
                            <th className="text-center px-3 py-2 text-xs font-bold text-slate-400 uppercase">
                              Quiz Passed
                            </th>
                            <th className="text-center px-3 py-2 text-xs font-bold text-slate-400 uppercase">
                              Attempts
                            </th>
                            <th className="text-center px-3 py-2 text-xs font-bold text-slate-400 uppercase">
                              Exercise
                            </th>
                            <th className="text-center px-3 py-2 text-xs font-bold text-slate-400 uppercase">
                              Progress
                            </th>
                            <th className="text-center px-3 py-2 text-xs font-bold text-slate-400 uppercase">
                              Coach Review
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {sub.moduleProgress.map((detail) => {
                            const coachReview = getCoachReview(detail.code);
                            return (
                              <tr key={detail.code} className="hover:bg-slate-900/20">
                                <td className="px-3 py-2.5">
                                  <span className="font-bold text-white">{detail.code}</span>
                                </td>
                                <td className="px-3 py-2.5 text-center">
                                  <span
                                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${
                                      detail.quizPassed
                                        ? 'bg-emerald-400/20 text-emerald-200 border-emerald-400/30'
                                        : 'bg-red-400/20 text-red-200 border-red-400/30'
                                    }`}
                                  >
                                    {detail.quizScore}%
                                  </span>
                                </td>
                                <td className="px-3 py-2.5 text-center">
                                  {detail.quizPassed ? (
                                    <span className="text-emerald-400 font-bold">✓</span>
                                  ) : (
                                    <span className="text-red-400 font-bold">✗</span>
                                  )}
                                </td>
                                <td className="px-3 py-2.5 text-center">
                                  <span className="text-xs text-slate-400">
                                    {detail.quizAttempts}
                                  </span>
                                </td>
                                <td className="px-3 py-2.5 text-center">
                                  {detail.exerciseVerified ? (
                                    <span className="text-emerald-400 font-bold">✓ Verified</span>
                                  ) : (
                                    <span className="text-slate-500 text-xs">
                                      {detail.exerciseValue}/{detail.exerciseTarget}
                                    </span>
                                  )}
                                </td>
                                <td className="px-3 py-2.5 text-center">
                                  <div className="w-20 mx-auto h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${
                                        detail.exerciseVerified
                                          ? 'bg-emerald-400'
                                          : 'bg-cyan-400'
                                      }`}
                                      style={{
                                        width: `${Math.min(
                                          (detail.exerciseValue / detail.exerciseTarget) * 100,
                                          100
                                        )}%`,
                                      }}
                                    />
                                  </div>
                                </td>
                                <td className="px-3 py-2.5 text-center">
                                  {coachReview ? (
                                    <span className="text-xs text-purple-400 font-bold">✓</span>
                                  ) : (
                                    <span className="text-xs text-slate-600">—</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>

                      {rep && (
                        <div className="mt-4 flex justify-end">
                          <button
                            onClick={() => handleApprove(rep)}
                            disabled={approving === rep.id}
                            className="rounded-lg border border-purple-400/40 bg-purple-400/10 px-4 py-2 text-sm font-bold text-purple-200 hover:bg-purple-400/20 disabled:opacity-40 transition-colors"
                          >
                            {approving === rep.id
                              ? 'Approving...'
                              : `Approve ${sub.userName} — Grant ${CERTIFICATION_TITLE}`}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Directors List */}
        {directors.length > 0 && (
          <div>
            <h3 className="text-lg font-black text-white mb-3">
              Directors & Administrators
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              {directors.map((dir) => {
                const record = getRepRecord(dir.id);
                return (
                  <div
                    key={dir.id}
                    className="rounded-xl border border-cyan-400/15 bg-[#0d1520] p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-white">{dir.displayName}</p>
                        <p className="text-xs text-slate-500">
                          {dir.role} · {dir.territory || 'National'}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
                        Full Access
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Module Phase Legend
          </h3>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-emerald-400/30 bg-emerald-400/20 text-emerald-300 text-xs">
                ✓
              </span>
              <span className="text-slate-400">Coach Review Acknowledged</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-purple-400/30 bg-purple-400/20 text-purple-300 text-xs">
                ◆
              </span>
              <span className="text-slate-400">Coach Review Ready (Rep must acknowledge)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-amber-400/30 bg-amber-400/20 text-amber-300 text-xs">
                ⏳
              </span>
              <span className="text-slate-400">Awaiting Coach Review</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-cyan-400/30 bg-cyan-400/20 text-cyan-300 text-xs">
                Q
              </span>
              <span className="text-slate-400">Quiz Passed / Demonstrate</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-blue-400/30 bg-blue-400/20 text-blue-300 text-xs">
                📖
              </span>
              <span className="text-slate-400">Learn Phase</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-slate-600/30 bg-slate-700/40 text-slate-500 text-xs">
                —
              </span>
              <span className="text-slate-400">Locked</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
