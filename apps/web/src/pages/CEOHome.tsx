import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getStoredUser } from '../auth';
import { apiClient } from '../services/apiClient';
import { useOrganizations } from '../hooks/useOrganizations';
import { useOpportunities } from '../hooks/useOpportunities';
import { getNearCloseOpportunities } from '../services/businessSelectors';
import { formatCurrency } from '../utils/format';

export default function CEOHome() {
  const user = getStoredUser();
  const name = user?.name?.split(' ')[0] || 'CEO';
  const { data: organizations = [] } = useOrganizations({});
  const { data: opportunities = [] } = useOpportunities({});

  const [statusCheck, setStatusCheck] = useState<{ total: number; pending: number }>({ total: 0, pending: 0 });

  useEffect(() => {
    apiClient('/intake/status-check').then((d: any) => {
      setStatusCheck({ total: d?.total || 0, pending: d?.pending?.length || 0 });
    }).catch(() => {});
  }, []);

  // What requires attention
  const nearClose = getNearCloseOpportunities(opportunities);
  const nearCloseValue = nearClose.reduce((s, o) => s + o.value, 0);
  const staleOpps = opportunities.filter(o => {
    if (['CLOSED_WON', 'CLOSED_LOST'].includes(o.stage)) return false;
    if (!o.lastActivity) return true;
    return (Date.now() - new Date(o.lastActivity).getTime()) > 14 * 86400000;
  });

  const untouchedOrgs = organizations.filter(o => o.coverageStatus === 'UNTOUCHED');
  const contactedOrgs = organizations.length - untouchedOrgs.length;

  // CEO priorities — what only the CEO can do
  const priorities: string[] = [];
  if (statusCheck.pending > 0) {
    priorities.push(`${statusCheck.pending} director${statusCheck.pending > 1 ? 's' : ''} haven't responded to leadership status check`);
  }
  if (staleOpps.length > 0) {
    priorities.push(`${staleOpps.length} opportunities have gone stale — revenue at risk`);
  }
  if (nearClose.length > 0) {
    priorities.push(`${nearClose.length} deals near close (${formatCurrency(nearCloseValue)}) — ensure nothing blocks them`);
  }
  if (untouchedOrgs.length > organizations.length * 0.5) {
    priorities.push(`Over 50% of territory untouched — accelerate coverage`);
  }
  if (priorities.length === 0) {
    priorities.push('All territories active and pipeline healthy');
    priorities.push('Focus on expansion and recruiting');
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-white">
          Good Morning, {name}
        </h1>
      </div>

      {/* Today's Priorities — Five Things Only You Should Work On */}
      <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 sm:p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-cyan-300 mb-3">
          Five Things Only You Should Work On Today
        </h2>
        <ul className="space-y-2">
          {priorities.slice(0, 5).map((p, i) => (
            <li key={i} className="flex items-start gap-2 text-slate-200 text-sm">
              <span className="text-cyan-400 mt-0.5">{i + 1}.</span>
              <span>{p}</span>
            </li>
          ))}
        </ul>
        {priorities.length === 0 && (
          <p className="text-emerald-400 text-sm">All clear. The business is moving.</p>
        )}
      </div>

      {/* Who Needs You */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 sm:p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Who Needs You
        </h2>

        {/* Directors pending status check */}
        {statusCheck.pending > 0 && (
          <div className="flex items-center justify-between py-2 border-b border-slate-800">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-slate-200">Leadership Status Check</p>
              <p className="text-xs text-red-300">{statusCheck.pending} director{statusCheck.pending > 1 ? 's' : ''} pending response</p>
            </div>
            <Link to="/command" className="text-xs text-cyan-400 hover:text-cyan-300 shrink-0 ml-2">
              View →
            </Link>
          </div>
        )}

        {/* Revenue at risk */}
        {staleOpps.length > 0 && (
          <div className="flex items-center justify-between py-2 border-b border-slate-800">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-slate-200">Revenue at Risk</p>
              <p className="text-xs text-amber-300">{staleOpps.length} stale opportunities</p>
            </div>
            <Link to="/team-opportunities" className="text-xs text-cyan-400 hover:text-cyan-300 shrink-0 ml-2">
              View →
            </Link>
          </div>
        )}

        {/* Blocked / Near close */}
        {nearClose.length > 0 && (
          <div className="flex items-center justify-between py-2 border-b border-slate-800">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-slate-200">Near-Close Pipeline</p>
              <p className="text-xs text-emerald-300">{nearClose.length} deals · {formatCurrency(nearCloseValue)}</p>
            </div>
            <Link to="/team-opportunities" className="text-xs text-cyan-400 hover:text-cyan-300 shrink-0 ml-2">
              View →
            </Link>
          </div>
        )}

        {/* Territory coverage */}
        <div className="flex items-center justify-between py-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-slate-200">Territory Coverage</p>
            <p className="text-xs text-slate-400">{contactedOrgs} contacted · {untouchedOrgs.length} untouched</p>
          </div>
          <Link to="/territory" className="text-xs text-cyan-400 hover:text-cyan-300 shrink-0 ml-2">
            View →
          </Link>
        </div>
      </div>

      {/* Quick Links */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 text-xs">
        <Link to="/command" className="text-cyan-400 hover:text-cyan-300">Command Center →</Link>
        <Link to="/intake" className="text-cyan-400 hover:text-cyan-300">Executive Intake →</Link>
        <Link to="/people" className="text-cyan-400 hover:text-cyan-300">People Pipeline →</Link>
        <Link to="/recruiting" className="text-cyan-400 hover:text-cyan-300">Recruiting →</Link>
      </div>
    </div>
  );
}
