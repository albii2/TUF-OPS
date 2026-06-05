import { getStoredUser } from '../auth';
import { Card } from '../components/primitives';
import { teamMembers, type Opportunity, type Order } from '../data/mockSalesData';
import { useOpportunities } from '../hooks/useOpportunities';
import { useOrders } from '../hooks/useOrders';
import { getStaleOpportunities, getNearCloseOpportunities } from '../services/businessSelectors';
import { formatCurrency } from '../utils/format';

const MONTHLY_ORDER_GOAL = 4;
const REP_COMMISSION_RATE = 0.08;
const DIRECTOR_OVERRIDE_RATE = 0.02;
const TARGET_ORDER_VALUE = 15000;

type EarningsRow = {
  rep: string;
  wonCount: number;
  wonValue: number;
  openPipeline: number;
  nearClose: number;
  stale: number;
  repCommission: number;
  directorOverride: number;
  possibleAtGoal: number;
};

function buildRow(rep: string, opportunities: Opportunity[], orders: Order[]): EarningsRow {
  const orderWonIds = new Set(orders.map((order) => order.opportunityId));
  const repOpportunities = opportunities.filter((opportunity) => opportunity.assignedRep === rep);
  const won = repOpportunities.filter((opportunity) => opportunity.stage === 'CLOSED_WON' && orderWonIds.has(opportunity.id));
  const wonValue = won.reduce((sum, opportunity) => sum + opportunity.value, 0);
  const averageOrderValue = won.length ? wonValue / won.length : TARGET_ORDER_VALUE;
  const remainingOrders = Math.max(MONTHLY_ORDER_GOAL - won.length, 0);

  return {
    rep,
    wonCount: won.length,
    wonValue,
    openPipeline: repOpportunities.filter((opportunity) => !['CLOSED_WON', 'CLOSED_LOST'].includes(opportunity.stage)).reduce((sum, opportunity) => sum + opportunity.value, 0),
    nearClose: getNearCloseOpportunities(repOpportunities).length,
    stale: getStaleOpportunities(repOpportunities).length,
    repCommission: wonValue * REP_COMMISSION_RATE,
    directorOverride: wonValue * DIRECTOR_OVERRIDE_RATE,
    possibleAtGoal: (wonValue + remainingOrders * averageOrderValue) * REP_COMMISSION_RATE,
  };
}

function ProgressBar({ value, total }: { value: number; total: number }) {
  const pct = Math.min(100, Math.round((value / Math.max(total, 1)) * 100));
  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-800">
      <div className="h-full rounded-full bg-cyan-400" style={{ width: `${pct}%` }} />
    </div>
  );
}

function MoneyCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <Card>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
      <p className="text-sm text-slate-300">{note}</p>
    </Card>
  );
}

export function EarningsPage() {
  const user = getStoredUser();
  const opportunities = useOpportunities({});
  const orders = useOrders({});
  const visibleRepNames = Array.from(new Set(opportunities.map((opportunity) => opportunity.assignedRep).filter(Boolean)));
  const fallbackRepNames = teamMembers.filter((member) => member.role === 'REP' && member.active).map((member) => member.name);
  const repNames = visibleRepNames.length ? visibleRepNames : user?.role === 'REP' ? [user.name] : fallbackRepNames;
  const rows = repNames.map((rep) => buildRow(rep, opportunities, orders));
  const totalWon = rows.reduce((sum, row) => sum + row.wonValue, 0);
  const totalRepCommission = rows.reduce((sum, row) => sum + row.repCommission, 0);
  const totalOverride = rows.reduce((sum, row) => sum + row.directorOverride, 0);
  const possibleAtGoal = rows.reduce((sum, row) => sum + row.possibleAtGoal, 0);
  const totalOrders = rows.reduce((sum, row) => sum + row.wonCount, 0);
  const totalGoal = rows.length * MONTHLY_ORDER_GOAL;
  const remainingOrders = Math.max(totalGoal - totalOrders, 0);
  const openPipeline = rows.reduce((sum, row) => sum + row.openPipeline, 0);

  if (user?.role === 'DIRECTOR') {
    const pacePct = Math.round((totalOrders / Math.max(totalGoal, 1)) * 100);
    return (
      <div className="space-y-3">
        <Card title="Director Team Performance">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <MoneyCard label="Team Revenue" value={formatCurrency(totalWon)} note="Closed-won revenue linked to team orders." />
            <MoneyCard label="Order Count" value={`${totalOrders}/${totalGoal}`} note={`${remainingOrders} order${remainingOrders === 1 ? '' : 's'} left to team pace.`} />
            <MoneyCard label="Pipeline Value" value={formatCurrency(openPipeline)} note="Open team pipeline in your scope." />
            <MoneyCard label="4-Order Pace" value={`${pacePct}%`} note="Team progress toward 4 orders per rep." />
          </div>
        </Card>

        <Card title="Rep Pace And Activity">
          <div className="space-y-2">
            {rows.map((row) => {
              const remaining = Math.max(MONTHLY_ORDER_GOAL - row.wonCount, 0);
              return (
                <div key={row.rep} className="grid gap-3 rounded-lg border border-slate-800 bg-slate-950/70 p-3 lg:grid-cols-[1fr_1fr_1fr_1fr]">
                  <div>
                    <p className="font-semibold text-white">{row.rep}</p>
                    <p className="text-sm text-slate-400">{remaining ? `${remaining} order${remaining === 1 ? '' : 's'} from target` : 'Target reached'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-300">Orders</p>
                    <p className="font-semibold text-cyan-200">{Math.min(row.wonCount, MONTHLY_ORDER_GOAL)}/4</p>
                    <ProgressBar value={row.wonCount} total={MONTHLY_ORDER_GOAL} />
                  </div>
                  <p className="text-sm text-slate-300">Open pipeline: {formatCurrency(row.openPipeline)}</p>
                  <p className="text-sm text-slate-300">Activity: near-close {row.nearClose} · stale {row.stale}</p>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    );
  }

  if (user?.role === 'REP') {
    const row = rows.find((item) => item.rep === user.name) ?? rows[0];
    const pendingCommission = (row?.repCommission ?? 0) * 0.35;
    const paidCommission = (row?.repCommission ?? 0) - pendingCommission;
    return (
      <div className="space-y-3">
        <Card title="My Commission Snapshot">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <MoneyCard label="Commission MTD" value={formatCurrency(row?.repCommission ?? 0)} note="Your eligible closed-won orders." />
            <MoneyCard label="Projected At Pace" value={formatCurrency(row?.possibleAtGoal ?? 0)} note="Projected at 4 orders this month." />
            <MoneyCard label="Pending" value={formatCurrency(pendingCommission)} note="Estimated pending commission." />
            <MoneyCard label="Paid" value={formatCurrency(paidCommission)} note="Estimated paid commission." />
          </div>
        </Card>

        <Card title="My 4-Order Pace">
          <div className="space-y-2">
            <p className="text-sm text-slate-300">Orders closed this month: {row?.wonCount ?? 0}/{MONTHLY_ORDER_GOAL}</p>
            <ProgressBar value={row?.wonCount ?? 0} total={MONTHLY_ORDER_GOAL} />
            <p className="text-sm text-slate-300">Open pipeline: {formatCurrency(row?.openPipeline ?? 0)}</p>
          </div>
        </Card>
      </div>
    );
  }

  const grossProfitEstimate = totalWon * 0.42;
  const netRevenue = totalWon - totalRepCommission - totalOverride;

  return (
    <div className="space-y-3">
      <Card title="Owner Earnings Command Center">
        <div className="grid gap-3 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <p className="text-sm font-semibold text-white">The standard is 4 orders per month.</p>
            <p className="mt-1 text-sm text-slate-300">Owner view includes full commission and payout liability.</p>
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-slate-300">Order pace</span>
                <span className="font-semibold text-cyan-200">{totalOrders}/{totalGoal}</span>
              </div>
              <ProgressBar value={totalOrders} total={totalGoal} />
              <p className="mt-2 text-xs text-slate-400">{remainingOrders} order{remainingOrders === 1 ? '' : 's'} left to hit the monthly floor.</p>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <MoneyCard label="Rep Commission" value={formatCurrency(totalRepCommission)} note="Rep payout liability from eligible orders." />
            <MoneyCard label="Can Make At Pace" value={formatCurrency(possibleAtGoal)} note="Projected rep commission at 4 orders." />
            <MoneyCard label="Won Revenue" value={formatCurrency(totalWon)} note="Closed-won value linked to orders." />
            <MoneyCard label="Director Override" value={formatCurrency(totalOverride)} note="2% override on eligible team wins." />
          </div>
        </div>
      </Card>

      <Card title="Owner Financial Snapshot">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <MoneyCard label="Total Won Revenue" value={formatCurrency(totalWon)} note="Closed won linked to order handoff." />
          <MoneyCard label="Total Commission Liability" value={formatCurrency(totalRepCommission + totalOverride)} note="Rep + director payouts." />
          <MoneyCard label="Net Revenue" value={formatCurrency(netRevenue)} note="Won revenue less payout liability." />
          <MoneyCard label="Gross Profit Estimate" value={formatCurrency(grossProfitEstimate)} note="Estimated at 42% gross margin." />
        </div>
      </Card>

      <Card title="Rep Financial Detail">
        <div className="space-y-2">
          {rows.map((row) => (
            <div key={row.rep} className="grid gap-3 rounded-lg border border-slate-800 bg-slate-950/70 p-3 lg:grid-cols-[1fr_1fr_1fr_1fr]">
              <p className="font-semibold text-white">{row.rep}</p>
              <p className="text-sm text-slate-300">Orders: {row.wonCount}/4</p>
              <p className="text-sm text-slate-300">Rep commission: {formatCurrency(row.repCommission)}</p>
              <p className="text-sm text-slate-300">Director override: {formatCurrency(row.directorOverride)}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
