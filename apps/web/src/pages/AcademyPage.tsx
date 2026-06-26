import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getStoredUser } from '../auth';
import {
  LEVEL_1_MODULES,
  SALES_PHILOSOPHY,
  detectAllModules,
  isLevel1Complete,
  certificationProgress,
  markPageVisited,
  saveCertificationRecord,
  type ModuleProgress,
  type AcademyModule,
} from '../lib/academy';
import TufAcademyLogo from '../assets/tuf-academy.png';

export default function AcademyPage() {
  const user = getStoredUser();
  const [moduleProgress, setModuleProgress] = useState<ModuleProgress[]>([]);
  const [showPhilosophy, setShowPhilosophy] = useState(false);

  const isCertified = user?.isCertified === true;
  const isRep = user?.role === 'REP';
  const userName = user?.name ?? 'TAE';

  useEffect(() => {
    // Mark this page as visited for ACAD-105
    markPageVisited('academy');

    // Detect module completion from real data
    const progress = detectAllModules();
    setModuleProgress(progress);

    // Save certification record
    if (user) {
      const allComplete = isLevel1Complete(progress);
      saveCertificationRecord({
        userId: user.id,
        userName: user.name,
        role: user.role,
        isLevel1Certified: allComplete,
        certifiedAt: allComplete ? new Date().toISOString() : undefined,
        moduleProgress: progress,
        lastChecked: new Date().toISOString(),
      });
    }

    // Refresh progress every 30 seconds
    const interval = setInterval(() => {
      const fresh = detectAllModules();
      setModuleProgress(fresh);

      if (user) {
        const allComplete = isLevel1Complete(fresh);
        saveCertificationRecord({
          userId: user.id,
          userName: user.name,
          role: user.role,
          isLevel1Certified: allComplete,
          certifiedAt: allComplete ? new Date().toISOString() : undefined,
          moduleProgress: fresh,
          lastChecked: new Date().toISOString(),
        });
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [user]);

  const completedCount = moduleProgress.filter((m) => m.status === 'completed').length;
  const progressPercent = moduleProgress.length ? Math.round((completedCount / moduleProgress.length) * 100) : 0;

  const moduleDefMap = useMemo(() => {
    const map = new Map<string, AcademyModule>();
    LEVEL_1_MODULES.forEach((m) => map.set(m.code, m));
    return map;
  }, []);

  const certificationLabel = isCertified
    ? 'Level 1 Certified — Full CRM Access Granted'
    : isRep
      ? `Academy Progress: ${completedCount}/5 Modules — CRM Access Gated`
      : 'Director/Admin — Full CRM Access';

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
                Complete all 5 training modules through real production work to earn Level 1 Certification
                and unlock full CRM access.
              </p>

              {/* Certification Status */}
              <div className="mt-4">
                <span
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-wider ${
                    isCertified
                      ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200'
                      : isRep
                        ? 'border-amber-400/40 bg-amber-400/10 text-amber-200'
                        : 'border-cyan-400/40 bg-cyan-400/10 text-cyan-200'
                  }`}
                >
                  {isCertified ? '✓' : isRep ? '●' : '◆'} {certificationLabel}
                </span>
              </div>

              {/* Progress Bar */}
              {isRep && moduleProgress.length > 0 && (
                <div className="mt-4 max-w-md mx-auto">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Certification Progress</span>
                    <span>{completedCount} / 5 ({progressPercent}%)</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Training Modules ── */}
        <div>
          <h2 className="text-xl font-black text-white mb-4 flex items-center gap-2">
            <span>📋</span> Level 1 Training Modules
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {LEVEL_1_MODULES.map((module) => {
              const progress = moduleProgress.find((p) => p.code === module.code);
              const status = progress?.status ?? 'not_started';
              const statusColors = {
                completed: 'border-emerald-400/30 bg-emerald-400/5',
                in_progress: 'border-cyan-400/30 bg-cyan-400/5',
                not_started: 'border-slate-700/60 bg-slate-900/30',
              };
              const statusBadge = {
                completed: 'bg-emerald-400/20 text-emerald-200 border-emerald-400/30',
                in_progress: 'bg-cyan-400/20 text-cyan-200 border-cyan-400/30',
                not_started: 'bg-slate-700/40 text-slate-400 border-slate-600/30',
              };
              const statusLabel = {
                completed: '✓ Completed',
                in_progress: '⟳ In Progress',
                not_started: '○ Not Started',
              };

              const philosophy = SALES_PHILOSOPHY[module.philosophyPrinciple - 1];

              return (
                <div
                  key={module.code}
                  className={`rounded-xl border p-5 transition-all ${statusColors[status]} ${
                    status === 'completed'
                      ? 'shadow-[0_0_12px_rgba(16,185,129,0.08)]'
                      : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                      {module.code}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusBadge[status]}`}
                    >
                      {statusLabel[status]}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-white mb-1.5">{module.name}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-3">
                    {module.description}
                  </p>

                  {/* Completion Criteria */}
                  <div className="mb-3 rounded-lg bg-slate-950/50 border border-slate-800/60 p-2.5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      What You Need To Do
                    </p>
                    <p className="text-xs text-slate-300">{module.completionCriteria}</p>
                    {progress && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              status === 'completed' ? 'bg-emerald-400' : 'bg-cyan-400'
                            }`}
                            style={{
                              width: `${Math.min(
                                (progress.currentValue / progress.targetValue) * 100,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap">
                          {progress.currentValue}/{progress.targetValue}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Philosophy Principle */}
                  <div className="rounded-lg bg-[#0d1520] border border-slate-800/40 p-2.5">
                    <p className="text-[10px] font-bold text-amber-400/80 uppercase tracking-wider mb-0.5">
                      Philosophy #{philosophy.number}
                    </p>
                    <p className="text-xs text-slate-300 font-medium italic">
                      &ldquo;{philosophy.title}&rdquo;
                    </p>
                  </div>

                  {/* Practice Link */}
                  {isRep && status !== 'completed' && (
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

        {/* ── Uncertified Rep Notice ── */}
        {isRep && !isCertified && (
          <div className="rounded-2xl border border-amber-400/25 bg-amber-500/5 p-6 backdrop-blur-md">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🔒</span>
              <div>
                <h2 className="text-lg font-black text-white">CRM Access is Gated</h2>
                <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                  While you complete your Level 1 certification, you can access:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-slate-400">
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400">✓</span> The Academy (this page)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400">✓</span> Dashboard (read-only, to see your progress)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400">✓</span> Organizations (to practice creating them)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400">✓</span> Opportunities (to practice creating them)
                  </li>
                </ul>
                <p className="mt-3 text-xs text-amber-300 font-medium">
                  Complete all 5 modules above to unlock the full CRM.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Certified Rep Notice ── */}
        {isRep && isCertified && (
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
