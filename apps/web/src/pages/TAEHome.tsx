import { Link } from 'react-router-dom';
import { useOrganizations } from '../hooks/useOrganizations';
import { useOpportunities } from '../hooks/useOpportunities';
import { getStoredUser } from '../auth';
import { getNearCloseOpportunities, getStaleOpportunities } from '../services/businessSelectors';
import { formatCurrency } from '../utils/format';

const MONTHLY_ORDER_GOAL = 4;

export default function TAEHome() {
  const user = getStoredUser();
  const name = user?.name?.split(' ')[0] || 'Rep';
  const { data: organizations = [] } = useOrganizations({});
  const { data: opportunities = [] } = useOpportunities({});

  const openOpps = opportunities.filter(o => !['CLOSED_WON', 'CLOSED_LOST'].includes(o.stage));
  const nearClose = getNearCloseOpportunities(opportunities);
  const staleOpps = getStaleOpportunities(opportunities, 14);
  const wonOpps = opportunities.filter(o => o.stage === 'CLOSED_WON');
  const wonCount = wonOpps.length;
  const untouchedAccounts = organizations.filter(o => o.coverageStatus === 'UNTOUCHED');
  const contacted = organizations.length - untouchedAccounts.length;

  // Today's priorities
  const priorities: string[] = [];
  if (nearClose.length > 0) {
    for (const deal of nearClose.slice(0, 3)) {
      priorities.push(`Close: ${deal.organizationName || 'Deal'} — ${formatCurrency(deal.value)}`);
    }
  }
  if (staleOpps.length > 0) {
    priorities.push(`Re-engage ${staleOpps.length} stale deal${staleOpps.length > 1 ? 's' : ''}`);
  }
  if (untouchedAccounts.length > 0) {
    priorities.push(`Make first contact with ${Math.min(untouchedAccounts.length, 5)} new schools`);
  }
  if (priorities.length === 0 && openOpps.length === 0) {
    priorities.push('Open your first opportunity — start with Uniforms discovery');
    priorities.push('Contact 3 schools today');
  }
  if (priorities.length === 0 && openOpps.length > 0) {
    priorities.push(`Advance ${openOpps.length} open opportunities`);
    priorities.push('Contact 3 new schools to expand pipeline');
  }

  // Pipeline stage progress
  const stages = [
    { key: 'LEAD_ENGAGED', label: 'Lead' },
    { key: 'DISCOVERY', label: 'Discovery' },
    { key: 'MOCKUP_STAGE', label: 'Mockup' },
    { key: 'INVOICE_SENT', label: 'Invoice' },
    { key: 'CLOSED_WON', label: 'Won' },
  ];
  const stageCounts = Object.fromEntries(
    stages.map(s => [s.key, opportunities.filter(o => o.stage === s.key).length])
  );

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-semibold text-white">
          Good Morning, {name}
        </h1>
      </div>

      {/* Order Pace */}
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-emerald-300 font-semibold">4-Order Floor</p>
          <p className="text-2xl font-bold text-white">{wonCount}/{MONTHLY_ORDER_GOAL}</p>
        </div>
        <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all"
            style={{ width: `${Math.min(100, (wonCount / MONTHLY_ORDER_GOAL) * 100)}%` }}
          />
        </div>
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
        {nearClose.length > 0 && (
          <Link to="/my-opportunities" className="inline-block mt-3 text-xs text-cyan-400 hover:text-cyan-300">
            View all near-close deals →
          </Link>
        )}
      </div>

      {/* Pipeline Progress */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Pipeline
        </h2>
        <div className="flex items-center gap-1">
          {stages.map((stage, i) => {
            const count = stageCounts[stage.key] || 0;
            const isActive = count > 0;
            return (
              <div key={stage.key} className="flex-1 flex items-center">
                <div className={`flex-1 rounded-lg p-2 text-center ${isActive ? 'bg-cyan-500/10 border border-cyan-500/30' : 'bg-slate-900 border border-slate-800'}`}>
                  <p className={`text-lg font-bold ${isActive ? 'text-cyan-300' : 'text-slate-600'}`}>{count}</p>
                  <p className="text-[9px] uppercase text-slate-500">{stage.label}</p>
                </div>
                {i < stages.length - 1 && (
                  <div className={`w-2 h-px ${isActive ? 'bg-cyan-500/50' : 'bg-slate-800'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Who to Contact */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Who to Contact
        </h2>
        {untouchedAccounts.slice(0, 5).map(org => (
          <div key={org.id} className="flex items-center justify-between py-1.5 border-b border-slate-800 last:border-0">
            <div>
              <p className="text-sm text-slate-200">{org.name}</p>
              <p className="text-xs text-slate-500">{org.city}, {org.state}</p>
            </div>
            <Link to={`/organizations/${org.id}`} className="text-xs text-cyan-400 hover:text-cyan-300">
              Contact →
            </Link>
          </div>
        ))}
        {untouchedAccounts.length === 0 && (
          <p className="text-sm text-emerald-400">All accounts contacted. Expand your territory!</p>
        )}
      </div>

      {/* Academy status */}
      {!user?.isCertified && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-amber-300 font-semibold">Academy</p>
            <p className="text-sm text-slate-300">Complete your certification training</p>
          </div>
          <Link to="/academy" className="text-xs text-amber-400 hover:text-amber-300 font-semibold">
            Continue →
          </Link>
        </div>
      )}

      {/* Quick Links */}
      <div className="flex gap-3 text-xs">
        <Link to="/organizations/new" className="text-cyan-400 hover:text-cyan-300">+ New Organization →</Link>
        <Link to="/my-opportunities" className="text-cyan-400 hover:text-cyan-300">My Pipeline →</Link>
        <Link to="/organizations" className="text-cyan-400 hover:text-cyan-300">All Accounts →</Link>
      </div>
    </div>
  );
}
