import React, { useState, useEffect } from 'react';
import { TrainingModule, TrainingProgress, TrainingEnrollment } from '../hooks/useTrainingEnrollment';
import { useTrainingModule } from '../hooks/useTrainingEnrollment';
import { parseMarkdown } from '../utils/markdown';
import TrainingFrictionPanel from './academy/TrainingFrictionPanel';

interface TrainingModuleDetailProps {
  module: TrainingModule;
  enrollment: TrainingEnrollment;
  progress?: TrainingProgress;
  onClose: () => void;
  onProgressUpdate: () => void;
}

export default function TrainingModuleDetail({
  module,
  enrollment,
  progress,
  onClose,
  onProgressUpdate,
}: TrainingModuleDetailProps) {
  const { startModule, completeModule, submitQuiz, loading } = useTrainingModule(module.id, enrollment.id);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeSpent, setTimeSpent] = useState(progress?.time_spent_seconds || 0);
  const [quizAnswers, setQuizAnswers] = useState<string[]>([]);
  const quizQuestions = module.quiz_json || [];
  const quizPassKey = `tuf_ops_training_quiz_passed_${enrollment.id}_${module.id}`;
  const [quizResult, setQuizResult] = useState<{ score: number; passed: boolean } | null>(() => {
    if (!quizQuestions.length) return null;
    try {
      return localStorage.getItem(quizPassKey) === 'true' ? { score: module.passing_score || 85, passed: true } : null;
    } catch {
      return null;
    }
  });
  const quizPassed = !quizQuestions.length || quizResult?.passed === true;
  const completedWithoutRequiredQuiz = progress?.status === 'COMPLETED' && quizQuestions.length > 0 && !quizPassed;

  useEffect(() => {
    if (progress?.status !== 'COMPLETED' && !startTime && progress?.status !== 'NOT_STARTED') {
      setStartTime(Date.now());
    }
  }, [progress, startTime]);

  useEffect(() => {
    if (!startTime) return;
    const timer = setInterval(() => {
      setTimeSpent((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  const handleStart = async () => {
    try {
      await startModule();
      setStartTime(Date.now());
    } catch (err) {
      console.error('Failed to start module:', err);
    }
  };

  const handleComplete = async () => {
    try {
      if (quizQuestions.length && !quizPassed) {
        const result = await submitQuiz(quizAnswers);
        setQuizResult(result);
        if (result.passed) {
          try { localStorage.setItem(quizPassKey, 'true'); } catch {}
        }
        if (!result.passed) return;
      }
      await completeModule(timeSpent);
      onProgressUpdate();
    } catch (err) {
      console.error('Failed to complete module:', err);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-800/80">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">{module.title}</h2>
            {module.description && <p className="text-slate-400 mt-2 text-sm font-semibold">{module.description}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white text-2xl transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="prose prose-invert max-w-none">
            {parseMarkdown(module.content_markdown)}
          </div>

          {quizQuestions.length ? (
            <div className="mt-6 rounded-xl border border-cyan-400/20 bg-cyan-500/10 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">Certification Quiz • Passing score {module.passing_score || 85}%</p>
              <div className="mt-3 space-y-4">
                {quizQuestions.map((question, index) => (
                  <div key={question.question} className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                    <p className="text-sm font-bold text-white">{index + 1}. {question.question}</p>
                    <div className="mt-2 grid gap-2">
                      {question.options.map((option) => (
                        <label key={option} className="flex items-center gap-2 rounded-md border border-slate-800 bg-slate-900/50 px-3 py-2 text-sm text-slate-300">
                          <input
                            type="radio"
                            name={`quiz-${module.id}-${index}`}
                            checked={quizAnswers[index] === option}
                            onChange={() => setQuizAnswers((answers) => { const next = [...answers]; next[index] = option; return next; })}
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {quizResult ? <p className={`mt-3 text-sm font-bold ${quizResult.passed ? 'text-emerald-300' : 'text-amber-300'}`}>Quiz score: {quizResult.score}% · {quizResult.passed ? 'Passed' : 'Retake required before completion'}</p> : null}
            </div>
          ) : null}

          <div className="mt-8 pt-6 border-t border-slate-800">
            <TrainingFrictionPanel enrollmentId={enrollment.id} moduleId={module.id} />
          </div>
        </div>

        {/* Progress Bar and Stats */}
        <div className="border-t border-slate-800/80 p-6 bg-slate-950/40">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Time Spent</p>
              <p className="text-lg font-black text-cyan-300">{formatTime(timeSpent)}</p>
            </div>
            {module.estimated_duration_minutes && (
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estimated Time</p>
                <p className="text-lg font-black text-white">{module.estimated_duration_minutes} min</p>
              </div>
            )}
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Type</p>
              <p className="text-lg font-black text-white">{module.module_type}</p>
            </div>
          </div>

          {/* Progress Bar */}
          {module.estimated_duration_minutes && (
            <div className="mb-6">
              <div className="w-full bg-slate-850 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-cyan-500 h-2 rounded-full transition-all shadow-[0_0_8px_rgba(6,182,212,0.5)]"
                  style={{
                    width: `${Math.min((timeSpent / (module.estimated_duration_minutes * 60)) * 100, 100)}%`,
                  }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-2 font-medium">
                {Math.min((timeSpent / (module.estimated_duration_minutes * 60)) * 100, 100).toFixed(0)}% of recommended time spent
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-800 rounded-lg font-bold text-sm text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
            {progress?.status === 'COMPLETED' && !completedWithoutRequiredQuiz ? (
              <button
                disabled
                className="flex-1 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg font-bold text-sm cursor-default"
              >
                ✓ Completed
              </button>
            ) : progress?.status === 'NOT_STARTED' || !progress ? (
              <button
                onClick={handleStart}
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-cyan-500 text-slate-950 hover:bg-cyan-400 rounded-lg font-bold text-sm disabled:opacity-50 transition-colors shadow-[0_0_12px_rgba(6,182,212,0.3)]"
              >
                {loading ? 'Starting...' : 'Start Module'}
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-emerald-500 text-slate-950 hover:bg-emerald-400 rounded-lg font-bold text-sm disabled:opacity-50 transition-colors shadow-[0_0_12px_rgba(16,185,129,0.3)]"
              >
                {loading ? 'Saving...' : completedWithoutRequiredQuiz ? 'Submit Required Quiz' : quizQuestions.length && !quizPassed ? 'Submit Quiz & Complete' : 'Mark Complete'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
