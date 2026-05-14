import { Card } from '../components/primitives';
import { orders, opportunities } from '../data/mockSalesData';
import { formatCurrency } from '../utils/format';

const REP_COMMISSION_RATE = 0.08;
const MONTHLY_ORDER_GOAL = 4;
const TARGET_ORDER_VALUE = 15000;

function getRepCommission(repName: string) {
  const orderWonIds = new Set(orders.map((o) => o.opportunityId));
  const won = opportunities.filter((o) => o.assignedRep === repName && o.stage === 'CLOSED_WON' && orderWonIds.has(o.id));
  const wonValue = won.reduce((sum, o) => sum + o.value, 0);
  const averageOrderValue = won.length ? wonValue / won.length : TARGET_ORDER_VALUE;
  const remainingOrders = Math.max(MONTHLY_ORDER_GOAL - won.length, 0);

  return {
    commission: wonValue * REP_COMMISSION_RATE,
    wonCount: won.length,
    wonValue,
    possibleAtGoal: (wonValue + remainingOrders * averageOrderValue) * REP_COMMISSION_RATE,
    recentDeals: won.slice(0, 5),
  };
}

export function RepEarnings({ repName }: { repName: string }) {
  const { commission, wonCount, wonValue, possibleAtGoal, recentDeals } = getRepCommission(repName);

  return (
    <div className="space-y-3">
      <Card title="My Earnings">
        <div className="grid gap-3 lg:grid-cols-3">
          <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
            <p className="text-sm text-slate-300">Commission (MTD)</p>
            <p className="text-2xl font-semibold text-white">{formatCurrency(commission)}</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
            <p className="text-sm text-slate-300">Projected at Pace</p>
            <p className="text-2xl font-semibold text-emerald-200">{formatCurrency(possibleAtGoal)}</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
            <p className="text-sm text-slate-300">Bonuses</p>
            <p className="text-2xl font-semibold text-white">{formatCurrency(0)}</p>
          </div>
        </div>
      </Card>
      <Card title="Recent Commissions">
        <div className="space-y-2">
          {recentDeals.map((deal) => (
            <div key={deal.id} className="flex justify-between items-center">
              <p>{deal.organizationName} - {deal.title}</p>
              <p className="font-semibold">{formatCurrency(deal.value * REP_COMMISSION_RATE)}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}