import { Card } from '../components/primitives';
import { opportunities, orders, teamMembers } from '../data/mockSalesData';
import { formatCurrency } from '../utils/format';

const MONTHLY_ORDER_GOAL = 4;

function getDirectorTeamSummary(directorName: string) {
  const director = teamMembers.find((member) => member.name === directorName);
  if (!director) return { teamRows: [], teamRevenue: 0, teamOrders: 0, teamPipeline: 0 };

  const teamReps = teamMembers.filter((member) => member.role === 'REP' && director.territoryIds.some((territory) => member.territoryIds.includes(territory)));
  const orderWonIds = new Set(orders.map((order) => order.opportunityId));
  const teamRows = teamReps.map((rep) => {
    const repOpportunities = opportunities.filter((opportunity) => opportunity.assignedRep === rep.name);
    const won = repOpportunities.filter((opportunity) => opportunity.stage === 'CLOSED_WON' && orderWonIds.has(opportunity.id));
    return {
      repName: rep.name,
      orderCount: won.length,
      pipeline: repOpportunities.filter((opportunity) => !['CLOSED_WON', 'CLOSED_LOST'].includes(opportunity.stage)).reduce((sum, opportunity) => sum + opportunity.value, 0),
      nearClose: repOpportunities.filter((opportunity) => ['MOCKUP_DELIVERED', 'INVOICE_SENT', 'DECISION_PENDING'].includes(opportunity.stage)).length,
    };
  });

  return {
    teamRows,
    teamRevenue: teamRows.reduce((sum, row) => sum + row.pipeline, 0),
    teamOrders: teamRows.reduce((sum, row) => sum + row.orderCount, 0),
    teamPipeline: teamRows.reduce((sum, row) => sum + row.pipeline, 0),
  };
}

export function DirectorEarnings({ directorName }: { directorName: string }) {
  const { teamRows, teamRevenue, teamOrders, teamPipeline } = getDirectorTeamSummary(directorName);

  return (
    <div className="space-y-3">
      <Card title="Team Earnings Visibility">
        <div className="grid gap-3 lg:grid-cols-3">
          <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
            <p className="text-sm text-slate-300">Team Revenue</p>
            <p className="text-2xl font-semibold text-white">{formatCurrency(teamRevenue)}</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
            <p className="text-sm text-slate-300">Team Orders</p>
            <p className="text-2xl font-semibold text-white">{teamOrders}</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
            <p className="text-sm text-slate-300">Pipeline Value</p>
            <p className="text-2xl font-semibold text-white">{formatCurrency(teamPipeline)}</p>
          </div>
        </div>
      </Card>
      <Card title="Rep Pace">
        <div className="space-y-2">
          {teamRows.map((row) => (
            <div key={row.repName} className="grid gap-2 rounded border border-slate-800 p-2 text-sm md:grid-cols-4">
              <p className="font-semibold">{row.repName}</p>
              <p>Orders: {row.orderCount}/{MONTHLY_ORDER_GOAL}</p>
              <p>Pipeline: {formatCurrency(row.pipeline)}</p>
              <p>Near-close: {row.nearClose}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
