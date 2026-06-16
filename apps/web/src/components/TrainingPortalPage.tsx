import React, { useEffect, useState } from 'react';
import { useTrainingEnrollment, TrainingPhase } from '../hooks/useTrainingEnrollment';
import TrainingPhaseView from './TrainingPhaseView';
import ProgressRing from './ProgressRing';
import { getStoredUser } from '../auth';
import TufLogoSvg from '../assets/tuf-logo.svg';

const PHASES = ['DAY_1', 'DAY_1_2', 'WEEK_1_2', 'MONTH_1'];
const PHASE_LABELS: Record<string, string> = {
  DAY_1: 'Day 1',
  DAY_1_2: 'Day 1-2',
  WEEK_1_2: 'Week 1-2',
  MONTH_1: 'Month 1',
};

export default function TrainingPortalPage() {
  const user = getStoredUser();
  const userId = user ? parseInt(user.id.replace('u-local-', '').replace('u-rep-', '').replace('u-director-', ''), 10) || 21 : 21; // Jason Mulder fallback
  const { enrollment, loading, error } = useTrainingEnrollment(userId);
  const [selectedPhase, setSelectedPhase] = useState<string>('DAY_1');
  const [certStatus, setCertStatus] = useState<any>(null);

  const { enrollment: enrollmentData, completionMetrics } = enrollment || {};

  useEffect(() => {
    if (user && user.role === 'REP') {
      fetch(`${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/training/reps/${user.id}/certification-status`)
        .then((res) => res.json())
        .then((data) => setCertStatus(data))
        .catch(() => {
          // Fallback to local storage user state in static Vercel mode
          setCertStatus({
            hrDocsCompleted: user.hrDocsCompleted || false,
            directorSignedOff: user.directorSignedOff || false,
            isCertified: user.isCertified || false,
            modulesPercent: completionMetrics?.percentComplete || 0,
            completedModules: completionMetrics?.completedModules || 0,
            totalModules: completionMetrics?.totalModules || 0,
          });
        });
    }
  }, [user, completionMetrics?.percentComplete]);

  if (loading) {
    return <div className="p-8 text-slate-300">Loading training portal...</div>;
  }

  if (error || !enrollment || !enrollmentData || !completionMetrics) {
    return <div className="p-8 text-rose-400">Error loading training portal: {error || 'No enrollment data available'}</div>;
  }

  const currentPhaseIndex = PHASES.indexOf(enrollmentData.current_phase);
  const visiblePhases = PHASES.slice(0, currentPhaseIndex + 2);

  return (
    <div className="min-h-screen text-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-4">
            <img src={TufLogoSvg} alt="TUF Logo" className="h-10 w-auto opacity-95" />
            <div className="h-8 w-px bg-slate-800 hidden sm:block" />
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white uppercase">
                TUF Academy
              </h1>
              <p className="text-slate-400 mt-0.5 text-xs font-bold uppercase tracking-wider">
                {enrollmentData.role} Curriculum • Current Phase: {PHASE_LABELS[enrollmentData.current_phase]}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-slate-800 bg-[#070c13]/90 px-4 py-3">
            <ProgressRing percentage={completionMetrics.percentComplete} size={60} strokeWidth={6} />
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Course Progress</p>
              <p className="text-lg font-black text-cyan-300">{completionMetrics.percentComplete}% Complete</p>
            </div>
          </div>
        </div>

        {/* Global Block / Certification Checklist Banner */}
        {user?.role === 'REP' && certStatus && (
          <div className={`rounded-xl border p-5 ${certStatus.isCertified ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
            <div className="flex items-center gap-3">
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${certStatus.isCertified ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                {certStatus.isCertified ? '✓' : 'i'}
              </span>
              <div>
                <h2 className="font-black text-slate-100 text-base">
                  {certStatus.isCertified ? 'Activation Certified' : 'System Access Locked — Certification Pending'}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {certStatus.isCertified 
                    ? 'Your onboarding is complete. You have full system access to TUF Ops.' 
                    : 'Complete the requirements below to unlock full sales features in TUF Ops.'}
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3 border-t border-slate-800/40 pt-4">
              <div className="rounded-lg border border-slate-800/60 bg-[#050b12] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">1. Lessons & Quizzes</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${certStatus.modulesPercent === 100 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                    {certStatus.modulesPercent === 100 ? 'Done' : `${certStatus.modulesPercent}%`}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-2">Complete all modules and pass phase exams in TUF Academy.</p>
              </div>
              <div className="rounded-lg border border-slate-800/60 bg-[#050b12] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">2. HR Verification</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${certStatus.hrDocsCompleted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                    {certStatus.hrDocsCompleted ? 'Filed' : 'Pending'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-2">Submit and verify direct deposit, tax forms, and background checks with HR.</p>
              </div>
              <div className="rounded-lg border border-slate-800/60 bg-[#050b12] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">3. Director Sign-Off</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${certStatus.directorSignedOff ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                    {certStatus.directorSignedOff ? 'Signed' : 'Pending'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-2">Complete mock pitch and secure activation authorization from your State Director.</p>
              </div>
            </div>
          </div>
        )}

        {/* Phase Tabs */}
        <div className="flex gap-2 border-b border-slate-800">
          {visiblePhases.map((phase) => (
            <button
              key={phase}
              onClick={() => setSelectedPhase(phase)}
              className={`px-4 py-3 text-sm font-bold transition-all ${
                selectedPhase === phase
                  ? 'border-b-2 border-cyan-400 text-cyan-400'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {PHASE_LABELS[phase]}
            </button>
          ))}
        </div>

        {/* Phase Completion Status Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {PHASES.map((phase) => {
            const status = completionMetrics.phaseCompletionStatus[phase];
            const isUnlocked = PHASES.indexOf(phase) <= currentPhaseIndex + 1;
            return (
              <div
                key={phase}
                className={`p-3 rounded-lg border ${
                  isUnlocked
                    ? status.percentComplete === 100
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : 'border-cyan-500/20 bg-cyan-500/5'
                    : 'border-slate-850 bg-slate-900/10 opacity-40'
                }`}
              >
                <p className="font-bold text-xs text-slate-300">{PHASE_LABELS[phase]}</p>
                <div className="flex items-baseline justify-between mt-2">
                  <p className="text-xl font-black text-white">
                    {status.completed}/{status.total} <span className="text-xs font-normal text-slate-400">modules</span>
                  </p>
                  <p className="text-xs text-slate-400 font-bold">{status.percentComplete}%</p>
                </div>
                <div className="mt-2 bg-slate-850 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      status.percentComplete === 100 ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-cyan-400'
                    }`}
                    style={{ width: `${status.percentComplete}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Modules for Selected Phase */}
        <div className="rounded-xl border border-slate-800 bg-[#070c13]/40 p-5">
          <h2 className="text-lg font-black text-white mb-4">{PHASE_LABELS[selectedPhase]} Onboarding Modules</h2>
          <TrainingPhaseView
            phase={selectedPhase}
            enrollment={enrollment}
            userId={userId}
          />
        </div>

        {/* Completion Message */}
        {enrollmentData.status === 'COMPLETED' && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5">
            <h3 className="text-base font-bold text-emerald-200">🎉 Onboarding Modules Completed!</h3>
            <p className="text-sm text-slate-300 mt-1.5">
              You have completed all curriculum modules. Once your HR paperwork is filed and your State Director signs off, your sales permissions will unlock automatically.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
