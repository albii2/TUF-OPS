import { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getStoredUser } from '../auth';
import {
  LEVEL_1_MODULES,
  SALES_PHILOSOPHY,
  QUIZZES,
  QUIZ_PASS_THRESHOLD,
  MODULE_ORDER,
  CERTIFICATION_TITLE,
  detectAllModules,
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
  onClose,
  onSave,
}: {
  existingText: string;
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
            <h2 className="text-lg font-black text-white">Your Mission Statement</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Explain TUF's mission in your own words. This will be reviewed by your Director.
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
            Why does TUF exist? What is our mission? How do the 7 Sales Philosophy principles
            guide you as a Territory Account Executive? Write 3-5 sentences.
          </p>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write your mission statement here..."
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
            Save Mission Statement
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
          <h3 className="text-sm font-black text-emerald-300 mb-2">💪 Strengths</h3>
          <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
            {coachReview.strengths || 'No strengths noted.'}
          </p>
        </div>

        {/* Corrections */}
        <div className="mb-4 rounded-lg border border-amber-400/20 bg-amber-400/5 p-4">
          <h3 className="text-sm font-black text-amber-300 mb-2">🔧 Corrections</h3>
          <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
            {coachReview.corrections || 'No corrections noted.'}
          </p>
        </div>

        {/* Coaching Notes */}
        <div className="mb-6 rounded-lg border border-cyan-400/20 bg-cyan-400/5 p-4">
          <h3 className="text-sm font-black text-cyan-300 mb-2">📝 Coaching Notes</h3>
          <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
            {coachReview.coachingNotes || 'No coaching notes.'}
          </p>
        </div>

        {/* Acknowledge */}
        <div className="rounded-lg border border-purple-400/30 bg-purple-400/5 p-4">
          <p className="text-sm text-slate-300 mb-3">
            Review the Director's feedback above. When you're ready, acknowledge to unlock the next module.
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
              📖 {module.name} — Learn
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
            💡 <strong>Philosophy Principle #{module.philosophyPrinciple}:</strong>{' '}
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
  const userName = user?.name ?? 'TAE';
  const userId = user?.id ?? '';

  // Load progress
  useEffect(() => {
    markPageVisited('academy');
    refreshProgress();

    const interval = setInterval(refreshProgress, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const refreshProgress = useCallback(() => {
    const progress = detectAllModules();
    setModuleProgress(progress);

    // Save certification record WITHOUT auto-certifying
    if (user) {
      saveCertificationRecord({
        userId: user.id,
        userName: user.name,
        role: user.role,
        isLevel1Certified: isCertified,
        certificationTitle: CERTIFICATION_TITLE,
        moduleProgress: progress,
        lastChecked: new Date().toISOString(),
      });
    }
  }, [user, isCertified]);

  const verifiedCount = verifiedModuleCount(moduleProgress);
  const completeCount = moduleProgress.filter(
    (m) => m.phase === 'acknowledged' || m.phase === 'certified'
  ).length;
  const quizResults = getQuizResults();
  const submission = useMemo(() => getSubmission(userId), [userId]);
  const missionStatement = getMissionStatement(userId);

  const certificationLabel = isCertified
    ? `${CERTIFICATION_TITLE} — Full CRM Access Granted`
    : isRep
      ? approvalSubmitted
        ? 'Submitted for Director Review — Pending'
        : `Academy Progress: ${completeCount}/5 Modules Complete — Coach Review Required`
      : 'Director/Admin — Full CRM Access';

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
        'All 5 modules must go through Coach Review and you must acknowledge each one before submitting for certification.'
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
    LEVEL_1_MODULES.forEach((m) => map.set(m.code, m));
    return map;
  }, []);

  // ─── Render ──

  return (
    <div className="min-h-screen text-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* ── Header ── */}
        <div className="relative overflow-hidden rounded-2xl border border-cyan-400/20 bg-[radial-gradient(circle_at_top_left,rgba(31,182,255,0.22),transparent_38%),linear-gradient(135deg,rgba(7,12,19,0.98),rgba(3,7,12,0.94))] p-5 shadow-2xl shadow-cyan-950/30 md:p-7">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="mx-auto max-w-3xl">
              <img
                src={TufAcademyLogo}
                alt="TUF Academy"
                className="mx-auto h-14 w-auto object-contain drop-shadow-[0_0_22px_rgba(31,182,255,0.25)] sm:h-16"
              />
              <h1 className="mt-3 text-2xl font-black leading-tight text-white md:text-4xl">
                TUF Academy — TUF Sales System Certification
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Master the TUF Sales System through five modules: Philosophy, Prospecting, Discovery,
                Proposal, and Order Handoff. Learn → Demonstrate → Coach Review → Deploy.
              </p>

              {/* Certification Status */}
              <div className="mt-4">
                <span
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-wider ${statusColor}`}
                >
                  {isCertified ? '🎉' : approvalSubmitted ? '◆' : isRep ? '●' : '◆'}{' '}
                  {certificationLabel}
                </span>
              </div>

              {/* Progress Bar for reps */}
              {isRep && (
                <div className="mt-4 max-w-md mx-auto">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Certification Progress</span>
                    <span>{verifiedCount} / 5 ({certificationProgress(moduleProgress)}%)</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${certificationProgress(moduleProgress)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Module Cards ── */}
        <div>
          <h2 className="text-xl font-black text-white mb-4 flex items-center gap-2">
            <span>📋</span> TUF Sales System — Level 1 Modules
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {LEVEL_1_MODULES.map((module, idx) => {
              const progress = moduleProgress.find((p) => p.code === module.code);
              const phase = progress?.phase ?? 'locked';
              const quizResult = quizResults[module.code] ?? null;
              const coachReview = progress?.coachReview ?? getCoachReview(module.code) ?? null;

              const phaseColors: Record<string, string> = {
                certified: 'border-emerald-400/30 bg-emerald-400/5 shadow-[0_0_12px_rgba(16,185,129,0.08)]',
                acknowledged: 'border-emerald-400/30 bg-emerald-400/5 shadow-[0_0_12px_rgba(16,185,129,0.08)]',
                coach_review: 'border-purple-400/30 bg-purple-400/5',
                awaiting_coach: 'border-amber-400/30 bg-amber-400/5',
                demonstrate: 'border-cyan-400/30 bg-cyan-400/5',
                quiz_passed: 'border-cyan-400/30 bg-cyan-400/5',
                learn: 'border-blue-400/30 bg-blue-400/5',
                locked: 'border-slate-700/60 bg-slate-900/30 opacity-50',
              };

              const phaseLabel: Record<string, string> = {
                certified: '✓ Deploy',
                acknowledged: '✓ Acknowledged',
                coach_review: '◆ Coach Review',
                awaiting_coach: '⏳ Awaiting Coach',
                demonstrate: '▶ Demonstrate',
                quiz_passed: '✓ Quiz Passed',
                learn: '📖 Learn',
                locked: '🔒 Locked',
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
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                      {module.code}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        phase === 'certified' || phase === 'acknowledged'
                          ? 'bg-emerald-400/20 text-emerald-200 border-emerald-400/30'
                          : phase === 'coach_review'
                            ? 'bg-purple-400/20 text-purple-200 border-purple-400/30'
                            : phase === 'awaiting_coach'
                              ? 'bg-amber-400/20 text-amber-200 border-amber-400/30'
                              : phase === 'demonstrate'
                                ? 'bg-cyan-400/20 text-cyan-200 border-cyan-400/30'
                                : phase === 'quiz_passed'
                                  ? 'bg-cyan-400/20 text-cyan-200 border-cyan-400/30'
                                  : phase === 'learn'
                                    ? 'bg-blue-400/20 text-blue-200 border-blue-400/30'
                                    : 'bg-slate-700/40 text-slate-400 border-slate-600/30'
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
                  {(status === 'available' || status === 'quiz_available') && module.learnContent && (
                    <details className="mb-3 rounded-lg bg-slate-950/50 border border-blue-900/30 overflow-hidden group">
                      <summary className="cursor-pointer px-3 py-2 text-xs font-bold text-blue-300 uppercase tracking-wider hover:text-blue-200 select-none">
                        📖 Study: What You Need to Learn
                      </summary>
                      <div className="px-3 pb-3 pt-1 text-xs text-slate-300 leading-relaxed border-t border-blue-900/20 space-y-3">
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

                  {/* Exercise Progress Bar */}
                  {showExerciseBar && progress && (
                    <div className="mb-3 rounded-lg bg-slate-950/50 border border-slate-800/60 p-2.5">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Demonstrate Progress
                      </p>
                      <p className="text-xs text-slate-300">{module.completionCriteria}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all bg-cyan-400"
                            style={{ width: `${exerciseProgressPercent}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap">
                          {progress?.currentValue ?? 0}/{progress?.targetValue ?? '?'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Learn Phase */}
                  {phase === 'learn' && (
                    <div className="mb-3 space-y-2">
                      <button
                        onClick={() => handleOpenLearn(module.code)}
                        className="w-full rounded-lg border border-blue-400/30 bg-blue-400/5 px-3 py-2 text-xs font-bold text-blue-200 hover:bg-blue-400/10 transition-colors"
                      >
                        📖 Study Learning Content
                      </button>
                      <button
                        onClick={() => handleTakeQuiz(module.code)}
                        className="w-full rounded-lg border border-cyan-400/30 bg-cyan-400/5 px-3 py-2 text-xs font-bold text-cyan-200 hover:bg-cyan-400/10 transition-colors"
                      >
                        📝 Take Quiz
                      </button>
                    </div>
                  )}

                  {/* Quiz Passed / Demonstrate */}
                  {(phase === 'quiz_passed' || phase === 'demonstrate') && (
                    <div className="mb-3 space-y-2">
                      {quizResult && (
                        <div className="rounded-lg bg-[#0d1520] border border-slate-800/40 p-2.5 flex items-center justify-between">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${
                              quizResult.passed
                                ? 'bg-emerald-400/20 text-emerald-200 border-emerald-400/30'
                                : 'bg-amber-400/20 text-amber-200 border-amber-400/30'
                            }`}
                          >
                            {quizResult.passed ? '✓' : '✗'} Quiz: {quizResult.score}%
                          </span>
                          <button
                            onClick={() => handleTakeQuiz(module.code)}
                            className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-[10px] font-bold text-cyan-200 hover:bg-cyan-400/20 transition-colors"
                          >
                            Retake Quiz
                          </button>
                        </div>
                      )}
                      <div className="rounded-lg bg-slate-950/50 border border-slate-800/60 p-2.5">
                        <p className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider mb-1">
                          ▶ Demonstrate
                        </p>
                        <p className="text-xs text-slate-400">{module.demonstrateTask}</p>
                      </div>
                      {/* Module-specific Demonstrate actions */}
                      {module.code === 'ACAD-101' && (
                        <button
                          onClick={() => setShowMissionModal(true)}
                          className="w-full rounded-lg border border-emerald-400/30 bg-emerald-400/5 px-3 py-2 text-xs font-bold text-emerald-200 hover:bg-emerald-400/10 transition-colors"
                        >
                          ✍️ Write Mission Statement
                        </button>
                      )}
                      {module.code === 'ACAD-102' && (
                        <div className="space-y-1.5">
                          <Link
                            to="/organizations"
                            className="block w-full rounded-lg border border-cyan-400/30 bg-cyan-400/5 px-3 py-2 text-xs font-bold text-cyan-200 hover:bg-cyan-400/10 transition-colors text-center"
                          >
                            Practice: Add Organizations →
                          </Link>
                          <Link
                            to="/opportunities"
                            className="block w-full rounded-lg border border-cyan-400/30 bg-cyan-400/5 px-3 py-2 text-xs font-bold text-cyan-200 hover:bg-cyan-400/10 transition-colors text-center"
                          >
                            Practice: Log Activities →
                          </Link>
                        </div>
                      )}
                      {module.code === 'ACAD-103' && (
                        <Link
                          to="/opportunities"
                          className="block w-full rounded-lg border border-cyan-400/30 bg-cyan-400/5 px-3 py-2 text-xs font-bold text-cyan-200 hover:bg-cyan-400/10 transition-colors text-center"
                        >
                          Practice: Create Discovery Opportunities →
                        </Link>
                      )}
                      {module.code === 'ACAD-104' && (
                        <Link
                          to="/opportunities"
                          className="block w-full rounded-lg border border-cyan-400/30 bg-cyan-400/5 px-3 py-2 text-xs font-bold text-cyan-200 hover:bg-cyan-400/10 transition-colors text-center"
                        >
                          Practice: Build Proposals →
                        </Link>
                      )}
                      {module.code === 'ACAD-105' && (
                        <Link
                          to="/opportunities"
                          className="block w-full rounded-lg border border-cyan-400/30 bg-cyan-400/5 px-3 py-2 text-xs font-bold text-cyan-200 hover:bg-cyan-400/10 transition-colors text-center"
                        >
                          Practice: Close & Hand Off →
                        </Link>
                      )}
                    </div>
                  )}

                  {/* Awaiting Coach */}
                  {phase === 'awaiting_coach' && (
                    <div className="mb-3 rounded-lg border border-amber-400/20 bg-amber-400/5 p-3">
                      <p className="text-xs font-bold text-amber-300 mb-1">⏳ Awaiting Coach Review</p>
                      <p className="text-xs text-slate-400">
                        Your work has been submitted. Your Director will review and provide feedback.
                      </p>
                    </div>
                  )}

                  {/* Coach Review Ready */}
                  {phase === 'coach_review' && coachReview && (
                    <div className="mb-3 space-y-2">
                      <div className="rounded-lg border border-purple-400/20 bg-purple-400/5 p-3">
                        <p className="text-xs font-bold text-purple-300 mb-1">
                          ◆ Coach Review Ready
                        </p>
                        <p className="text-xs text-slate-400">
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
                    <div className="mb-3 rounded-lg border border-emerald-400/20 bg-emerald-400/5 p-3">
                      <p className="text-xs font-bold text-emerald-300 mb-1">✓ Acknowledged</p>
                      <p className="text-xs text-slate-400">
                        Coach Review acknowledged. Module complete!
                      </p>
                    </div>
                  )}

                  {/* Certified */}
                  {(phase === 'certified') && (
                    <div className="mb-3 rounded-lg border border-emerald-400/20 bg-emerald-400/5 p-3">
                      <p className="text-xs font-bold text-emerald-300 mb-1">🎉 Certified</p>
                      <p className="text-xs text-slate-400">
                        {CERTIFICATION_TITLE}
                      </p>
                    </div>
                  )}

                  {/* Locked */}
                  {phase === 'locked' && (
                    <div className="mb-3 rounded-lg bg-slate-950/40 border border-slate-700/50 p-2.5">
                      <p className="text-xs text-slate-500 italic">
                        🔒 Complete {MODULE_ORDER[MODULE_ORDER.indexOf(module.code) - 1]} first (acknowledge Coach Review).
                      </p>
                    </div>
                  )}

                  {/* Philosophy Principle */}
                  <div className="rounded-lg bg-[#0d1520] border border-slate-800/40 p-2.5">
                    <p className="text-[10px] font-bold text-amber-400/80 uppercase tracking-wider mb-0.5">
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
        {isRep && completeCount === 5 && !approvalSubmitted && !isCertified && (
          <div className="rounded-2xl border border-purple-400/25 bg-purple-500/5 p-6 backdrop-blur-md mt-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📋</span>
              <div>
                <h2 className="text-lg font-black text-white">
                  Submit for {CERTIFICATION_TITLE}
                </h2>
                <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                  All 5 modules have been reviewed and acknowledged. Submit for Director certification.
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
          <div className="rounded-2xl border border-purple-400/25 bg-purple-500/5 p-6 backdrop-blur-md mb-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl">◆</span>
              <div>
                <h2 className="text-lg font-black text-white">Submitted for Director Certification</h2>
                <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                  Your certification submission is under review. The Director will review your completed
                  modules, Coach Reviews, and decide: &ldquo;Would I trust you with one of our schools?&rdquo;
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Sales Philosophy ── */}
        <div>
          <button
            onClick={() => setShowPhilosophy(!showPhilosophy)}
            className="w-full flex items-center justify-between rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 hover:border-amber-400/40 transition-colors"
          >
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <span>🧠</span> The 7 Sales Philosophy Principles
            </h2>
            <span className="text-amber-400 text-lg">{showPhilosophy ? '▲' : '▼'}</span>
          </button>

          {showPhilosophy && (
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {SALES_PHILOSOPHY.map((principle) => (
                <div
                  key={principle.number}
                  className="rounded-xl border border-amber-400/15 bg-[#0d1520] p-4 hover:border-amber-400/30 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-xs font-black text-amber-300">
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
        {isRep && !isCertified && !approvalSubmitted && completeCount < 5 && (
          <div className="rounded-2xl border border-amber-400/25 bg-amber-500/5 p-6 backdrop-blur-md">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🔒</span>
              <div>
                <h2 className="text-lg font-black text-white">CRM Access is Gated</h2>
                <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                  Complete all 5 modules (Learn → Demonstrate → Coach Review → Acknowledge),
                  then submit for Director certification to unlock the full CRM.
                </p>
                <p className="mt-3 text-xs text-amber-300 font-medium">
                  {5 - completeCount} module{5 - completeCount !== 1 ? 's' : ''} remaining before
                  you can submit for {CERTIFICATION_TITLE}.
                </p>
              </div>
            </div>
          </div>
        )}

        {isCertified && (
          <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/5 p-6 backdrop-blur-md">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🎉</span>
              <div>
                <h2 className="text-lg font-black text-white">
                  {CERTIFICATION_TITLE}!
                </h2>
                <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                  Full CRM access has been unlocked. You can now access all TUF Ops features.
                  Continue building your pipeline and working toward Level 2 certification.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
