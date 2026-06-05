import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, DataTable, EmptyState, Input, LaneBadge, Pagination, Select, type Column } from '../components/primitives';
import { formatCurrency, formatDate } from '../utils/format';
import { useOrders } from '../hooks/useOrders';
import { getOrderRiskScore } from '../services/businessSelectors';
import { createMockOrderFromOpportunity } from '../services/ordersService';
import { useOpportunities } from '../hooks/useOpportunities';
import { notify } from '../services/feedbackService';

const PAGE_SIZE = 8;

export function OrdersPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const allOrders = useOrders({ refreshKey });
  const filtered = useOrders({ search, productionStatus: status as 'ALL' | 'NEEDS_REVIEW' | 'READY_FOR_VENDOR' | 'IN_PRODUCTION' | 'BLOCKED' | 'COMPLETED', refreshKey });
  const opportunities = useOpportunities({ refreshKey });

  const statuses = useMemo(() => Array.from(new Set(allOrders.map((o) => o.productionStatus))), [allOrders]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const prioritized = [...filtered].sort((a, b) => getOrderRiskScore(b) - getOrderRiskScore(a));
  const paged = prioritized.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const columns: Column<(typeof filtered)[number]>[] = [
    { key: 'order', header: 'Order', cell: (r) => <div><p className='font-semibold text-slate-100'>{r.id}</p><p className='text-xs text-slate-400'>{r.organizationName}</p></div> },
    { key: 'org', header: 'Organization', cell: (r) => r.organizationName },
    { key: 'lane', header: 'Lane', className: 'min-w-[140px] whitespace-nowrap', cell: (r) => <LaneBadge lane={r.lane} /> },
    { key: 'value', header: 'Value', className: 'text-right min-w-[120px]', cell: (r) => formatCurrency(r.value) },
    { key: 'status', header: 'Production Status', className: 'min-w-[170px] whitespace-nowrap', cell: (r) => <span className={r.productionStatus==='BLOCKED' ? 'text-rose-200' : 'text-slate-200'}>{r.productionStatus.replace(/_/g,' ')}</span> },
    { key: 'missing', header: 'Blocking Items', className: 'min-w-[220px]', cell: (r) => (r.missingInfo.length ? r.missingInfo.join(', ') : 'Clear') },
    { key: 'vendor', header: 'Vendor', cell: (r) => r.vendor },
    { key: 'created', header: 'Created Date', className: 'min-w-[130px] whitespace-nowrap', cell: (r) => formatDate(r.createdDate) },
    { key: 'actions', header: 'Actions', cell: (r) => <button className="text-xs text-cyan-300" onClick={(e) => { e.stopPropagation(); navigate(`/orders/${r.id}`); }}>Open</button> },
  ];

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
