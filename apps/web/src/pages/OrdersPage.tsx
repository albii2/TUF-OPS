import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { orders } from '../data/mockSalesData';
import { Button, Card, DataTable, EmptyState, Input, LaneBadge, Pagination, Select, type Column } from '../components/primitives';
import { formatCurrency, formatDate } from '../utils/format';

const PAGE_SIZE = 8;

export function OrdersPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [page, setPage] = useState(1);

  const statuses = useMemo(() => Array.from(new Set(orders.map((o) => o.productionStatus))), []);
  const filtered = useMemo(
    () =>
      orders.filter((o) => {
        const matchesSearch = [o.id, o.organizationName, o.vendor].join(' ').toLowerCase().includes(search.toLowerCase());
        return matchesSearch && (status === 'ALL' || o.productionStatus === status);
      }),
    [search, status],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const columns: Column<(typeof orders)[number]>[] = [
    { key: 'order', header: 'Order', cell: (r) => r.id },
    { key: 'org', header: 'Organization', cell: (r) => r.organizationName },
    { key: 'lane', header: 'Lane', cell: (r) => <LaneBadge lane={r.lane} /> },
    { key: 'value', header: 'Value', cell: (r) => formatCurrency(r.value) },
    { key: 'status', header: 'Production Status', cell: (r) => r.productionStatus },
    { key: 'missing', header: 'Missing Info', cell: (r) => (r.missingInfo.length ? r.missingInfo.join(', ') : 'None') },
    { key: 'vendor', header: 'Vendor', cell: (r) => r.vendor },
    { key: 'created', header: 'Created Date', cell: (r) => formatDate(r.createdDate) },
    { key: 'actions', header: 'Actions', cell: (r) => <button className="text-xs text-cyan-300" onClick={(e) => { e.stopPropagation(); navigate(`/orders/${r.id}`); }}>Open</button> },
  ];

  return (
    <Card title="Orders">
      <div className="mb-2 flex items-center justify-between text-xs text-slate-400"><span>{filtered.length} orders</span><button onClick={() => { setSearch(''); setStatus('ALL'); setPage(1); }} className="text-cyan-300">Reset filters</button></div>
      <div className="mb-3 grid gap-2 lg:grid-cols-[1fr_220px]">
        <Input placeholder="Search order / org / vendor" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}><option value="ALL">All Status</option>{statuses.map((s) => <option key={s}>{s}</option>)}</Select>
      </div>
      {paged.length ? <DataTable columns={columns} rows={paged} getRowId={(r) => r.id} onRowClick={(r) => navigate(`/orders/${r.id}`)} /> : <EmptyState title="No orders found" description="Try another filter combination." />}
      <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
      <div className="mt-3"><Button>New Order (placeholder)</Button></div>
    </Card>
  );
}
