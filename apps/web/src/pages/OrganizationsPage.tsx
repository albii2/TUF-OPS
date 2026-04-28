import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { organizations } from '../data/mockSalesData';
import { Button, Card, DataTable, EmptyState, Input, LaneStatusBadge, Pagination, Select, type Column } from '../components/primitives';
import { formatCurrency, formatDate } from '../utils/format';

const PAGE_SIZE = 8;

export function OrganizationsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [rep, setRep] = useState('ALL');
  const [page, setPage] = useState(1);

  const reps = useMemo(() => Array.from(new Set(organizations.map((o) => o.assignedRep))), []);

  const filtered = useMemo(
    () =>
      organizations.filter((o) => {
        const matchesSearch = [o.name, o.city, o.state, o.assignedRep, o.assignedDirector].join(' ').toLowerCase().includes(search.toLowerCase());
        const matchesStatus = status === 'ALL' || o.status === status;
        const matchesRep = rep === 'ALL' || o.assignedRep === rep;
        return matchesSearch && matchesStatus && matchesRep;
      }),
    [search, status, rep],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const columns: Column<(typeof organizations)[number]>[] = [
    { key: 'organization', header: 'Organization', cell: (r) => <div><p className="font-medium">{r.name}</p><p className="text-xs text-slate-400">{r.id}</p></div> },
    { key: 'city', header: 'City/State', cell: (r) => `${r.city}, ${r.state}` },
    { key: 'rep', header: 'Assigned Rep', cell: (r) => r.assignedRep },
    { key: 'director', header: 'Assigned Director', cell: (r) => r.assignedDirector },
    { key: 'pipeline', header: 'Pipeline Value', cell: (r) => formatCurrency(r.pipelineValue) },
    { key: 'lane', header: 'Lane Status', cell: (r) => <div className="flex flex-wrap gap-1">{Object.values(r.laneStatuses).map((ls, idx) => <LaneStatusBadge key={idx} status={ls.status} />)}</div> },
    { key: 'next', header: 'Next Action', cell: (r) => <span className="text-xs text-slate-300">{r.nextAction}</span> },
    { key: 'last', header: 'Last Activity', cell: (r) => formatDate(r.lastActivity) },
    { key: 'status', header: 'Status', cell: (r) => <span className="text-xs uppercase tracking-[0.12em]">{r.status}</span> },
    {
      key: 'actions',
      header: 'Actions',
      cell: (r) => (
        <button
          className="text-xs text-cyan-300"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/organizations/${r.id}`);
          }}
        >
          Open
        </button>
      ),
    },
  ];

  const clearFilters = () => {
    setSearch('');
    setStatus('ALL');
    setRep('ALL');
    setPage(1);
  };

  return (
    <Card title="Organizations">
      <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
        <span>{filtered.length} accounts</span>
        <button onClick={clearFilters} className="text-cyan-300">Reset filters</button>
      </div>
      <div className="mb-3 grid gap-2 lg:grid-cols-[1fr_180px_180px_180px]">
        <Input placeholder="Search organizations" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="ALL">All Status</option><option value="ACTIVE">Active</option><option value="WATCH">Watch</option><option value="NEW">New</option>
        </Select>
        <Select value={rep} onChange={(e) => { setRep(e.target.value); setPage(1); }}>
          <option value="ALL">All Reps</option>{reps.map((r) => <option key={r} value={r}>{r}</option>)}
        </Select>
        <Button onClick={() => navigate('/organizations/new')}>New Organization</Button>
      </div>
      {paged.length ? <DataTable columns={columns} rows={paged} getRowId={(r) => r.id} onRowClick={(row) => navigate(`/organizations/${row.id}`)} /> : <EmptyState title="No organizations match filters" description="Try a different rep, status, or search term." />}
      <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
    </Card>
  );
}
