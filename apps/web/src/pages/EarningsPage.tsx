import { getStoredUser } from '../auth';
import { Card } from '../components/primitives';
import { opportunities, orders } from '../data/mockSalesData';
import { formatCurrency } from '../utils/format';

const REP_COMMISSION_RATE = 0.08;
const DIRECTOR_OVERRIDE_RATE = 0.02;

export function EarningsPage() {
  const user = getStoredUser();

  const wonByRep = opportunities.filter((o) => o.stage === 'CLOSED_WON');
  const orderWonIds = new Set(orders.map((o) => o.opportunityId));
  const commissionEligible = wonByRep.filter((o) => orderWonIds.has(o.id));

  const repRows = Array.from(new Set(opportunities.map((o) => o.assignedRep))).map((rep) => {
    const myWon = commissionEligible.filter((o) => o.assignedRep === rep);
    const wonValue = myWon.reduce((sum, o) => sum + o.value, 0);
    return {
      rep,
      wonCount: myWon.length,
      wonValue,
      repCommission: wonValue * REP_COMMISSION_RATE,
      directorOverride: wonValue * DIRECTOR_OVERRIDE_RATE,
    };
  });

  const myRepRow = repRows.find((r) => r.rep === user?.name);

  return (
    <div className="space-y-3">
      <Card title="Earnings & Commissions">
        <p className="text-sm text-slate-300">Commission is calculated from opportunities in <strong>CLOSED_WON</strong> with linked orders (won and handed off).</p>
      </Card>

      {(user?.role === 'OWNER' || user?.role === 'DIRECTOR') && (
        <Card title={user.role === 'OWNER' ? 'All Opportunities Commission Summary' : 'Team Commission Summary'}>
          <div className="space-y-2 text-sm">
            {repRows.map((row) => (
              <div key={row.rep} className="grid grid-cols-1 gap-2 rounded-md border border-slate-800 bg-slate-950/60 p-3 md:grid-cols-5">
                <p className="font-semibold text-slate-100">{row.rep}</p>
                <p className="text-slate-300">Won Deals: {row.wonCount}</p>
                <p className="text-slate-300">Won Value: {formatCurrency(row.wonValue)}</p>
                <p className="text-cyan-200">Rep Commission: {formatCurrency(row.repCommission)}</p>
                <p className="text-sky-200">Director Override: {formatCurrency(row.directorOverride)}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {user?.role === 'REP' && myRepRow && (
        <Card title="My Earnings">
          <p className="text-sm text-slate-300">Deals Won: {myRepRow.wonCount}</p>
          <p className="text-sm text-slate-300">Won Value: {formatCurrency(myRepRow.wonValue)}</p>
          <p className="text-lg font-semibold text-cyan-200">Estimated Commission: {formatCurrency(myRepRow.repCommission)}</p>
        </Card>
      )}
    </div>
  );
}
