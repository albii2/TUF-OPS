import { Link } from 'react-router-dom';
import { useOrganizations } from '../hooks/useOrganizations';
import { useOpportunities } from '../hooks/useOpportunities';
import { getStoredUser } from '../auth';
import { listUsers } from '../services/usersService';
import { getNearCloseOpportunities, getStaleOpportunities } from '../services/businessSelectors';
import { formatCurrency } from '../utils/format';

export default function DirectorHome() {
  const user = getStoredUser();
  const name = user?.name?.split(' ')[0] || 'Director';
  const { data: organizations = [] } = useOrganizations({});
  const { data: opportunities = [] } = useOpportunities({});

  // Territory snapshot
  const territoryOrgs = organizations;
  const contacted = territoryOrgs.filter(o => o.coverageStatus !== 'UNTOUCHED').length;
  const untouched = territoryOrgs.length - contacted;
  const coveragePct = territoryOrgs.length ? Math.round((contacted / territoryOrgs.length) * 100) : 0;

  // Reps and their status
  const allUsers = listUsers();
  const reps = allUsers.filter(u => u.role === 'REP' && u.status === 'ACTIVE');
  const repStatuses = reps.map(rep => {
    const repOpps = opportunities.filter(o => o.assignedRep === rep.displayName);
    const staleOpps = getStaleOpportunities(repOpps, 14);
    const nearClose = getNearCloseOpportunities(repOpps);
    const openOpps = repOpps.filter(o => !['CLOSED_WON', 'CLOSED_LOST'].includes(o.stage));
    const lastActivity = repOpps
      .map(o => o.lastActivity)
      .filter(Boolean)
      .sort()
      .reverse()[0];
    const daysSince = lastActivity
      ? Math.floor((Date.now() - new Date(lastActivity).getTime()) / 86400000)
      : 999;

    let status: string;
    if (rep.isCertified && daysSince <= 1) status = 'Active today';
    else if (!rep.isCertified) status = 'Academy in progress';
    else if (daysSince > 3) status = `No activity in ${daysSince} days`;
    else if (staleOpps.length > 0) status = `${staleOpps.length} stale deal${staleOpps.length > 1 ? 's' : ''}`;
    else if (nearClose.length > 0) status = `${nearClose.length} near close`;
    else status = `${openOpps.length} open opportunities`;

    return {
      name: rep.displayName,
      status,
      needsAttention: daysSince > 3 || staleOpps.length > 0,
      openOpps: openOpps.length,
      nearClose: nearClose.length,
      stale: staleOpps.length,
    };
  });
  const needsCoaching = repStatuses.filter(r => r.needsAttention);

  // Today's priorities — derived, not random
  const priorities: string[] = [];
  const nearCloseDeals = getNearCloseOpportunities(opportunities);
  if (nearCloseDeals.length > 0) {
    priorities.push(`Coach ${nearCloseDeals.length} near-close deal${nearCloseDeals.length > 1 ? 's' : ''} to close`);
  }
  if (needsCoaching.length > 0) {
    const names = needsCoaching.map(r => r.name.split(' ')[0]).join(', ');
    priorities.push(`Check in with ${names}`);
  }
  if (untouched > 0) {
    priorities.push(`Assign ${Math.min(untouched, 5)} untouched accounts to reps`);
  }
  const staleOpps = getStaleOpportunities(opportunities, 14);
  if (staleOpps.length > 0) {
    priorities.push(`Review ${staleOpps.length} stale opportunities`);
  }
  if (priorities.length === 0) {
    priorities.push('All reps are active and pipeline is moving');
    priorities.push('Focus on recruiting and territory expansion');
  }

  // Next high-value target
  const untouchedOrgs = territoryOrgs.filter(o => o.coverageStatus === 'UNTOUCHED');
  const nextTarget = untouchedOrgs[0];

  // Academy status for uncertified reps
  const uncertifiedReps = reps.filter(r => !r.isCertified);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-semibold text-white">
          Good Morning, {name}
        </h1>
      </div>

      {/* Today's Priorities */}
      <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-cyan-300 mb-3">
          Today's Priorities
        </h2>
        <ul className="space-y-2">
          {priorities.slice(0, 5).map((p, i) => (
            <li key={i} className="flex items-start gap-2 text-slate-200">
              <span className="text-cyan-400 mt-0.5">•</span>
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Your Team */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Your Team
        </h2>
        <div className="space-y-2">
          {repStatuses.map(rep => (
            <div
              key={rep.name}
              className={`flex items-center justify-between py-1.5 px-3 rounded-lg ${
                rep.needsAttention ? 'bg-amber-500/5 border border-amber-500/20' : ''
              }`}
            >
              <span className="text-slate-200 text-sm">{rep.name}</span>
              <span className={`text-xs ${rep.needsAttention ? 'text-amber-300 font-semibold' : 'text-slate-500'}`}>
                {rep.status}
              </span>
            </div>
          ))}
          {repStatuses.length === 0 && (
            <p className="text-sm text-slate-500">No reps assigned yet.</p>
          )}
        </div>
      </div>

      {/* Your Territory */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Your Territory
        </h2>
        <div className="grid grid-cols-3 gap-4 mb-3">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{territoryOrgs.length}</p>
            <p className="text-xs text-slate-500">Schools</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-300">{contacted}</p>
            <p className="text-xs text-slate-500">Contacted</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-300">{untouched}</p>
            <p className="text-xs text-slate-500">Untouched</p>
          </div>
        </div>
        {nextTarget && (
          <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">Next High-Value Target</p>
              <p className="text-sm text-white font-semibold">{nextTarget.name}</p>
            </div>
            <Link
              to={`/organizations/${nextTarget.id}`}
              className="text-xs text-cyan-400 hover:text-cyan-300"
            >
              Open →
            </Link>
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="flex gap-3 text-xs">
        <Link to="/organizations" className="text-cyan-400 hover:text-cyan-300">Organizations →</Link>
        <Link to="/team-opportunities" className="text-cyan-400 hover:text-cyan-300">Team Pipeline →</Link>
        <Link to="/territory" className="text-cyan-400 hover:text-cyan-300">Territory Map →</Link>
        <Link to="/recruiting" className="text-cyan-400 hover:text-cyan-300">Recruiting →</Link>
      </div>
    </div>
  );
}
