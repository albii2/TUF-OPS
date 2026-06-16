import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, EmptyState, Input, LaneBadge, Pagination } from '../components/primitives';
import { formatCurrency, formatDate } from '../utils/format';
import { useOrders } from '../hooks/useOrders';
import { getOrderRiskScore } from '../services/businessSelectors';
import { createMockOrderFromOpportunity } from '../services/ordersService';
import { useOpportunities } from '../hooks/useOpportunities';
import { notify } from '../services/feedbackService';

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
  const filtered = useOrders({ search, productionStatus: status as 'ALL' | 'NEEDS_REVIEW' | 'READY_FOR_VENDOR' | 'IN_PRODUCTION' | 'BLOCKED' | 'COMPLETED', refreshKey });
  const opportunities = useOpportunities({ refreshKey });

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

  const createOrder = () => {
    try {
      const existingOpportunityIds = new Set(allOrders.map((order) => order.opportunityId));
      const sourceOpportunity = opportunities.find((opportunity) => opportunity.stage === 'CLOSED_WON' && !existingOpportunityIds.has(opportunity.id));
      const created = createMockOrderFromOpportunity(sourceOpportunity);
      setMessage(`Order created from ${created.organizationName}.`);
      setRefreshKey((value) => value + 1);
      notify('Order created.', 'success');
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Close an opportunity before creating an order.';
      setMessage(detail);
      notify(`Order creation failed: ${detail}`, 'error');
    }
  };

  return (
    <Card title="Order Execution Queue" className="min-w-0">
      <div className="mb-2 flex items-center justify-between text-xs text-slate-400"><span>{filtered.length} orders</span><button onClick={() => { setSearch(''); setStatus('ALL'); setPage(1); }} className="text-cyan-300">Reset filters</button></div>
      <div className="safe-grid mb-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_220px]">
        <Input placeholder="Search order / org / vendor" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}><option value="ALL">All Status</option>{statuses.map((s) => <option key={s}>{s}</option>)}</Select>
      </div>
      {paged.length ? <DataTable columns={columns} rows={paged} getRowId={(r) => r.id} onRowClick={(r) => navigate(`/orders/${r.id}`)} /> : <EmptyState title="No orders found" description="Try another filter combination." />}
      <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
      <div className="mt-3 flex flex-wrap items-center gap-2"><Button onClick={createOrder}>Create Order</Button>{message ? <p className="text-sm text-cyan-200">{message}</p> : null}</div>
    </Card>
  );
}
