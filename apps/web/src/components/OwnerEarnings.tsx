import { Card } from '../components/primitives';
import { opportunities, orders, teamMembers } from '../data/mockSalesData';
import { formatCurrency } from '../utils/format';

const REP_COMMISSION_RATE = 0.08;
const DIRECTOR_OVERRIDE_RATE = 0.02;

function getCompanyEarnings() {
  const orderWonIds = new Set(orders.map((o) => o.opportunityId));
  const won = opportunities.filter((o) => o.stage === 'CLOSED_WON' && orderWonIds.has(o.id));
  const wonValue = won.reduce((sum, o) => sum + o.value, 0);

  const repCommission = wonValue * REP_COMMISSION_RATE;
  const directorOverride = wonValue * DIRECTOR_OVERRIDE_RATE;
  const totalCommission = repCommission + directorOverride;
  const netRevenue = wonValue - totalCommission;

  return { wonValue, totalCommission, netRevenue };
}

export function OwnerEarnings() {
  const { wonValue, totalCommission, netRevenue } = getCompanyEarnings();

  return (
    <Card title="Company Earnings">
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
          <p className="text-sm text-slate-300">Total Won Revenue</p>
          <p className="text-2xl font-semibold text-white">{formatCurrency(wonValue)}</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
          <p className="text-sm text-slate-300">Total Commission Paid</p>
          <p className="text-2xl font-semibold text-white">{formatCurrency(totalCommission)}</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
          <p className="text-sm text-slate-300">Net Revenue</p>
          <p className="text-2xl font-semibold text-emerald-200">{formatCurrency(netRevenue)}</p>
        </div>
      </div>
    </Card>
  );
}