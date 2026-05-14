import { Card } from '../components/primitives';
import { orders, opportunities, teamMembers } from '../data/mockSalesData';
import { formatCurrency } from '../utils/format';

const DIRECTOR_OVERRIDE_RATE = 0.02;

function getDirectorCommission(directorName: string) {
  const director = teamMembers.find((m) => m.name === directorName);
  if (!director) return { commission: 0, repOverrides: [] };

  const teamReps = teamMembers.filter((m) => m.role === 'REP' && director.territoryIds.some((t) => m.territoryIds.includes(t)));

  const repOverrides = teamReps.map((rep) => {
    const orderWonIds = new Set(orders.map((o) => o.opportunityId));
    const won = opportunities.filter((o) => o.assignedRep === rep.name && o.stage === 'CLOSED_WON' && orderWonIds.has(o.id));
    const wonValue = won.reduce((sum, o) => sum + o.value, 0);
    return {
      repName: rep.name,
      override: wonValue * DIRECTOR_OVERRIDE_RATE,
    };
  });

  const commission = repOverrides.reduce((sum, r) => sum + r.override, 0);

  return { commission, repOverrides };
}

export function DirectorEarnings({ directorName }: { directorName: string }) {
  const { commission, repOverrides } = getDirectorCommission(directorName);

  return (
    <div className="space-y-3">
      <Card title="My Earnings">
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
            <p className="text-sm text-slate-300">Total Override</p>
            <p className="text-2xl font-semibold text-white">{formatCurrency(commission)}</p>
          </div>
        </div>
      </Card>
      <Card title="Team Overrides">
        <div className="space-y-2">
          {repOverrides.map((override) => (
            <div key={override.repName} className="flex justify-between items-center">
              <p>{override.repName}</p>
              <p className="font-semibold">{formatCurrency(override.override)}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}