import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { opportunityStages, opportunities, revenueLanes } from '../data/mockSalesData';
import { Button, Card, DataTable, EmptyState, Input, LaneBadge, Pagination, Select, StageBadge, type Column } from '../components/primitives';
import { formatCurrency, formatDate } from '../utils/format';

const PAGE_SIZE = 8;

export function OpportunitiesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [stage, setStage] = useState('ALL');
  const [lane, setLane] = useState('ALL');
  const [rep, setRep] = useState('ALL');
  const [sport, setSport] = useState('ALL');
  const [page, setPage] = useState(1);

  const reps = useMemo(() => Array.from(new Set(opportunities.map((o) => o.assignedRep))), []);
  const sports = useMemo(() => Array.from(new Set(opportunities.map((o) => o.sport))), []);

  const filtered = useMemo(
    () =>
      opportunities.filter((o) => {
        const matchesSearch = [o.title, o.organizationName].join(' ').toLowerCase().includes(search.toLowerCase());
        return matchesSearch && (stage === 'ALL' || o.stage === stage) && (lane === 'ALL' || o.lane === lane) && (rep === 'ALL' || o.assignedRep === rep) && (sport === 'ALL' || o.sport === sport);
      }),
    [search, stage, lane, rep, sport],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const columns: Column<(typeof opportunities)[number]>[] = [
    { key: 'opp', header: 'Opportunity', cell: (r) => r.title },
    { key: 'org', header: 'Organization', cell: (r) => r.organizationName },
    { key: 'lane', header: 'Lane', cell: (r) => <LaneBadge lane={r.lane} /> },
    { key: 'sport', header: 'Sport', cell: (r) => r.sport },
    { key: 'stage', header: 'Stage', cell: (r) => <StageBadge stage={r.stage} /> },
    { key: 'value', header: 'Value', cell: (r) => formatCurrency(r.value) },
    { key: 'rep', header: 'Assigned Rep', cell: (r) => r.assignedRep },
    { key: 'next', header: 'Next Action', cell: (r) => <span className="text-xs text-slate-300">{r.nextAction}</span> },
    { key: 'last', header: 'Last Activity', cell: (r) => formatDate(r.lastActivity) },
    { key: 'prob', header: 'Close Probability', cell: (r) => `${r.closeProbability}%` },
    {
      key: 'actions',
      header: 'Actions',
      cell: (r) => <button className="text-xs text-cyan-300" onClick={(e) => { e.stopPropagation(); navigate(`/opportunities/${r.id}`); }}>Open</button>,
    },
  ];

  const clearFilters = () => {
    setSearch('');
    setStage('ALL');
    setLane('ALL');
    setRep('ALL');
    setSport('ALL');
    setPage(1);
  };

  return (
    <Card title="Opportunities">
      <div className="mb-2 flex items-center justify-between text-xs text-slate-400"><span>{filtered.length} opportunities</span><button onClick={clearFilters} className="text-cyan-300">Reset filters</button></div>
      <div className="mb-3 grid gap-2 xl:grid-cols-6">
        <Input placeholder="Search opportunities" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        <Select value={stage} onChange={(e) => { setStage(e.target.value); setPage(1); }}><option value="ALL">All Stages</option>{opportunityStages.map((s) => <option key={s}>{s}</option>)}</Select>
        <Select value={lane} onChange={(e) => { setLane(e.target.value); setPage(1); }}><option value="ALL">All Lanes</option>{revenueLanes.map((l) => <option key={l}>{l}</option>)}</Select>
        <Select value={rep} onChange={(e) => { setRep(e.target.value); setPage(1); }}><option value="ALL">All Reps</option>{reps.map((r) => <option key={r}>{r}</option>)}</Select>
        <Select value={sport} onChange={(e) => { setSport(e.target.value); setPage(1); }}><option value="ALL">All Sports</option>{sports.map((s) => <option key={s}>{s}</option>)}</Select>
        <Button onClick={() => navigate('/opportunities/new')}>New Opportunity</Button>
      </div>
      {paged.length ? <DataTable columns={columns} rows={paged} getRowId={(r) => r.id} onRowClick={(r) => navigate(`/opportunities/${r.id}`)} /> : <EmptyState title="No opportunities found" description="Adjust filters or search to broaden results." />}
      <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
    </Card>
  );
}
