import { getStoredUser } from '../auth';
import { OwnerEarnings } from '../components/OwnerEarnings';
import { DirectorEarnings } from '../components/DirectorEarnings';
import { RepEarnings } from '../components/RepEarnings';
import { teamMembers, opportunities, orders } from '../data/mockSalesData';
import { Card } from '../components/primitives';
import { formatCurrency } from '../utils/format';

const MONTHLY_ORDER_GOAL = 4;
const REP_COMMISSION_RATE = 0.08;
const DIRECTOR_OVERRIDE_RATE = 0.02;
const TARGET_ORDER_VALUE = 15000;

type EarningsRow = {
  rep: string;
  wonCount: number;
  wonValue: number;
  repCommission: number;
  directorOverride: number;
  possibleAtGoal: number;
};

function buildRow(rep: string): EarningsRow {
  const orderWonIds = new Set(orders.map((o) => o.opportunityId));
  const won = opportunities.filter((o) => o.assignedRep === rep && o.stage === 'CLOSED_WON' && orderWonIds.has(o.id));
  const wonValue = won.reduce((sum, o) => sum + o.value, 0);
  const averageOrderValue = won.length ? wonValue / won.length : TARGET_ORDER_VALUE;
  const remainingOrders = Math.max(MONTHLY_ORDER_GOAL - won.length, 0);
  return {
    rep,
    wonCount: won.length,
    wonValue,
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
  const repNames = teamMembers.filter((member) => member.role === 'REP' && member.active).map((member) => member.name);
  const allRows = repNames.map(buildRow);
  const visibleRows = user?.role === 'REP' ? allRows.filter((row) => row.rep === user.name) : allRows;
  const focusRows = visibleRows.length ? visibleRows : allRows;
  const totalWon = focusRows.reduce((sum, row) => sum + row.wonValue, 0);
  const totalRepCommission = focusRows.reduce((sum, row) => sum + row.repCommission, 0);
  const totalOverride = focusRows.reduce((sum, row) => sum + row.directorOverride, 0);
  const possibleAtGoal = focusRows.reduce((sum, row) => sum + row.possibleAtGoal, 0);
  const totalOrders = focusRows.reduce((sum, row) => sum + row.wonCount, 0);
  const grossProfitEstimate = totalWon * 0.42;
  const netRevenue = totalWon - totalRepCommission - totalOverride;
  const laneRevenue = ['UNIFORM','TRAVEL_GEAR','TEAM_STORE','LETTERMAN'].map((lane)=>({lane, value: opportunities.filter((o)=>o.stage==='CLOSED_WON' && o.lane===lane).reduce((sum,o)=>sum+o.value,0)}));
  const totalGoal = focusRows.length * MONTHLY_ORDER_GOAL;
  const pendingCommission = totalRepCommission * 0.35;
  const paidCommission = totalRepCommission - pendingCommission;
  const remainingOrders = Math.max(totalGoal - totalOrders, 0);

  return (
    <div className="space-y-3">
      <Card title="Owner Earnings Command Center">
        <div className="grid gap-3 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <p className="text-sm font-semibold text-white">The standard is 4 orders per month.</p>
            <p className="mt-1 text-sm text-slate-300">Commission is calculated from closed-won opportunities that have been handed off into orders.</p>
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-slate-300">Order pace</span>
                <span className="font-semibold text-cyan-200">{totalOrders}/{totalGoal}</span>
              </div>
              <ProgressBar value={totalOrders} total={totalGoal} />
              <p className="mt-2 text-xs text-slate-400">{remainingOrders} order{remainingOrders === 1 ? '' : 's'} left to hit the monthly floor. Lane penetration is the multiplier after that.</p>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <MoneyCard label="Made" value={formatCurrency(totalRepCommission)} note="Rep commission earned from eligible orders." />
            <MoneyCard label="Can Make at Pace" value={formatCurrency(possibleAtGoal)} note="Projected rep commission at 4 orders." />
            <MoneyCard label="Won Revenue" value={formatCurrency(totalWon)} note="Closed-won value linked to orders." />
            <MoneyCard label="Director Override" value={formatCurrency(totalOverride)} note="2% override on eligible team wins." />
          </div>
        </div>
      </Card>

      {user?.role === "OWNER" ? <Card title="Owner Financial Snapshot"><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"><MoneyCard label="Total Won Revenue" value={formatCurrency(totalWon)} note="Closed won linked to order handoff." /><MoneyCard label="Total Commission Liability" value={formatCurrency(totalRepCommission + totalOverride)} note="Rep + director payouts." /><MoneyCard label="Net Revenue" value={formatCurrency(netRevenue)} note="Won revenue less payout liability." /><MoneyCard label="Gross Profit Estimate" value={formatCurrency(grossProfitEstimate)} note="Estimated at 42% gross margin." /></div><div className="mt-3 grid gap-2 sm:grid-cols-2"> <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3"><p className="text-xs uppercase text-slate-400">Revenue by Lane</p>{laneRevenue.map((row)=><p key={row.lane} className="text-sm text-slate-300">{row.lane}: {formatCurrency(row.value)}</p>)}</div><div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3"><p className="text-xs uppercase text-slate-400">Payout Snapshot</p><p className="text-sm text-slate-300">Rep payout: {formatCurrency(totalRepCommission)}</p><p className="text-sm text-slate-300">Director override: {formatCurrency(totalOverride)}</p></div></div></Card> : null}

      {user?.role === 'REP' ? <Card title='My Commission Snapshot'><div className='grid gap-2 sm:grid-cols-2'><p className='text-sm text-slate-300'>Orders closed this month: {totalOrders}</p><p className='text-sm text-slate-300'>Estimated commission: {formatCurrency(totalRepCommission)}</p><p className='text-sm text-slate-300'>Pending commission: {formatCurrency(pendingCommission)}</p><p className='text-sm text-slate-300'>Paid commission (mock): {formatCurrency(paidCommission)}</p><p className='text-sm text-slate-300'>4-order bonus progress: {totalOrders}/{MONTHLY_ORDER_GOAL}</p><p className='text-sm text-slate-300'>Lane penetration bonus progress: {laneRevenue.filter((l)=>l.value>0).length}/4 lanes won</p></div></Card> : null}

      <Card title={user?.role === 'REP' ? 'My 4-Order Pace' : 'Team 4-Order Pace'}>
        <div className="space-y-2">
          {visibleRows.map((row) => {
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
                <div>
                  <p className="text-sm text-slate-300">Made</p>
                  <p className="font-semibold text-white">{formatCurrency(row.repCommission)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-300">Possible at 4</p>
                  <p className="font-semibold text-emerald-200">{formatCurrency(row.possibleAtGoal)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
