import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, DataTable, EmptyState, Input, LaneBadge, Pagination, Select, StageBadge, type Column } from '../components/primitives';
import { formatCurrency, formatDate } from '../utils/format';
import { useOpportunities, useOpportunityStages, useRevenueLanes } from '../hooks/useOpportunities';
import { getNearCloseOpportunities } from '../services/businessSelectors';

const PAGE_SIZE = 8;

export function OpportunitiesPage({ forceRep, title = "Pipeline Opportunities" }: { forceRep?: string; title?: string } = {}) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [stage, setStage] = useState('ALL');
  const [lane, setLane] = useState('ALL');
  const [rep, setRep] = useState(forceRep ?? 'ALL');
  const [sport, setSport] = useState('ALL');
  const [page, setPage] = useState(1);

  const allOpportunities = useOpportunities({});
  const filtered = useOpportunities({
    search,
    stage: stage as 'ALL' | 'LEAD_ASSIGNED' | 'CONTACTED' | 'DISCOVERY' | 'MOCKUP_REQUESTED' | 'MOCKUP_DELIVERED' | 'INVOICE_SENT' | 'DECISION_PENDING' | 'CLOSED_WON' | 'CLOSED_LOST',
    lane: lane as 'ALL' | 'UNIFORM' | 'TRAVEL_GEAR' | 'TEAM_STORE' | 'LETTERMAN',
    rep: forceRep ?? rep,
    sport,
  });
  const opportunityStages = useOpportunityStages();
  const revenueLanes = useRevenueLanes();

  const reps = useMemo(() => Array.from(new Set(allOpportunities.map((o) => o.assignedRep))), [allOpportunities]);
  const sports = useMemo(() => Array.from(new Set(allOpportunities.map((o) => o.sport))), [allOpportunities]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const nearCloseSorted = getNearCloseOpportunities(filtered);
  const remainder = filtered.filter((opp) => !nearCloseSorted.some((n) => n.id === opp.id));
  const prioritized = [...nearCloseSorted, ...remainder];
  const paged = prioritized.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const columns: Column<(typeof filtered)[number]>[] = [
    { key: 'opp', header: 'Deal', cell: (r) => <div><p className='font-semibold text-slate-100'>{r.title}</p><p className='text-xs text-slate-400'>{r.organizationName}</p></div> },
    { key: 'org', header: 'Account', cell: (r) => r.organizationName },
    { key: 'lane', header: 'Lane', cell: (r) => <LaneBadge lane={r.lane} /> },
    { key: 'sport', header: 'Sport', cell: (r) => r.sport },
    { key: 'stage', header: 'Stage', cell: (r) => <StageBadge stage={r.stage} /> },
    { key: 'value', header: 'Value', cell: (r) => formatCurrency(r.value) },
    { key: 'rep', header: 'Assigned Rep', cell: (r) => r.assignedRep },
    { key: 'next', header: 'Next Action', cell: (r) => <span className='rounded-md bg-cyan-500/10 px-2 py-1 text-xs text-cyan-100'>{r.nextAction}</span> },
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
    <Card title={title}>
      <div className="mb-2 flex items-center justify-between text-xs text-slate-400"><span>{filtered.length} opportunities</span><button onClick={clearFilters} className="text-cyan-300">Reset filters</button></div>
      <div className="mb-3 grid gap-2 xl:grid-cols-6">
        <Input placeholder="Search opportunities" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        <Select value={stage} onChange={(e) => { setStage(e.target.value); setPage(1); }}><option value="ALL">All Stages</option>{opportunityStages.map((s) => <option key={s}>{s}</option>)}</Select>
        <Select value={lane} onChange={(e) => { setLane(e.target.value); setPage(1); }}><option value="ALL">All Lanes</option>{revenueLanes.map((l) => <option key={l}>{l}</option>)}</Select>
        {forceRep ? <div className='h-10 rounded-lg border border-[#2b4368] bg-[#020b1e]/95 px-3 text-sm text-slate-300 flex items-center'>Rep: {forceRep}</div> : <Select value={rep} onChange={(e) => { setRep(e.target.value); setPage(1); }}><option value="ALL">All Reps</option>{reps.map((r) => <option key={r}>{r}</option>)}</Select>}
        <Select value={sport} onChange={(e) => { setSport(e.target.value); setPage(1); }}><option value="ALL">All Sports</option>{sports.map((s) => <option key={s}>{s}</option>)}</Select>
        <Button onClick={() => navigate('/opportunities/new')}>New Opportunity</Button>
      </div>
      {paged.length ? <DataTable columns={columns} rows={paged} getRowId={(r) => r.id} onRowClick={(r) => navigate(`/opportunities/${r.id}`)} /> : <EmptyState title="No opportunities found" description="Adjust filters or search to broaden results." />}
      <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
    </Card>
  );
}
