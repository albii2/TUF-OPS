import { useEffect, useState } from 'react';
import { getStoredUser } from '../auth';
import { listUsers } from '../services/usersService';
import {
  getAllCertificationRecords,
  directorCertifyRep,
  type CertificationRecord,
  type ModuleProgress,
} from '../lib/academy';
import type { ManagedUser } from '../services/usersService';

export default function AdminCertificationPage() {
  const user = getStoredUser();
  const isDirectorOrAdmin =
    user?.role === 'DIRECTOR' || user?.role === 'REGIONAL_DIRECTOR' || user?.role === 'ADMIN';
  const [records, setRecords] = useState<CertificationRecord[]>([]);
  const [allUsers, setAllUsers] = useState<ManagedUser[]>([]);
  const [certifying, setCertifying] = useState<string | null>(null);

  useEffect(() => {
    const loadedUsers = listUsers();
    setAllUsers(loadedUsers);
    const loadedRecords = getAllCertificationRecords();
    setRecords(loadedRecords);
  }, []);

  const refreshData = () => {
    const loadedUsers = listUsers();
    setAllUsers(loadedUsers);
    const loadedRecords = getAllCertificationRecords();
    setRecords(loadedRecords);
  };

  const handleCertify = async (repUser: ManagedUser) => {
    if (!user) return;
    setCertifying(repUser.id);
    try {
      directorCertifyRep(repUser.id, repUser.displayName, user.name);
      refreshData();
    } finally {
      setCertifying(null);
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

  const getStatusBadge = (record?: CertificationRecord) => {
    if (!record) {
      return {
        label: 'Not Enrolled',
        className: 'bg-slate-700/40 text-slate-400 border-slate-600/30',
      };
    }
    if (record.isLevel1Certified) {
      return {
        label: 'Certified ✓',
        className: 'bg-emerald-400/20 text-emerald-200 border-emerald-400/30',
      };
    }
    const completed = record.moduleProgress.filter((m) => m.status === 'completed').length;
    return {
      label: `${completed}/5 Modules`,
      className: 'bg-amber-400/20 text-amber-200 border-amber-400/30',
    };
  };

  const getModuleStatusClass = (status: ModuleProgress['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30';
      case 'in_progress':
        return 'bg-cyan-400/20 text-cyan-300 border-cyan-400/30';
      default:
        return 'bg-slate-700/40 text-slate-500 border-slate-600/30';
    }
  };

  const getModuleStatusLabel = (status: ModuleProgress['status']) => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'in_progress':
        return '⟳';
      default:
        return '○';
    }
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

  return (
    <div className="min-h-screen text-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">TAE Certification Review</h1>
            <p className="text-sm text-slate-400 mt-1">
              Review certification progress for all Territory Account Executives.{' '}
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
                    const statusBadge = getStatusBadge(record);
                    const isAlreadyCertified = record?.isLevel1Certified === true;

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
                          {record?.certifiedBy && (
                            <p className="text-[10px] text-slate-500 mt-1">
                              by {record.certifiedBy}
                            </p>
                          )}
                        </td>
                        {(['ACAD-101', 'ACAD-102', 'ACAD-103', 'ACAD-104', 'ACAD-105'] as const).map(
                          (code) => {
                            const mod = record?.moduleProgress.find(
                              (m) => m.code === code
                            );
                            const status = mod?.status ?? 'not_started';
                            return (
                              <td key={code} className="px-2 py-3 text-center">
                                <span
                                  className={`inline-flex items-center justify-center w-8 h-8 rounded-full border text-xs font-bold ${getModuleStatusClass(
                                    status
                                  )}`}
                                  title={`${status}: ${mod?.currentValue ?? 0}/${mod?.targetValue ?? '?'}`}
                                >
                                  {getModuleStatusLabel(status)}
                                </span>
                              </td>
                            );
                          }
                        )}
                        <td className="px-4 py-3 text-center">
                          {isAlreadyCertified ? (
                            <span className="text-xs text-emerald-400 font-bold">
                              Certified ✓
                            </span>
                          ) : (
                            <button
                              onClick={() => handleCertify(rep)}
                              disabled={certifying === rep.id}
                              className="rounded-lg border border-cyan-400/40 bg-cyan-400/10 px-3 py-1.5 text-[10px] font-bold text-cyan-300 hover:bg-cyan-400/20 hover:border-cyan-400/60 transition-colors disabled:opacity-50"
                            >
                              {certifying === rep.id ? '...' : 'Certify'}
                            </button>
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
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-emerald-400/30 bg-emerald-400/20 text-emerald-300 text-xs">
                ✓
              </span>
              <span className="text-slate-400">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-cyan-400/30 bg-cyan-400/20 text-cyan-300 text-xs">
                ⟳
              </span>
              <span className="text-slate-400">In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-slate-600/30 bg-slate-700/40 text-slate-500 text-xs">
                ○
              </span>
              <span className="text-slate-400">Not Started</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
