import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, EmptyState, Input, Pagination } from '../components/primitives';
import { formatCurrency, formatDate } from '../utils/format';
import { useOrders } from '../hooks/useOrders';
import { createMockOrderFromOpportunity } from '../services/ordersService';
import { useOpportunities } from '../hooks/useOpportunities';
import { notify } from '../services/feedbackService';
import {
  canSeeOrderValue,
  getOrderDueDate,
  getOrderStageLabel,
  getOrderTitle,
  matchesOrderQueueFilter,
  sortOrdersForExecution,
  type OrderQueueFilter,
} from '../services/orderWorkflow';

const PAGE_SIZE = 10;

const filters: { key: OrderQueueFilter; label: string }[] = [
  { key: 'ACTION_NEEDED', label: 'Action Needed' },
  { key: 'IN_PRODUCTION', label: 'In Production' },
  { key: 'BLOCKED', label: 'Blocked' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'ALL', label: 'All Orders' },
];

function StatusBadge({ stage }: { stage: string }) {
  const config: Record<string, { label: string; className: string }> = {
    'COMPLETED': { label: 'Complete', className: 'bg-emerald-900/40 text-emerald-300 border-emerald-600/40' },
    'IN_PRODUCTION': { label: 'In Production', className: 'bg-blue-900/40 text-blue-300 border-blue-600/40' },
    'ACTION_NEEDED': { label: 'Pending', className: 'bg-amber-900/40 text-amber-300 border-amber-600/40' },
    'BLOCKED': { label: 'Blocked', className: 'bg-red-900/40 text-red-300 border-red-600/40' },
  };
  const cfg = config[stage] ?? { label: stage, className: 'bg-slate-800/40 text-slate-400 border-slate-600/40' };
  return (
    <span className={`inline-flex items-center rounded border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

export function OrdersPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [queueFilter, setQueueFilter] = useState<OrderQueueFilter>('ALL');
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const allOrders = useOrders({ refreshKey });
  const searchedOrders = useOrders({ search, refreshKey });
  const opportunities = useOpportunities({ refreshKey });
  const canShowValue = canSeeOrderValue();

  const filtered = useMemo(
    () => searchedOrders
      .filter((order) => matchesOrderQueueFilter(order, queueFilter))
      .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')), // newest first
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
      <Card title="Orders" className="min-w-0">
        {/* Filter Pills */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {filters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => { setQueueFilter(filter.key); setPage(1); }}
              className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
                queueFilter === filter.key
                  ? 'border-slate-400 bg-slate-700/50 text-slate-100'
                  : 'border-slate-700 bg-slate-900/30 text-slate-400 hover:border-slate-500 hover:text-slate-200'
              }`}
            >
              {filter.label}
              <span className="ml-1.5 text-slate-500">{counts[filter.key]}</span>
            </button>
          ))}
          <div className="flex-1" />
          <button
            onClick={() => { setSearch(''); setQueueFilter('ALL'); setPage(1); }}
            className="text-xs font-semibold text-slate-400 hover:text-slate-200"
          >
            Reset
          </button>
        </div>

        {/* Search + Create */}
        <div className="mb-4 grid gap-2 md:grid-cols-[1fr_auto]">
          <Input placeholder="Search orders by organization or vendor" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          <Button onClick={createOrder}>Create Order From Closed-Won</Button>
        </div>

        {message ? (
          <p className="mb-4 rounded-lg border border-slate-600/40 bg-slate-800/40 px-3 py-2 text-sm text-slate-200">{message}</p>
        ) : null}

        {/* Summary Bar */}
        <div className="mb-3 flex items-center justify-between border-b border-slate-800 pb-2 text-xs text-slate-500">
          <span>{filtered.length} orders in {filters.find((f) => f.key === queueFilter)?.label}</span>
          <span>Newest first</span>
        </div>

        {/* Table */}
        {paged.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-2 pr-3">Order ID</th>
                  <th className="py-2 pr-3">School</th>
                  <th className="py-2 pr-3">Items</th>
                  <th className="py-2 pr-3 text-right">Value</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {paged.map((order) => {
                  const linkedOpportunity = opportunities.find((o) => o.id === order.opportunityId);
                  return (
                    <tr
                      key={order.id}
                      onClick={() => navigate(`/orders/${order.id}`)}
                      className="cursor-pointer transition-colors hover:bg-slate-800/30"
                    >
                      <td className="py-3 pr-3">
                        <span className="font-mono text-xs text-slate-300">{order.id}</span>
                      </td>
                      <td className="py-3 pr-3">
                        <p className="font-semibold text-slate-100">{order.organizationName}</p>
                        <p className="text-xs text-slate-500">{getOrderTitle(order, linkedOpportunity)}</p>
                      </td>
                      <td className="py-3 pr-3 text-xs text-slate-400">
                        {order.lane ?? '—'}
                      </td>
                      <td className="py-3 pr-3 text-right">
                        {canShowValue ? (
                          <span className="font-semibold text-slate-200">{formatCurrency(order.value)}</span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="py-3 pr-3">
                        <StatusBadge stage={order.productionStatus ?? 'ACTION_NEEDED'} />
                      </td>
                      <td className="py-3 text-xs text-slate-500">
                        {formatDate(getOrderDueDate(order))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title={allOrders.length ? 'No orders match this filter' : 'No orders yet'}
            description={allOrders.length ? 'Try switching to All Orders.' : 'Create an order from a closed-won opportunity to get started.'}
          />
        )}

        <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
      </Card>
    </div>
  );
}
