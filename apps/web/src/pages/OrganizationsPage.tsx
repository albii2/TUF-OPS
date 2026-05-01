import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, DataTable, EmptyState, Input, Pagination, Select, type Column } from '../components/primitives';
import { formatCurrency, formatDate } from '../utils/format';
import { useOrganizations } from '../hooks/useOrganizations';
import { OrganizationImportPanel } from '../components/OrganizationImportPanel';
import { getOrganizationPriorityScore } from '../services/businessSelectors';

const PAGE_SIZE = 8;

export function OrganizationsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [rep, setRep] = useState('ALL');
  const [page, setPage] = useState(1);
  const [coverageStatus, setCoverageStatus] = useState('ALL');

  const allOrganizations = useOrganizations({});
  const filtered = useOrganizations({ search, status: status as 'ALL' | 'ACTIVE' | 'WATCH' | 'NEW', rep }).filter((o) => {
    if (coverageStatus === 'ALL') return true;
    if (coverageStatus === 'UNTOUCHED') return o.coverageStatus === 'UNTOUCHED';
    if (coverageStatus === 'CONTACTED') return o.coverageStatus === 'CONTACTED';
    if (coverageStatus === 'ACTIVE') return o.coverageStatus === 'ACTIVE';
    if (coverageStatus === 'CLOSED') return o.coverageStatus === 'CLOSED';
    return true;
  });

  const reps = useMemo(() => Array.from(new Set(allOrganizations.map((o) => o.assignedRep))), [allOrganizations]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const prioritized = [...filtered].sort((a, b) => getOrganizationPriorityScore(b) - getOrganizationPriorityScore(a));
  const paged = prioritized.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const columns: Column<(typeof filtered)[number]>[] = [
    { key: 'organization', header: 'Organization', cell: (r) => <div><p className="font-medium">{r.name}</p><p className="text-xs text-slate-400">{r.id}</p></div> },
    { key: 'city', header: 'City/State', cell: (r) => `${r.city}, ${r.state}` },
    { key: 'rep', header: 'Assigned Rep', cell: (r) => r.assignedRep },
    { key: 'director', header: 'Assigned Director', cell: (r) => r.assignedDirector },
    { key: 'pipeline', header: 'Pipeline Value', cell: (r) => formatCurrency(r.pipelineValue) },
    { key: 'territory', header: 'Territory', cell: (r) => r.territory.toUpperCase() },
    { key: 'lane', header: 'Lane Status', cell: (r) => <span className='text-xs text-slate-300'>U:{r.laneStatuses.UNIFORM.status} · T:{r.laneStatuses.TRAVEL_GEAR.status} · S:{r.laneStatuses.TEAM_STORE.status} · L:{r.laneStatuses.LETTERMAN.status}</span> },
    { key: 'next', header: 'Next Action', cell: (r) => <span className="rounded-md bg-cyan-500/12 px-2 py-1 text-xs text-cyan-100">{r.nextAction}</span> },
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

  const existingKeys = allOrganizations.map((o) => `${o.name}|${o.state}`.toLowerCase());

  return (
    <div className="space-y-3">
      <OrganizationImportPanel existingKeys={existingKeys} />
      <Card title="Accounts & Expansion Pipeline">
      <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
        <span>{filtered.length} accounts</span>
        <button onClick={clearFilters} className="text-cyan-300">Reset filters</button>
      </div>
      <div className="mb-3 grid gap-2 lg:grid-cols-[1fr_180px_180px_180px_160px]">
        <Input placeholder="Search organizations" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="ALL">All Status</option><option value="ACTIVE">Active</option><option value="WATCH">Watch</option><option value="NEW">New</option>
        </Select>
        <Select value={rep} onChange={(e) => { setRep(e.target.value); setPage(1); }}>
          <option value="ALL">All Reps</option>{reps.map((r) => <option key={r} value={r}>{r}</option>)}
        </Select>
        <Select value={coverageStatus} onChange={(e) => { setCoverageStatus(e.target.value); setPage(1); }}><option value='ALL'>Coverage</option><option value='UNTOUCHED'>Untouched</option><option value='CONTACTED'>Contacted</option><option value='ACTIVE'>Active</option><option value='CLOSED'>Closed</option></Select>
        <Button onClick={() => navigate('/organizations/new')}>New Organization</Button>
      </div>
      <div className='mb-2 flex flex-wrap gap-2 text-xs'><Button>Assign Territory</Button><Button>Assign Rep</Button><Button>Assign Director</Button></div>
      {paged.length ? <DataTable columns={columns} rows={paged} getRowId={(r) => r.id} onRowClick={(row) => navigate(`/organizations/${row.id}`)} /> : <EmptyState title="No organizations match filters" description="Try a different rep, status, or search term." />}
      <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
    </Card>
    </div>
  );
}
