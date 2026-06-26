import { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getStoredUser } from '../auth';
import {
  LEVEL_1_MODULES,
  SALES_PHILOSOPHY,
  QUIZZES,
  QUIZ_PASS_THRESHOLD,
  detectAllModules,
  isLevel1Complete,
  verifiedModuleCount,
  certificationProgress,
  getQuizResults,
  gradeQuiz,
  submitForApproval,
  saveCertificationRecord,
  getSubmission,
  markPageVisited,
  MODULE_ORDER,
  type ModuleProgress,
  type AcademyModule,
  type AcademyModuleCode,
  type QuizQuestion,
  type QuizResult,
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

// ─── Main Academy Page ────────────────────────────────────────────────────

export default function AcademyPage() {
  const user = getStoredUser();
  const [moduleProgress, setModuleProgress] = useState<ModuleProgress[]>([]);
  const [showPhilosophy, setShowPhilosophy] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState<AcademyModuleCode | null>(null);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
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
        moduleProgress: progress,
        lastChecked: new Date().toISOString(),
      });
    }
  }, [user, userId, isCertified]);

  const verifiedCount = verifiedModuleCount(moduleProgress);
  const completeCount = moduleProgress.filter((m) => m.status === 'verified').length;
  const quizResults = getQuizResults();
  const submission = useMemo(() => getSubmission(userId), [userId]);

  const certificationLabel = isCertified
    ? 'Level 1 Certified — Full CRM Access Granted'
    : isRep
      ? approvalSubmitted
        ? 'Submitted for Director Approval — Pending Review'
        : `Academy Progress: ${completeCount}/5 Modules Complete — Submit for Certification`
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
        const result = gradeQuiz(activeQuiz, answers);
        setSubmittingQuiz(false);
        // Refresh progress after quiz
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

  const handleSubmitForApproval = useCallback(async () => {
    if (!isLevel1Complete(moduleProgress)) {
      setApprovalError('All 5 modules must be verified (quiz passed + exercise completed) before submitting.');
      return;
    }
    setSubmittingForApproval(true);
    setApprovalError(null);
    try {
      submitForApproval(userId, userName);
      setApprovalSubmitted(true);
      refreshProgress();
    } catch (e) {
      setApprovalError(e instanceof Error ? e.message : 'Failed to submit. Please try again.');
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
                TUF Academy — Level 1 Certification
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Pass the quiz for each module, complete the real-world exercise,
                and submit for Director approval to earn your Level 1 Certification.
              </p>

              {/* Certification Status */}
              <div className="mt-4">
                <span
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-wider ${statusColor}`}
                >
                  {isCertified ? '✓' : approvalSubmitted ? '◆' : isRep ? '●' : '◆'}{' '}
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
            <span>📋</span> Level 1 Training Modules
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {LEVEL_1_MODULES.map((module, idx) => {
              const progress = moduleProgress.find((p) => p.code === module.code);
              const status = progress?.status ?? 'locked';
              const quizResult = quizResults[module.code] ?? null;

              const statusColors: Record<string, string> = {
                verified: 'border-emerald-400/30 bg-emerald-400/5',
                submitted: 'border-purple-400/30 bg-purple-400/5',
                approved: 'border-emerald-400/30 bg-emerald-400/5',
                quiz_passed: 'border-amber-400/30 bg-amber-400/5',
                available: 'border-cyan-400/30 bg-cyan-400/5',
                locked: 'border-slate-700/60 bg-slate-900/30 opacity-50',
              };

              const statusLabel: Record<string, string> = {
                verified: '✓ Verified',
                submitted: '◆ Submitted',
                approved: '✓ Certified',
                quiz_passed: '✓ Quiz Passed',
                available: '○ Available',
                locked: '🔒 Locked',
              };

              const exerciseProgressPercent =
                status === 'verified' || status === 'quiz_passed'
                  ? Math.min((progress?.currentValue ?? 0) / (progress?.targetValue ?? 1) * 100, 100)
                  : 0;

              const philosophy = SALES_PHILOSOPHY[module.philosophyPrinciple - 1];
              const isExerciseActive = status === 'quiz_passed' || status === 'verified' || status === 'submitted' || status === 'approved';
              const showExerciseBar = status === 'quiz_passed' || status === 'verified';

              return (
                <div
                  key={module.code}
                  className={`rounded-xl border p-5 transition-all ${statusColors[status] || statusColors['locked']} ${
                    status === 'verified' || status === 'approved'
                      ? 'shadow-[0_0_12px_rgba(16,185,129,0.08)]'
                      : status === 'submitted'
                        ? 'shadow-[0_0_12px_rgba(147,51,234,0.08)]'
                        : ''
                  }`}
                >
                  {/* Module Header */}
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                      {module.code}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        status === 'verified' || status === 'approved'
                          ? 'bg-emerald-400/20 text-emerald-200 border-emerald-400/30'
                          : status === 'submitted'
                            ? 'bg-purple-400/20 text-purple-200 border-purple-400/30'
                            : status === 'quiz_passed'
                              ? 'bg-amber-400/20 text-amber-200 border-amber-400/30'
                              : status === 'available'
                                ? 'bg-cyan-400/20 text-cyan-200 border-cyan-400/30'
                                : 'bg-slate-700/40 text-slate-400 border-slate-600/30'
                      }`}
                    >
                      {statusLabel[status] || statusLabel['locked']}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-white mb-1.5">{module.name}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-2">
                    {module.description}
                  </p>

                  {/* Learning Content — expandable study section */}
                  {(status === 'available' || status === 'quiz_available') && module.learningContent && (
                    <details className="mb-3 rounded-lg bg-slate-950/50 border border-blue-900/30 overflow-hidden group">
                      <summary className="cursor-pointer px-3 py-2 text-xs font-bold text-blue-300 uppercase tracking-wider hover:text-blue-200 select-none">
                        📖 Study: What You Need to Learn
                      </summary>
                      <div className="px-3 pb-3 pt-1 text-xs text-slate-300 leading-relaxed whitespace-pre-line border-t border-blue-900/20">
                        {module.learningContent}
                      </div>
                    </details>
                  )}

                  {/* Exercise Progress Bar */}
                  {showExerciseBar && progress && (
                    <div className="mb-3 rounded-lg bg-slate-950/50 border border-slate-800/60 p-2.5">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        {status === 'quiz_passed' ? 'Now Practicing' : 'Exercise Complete'}
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

                  {/* Quiz Section */}
                  {quizResult ? (
                    <div className="mb-3 rounded-lg bg-[#0d1520] border border-slate-800/40 p-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${
                            quizResult.passed
                              ? 'bg-emerald-400/20 text-emerald-200 border-emerald-400/30'
                              : 'bg-amber-400/20 text-amber-200 border-amber-400/30'
                          }`}
                        >
                          {quizResult.passed ? '✓' : '✗'} Quiz: {quizResult.score}%
                        </span>
                        <span className="text-[10px] text-slate-500">
                          ({quizResult.attempts} attempt{quizResult.attempts !== 1 ? 's' : ''})
                        </span>
                      </div>
                      <button
                        onClick={() => handleTakeQuiz(module.code)}
                        className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-[10px] font-bold text-cyan-200 hover:bg-cyan-400/20 transition-colors"
                      >
                        {quizResult.passed ? 'Retake Quiz' : 'Take Quiz'}
                      </button>
                    </div>
                  ) : status === 'available' ? (
                    <div className="mb-3 rounded-lg bg-[#0d1520] border border-cyan-400/20 p-3">
                      <p className="text-xs font-bold text-cyan-300 mb-2">
                        📝 Quiz Required
                      </p>
                      <p className="text-xs text-slate-400">
                        Pass the quiz ({QUIZ_PASS_THRESHOLD}%) to unlock the practical exercise.
                      </p>
                      <button
                        onClick={() => handleTakeQuiz(module.code)}
                        className="mt-2 rounded-lg border border-cyan-400/40 bg-cyan-400/10 px-4 py-1.5 text-xs font-bold text-cyan-200 hover:bg-cyan-400/20 transition-colors"
                      >
                        Take Quiz
                      </button>
                    </div>
                  ) : status === 'locked' ? (
                    <div className="mb-3 rounded-lg bg-slate-950/40 border border-slate-700/50 p-2.5">
                      <p className="text-xs text-slate-500 italic">
                        🔒 Complete {MODULE_ORDER[MODULE_ORDER.indexOf(module.code) - 1]} first.
                      </p>
                    </div>
                  ) : null}

                  {/* Philosophy Principle */}
                  <div className="rounded-lg bg-[#0d1520] border border-slate-800/40 p-2.5">
                    <p className="text-[10px] font-bold text-amber-400/80 uppercase tracking-wider mb-0.5">
                      Philosophy #{philosophy.number}
                    </p>
                    <p className="text-xs text-slate-300 font-medium italic">
                      &ldquo;{philosophy.title}&rdquo;
                    </p>
                  </div>

                  {/* Practice Link (for reps) */}
                  {isRep && !isCertified && status !== 'verified' && status !== 'approved' && status !== 'submitted' && (
                    <div className="mt-3">
                      {module.code === 'ACAD-101' && (
                        <Link
                          to="/opportunities"
                          className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 uppercase tracking-wider"
                        >
                          Practice: Go to Opportunities →
                        </Link>
                      )}
                      {module.code === 'ACAD-102' && (
                        <Link
                          to="/organizations"
                          className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 uppercase tracking-wider"
                        >
                          Practice: Create Organizations →
                        </Link>
                      )}
                      {module.code === 'ACAD-103' && (
                        <Link
                          to="/opportunities"
                          className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 uppercase tracking-wider"
                        >
                          Practice: Build Pipeline →
                        </Link>
                      )}
                      {module.code === 'ACAD-104' && (
                        <Link
                          to="/organizations"
                          className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 uppercase tracking-wider"
                        >
                          Practice: Log Activities →
                        </Link>
                      )}
                      {module.code === 'ACAD-105' && (
                        <Link
                          to="/dashboard"
                          className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 uppercase tracking-wider"
                        >
                          Practice: Navigate TUF Ops →
                        </Link>
                      )}
                    </div>
                  )}
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

        {/* ── Submit for Approval Section ── */}
        {isRep && verifiedCount === 5 && !approvalSubmitted && !isCertified && (
          <div className="rounded-2xl border border-purple-400/25 bg-purple-500/5 p-6 backdrop-blur-md mt-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📋</span>
              <div>
                <h2 className="text-lg font-black text-white">Submit for Level 1 Certification</h2>
                <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                  All 5 modules are complete. Submit for Director review to earn your certification.
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
                  {submittingForApproval ? 'Submitting...' : 'Submit for Director Approval'}
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
                <h2 className="text-lg font-black text-white">Submitted for Director Approval</h2>
                <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                  Your certification submission is under review. The Director will review your quiz scores,
                  exercise verification, and decide: &ldquo;Would I trust you with one of our schools?&rdquo;
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
        {isRep && !isCertified && !approvalSubmitted && verifiedCount < 5 && (
          <div className="rounded-2xl border border-amber-400/25 bg-amber-500/5 p-6 backdrop-blur-md">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🔒</span>
              <div>
                <h2 className="text-lg font-black text-white">CRM Access is Gated</h2>
                <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                  Complete all 5 modules (quiz + exercise), then submit for
                  Director approval to unlock the full CRM.
                </p>
                <p className="mt-3 text-xs text-amber-300 font-medium">
                  {5 - verifiedCount} module{5 - verifiedCount !== 1 ? 's' : ''} remaining before
                  you can submit.
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
                  You Are Level 1 Certified!
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
