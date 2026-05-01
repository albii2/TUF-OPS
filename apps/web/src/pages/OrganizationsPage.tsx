import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStoredUser } from '../auth';
import { Button, Card, DataTable, EmptyState, Input, Pagination, Select, type Column } from '../components/primitives';
import { formatCurrency, formatDate } from '../utils/format';
import { useOrganizations } from '../hooks/useOrganizations';
import { OrganizationImportPanel } from '../components/OrganizationImportPanel';
import { getOrganizationPriorityScore } from '../services/businessSelectors';

const PAGE_SIZE = 8;

export function OrganizationsPage() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const canBulkAssign = user?.role === 'OWNER' || user?.role === 'DIRECTOR';

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [rep, setRep] = useState('ALL');
  const [territory, setTerritory] = useState('ALL');
  const [director, setDirector] = useState('ALL');
  const [coverageStatus, setCoverageStatus] = useState('ALL');
  const [priority, setPriority] = useState('ALL');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkMessage, setBulkMessage] = useState('');

  const allOrganizations = useOrganizations({});
  const filtered = useOrganizations({ search, status: status as any, rep, territory: territory as any, director, coverageStatus: coverageStatus as any, priority: priority as any });

  const reps = useMemo(() => Array.from(new Set(allOrganizations.map((o) => o.assignedRep))), [allOrganizations]);
  const directors = useMemo(() => Array.from(new Set(allOrganizations.map((o) => o.assignedDirector))), [allOrganizations]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const prioritized = [...filtered].sort((a, b) => getOrganizationPriorityScore(b) - getOrganizationPriorityScore(a));
  const paged = prioritized.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const toggleSelected = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const toggleSelectVisible = () => {
    const visibleIds = paged.map((r) => r.id);
    const allVisibleSelected = visibleIds.every((id) => selected.includes(id));
    setSelected(allVisibleSelected ? selected.filter((id) => !visibleIds.includes(id)) : Array.from(new Set([...selected, ...visibleIds])));
  };

  const runBulkAction = (label: string) => {
    if (!selected.length) return;
    setBulkMessage(`${label} applied to ${selected.length} selected account${selected.length > 1 ? 's' : ''} (mock only).`);
  };

  const columns: Column<(typeof filtered)[number]>[] = [
    { key: 'select', header: '', cell: (r) => canBulkAssign ? <input type='checkbox' checked={selected.includes(r.id)} onChange={(e) => { e.stopPropagation(); toggleSelected(r.id); }} /> : null },
    { key: 'organization', header: 'Organization', cell: (r) => <div><p className='font-medium'>{r.name}</p><p className='text-xs text-slate-400'>{r.city}, {r.state}</p></div> },
    { key: 'rep', header: 'Rep', cell: (r) => r.assignedRep },
    { key: 'director', header: 'Director', cell: (r) => r.assignedDirector },
    { key: 'territory', header: 'Territory', cell: (r) => r.territory.toUpperCase() },
    { key: 'coverage', header: 'Coverage', cell: (r) => r.coverageStatus },
    { key: 'priority', header: 'Priority', cell: (r) => r.priority },
    { key: 'pipeline', header: 'Pipeline Value', cell: (r) => formatCurrency(r.pipelineValue) },
    { key: 'lane', header: 'Lane Status', cell: (r) => <span className='text-xs text-slate-300'>U:{r.laneStatuses.UNIFORM.status} · T:{r.laneStatuses.TRAVEL_GEAR.status} · S:{r.laneStatuses.TEAM_STORE.status} · L:{r.laneStatuses.LETTERMAN.status}</span> },
    { key: 'next', header: 'Next Action', cell: (r) => <span className='rounded-md bg-cyan-500/12 px-2 py-1 text-xs text-cyan-100'>{r.nextAction}</span> },
    { key: 'last', header: 'Last Activity', cell: (r) => formatDate(r.lastActivity) },
  ];

  const existingKeys = allOrganizations.map((o) => `${o.name}|${o.state}`.toLowerCase());

  return (
    <div className='space-y-3'>
      <OrganizationImportPanel existingKeys={existingKeys} />
      <Card title='Accounts & Expansion Pipeline'>
        <div className='mb-3 grid gap-2 lg:grid-cols-8'>
          <Input placeholder='Search organizations' value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          <Select value={status} onChange={(e) => setStatus(e.target.value)}><option value='ALL'>Status</option><option value='ACTIVE'>Active</option><option value='WATCH'>Watch</option><option value='NEW'>New</option></Select>
          <Select value={rep} onChange={(e) => setRep(e.target.value)}><option value='ALL'>All Reps</option>{reps.map((r) => <option key={r}>{r}</option>)}</Select>
          <Select value={director} onChange={(e) => setDirector(e.target.value)}><option value='ALL'>All Directors</option>{directors.map((d) => <option key={d}>{d}</option>)}</Select>
          <Select value={territory} onChange={(e) => setTerritory(e.target.value)}><option value='ALL'>Territory</option><option value='metro'>Metro</option><option value='north'>North</option><option value='west'>West</option><option value='south'>South</option></Select>
          <Select value={coverageStatus} onChange={(e) => setCoverageStatus(e.target.value)}><option value='ALL'>Coverage</option><option value='UNTOUCHED'>Untouched</option><option value='CONTACTED'>Contacted</option><option value='ACTIVE'>Active</option><option value='CLOSED'>Closed</option></Select>
          <Select value={priority} onChange={(e) => setPriority(e.target.value)}><option value='ALL'>Priority</option><option value='HIGH'>High</option><option value='MEDIUM'>Medium</option><option value='LOW'>Low</option></Select>
          <Button onClick={() => navigate('/organizations/new')}>New Organization</Button>
        </div>

        {canBulkAssign && (
          <div className='mb-3 rounded-md border border-slate-700 bg-slate-900/60 p-2 text-xs text-slate-200'>
            <div className='mb-2 flex items-center justify-between'>
              <span>{selected.length} selected</span>
              <Button className='px-2 py-1 text-xs' onClick={() => setSelected([])}>Clear Selection</Button>
            </div>
            <div className='flex flex-wrap gap-2'>
              <Button className='px-2 py-1 text-xs' onClick={() => runBulkAction('Assign Territory')}>Assign Territory</Button>
              <Button className='px-2 py-1 text-xs' onClick={() => runBulkAction('Assign Director')}>Assign Director</Button>
              <Button className='px-2 py-1 text-xs' onClick={() => runBulkAction('Assign Rep')}>Assign Rep</Button>
              <Button className='px-2 py-1 text-xs' onClick={() => runBulkAction('Set Coverage Status')}>Set Coverage Status</Button>
            </div>
            {bulkMessage ? <p className='mt-2 text-cyan-300'>{bulkMessage}</p> : null}
          </div>
        )}

        {paged.length ? <DataTable columns={columns} rows={paged} getRowId={(r) => r.id} onRowClick={(row) => navigate(`/organizations/${row.id}`)} /> : <EmptyState title='No organizations match filters' description='Try a different filter set.' />}
        <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
      </Card>
    </div>
  );
}
