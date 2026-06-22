import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ACADEMY_PHASE_LABELS, ACADEMY_PHASES, ACADEMY_CERTIFICATION_LABELS, useTrainingEnrollment } from '../hooks/useTrainingEnrollment';
import TrainingPhaseView from './TrainingPhaseView';
import ProgressRing from './ProgressRing';
import { getStoredUser } from '../auth';
import TufAcademyLogo from '../assets/tuf-academy.png';

const ACADEMY_PHASE_KEYS: string[] = [...ACADEMY_PHASES];
const LEGACY_PHASE_KEYS = ['DAY_1', 'DAY_1_2', 'WEEK_1_2', 'MONTH_1'];
const PHASE_LABELS = ACADEMY_PHASE_LABELS;

function getRenderablePhases(modulePhases: string[], currentPhase?: string) {
  const hasAcademyModules = modulePhases.some((phase) => ACADEMY_PHASE_KEYS.includes(phase));
  const basePhases = hasAcademyModules ? ACADEMY_PHASE_KEYS : LEGACY_PHASE_KEYS;
  return Array.from(new Set([...basePhases, ...modulePhases, ...(currentPhase ? [currentPhase] : [])]));
}

export default function TrainingPortalPage() {
  const user = getStoredUser();
  const userId = user ? user.id : 'u-rep-jason-mulder';
  const { enrollment, loading, error } = useTrainingEnrollment(userId);
  const [selectedPhase, setSelectedPhase] = useState<string>('LEVEL_1_OPERATOR');
  const [certStatus, setCertStatus] = useState<any>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isTimerOverdue, setIsTimerOverdue] = useState<boolean>(false);
  const [notified, setNotified] = useState<boolean>(false);

  useEffect(() => {
    setNotified(localStorage.getItem(`tuf_ops_notified_director_${userId}`) === 'true');
  }, [userId]);

  const { enrollment: enrollmentData, completionMetrics } = enrollment || {};

  useEffect(() => {
    const enrolledDateStr = certStatus?.enrolledAt || enrollmentData?.enrolled_at;
    if (!enrolledDateStr) return;
    const calculateTime = () => {
      const totalLimitMs = 72 * 60 * 60 * 1000;
      const enrolledTime = new Date(enrolledDateStr).getTime();
      const elapsedMs = Date.now() - enrolledTime;
      const remaining = totalLimitMs - elapsedMs;
      setTimeRemaining(remaining);
      setIsTimerOverdue(remaining <= 0);
    };

    calculateTime();
    const interval = setInterval(calculateTime, 30000); // update every 30s
    return () => clearInterval(interval);
  }, [certStatus?.enrolledAt, enrollmentData?.enrolled_at]);

  const formatRemainingTime = (ms: number) => {
    if (ms <= 0) return 'Overdue';
    const totalHours = Math.floor(ms / (1000 * 60 * 60));
    const mins = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${totalHours}h ${mins}m remaining`;
  };

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
            practicalExerciseCompleted: user.practicalExerciseCompleted || false,
            isCertified: user.isCertified || false,
            modulesPercent: completionMetrics?.percentComplete || 0,
            completedModules: completionMetrics?.completedModules || 0,
            totalModules: completionMetrics?.totalModules || 0,
          });
        });
    }
  }, [user, completionMetrics?.percentComplete]);


  useEffect(() => {
    if (!enrollment || !enrollmentData) return;

    const phases = getRenderablePhases(enrollment.modules.map((module) => module.phase), enrollmentData.current_phase);
    const selectedPhaseHasModules = enrollment.modules.some((module) => module.phase === selectedPhase);
    const currentPhaseHasModules = enrollment.modules.some((module) => module.phase === enrollmentData.current_phase);

    if (!phases.includes(selectedPhase) || (!selectedPhaseHasModules && currentPhaseHasModules)) {
      setSelectedPhase(enrollmentData.current_phase);
    }
  }, [enrollment, enrollmentData, selectedPhase]);

  if (loading) {
    return <div className="p-8 text-slate-300">Loading training portal...</div>;
  }

  if (error || !enrollment || !enrollmentData || !completionMetrics) {
    return <div className="p-8 text-rose-400">Error loading training portal: {error || 'No enrollment data available'}</div>;
  }

  const PHASES = getRenderablePhases(enrollment.modules.map((module) => module.phase), enrollmentData.current_phase);
  const currentPhaseIndex = Math.max(PHASES.indexOf(enrollmentData.current_phase), 0);
  const visiblePhases = PHASES.slice(0, currentPhaseIndex + 2);

  return (
    <div className="min-h-screen text-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl border border-cyan-400/20 bg-[radial-gradient(circle_at_top_left,rgba(31,182,255,0.22),transparent_38%),linear-gradient(135deg,rgba(7,12,19,0.98),rgba(3,7,12,0.94))] p-5 shadow-2xl shadow-cyan-950/30 md:p-7">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="mx-auto max-w-3xl">
              <img src={TufAcademyLogo} alt="TUF Academy" className="mx-auto h-14 w-auto object-contain drop-shadow-[0_0_22px_rgba(31,182,255,0.25)] sm:h-16" />
              <p className="mt-4 text-xs font-black uppercase tracking-[0.24em] text-cyan-200">Sales Certification • Territory Development • Product Mastery</p>
              <h1 className="mt-3 text-2xl font-black leading-tight text-white md:text-4xl">The operating system for self-sufficient TUF territory developers.</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Create reps capable of identifying, creating, advancing, closing, and expanding athletic program opportunities with minimal leadership intervention.</p>
              <p className="mt-3 text-xs font-bold uppercase tracking-wider text-slate-400">{enrollmentData.role} Tracks • Current Certification: {ACADEMY_CERTIFICATION_LABELS[enrollmentData.current_phase] || enrollmentData.current_phase}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <div className="flex items-center gap-4 rounded-2xl border border-cyan-400/20 bg-[#050b12]/90 px-5 py-4 text-left shadow-xl shadow-black/30">
                <ProgressRing percentage={completionMetrics.percentComplete} size={60} strokeWidth={6} />
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Course Progress</p>
                  <p className="text-lg font-black text-cyan-300">{completionMetrics.percentComplete}% Complete</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 rounded-2xl border border-cyan-400/20 bg-[#050b12]/90 px-5 py-4 text-left shadow-xl shadow-black/30 min-w-[220px]">
                <span className="text-2xl">⏱️</span>
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">72h Academy Timer</p>
                  <p className={`text-base font-black uppercase ${isTimerOverdue || certStatus?.isOverdue ? 'text-rose-400 animate-pulse font-extrabold' : 'text-amber-400'}`}>
                    {formatRemainingTime(timeRemaining)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Overdue Warning Alert */}
        {user?.role === 'REP' && certStatus && (certStatus.isOverdue || isTimerOverdue) && !certStatus.isCertified && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 flex items-center gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-500/20 text-rose-400 text-sm font-bold">⚠️</span>
            <div>
              <h4 className="font-black text-slate-100 text-sm">72-Hour Certification Target Exceeded</h4>
              <p className="text-xs text-slate-400 mt-0.5">You have exceeded the target certification window. Regional Director Primeau Hill has been notified to assist you, but your CRM sandbox access remains open to complete certification.</p>
            </div>
          </div>
        )}

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
            <div className="mt-4 grid gap-3 sm:grid-cols-5 border-t border-slate-800/40 pt-4">
              <div className="rounded-lg border border-slate-800/60 bg-[#050b12] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">1. Playbooks & Quizzes</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${certStatus.modulesPercent === 100 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                    {certStatus.modulesPercent === 100 ? 'Done' : `${certStatus.modulesPercent}%`}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-2">Complete required certifications, quizzes, and practical exercises in TUF Academy.</p>
              </div>
              <div className="rounded-lg border border-slate-800/60 bg-[#050b12] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">2. HR Docs</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${certStatus.hrDocsCompleted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                    {certStatus.hrDocsCompleted ? 'Filed' : 'Pending'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-2">Required paperwork must be complete before live CRM access.</p>
              </div>
              <div className="rounded-lg border border-slate-800/60 bg-[#050b12] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">3. Practical Exercise</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${certStatus.practicalExerciseCompleted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                    {certStatus.practicalExerciseCompleted ? 'Reviewed' : 'Pending'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-2">Complete one Locker Room Simulator scenario and director review.</p>
              </div>
              <div className="rounded-lg border border-slate-800/60 bg-[#050b12] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">4. Director Sign-Off</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${certStatus.directorSignedOff ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                    {certStatus.directorSignedOff ? 'Signed' : 'Pending'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-2">State Director authorizes activation after review.</p>
              </div>
              <div className="rounded-lg border border-slate-800/60 bg-[#050b12] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">5. CRM Unlock</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${certStatus.isCertified ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                    {certStatus.isCertified ? 'Unlocked' : 'Locked'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-2">CRM remains gated until all requirements are complete.</p>
              </div>
            </div>
          </div>
        )}


        {/* Locker Room Simulator */}
        <div className="hidden rounded-xl border border-cyan-400/25 bg-cyan-500/10 p-5">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200">72-hour Practical Certification</p>
          <h2 className="mt-1 text-lg font-black text-white">Locker Room Simulator</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">Practice real TUF sales conversations anytime: AD intro, vendor objection, budget objection, team stores, player packs, letterman campaigns, feeder referrals, follow-up, and closing for mockup/sample.</p>
          <p className="mt-2 text-sm text-amber-100">Certification path: complete at least one simulator scenario, review it with your director, then director/admin marks the Practical Exercise complete before final sign-off and CRM Unlock.</p>
          <Link to="/training/simulator" className="mt-3 inline-flex rounded-md border border-cyan-300/50 bg-cyan-400/15 px-4 py-2 text-sm font-bold text-cyan-50 hover:bg-cyan-400/25">Open Locker Room Simulator</Link>
        </div>

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

        {/* Track Completion Status Grid */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {PHASES.map((phase) => {
            const status = completionMetrics.phaseCompletionStatus[phase] || { completed: 0, total: enrollment.modules.filter((module) => module.phase === phase).length, percentComplete: 0 };
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
                    {status.completed}/{status.total} <span className="text-xs font-normal text-slate-400">playbooks</span>
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

        {/* Playbooks for Selected Track */}
        <div className="rounded-xl border border-slate-800 bg-[#070c13]/40 p-5">
          <h2 className="text-lg font-black text-white mb-4">{PHASE_LABELS[selectedPhase]} Certification Playbooks</h2>
          <TrainingPhaseView
            phase={selectedPhase}
            enrollment={enrollment}
            userId={userId}
          />
        </div>

        {/* Completion Message */}
        {enrollmentData.status === 'COMPLETED' && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5">
            <h3 className="text-base font-bold text-emerald-200">🎉 Certification Playbooks Completed!</h3>
            <p className="text-sm text-slate-300 mt-1.5">
              You have completed all track playbooks. Once your HR paperwork is filed, your Locker Room Simulator/practical exercise is reviewed, and your State Director signs off, your sales permissions will unlock automatically.
            </p>
          </div>
        )}

        {/* Notify Director Button for 100% Completion */}
        {completionMetrics.percentComplete === 100 && (
          <div className="rounded-xl border border-cyan-500/30 bg-[#07111a]/85 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-cyan-200">
                {notified ? '✓ Review Requested' : 'Ready for Director Review?'}
              </h3>
              <p className="text-sm text-slate-300 mt-1">
                {notified 
                  ? 'Your regional director has been notified of your 100% track completion. They will review your practical exercises and HR paperwork shortly.'
                  : 'You have completed all track playbooks. Notify your State Director to review your track progression and complete your CRM certification.'}
              </p>
            </div>
            {!notified ? (
              <button
                onClick={() => {
                  localStorage.setItem(`tuf_ops_notified_director_${userId}`, 'true');
                  setNotified(true);
                  alert('State Director has been notified of your completion!');
                }}
                className="shrink-0 rounded-md border border-cyan-400 bg-cyan-500/20 px-5 py-2.5 text-sm font-black text-cyan-100 transition hover:bg-cyan-500/30 hover:scale-[1.02] active:scale-[0.98]"
              >
                Notify Director for Review
              </button>
            ) : (
              <button
                disabled
                className="shrink-0 rounded-md border border-slate-700 bg-slate-800/40 px-5 py-2.5 text-sm font-black text-slate-500 cursor-not-allowed"
              >
                Director Notified
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
