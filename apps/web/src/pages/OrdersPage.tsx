import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, EmptyState, Input, LaneBadge, Pagination } from '../components/primitives';
import { formatCurrency, formatDate } from '../utils/format';
import { useOrders } from '../hooks/useOrders';
import { createMockOrderFromOpportunity } from '../services/ordersService';
import { useOpportunities } from '../hooks/useOpportunities';
import { notify } from '../services/feedbackService';
import {
  canSeeOrderValue,
  getOrderDueDate,
  getOrderNextAction,
  getOrderOwner,
  getOrderRisk,
  getOrderStageLabel,
  getOrderTitle,
  matchesOrderQueueFilter,
  sortOrdersForExecution,
  type OrderQueueFilter,
} from '../services/orderWorkflow';

const PAGE_SIZE = 8;

const filters: { key: OrderQueueFilter; label: string }[] = [
  { key: 'ACTION_NEEDED', label: 'Action Needed' },
  { key: 'IN_PRODUCTION', label: 'In Production' },
  { key: 'BLOCKED', label: 'Blocked' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'ALL', label: 'All Orders' },
];

export function OrdersPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [queueFilter, setQueueFilter] = useState<OrderQueueFilter>('ACTION_NEEDED');
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const allOrders = useOrders({ refreshKey });
  const searchedOrders = useOrders({ search, refreshKey });
  const opportunities = useOpportunities({ refreshKey });
  const canShowValue = canSeeOrderValue();

  const filtered = useMemo(
    () => searchedOrders.filter((order) => matchesOrderQueueFilter(order, queueFilter)).sort(sortOrdersForExecution),
    [queueFilter, searchedOrders],
  );

  const counts = useMemo(() => filters.reduce<Record<OrderQueueFilter, number>>((acc, filter) => {
    acc[filter.key] = allOrders.filter((order) => matchesOrderQueueFilter(order, filter.key)).length;
    return acc;
  }, { ACTION_NEEDED: 0, IN_PRODUCTION: 0, BLOCKED: 0, COMPLETED: 0, ALL: 0 }), [allOrders]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const createOrder = () => {
    try {
      const existingOpportunityIds = new Set(allOrders.map((order) => order.opportunityId));
      const sourceOpportunity = opportunities.find((opportunity) => opportunity.stage === 'CLOSED_WON' && !existingOpportunityIds.has(opportunity.id));
      const created = createMockOrderFromOpportunity(sourceOpportunity);
      setMessage(`Order created from ${created.organizationName}.`);
      setRefreshKey((value) => value + 1);
      notify('Order created.', 'success');
      navigate(`/orders/${created.id}`);
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Close an opportunity before creating an order.';
      setMessage(detail);
      notify(`Order creation failed: ${detail}`, 'error');
    }
  };

  return (
    <div className="space-y-3 min-w-0">
      <Card title="Order Execution Queue" className="min-w-0">
        <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                key={filter.key}
                onClick={() => { setQueueFilter(filter.key); setPage(1); }}
                className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${queueFilter === filter.key ? 'border-cyan-300 bg-cyan-400/15 text-cyan-100' : 'border-slate-700 bg-slate-900/50 text-slate-300 hover:border-slate-500'}`}
              >
                {filter.label} <span className="text-slate-400">{counts[filter.key]}</span>
              </button>
            ))}
          </div>
          <button onClick={() => { setSearch(''); setQueueFilter('ACTION_NEEDED'); setPage(1); }} className="text-left text-xs font-semibold text-cyan-300 md:text-right">Reset</button>
        </div>
        <div className="mb-3 grid gap-2 md:grid-cols-[1fr_auto]">
          <Input placeholder="Search order, organization, vendor, or stage" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          <Button onClick={createOrder}>Create Closed-Won Handoff</Button>
        </div>
        {message ? <p className="mb-3 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-100">{message}</p> : null}
        <div className="mb-2 flex items-center justify-between text-xs text-slate-400"><span>{filtered.length} orders in {filters.find((filter) => filter.key === queueFilter)?.label}</span><span>Sorted by blockers, due date, production, completed</span></div>
        <div className="space-y-2">
          {paged.length ? paged.map((order) => {
            const linkedOpportunity = opportunities.find((opportunity) => opportunity.id === order.opportunityId);
            const risk = getOrderRisk(order);
            return (
              <button key={order.id} onClick={() => navigate(`/orders/${order.id}`)} className="w-full rounded-xl border border-slate-800 bg-slate-950/50 p-3 text-left transition hover:border-cyan-500/50 hover:bg-slate-900/70">
                <div className="grid gap-3 lg:grid-cols-[1.2fr_.9fr_.9fr_.8fr_.7fr_auto] lg:items-center">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-white">{order.organizationName}</p>
                    <p className="truncate text-xs text-slate-400">{getOrderTitle(order, linkedOpportunity)}</p>
                    <div className="mt-1 flex flex-wrap gap-1"><LaneBadge lane={order.lane} /><span className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] text-slate-300">{order.id}</span></div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Current stage</p>
                    <p className="text-sm font-semibold text-slate-100">{getOrderStageLabel(order)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Next action</p>
                    <p className="text-sm text-slate-200">{getOrderNextAction(order)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Owner / due</p>
                    <p className="text-sm text-slate-200">{getOrderOwner(order, linkedOpportunity)}</p>
                    <p className="text-xs text-slate-400">{formatDate(getOrderDueDate(order))}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 lg:block">
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${risk.tone}`}>{risk.label}</span>
                    {canShowValue ? <p className="mt-1 text-sm font-semibold text-cyan-200">{formatCurrency(order.value)}</p> : null}
                  </div>
                  <span className="rounded-lg border border-cyan-500/50 px-3 py-2 text-center text-xs font-bold text-cyan-200">Open</span>
                </div>
              </button>
            );
          }) : <EmptyState title="No orders in this queue" description="Try All Orders or create a closed-won handoff." />}
        </div>
        <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
      </Card>
    </div>
  );
}
