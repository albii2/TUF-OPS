import { useEffect, useState } from 'react';
import { getStoredUser } from '../auth';
import { listUsers } from '../services/usersService';
import {
  getAllCertificationRecords,
  getAllSubmissions,
  directorApproveRep,
  getQuizResults,
  type CertificationRecord,
  type CertificationSubmission,
  type ModuleProgress,
} from '../lib/academy';
import type { ManagedUser } from '../services/usersService';

export default function AdminCertificationPage() {
  const user = getStoredUser();
  const isDirectorOrAdmin =
    user?.role === 'DIRECTOR' || user?.role === 'REGIONAL_DIRECTOR' || user?.role === 'ADMIN';
  const [records, setRecords] = useState<CertificationRecord[]>([]);
  const [submissions, setSubmissions] = useState<CertificationSubmission[]>([]);
  const [allUsers, setAllUsers] = useState<ManagedUser[]>([]);
  const [approving, setApproving] = useState<string | null>(null);
  const [selectedRep, setSelectedRep] = useState<ManagedUser | null>(null);

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
        alert('Cannot approve: the rep must have a valid submission with all quizzes passed and exercises verified.');
      }
      refreshData();
    } finally {
      setApproving(null);
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

  const getStatusBadge = (rep: ManagedUser) => {
    const record = getRepRecord(rep.id);
    const submission = getRepSubmission(rep.id);

    if (record?.isLevel1Certified) {
      return {
        label: 'Certified ✓',
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
    const verified = record?.moduleProgress.filter(
      (m) => m.status === 'verified'
    ).length ?? 0;
    if (record && verified > 0) {
      return {
        label: `${verified}/5 Verified`,
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

  const getModuleStatusClass = (status: ModuleProgress['status']) => {
    switch (status) {
      case 'verified':
      case 'approved':
        return 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30';
      case 'submitted':
        return 'bg-purple-400/20 text-purple-300 border-purple-400/30';
      case 'quiz_passed':
        return 'bg-amber-400/20 text-amber-300 border-amber-400/30';
      case 'available':
        return 'bg-cyan-400/20 text-cyan-300 border-cyan-400/30';
      case 'locked':
        return 'bg-slate-700/40 text-slate-500 border-slate-600/30';
      default:
        return 'bg-slate-700/40 text-slate-500 border-slate-600/30';
    }
  };

  const getModuleStatusLabel = (status: ModuleProgress['status']) => {
    switch (status) {
      case 'verified': return '✓';
      case 'approved': return '✓';
      case 'submitted': return '◆';
      case 'quiz_passed': return 'Q';
      case 'available': return '○';
      case 'locked': return '—';
      default: return '○';
    }
  };

  const getModuleStatusTitle = (status: ModuleProgress['status'], code: string, submission?: CertificationSubmission) => {
    switch (status) {
      case 'verified': return `${code}: Verified (quiz + exercise)`;
      case 'approved': return `${code}: Certified`;
      case 'submitted': return `${code}: Submitted`;
      case 'quiz_passed': return `${code}: Quiz passed, exercise in progress`;
      case 'available': return `${code}: Available (quiz not yet passed)`;
      case 'locked': return `${code}: Locked`;
      default: return `${code}: Not started`;
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
    // Can approve if submitted and not yet certified
    return !!submission && !record?.isLevel1Certified;
  };

  return (
    <div className="min-h-screen text-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">TAE Certification Review</h1>
            <p className="text-sm text-slate-400 mt-1">
              Review quiz scores, exercise verification, and approve certification for Territory Account Executives.{' '}
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
                      <tr
                        key={rep.id}
                        className="hover:bg-slate-900/30 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-bold text-white">{rep.displayName}</p>
                            <p className="text-xs text-slate-500">{rep.email}</p>
                          </div>
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
                        {(['ACAD-101', 'ACAD-102', 'ACAD-103', 'ACAD-104', 'ACAD-105'] as const).map(
                          (code) => {
                            const mod = record?.moduleProgress.find(
                              (m) => m.code === code
                            );
                            const status = mod?.status ?? 'locked';
                            const quizScore = getQuizScoreForModule(rep.id, code);

                            return (
                              <td key={code} className="px-2 py-3 text-center">
                                <div className="flex flex-col items-center gap-1">
                                  <span
                                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full border text-xs font-bold ${getModuleStatusClass(
                                      status
                                    )}`}
                                    title={getModuleStatusTitle(status, code, submission)}
                                  >
                                    {getModuleStatusLabel(status)}
                                  </span>
                                  {quizScore !== null && quizScore > 0 && (
                                    <span className="text-[9px] text-slate-500 font-mono">
                                      {quizScore}%
                                    </span>
                                  )}
                                </div>
                              </td>
                            );
                          }
                        )}
                        <td className="px-4 py-3 text-center">
                          {isAlreadyCertified ? (
                            <span className="text-xs text-emerald-400 font-bold">
                              Certified ✓
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
                          <p className="font-bold text-white text-lg">
                            {sub.userName}
                          </p>
                          <p className="text-xs text-slate-400">
                            Submitted {new Date(sub.submittedAt).toLocaleDateString()} at{' '}
                            {new Date(sub.submittedAt).toLocaleTimeString()}
                          </p>
                        </div>
                        <div className="rounded-lg border border-purple-400/20 bg-purple-400/5 px-3 py-1.5 text-xs text-purple-200 font-bold">
                          Director QA: &ldquo;Would I trust this person with one of our schools?&rdquo;
                        </div>
                      </div>

                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-800">
                            <th className="text-left px-3 py-2 text-xs font-bold text-slate-400 uppercase">Module</th>
                            <th className="text-center px-3 py-2 text-xs font-bold text-slate-400 uppercase">Quiz Score</th>
                            <th className="text-center px-3 py-2 text-xs font-bold text-slate-400 uppercase">Quiz Passed</th>
                            <th className="text-center px-3 py-2 text-xs font-bold text-slate-400 uppercase">Attempts</th>
                            <th className="text-center px-3 py-2 text-xs font-bold text-slate-400 uppercase">Exercise</th>
                            <th className="text-center px-3 py-2 text-xs font-bold text-slate-400 uppercase">Progress</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {sub.moduleProgress.map((detail) => (
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
                                <span className="text-xs text-slate-400">{detail.quizAttempts}</span>
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
                                      detail.exerciseVerified ? 'bg-emerald-400' : 'bg-cyan-400'
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
                            </tr>
                          ))}
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
                              : `Approve ${sub.userName} — Grant Level 1 Certification`}
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
            Module Legend
          </h3>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-emerald-400/30 bg-emerald-400/20 text-emerald-300 text-xs">
                ✓
              </span>
              <span className="text-slate-400">Verified (Quiz + Exercise)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-purple-400/30 bg-purple-400/20 text-purple-300 text-xs">
                ◆
              </span>
              <span className="text-slate-400">Submitted for Approval</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-amber-400/30 bg-amber-400/20 text-amber-300 text-xs">
                Q
              </span>
              <span className="text-slate-400">Quiz Passed (Exercise Active)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-cyan-400/30 bg-cyan-400/20 text-cyan-300 text-xs">
                ○
              </span>
              <span className="text-slate-400">Available</span>
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
