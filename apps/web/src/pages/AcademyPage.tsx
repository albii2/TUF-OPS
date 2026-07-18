import { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getStoredUser } from '../auth';
import {
  LEVEL_1_MODULES,
  DIRECTOR_MODULES,
  SALES_PHILOSOPHY,
  QUIZZES,
  QUIZ_PASS_THRESHOLD,
  MODULE_ORDER,
  CERTIFICATION_TITLE,
  detectAllModules,
  detectAllDirectorModules,
  getAcademyTrack,
  isLevel1Complete,
  verifiedModuleCount,
  certificationProgress,
  getQuizResults,
  gradeQuiz,
  submitForApproval,
  saveCertificationRecord,
  getSubmission,
  getMissionStatement,
  saveMissionStatement,
  hasMissionStatement,
  getCoachReview,
  getCoachReviews,
  acknowledgeModule,
  isModuleAcknowledged,
  markPageVisited,
  type ModuleProgress,
  type AcademyModule,
  type AcademyModuleCode,
  type QuizQuestion,
  type QuizResult,
  type CoachReview,
} from '../lib/academy';
import TufAcademyLogo from '../assets/tuf-academy.png';

// ─── Quiz Modal Component ──────────────────────────────────────────────────

function QuizModal({
  moduleCode,
  moduleName,
  questions,
  quizResult,
  onClose,
  onSubmit,
  submitting,
}: {
  moduleCode: AcademyModuleCode;
  moduleName: string;
  questions: QuizQuestion[];
  quizResult: QuizResult | null;
  onClose: () => void;
  onSubmit: (answers: number[]) => void;
  submitting: boolean;
}) {
  const [answers, setAnswers] = useState<number[]>(
    () => new Array(questions.length).fill(-1)
  );
  const [feedback, setFeedback] = useState<{ message: string; passed: boolean } | null>(null);

  const handleSubmit = () => {
    if (answers.some((a) => a === -1)) return;
    onSubmit(answers);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-700 bg-[#070c13] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-black text-white">{moduleName} Quiz</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {questions.length} questions · Pass threshold: {QUIZ_PASS_THRESHOLD}%
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-600 px-3 py-1 text-xs text-slate-400 hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Previous Result */}
        {quizResult && (
          <div
            className={`mb-4 rounded-lg border p-3 text-xs ${
              quizResult.passed
                ? 'border-emerald-400/20 bg-emerald-400/5 text-emerald-200'
                : 'border-amber-400/20 bg-amber-400/5 text-amber-200'
            }`}
          >
            <span className="font-bold">
              Previous Attempt: {quizResult.score}% —{' '}
              {quizResult.passed ? 'Passed ✓' : 'Did Not Pass'}
            </span>
            <span className="text-slate-500 ml-2">
              (Attempt #{quizResult.attempts})
            </span>
          </div>
        )}

        {/* Feedback Banner */}
        {feedback && (
          <div
            className={`mb-4 rounded-lg border p-3 text-xs font-medium ${
              feedback.passed
                ? 'border-emerald-400/20 bg-emerald-400/5 text-emerald-300'
                : 'border-red-400/20 bg-red-400/5 text-red-200'
            }`}
          >
            {feedback.message}
          </div>
        )}

        {/* Questions */}
        <div className="space-y-5 max-h-[50vh] overflow-y-auto">
          {questions.map((q, i) => (
            <div
              key={q.id}
              className="rounded-lg border border-slate-800 bg-slate-900/40 p-4"
            >
              <p className="text-sm font-bold text-white mb-3">
                {i + 1}. {q.question}
              </p>
              <div className="space-y-2 mt-3">
                {q.options.map((opt, oi) => {
                  const isSelected = answers[i] === oi;
                  return (
                    <label
                      key={oi}
                      className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors text-sm ${
                        isSelected
                          ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-200'
                          : 'border-slate-700 bg-slate-800/40 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`quiz-${moduleCode}-q${i}`}
                        checked={isSelected}
                        onChange={() => {
                          const newAnswers = [...answers];
                          newAnswers[i] = oi;
                          setAnswers(newAnswers);
                          setFeedback(null);
                        }}
                        className="sr-only"
                      />
                      <span className="select-none">{opt}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Submit */}
        <div className="flex justify-end mt-6">
          <button
            onClick={handleSubmit}
            disabled={submitting || answers.some((a) => a === -1)}
            className="rounded-lg border border-cyan-400/40 bg-cyan-400/10 px-5 py-2 text-sm font-bold text-cyan-200 hover:bg-cyan-400/20 disabled:opacity-40 transition-colors"
          >
            {submitting ? 'Submitting...' : 'Submit Answers'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Mission Statement Modal (ACAD-101 Demonstrate) ────────────────────────

function MissionStatementModal({
  existingText,
  title = 'Your Mission Statement',
  subtitle = "Explain TUF's mission in your own words. This will be reviewed by your Director.",
  prompt = 'Why does TUF exist? What is our mission? How do the 7 Sales Philosophy principles guide you as a Territory Account Executive? Write 3-5 sentences.',
  saveLabel = 'Save Mission Statement',
  onClose,
  onSave,
}: {
  existingText: string;
  title?: string;
  subtitle?: string;
  prompt?: string;
  saveLabel?: string;
  onClose: () => void;
  onSave: (text: string) => void;
}) {
  const [text, setText] = useState(existingText);
  const canSave = text.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-700 bg-[#070c13] p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-black text-white">{title}</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {subtitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-600 px-3 py-1 text-xs text-slate-400 hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="mb-4 rounded-lg border border-slate-800 bg-slate-900/40 p-4">
          <p className="text-sm text-slate-300 mb-2 font-bold">Prompt:</p>
          <p className="text-xs text-slate-400 leading-relaxed">
            {prompt}
          </p>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write your response here..."
          rows={8}
          className="w-full rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-sm text-slate-200 placeholder-slate-600 focus:border-cyan-400/40 focus:outline-none resize-vertical"
        />

        <div className="flex justify-between items-center mt-4">
          <p className="text-xs text-slate-500">
            {text.trim().length > 0
              ? `${text.trim().length} characters`
              : 'Enter at least 100 characters for a strong statement'}
          </p>
          <button
            onClick={() => onSave(text.trim())}
            disabled={!canSave}
            className="rounded-lg border border-cyan-400/40 bg-cyan-400/10 px-5 py-2 text-sm font-bold text-cyan-200 hover:bg-cyan-400/20 disabled:opacity-40 transition-colors"
          >
            {saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Coach Review Modal ────────────────────────────────────────────────────

function CoachReviewModal({
  moduleName,
  moduleCode,
  coachReview,
  onClose,
  onAcknowledge,
  acknowledging,
}: {
  moduleName: string;
  moduleCode: AcademyModuleCode;
  coachReview: CoachReview;
  onClose: () => void;
  onAcknowledge: () => void;
  acknowledging: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-purple-400/20 bg-[#070c13] p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-black text-white">
              Coach Review — {moduleName}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Reviewed by {coachReview.reviewedBy} on{' '}
              {new Date(coachReview.reviewedAt).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-600 px-3 py-1 text-xs text-slate-400 hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Strengths */}
        <div className="mb-4 rounded-lg border border-emerald-400/20 bg-emerald-400/5 p-4">
          <h3 className="text-sm font-black text-emerald-300 mb-2">Strengths</h3>
          <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
            {coachReview.strengths || 'No strengths noted.'}
          </p>
        </div>

        {/* Corrections */}
        <div className="mb-4 rounded-lg border border-amber-400/20 bg-amber-400/5 p-4">
          <h3 className="text-sm font-black text-amber-300 mb-2">Corrections</h3>
          <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
            {coachReview.corrections || 'No corrections noted.'}
          </p>
        </div>

        {/* Coaching Notes */}
        <div className="mb-6 rounded-lg border border-cyan-400/20 bg-cyan-400/5 p-4">
          <h3 className="text-sm font-black text-cyan-300 mb-2">Coaching Notes</h3>
          <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
            {coachReview.coachingNotes || 'No coaching notes.'}
          </p>
        </div>

        {/* Acknowledge */}
        <div className="rounded-lg border border-purple-400/30 bg-purple-400/5 p-4">
          <p className="text-sm text-slate-300 mb-3">
            Review the Director's feedback above. When you're ready, acknowledge to access the next module.
          </p>
          <button
            onClick={onAcknowledge}
            disabled={acknowledging}
            className="rounded-lg border border-purple-400/40 bg-purple-400/10 px-5 py-2 text-sm font-bold text-purple-200 hover:bg-purple-400/20 disabled:opacity-40 transition-colors"
          >
            {acknowledging ? 'Acknowledging...' : 'Acknowledge & Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Learn Content Modal ───────────────────────────────────────────────────

function LearnContentModal({
  module,
  onClose,
}: {
  module: AcademyModule;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-cyan-400/20 bg-[#070c13] p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-black text-white">
              {module.name} — Learn
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Study the content below before taking the quiz.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-600 px-3 py-1 text-xs text-slate-400 hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {module.learnContent.map((section, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-slate-800 bg-slate-900/40 p-4"
            >
              <h3 className="text-sm font-black text-cyan-200 mb-2">
                {section.heading}
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {section.body}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-lg border border-amber-400/20 bg-amber-400/5 p-3">
          <p className="text-xs text-amber-200">
            Philosophy Principle #{module.philosophyPrinciple}:
            "{SALES_PHILOSOPHY[module.philosophyPrinciple - 1]?.title}"
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Academy Page ────────────────────────────────────────────────────

export default function AcademyPage() {
  const user = getStoredUser();
  const [moduleProgress, setModuleProgress] = useState<ModuleProgress[]>([]);
  const [showPhilosophy, setShowPhilosophy] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState<AcademyModuleCode | null>(null);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [activeLearn, setActiveLearn] = useState<AcademyModuleCode | null>(null);
  const [showMissionModal, setShowMissionModal] = useState(false);
  const [activeCoachReview, setActiveCoachReview] = useState<AcademyModuleCode | null>(null);
  const [acknowledging, setAcknowledging] = useState(false);
  const [submittingForApproval, setSubmittingForApproval] = useState(false);
  const [approvalSubmitted, setApprovalSubmitted] = useState(false);
  const [approvalError, setApprovalError] = useState<string | null>(null);

  const isCertified = user?.isCertified === true;
  const isRep = user?.role === 'REP';
  // Role-based track selection: DIRECTOR / REGIONAL_DIRECTOR train on the
  // Director track; REP trains on the TAE track.
  const track = getAcademyTrack(user?.role);
  const isDirector = track.track === 'DIRECTOR';
  const trackModules = track.modules;
  const trackOrder = track.order;
  const certTitle = track.certificationTitle;
  const moduleCount = trackModules.length;
  const userName = user?.name ?? 'TAE';
  const userId = user?.id ?? '';

  // Load progress
  useEffect(() => {
    markPageVisited('academy');
    refreshProgress();

    const interval = setInterval(refreshProgress, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const refreshProgress = useCallback(async () => {
    const progress = isDirector
      ? await detectAllDirectorModules()
      : await detectAllModules();
    setModuleProgress(progress);

    // Save certification record WITHOUT auto-certifying
    if (user) {
      saveCertificationRecord({
        userId: user.id,
        userName: user.name,
        role: user.role,
        isLevel1Certified: isCertified,
        certificationTitle: certTitle,
        moduleProgress: progress,
        lastChecked: new Date().toISOString(),
      });
    }
  }, [user, isCertified, isDirector, certTitle]);

  const verifiedCount = verifiedModuleCount(moduleProgress);
  const completeCount = moduleProgress.filter(
    (m) => m.phase === 'acknowledged' || m.phase === 'certified'
  ).length;
  const quizResults = getQuizResults();
  const submission = useMemo(() => getSubmission(userId), [userId]);
  const missionStatement = getMissionStatement(userId);

  const certificationLabel = isCertified
    ? `${certTitle} — Full CRM Access Granted`
    : isRep || isDirector
      ? approvalSubmitted
        ? `Submitted for ${isDirector ? 'VP' : 'Director'} Review — Pending`
        : `Academy Progress: ${completeCount}/${moduleCount} Modules Complete — Coach Review Required`
      : 'Admin — Full CRM Access';

  const statusColor = isCertified
    ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200'
    : approvalSubmitted
      ? 'border-purple-400/40 bg-purple-400/10 text-purple-200'
      : isRep
        ? 'border-amber-400/40 bg-amber-400/10 text-amber-200'
        : 'border-cyan-400/40 bg-cyan-400/10 text-cyan-200';

  const handleQuizSubmit = useCallback(
    (answers: number[]) => {
      if (!activeQuiz) return;
      setSubmittingQuiz(true);
      try {
        gradeQuiz(activeQuiz, answers);
        setSubmittingQuiz(false);
        refreshProgress();
        setActiveQuiz(null);
      } catch {
        setSubmittingQuiz(false);
      }
    },
    [activeQuiz, refreshProgress]
  );

  const handleTakeQuiz = (code: AcademyModuleCode) => {
    setActiveQuiz(code);
  };

  const handleOpenLearn = (code: AcademyModuleCode) => {
    setActiveLearn(code);
  };

  const handleSaveMission = (text: string) => {
    saveMissionStatement(userId, text);
    setShowMissionModal(false);
    refreshProgress();
  };

  const handleAcknowledge = useCallback(
    (code: AcademyModuleCode) => {
      setAcknowledging(true);
      try {
        acknowledgeModule(userId, code);
        setAcknowledging(false);
        setActiveCoachReview(null);
        refreshProgress();
      } catch {
        setAcknowledging(false);
      }
    },
    [userId, refreshProgress]
  );

  const handleSubmitForApproval = useCallback(async () => {
    if (!isLevel1Complete(moduleProgress)) {
      setApprovalError(
        `All ${moduleCount} modules must go through Coach Review and you must acknowledge each one before submitting for certification.`
      );
      return;
    }
    setSubmittingForApproval(true);
    setApprovalError(null);
    try {
      submitForApproval(userId, userName);
      setApprovalSubmitted(true);
      refreshProgress();
    } catch (e) {
      setApprovalError(
        e instanceof Error ? e.message : 'Failed to submit. Please try again.'
      );
    } finally {
      setSubmittingForApproval(false);
    }
  }, [userId, userName, moduleProgress]);

  const moduleDefMap = useMemo(() => {
    const map = new Map<AcademyModuleCode, AcademyModule>();
    [...LEVEL_1_MODULES, ...DIRECTOR_MODULES].forEach((m) => map.set(m.code, m));
    return map;
  }, []);

  // ─── Render ──

  return (
    <div className="min-h-screen text-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* ── Header ── */}
        <div className="rounded-2xl border border-slate-700 bg-[#0a0a0a] p-6 md:p-8">
          <div className="flex flex-col items-center text-center">
            <div className="mx-auto max-w-3xl">
              <h1 className="text-2xl font-black leading-tight tracking-wider text-white md:text-3xl">
                {isDirector ? 'TUF DIRECTOR TRACK — CERTIFICATION' : 'TUF SALES SYSTEM — CERTIFICATION'}
              </h1>
              <p className="mt-4 max-w-xl mx-auto text-sm leading-6 text-slate-400">
                Complete all {moduleCount === 6 ? 'six' : 'five'} modules. Pass the assessments. Get {isDirector ? 'VP' : 'Director'} approval. {isDirector ? 'Deploy your team.' : 'Start selling.'}
              </p>

              {/* Certification Status — Professional badge */}
              <div className="mt-4">
                <span
                  className={`inline-flex items-center gap-2 rounded border px-4 py-1.5 text-xs font-bold uppercase tracking-wider ${
                    isCertified
                      ? 'border-slate-500 bg-slate-800/50 text-slate-200'
                      : approvalSubmitted
                        ? 'border-slate-500 bg-slate-800/50 text-slate-300'
                        : isRep
                          ? 'border-slate-600 bg-slate-900/50 text-slate-400'
                          : 'border-slate-500 bg-slate-800/50 text-slate-200'
                  }`}
                >
                  {isCertified ? '' : approvalSubmitted ? '' : isRep ? '' : ''}
                  {certificationLabel}
                </span>
              </div>

              {/* Certification Module Checklist */}
              {(isRep || isDirector) && (
                <div className="mt-5 max-w-md mx-auto rounded-lg border border-slate-700 bg-slate-900/40 p-4 text-left">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Module Status
                  </h3>
                  <div className="space-y-1.5">
                    {trackOrder.map((code) => {
                      const progress = moduleProgress.find((p) => p.code === code);
                      const phase = progress?.phase ?? 'locked';
                      const mod = trackModules.find((m) => m.code === code);
                      const statusText =
                        phase === 'certified' || phase === 'acknowledged' ? 'COMPLETE' :
                        (phase as string) === 'demonstrate' || phase === 'quiz_passed' || phase === 'awaiting_coach' || phase === 'coach_review' ? 'IN PROGRESS' :
                        'LOCKED';
                      const statusColor =
                        phase === 'certified' || phase === 'acknowledged' ? 'text-slate-200' :
                        phase !== 'locked' ? 'text-slate-400' :
                        'text-slate-600';
                      return (
                        <div key={code} className="flex items-center justify-between text-xs">
                          <span className="text-slate-300 font-mono">{code}: {mod?.name ?? code}</span>
                          <span className={`font-bold tracking-wider ${statusColor}`}>{statusText}</span>
                        </div>
                      );
                    })}
                    <div className="border-t border-slate-700/50 pt-1.5 mt-1.5 flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-bold">{isDirector ? 'VP Review' : 'Director Review'}</span>
                      <span className={isCertified ? 'text-slate-200 font-bold' : approvalSubmitted ? 'text-slate-400 font-bold' : 'text-slate-500 font-bold'}>
                        {isCertified ? 'APPROVED' : approvalSubmitted ? 'PENDING' : 'NOT SUBMITTED'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Sales Operations Performance Metrics */}
              {isRep && isCertified && (
                <div className="mt-5 max-w-md mx-auto grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">This Month</p>
                    <p className="text-xl font-black text-white mt-0.5">{0}/4 Orders</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">4-order baseline</p>
                  </div>
                  <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Weekly Activity</p>
                    <p className="text-xl font-black text-white mt-0.5">{0}/40 Touchpoints</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Activity target</p>
                  </div>
                  <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-3 col-span-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Next Action</p>
                    <p className="text-sm font-bold text-white mt-0.5">Build pipeline — target 4 opportunities in qualifying</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Focus: consistent daily outreach</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Module Cards ── */}
        <div>
          <h2 className="text-lg font-black text-white mb-4 uppercase tracking-wider">
            CERTIFICATION MODULES
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {trackModules.map((module, idx) => {
              const progress = moduleProgress.find((p) => p.code === module.code);
              const phase = progress?.phase ?? 'locked';
              const quizResult = quizResults[module.code] ?? null;
              const coachReview = progress?.coachReview ?? getCoachReview(module.code) ?? null;

              const phaseColors: Record<string, string> = {
                certified: 'border-slate-600/50 bg-slate-900/50',
                acknowledged: 'border-slate-600/50 bg-slate-900/50',
                coach_review: 'border-slate-500/40 bg-slate-900/30',
                awaiting_coach: 'border-slate-600/40 bg-slate-900/30',
                demonstrate: 'border-slate-600/40 bg-slate-900/30',
                quiz_passed: 'border-slate-600/40 bg-slate-900/30',
                learn: 'border-slate-600/40 bg-slate-900/30',
                locked: 'border-slate-700/60 bg-slate-900/30 opacity-50',
              };

              const phaseLabel: Record<string, string> = {
                certified: 'COMPLETE',
                acknowledged: 'ACKNOWLEDGED',
                coach_review: 'Coach Review',
                awaiting_coach: 'Awaiting Coach',
                demonstrate: 'In Progress',
                quiz_passed: 'Quiz Passed',
                learn: 'Available',
                locked: 'Locked',
              };

              const exerciseProgressPercent =
                phase === 'demonstrate' ||
                phase === 'awaiting_coach' ||
                phase === 'coach_review' ||
                phase === 'acknowledged' ||
                phase === 'certified'
                  ? Math.min(
                      ((progress?.currentValue ?? 0) / (progress?.targetValue ?? 1)) * 100,
                      100
                    )
                  : 0;

              const philosophy = SALES_PHILOSOPHY[module.philosophyPrinciple - 1];
              const showExerciseBar =
                phase === 'demonstrate' ||
                phase === 'awaiting_coach' ||
                phase === 'coach_review';

              return (
                <div
                  key={module.code}
                  className={`rounded-xl border p-5 transition-all ${
                    phaseColors[phase] || phaseColors['locked']
                  }`}
                >
                  {/* Module Header */}
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {module.code}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        phase === 'certified' || phase === 'acknowledged'
                          ? 'bg-slate-700/40 text-slate-200 border-slate-500/40'
                          : phase === 'coach_review'
                            ? 'bg-slate-700/40 text-slate-300 border-slate-500/40'
                            : phase === 'awaiting_coach'
                              ? 'bg-slate-800/30 text-slate-400 border-slate-600/40'
                              : 'bg-slate-800/30 text-slate-500 border-slate-600/40'
                      }`}
                    >
                      {phaseLabel[phase] || phaseLabel['locked']}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-white mb-1.5">{module.name}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-2">
                    {module.description}
                  </p>

                  {/* Learning Content — expandable study section */}
                  {(phase === 'learn') && module.learnContent && (
                    <details className="mb-3 rounded-lg bg-slate-950/50 border border-slate-700/30 overflow-hidden group">
                      <summary className="cursor-pointer px-3 py-2 text-xs font-bold text-slate-300 uppercase tracking-wider hover:text-slate-200 select-none">
                        Study: What You Need to Learn
                      </summary>
                      <div className="px-3 pb-3 pt-1 text-xs text-slate-300 leading-relaxed border-t border-slate-700/20 space-y-3">
                        {Array.isArray(module.learnContent)
                          ? (module.learnContent as any[]).map((section: any, i: number) => (
                              <div key={i}>
                                {section.title && (
                                  <h4 className="text-xs font-bold text-blue-200 mb-1">{section.title}</h4>
                                )}
                                <p className="whitespace-pre-line">{section.body}</p>
                              </div>
                            ))
                          : <p className="whitespace-pre-line">{String(module.learnContent)}</p>
                        }
                      </div>
                    </details>
                  )}

                  {/* Exercise Status */}
                  {showExerciseBar && progress && (
                    <div className="mb-3 rounded-lg bg-slate-950/50 border border-slate-800/60 p-2.5">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Exercise Status
                      </p>
                      <p className="text-xs text-slate-500">{module.completionCriteria}</p>
                    </div>
                  )}

                  {/* Learn Phase */}
                  {phase === 'learn' && (
                    <div className="mb-3 space-y-2">
                      <button
                        onClick={() => handleOpenLearn(module.code)}
                        className="w-full rounded-lg border border-slate-600/40 bg-slate-800/40 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700/40 transition-colors"
                      >
                        Study Learning Content
                      </button>
                      <button
                        onClick={() => handleTakeQuiz(module.code)}
                        className="w-full rounded-lg border border-slate-600/40 bg-slate-800/40 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700/40 transition-colors"
                      >
                        Take Assessment
                      </button>
                    </div>
                  )}

                  {/* Quiz Passed / Demonstrate */}
                  {(phase === 'quiz_passed' || phase === 'demonstrate') && (
                    <div className="mb-3 space-y-2">
                      {quizResult && (
                        <div className="rounded-lg bg-slate-950/50 border border-slate-800/40 p-2.5 flex items-center justify-between">
                          <span
                            className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-bold uppercase ${
                              quizResult.passed
                                ? 'bg-slate-700/40 text-slate-200 border-slate-500/40'
                                : 'bg-slate-800/40 text-slate-400 border-slate-600/40'
                            }`}
                          >
                            {quizResult.passed ? 'PASSED' : 'NOT PASSED'}: {quizResult.score}%
                          </span>
                          <button
                            onClick={() => handleTakeQuiz(module.code)}
                            className="rounded-lg border border-slate-600/40 bg-slate-800/40 px-3 py-1 text-[10px] font-bold text-slate-300 hover:bg-slate-700/40 transition-colors"
                          >
                            Retake Assessment
                          </button>
                        </div>
                      )}
                      <div className="rounded-lg bg-slate-950/50 border border-slate-800/60 p-2.5">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Demonstrate
                        </p>
                        <p className="text-xs text-slate-400">{module.demonstrateTask}</p>
                      </div>
                      {/* Module-specific Demonstrate actions */}
                      {(module.code === 'ACAD-101' || module.code === 'DIR-1') && (
                        <button
                          onClick={() => setShowMissionModal(true)}
                          className="w-full rounded-lg border border-slate-600/40 bg-slate-800/40 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700/40 transition-colors"
                        >
                          {module.code === 'DIR-1' ? 'Write State Ownership Brief' : 'Write Mission Statement'}
                        </button>
                      )}
                      {module.code === 'ACAD-102' && (
                        <div className="space-y-1.5">
                          <Link
                            to="/organizations"
                            className="block w-full rounded-lg border border-slate-600/40 bg-slate-800/40 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700/40 transition-colors text-center"
                          >
                            Practice: Add Organizations →
                          </Link>
                          <Link
                            to="/opportunities"
                            className="block w-full rounded-lg border border-slate-600/40 bg-slate-800/40 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700/40 transition-colors text-center"
                          >
                            Practice: Log Activities →
                          </Link>
                        </div>
                      )}
                      {module.code === 'ACAD-103' && (
                        <Link
                          to="/opportunities"
                          className="block w-full rounded-lg border border-slate-600/40 bg-slate-800/40 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700/40 transition-colors text-center"
                        >
                          Practice: Create Discovery Opportunities →
                        </Link>
                      )}
                      {module.code === 'ACAD-104' && (
                        <Link
                          to="/opportunities"
                          className="block w-full rounded-lg border border-slate-600/40 bg-slate-800/40 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700/40 transition-colors text-center"
                        >
                          Practice: Build Proposals →
                        </Link>
                      )}
                      {module.code === 'ACAD-105' && (
                        <Link
                          to="/opportunities"
                          className="block w-full rounded-lg border border-slate-600/40 bg-slate-800/40 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700/40 transition-colors text-center"
                        >
                          Practice: Close &amp; Hand Off →
                        </Link>
                      )}
                      {module.code === 'DIR-2' && (
                        <Link
                          to="/recruiting"
                          className="block w-full rounded-lg border border-slate-600/40 bg-slate-800/40 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700/40 transition-colors text-center"
                        >
                          Work: Recruiting Pipeline →
                        </Link>
                      )}
                      {module.code === 'DIR-3' && (
                        <Link
                          to="/admin/certification"
                          className="block w-full rounded-lg border border-slate-600/40 bg-slate-800/40 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700/40 transition-colors text-center"
                        >
                          Work: Certification Reviews →
                        </Link>
                      )}
                      {module.code === 'DIR-4' && (
                        <Link
                          to="/territory"
                          className="block w-full rounded-lg border border-slate-600/40 bg-slate-800/40 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700/40 transition-colors text-center"
                        >
                          Work: Territory Map →
                        </Link>
                      )}
                      {module.code === 'DIR-5' && (
                        <Link
                          to="/team-opportunities"
                          className="block w-full rounded-lg border border-slate-600/40 bg-slate-800/40 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700/40 transition-colors text-center"
                        >
                          Work: Team Pipeline →
                        </Link>
                      )}
                    </div>
                  )}

                  {/* Awaiting Coach */}
                  {phase === 'awaiting_coach' && (
                    <div className="mb-3 rounded-lg border border-slate-700/40 bg-slate-900/30 p-3">
                      <p className="text-xs font-bold text-slate-300 mb-1">Awaiting Coach Review</p>
                      <p className="text-xs text-slate-500">
                        Your work has been submitted. {isDirector ? 'VP Sales' : 'Your Director'} will review and provide feedback.
                      </p>
                    </div>
                  )}

                  {/* Coach Review Ready */}
                  {phase === 'coach_review' && coachReview && (
                    <div className="mb-3 space-y-2">
                      <div className="rounded-lg border border-slate-600/40 bg-slate-900/30 p-3">
                        <p className="text-xs font-bold text-slate-300 mb-1">
                          Coach Review Ready
                        </p>
                        <p className="text-xs text-slate-500">
                          Reviewed by {coachReview.reviewedBy}. Open to view feedback and acknowledge.
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveCoachReview(module.code)}
                        className="w-full rounded-lg border border-purple-400/40 bg-purple-400/10 px-3 py-2 text-xs font-bold text-purple-200 hover:bg-purple-400/20 transition-colors"
                      >
                        View Coach Review & Acknowledge
                      </button>
                    </div>
                  )}

                  {/* Acknowledged */}
                  {phase === 'acknowledged' && (
                    <div className="mb-3 rounded-lg border border-slate-600/40 bg-slate-900/30 p-3">
                      <p className="text-xs font-bold text-slate-300 mb-1">Acknowledged</p>
                      <p className="text-xs text-slate-500">
                        Coach Review acknowledged. Module complete.
                      </p>
                    </div>
                  )}

                  {/* Certified */}
                  {(phase === 'certified') && (
                    <div className="mb-3 rounded-lg border border-slate-600/40 bg-slate-900/30 p-3">
                      <p className="text-xs font-bold text-slate-300 mb-1">Certified</p>
                      <p className="text-xs text-slate-400">
                        {certTitle}
                      </p>
                    </div>
                  )}

                  {/* Locked */}
                  {phase === 'locked' && (
                    <div className="mb-3 rounded-lg bg-slate-950/40 border border-slate-700/50 p-2.5">
                      <p className="text-xs text-slate-500 italic">
                        Complete {trackOrder[trackOrder.indexOf(module.code) - 1]} assessment first to access this module.
                      </p>
                    </div>
                  )}

                  {/* Philosophy Principle */}
                  <div className="rounded-lg bg-slate-950/50 border border-slate-800/40 p-2.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                      Philosophy #{philosophy.number}
                    </p>
                    <p className="text-xs text-slate-300 font-medium italic">
                      &ldquo;{philosophy.title}&rdquo;
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Resources / Sales Enablement ── */}
        <div className="border-t border-slate-800 pt-6">
          <h2 className="text-lg font-black text-white mb-1 uppercase tracking-wider">
            SALES ENABLEMENT RESOURCES
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Training manuals, templates, and reference materials — available to all roles.
          </p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Training Manuals */}
            {[
              {
                icon: '📖',
                name: 'Training Manual 01: The TUF Philosophy',
                desc: 'Core philosophy, mission, and values behind the TUF Sales System.',
                file: 'ACAD-101_TUF_Philosophy.html',
              },
              {
                icon: '🔍',
                name: 'Training Manual 02: Prospecting',
                desc: 'Identifying, qualifying, and engaging potential school partners.',
                file: 'ACAD-102_Prospecting.html',
              },
              {
                icon: '🎯',
                name: 'Training Manual 03: Discovery',
                desc: 'Running effective discovery meetings to uncover program needs.',
                file: 'ACAD-103_Discovery.html',
              },
              {
                icon: '📝',
                name: 'Training Manual 04: Proposal',
                desc: 'Building compelling proposals that win deals.',
                file: 'ACAD-104_Proposal.html',
              },
              {
                icon: '🤝',
                name: 'Training Manual 05: Order Handoff',
                desc: 'Seamless order processing and handoff procedures.',
                file: 'ACAD-105_Order_Handoff.html',
              },
              {
                icon: '🏷️',
                name: 'Training Manual 06: Product Knowledge',
                desc: 'Deep dive into TUF products, fabrics, and customization options.',
                file: 'ACAD-106_Product_Knowledge.html',
              },
              {
                icon: '📘',
                name: 'Complete Training Manual',
                desc: 'All six modules combined into one comprehensive document.',
                file: 'TRAINING_MANUAL_COMPLETE.md',
              },
            ].map((resource) => (
              <a
                key={resource.file}
                href={`/training/${resource.file}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-slate-700/50 bg-slate-900/30 p-5 hover:border-slate-500/50 hover:bg-slate-800/30 transition-all group"
              >
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-9 h-9 rounded-lg bg-slate-800/50 border border-slate-600/30 flex items-center justify-center text-lg">
                    {resource.icon}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-black text-white mb-1 group-hover:text-slate-200 transition-colors">
                      {resource.name}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed mb-2">
                      {resource.desc}
                    </p>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Open
                    </span>
                  </div>
                </div>
              </a>
            ))}

            {/* Email Template */}
            <a
              href="/training/FIRST_CONTACT_EMAIL_TEMPLATE.md"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-slate-700/50 bg-slate-900/30 p-5 hover:border-slate-500/50 hover:bg-slate-800/30 transition-all group"
            >
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-9 h-9 rounded-lg bg-slate-800/50 border border-slate-600/30 flex items-center justify-center text-lg">
                  ✉️
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-black text-white mb-1 group-hover:text-slate-200 transition-colors">
                    First Contact Email Template
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed mb-2">
                    Proven email template for initial outreach to coaches and ADs.
                  </p>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Open
                  </span>
                </div>
              </div>
            </a>

            {/* Product Cheat Sheet */}
            <a
              href="/training/product-cheat-sheets.md"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-slate-700/50 bg-slate-900/30 p-5 hover:border-slate-500/50 hover:bg-slate-800/30 transition-all group"
            >
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-9 h-9 rounded-lg bg-slate-800/50 border border-slate-600/30 flex items-center justify-center text-lg">
                  🏷️
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-black text-white mb-1 group-hover:text-slate-200 transition-colors">
                    Product Cheat Sheet
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed mb-2">
                    Quick reference for TUF products, pricing tiers, and fabric options.
                  </p>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Open
                  </span>
                </div>
              </div>
            </a>

            {/* Territory Map */}
            <a
              href="/training/territorymap_tuf_2026.png"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-slate-700/50 bg-slate-900/30 p-5 hover:border-slate-500/50 hover:bg-slate-800/30 transition-all group"
            >
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-9 h-9 rounded-lg bg-slate-800/50 border border-slate-600/30 flex items-center justify-center text-lg">
                  🗺️
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-black text-white mb-1 group-hover:text-slate-200 transition-colors">
                    Territory Map (2026)
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed mb-2">
                    Visual reference for TUF territory coverage across Minnesota.
                  </p>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Open
                  </span>
                </div>
              </div>
            </a>
          </div>
        </div>

        {/* ── Quiz Modal ── */}
        {activeQuiz && (
          <QuizModal
            moduleCode={activeQuiz}
            moduleName={moduleDefMap.get(activeQuiz)?.name ?? activeQuiz}
            questions={QUIZZES[activeQuiz]}
            quizResult={quizResults[activeQuiz] ?? null}
            onClose={() => setActiveQuiz(null)}
            onSubmit={handleQuizSubmit}
            submitting={submittingQuiz}
          />
        )}

        {/* ── Learn Content Modal ── */}
        {activeLearn && (
          <LearnContentModal
            module={moduleDefMap.get(activeLearn)!}
            onClose={() => setActiveLearn(null)}
          />
        )}

        {/* ── Mission Statement Modal ── */}
        {showMissionModal && (
          <MissionStatementModal
            existingText={missionStatement}
            title={isDirector ? 'Your State Ownership Brief' : 'Your Mission Statement'}
            subtitle={
              isDirector
                ? 'Define how you will own your state. This will be reviewed by VP Sales.'
                : "Explain TUF's mission in your own words. This will be reviewed by your Director."
            }
            prompt={
              isDirector
                ? 'What state do you own? How will you build your 4-6 TAE team? What is your revenue responsibility, and what does your weekly rhythm look like — pipeline reviews, ride-alongs, certifications, forecast? Write 5-8 sentences.'
                : 'Why does TUF exist? What is our mission? How do the 7 Sales Philosophy principles guide you as a Territory Account Executive? Write 3-5 sentences.'
            }
            saveLabel={isDirector ? 'Save State Ownership Brief' : 'Save Mission Statement'}
            onClose={() => setShowMissionModal(false)}
            onSave={handleSaveMission}
          />
        )}

        {/* ── Coach Review Modal ── */}
        {activeCoachReview && getCoachReview(activeCoachReview) && (
          <CoachReviewModal
            moduleName={moduleDefMap.get(activeCoachReview)?.name ?? activeCoachReview}
            moduleCode={activeCoachReview}
            coachReview={getCoachReview(activeCoachReview)!}
            onClose={() => setActiveCoachReview(null)}
            onAcknowledge={() => handleAcknowledge(activeCoachReview)}
            acknowledging={acknowledging}
          />
        )}

        {/* ── Submit for Certification Section ── */}
        {(isRep || isDirector) && completeCount === moduleCount && !approvalSubmitted && !isCertified && (
          <div className="rounded-2xl border border-slate-700/50 bg-slate-900/30 p-6 mt-6">
            <div className="flex items-start gap-3">
              <div>
                <h2 className="text-lg font-black text-white uppercase tracking-wider">
                  Submit for {certTitle}
                </h2>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                  All modules have been reviewed and acknowledged. Submit for {isDirector ? 'VP' : 'Director'} certification.
                </p>
                {approvalError && (
                  <div className="mt-3 rounded-lg border border-red-400/20 bg-red-500/5 p-3 text-xs text-red-200">
                    {approvalError}
                  </div>
                )}
                <button
                  onClick={handleSubmitForApproval}
                  disabled={submittingForApproval}
                  className="mt-2 rounded-lg border border-purple-400/40 bg-purple-400/10 px-5 py-2 text-sm font-bold text-purple-200 hover:bg-purple-400/20 disabled:opacity-40 transition-colors"
                >
                  {submittingForApproval ? 'Submitting...' : 'Submit for Certification'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Submitted State ── */}
        {approvalSubmitted && !isCertified && (
          <div className="rounded-2xl border border-slate-700/50 bg-slate-900/30 p-6 mb-6">
            <div className="flex items-start gap-3">
              <div>
                <h2 className="text-lg font-black text-white uppercase tracking-wider">Submitted for {isDirector ? 'VP' : 'Director'} Certification</h2>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                  Your certification submission is under review. {isDirector ? 'VP Sales' : 'The Director'} will review your completed
                  modules, Coach Reviews, and decide: &ldquo;{isDirector ? 'Would I trust you with one of our states?' : 'Would I trust you with one of our schools?'}&rdquo;
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Sales Philosophy ── */}
        <div>
          <button
            onClick={() => setShowPhilosophy(!showPhilosophy)}
            className="w-full flex items-center justify-between rounded-xl border border-slate-700/50 bg-slate-900/30 p-4 hover:border-slate-500/50 transition-colors"
          >
            <h2 className="text-lg font-black text-white uppercase tracking-wider">The 7 Sales Philosophy Principles</h2>
            <span className="text-slate-400 text-lg">{showPhilosophy ? '▲' : '▼'}</span>
          </button>

          {showPhilosophy && (
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {SALES_PHILOSOPHY.map((principle) => (
                <div
                  key={principle.number}
                  className="rounded-xl border border-slate-700/50 bg-slate-900/30 p-4 hover:border-slate-600/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-800 border border-slate-600/40 flex items-center justify-center text-xs font-black text-slate-300">
                      {principle.number}
                    </span>
                    <div>
                      <h3 className="text-sm font-black text-white mb-1">
                        {principle.title}
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {principle.meaning}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Footer Status Boxes ── */}
        {(isRep || isDirector) && !isCertified && !approvalSubmitted && completeCount < moduleCount && (
          <div className="rounded-2xl border border-slate-700/50 bg-slate-900/30 p-6">
            <div className="flex items-start gap-3">
              <div>
                <h2 className="text-lg font-black text-white uppercase tracking-wider">
                  {isDirector ? 'Director Certification In Progress' : 'CRM Access is Gated'}
                </h2>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                  {isDirector
                    ? 'Complete all modules (Learn → Demonstrate → Coach Review → Acknowledge), then submit for VP certification.'
                    : 'Complete all modules (Learn → Demonstrate → Coach Review → Acknowledge), then submit for Director certification to access the full CRM.'}
                </p>
                <p className="mt-3 text-xs text-slate-500 font-medium">
                  {moduleCount - completeCount} module{moduleCount - completeCount !== 1 ? 's' : ''} remaining before
                  you can submit for {certTitle}.
                </p>
              </div>
            </div>
          </div>
        )}

        {isCertified && (
          <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/5 p-6 backdrop-blur-md">
            <div className="flex items-start gap-3">
              <div>
                <h2 className="text-lg font-black text-white">
                  {certTitle}
                </h2>
                <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                  {isDirector
                    ? 'Certification complete. Keep the weekly rhythm — pipeline reviews, ride-alongs, certifications, forecast.'
                    : 'Full CRM access has been granted. Continue building your pipeline toward the 4-order monthly baseline.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
