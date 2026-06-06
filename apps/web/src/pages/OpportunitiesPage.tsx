import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Card, DataTable, EmptyState, Input, LaneBadge, Pagination, Select, StageBadge, type Column } from '../components/primitives';
import { formatCurrency } from '../utils/format';
import { useOpportunities, useOpportunityStages, useRevenueLanes } from '../hooks/useOpportunities';
import { getNearCloseOpportunities, getStuckOpportunities } from '../services/businessSelectors';
import { daysSince } from '../services/kpiUtils';

const PAGE_SIZE = 8;

export function OpportunitiesPage({ forceRep, title = "Pipeline Opportunities" }: { forceRep?: string; title?: string } = {}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const createdOpportunityId = searchParams.get('created');
  const [search, setSearch] = useState('');
  const [stage, setStage] = useState('ALL');
  const [lane, setLane] = useState('ALL');
  const [rep, setRep] = useState(forceRep ?? 'ALL');
  const [sport, setSport] = useState('ALL');
  const [page, setPage] = useState(1);
  const [view, setView] = useState<'ACTION_NEEDED' | 'NEAR_CLOSE' | 'STALLED' | 'ALL'>('ALL');

  const allOpportunities = useOpportunities({});
  const opportunityStages = useOpportunityStages();
  const revenueLanes = useRevenueLanes();

  const filtered = useMemo(() => {
    let list = allOpportunities.filter((o) => {
      if (forceRep && o.assignedRep !== forceRep) return false;
      if (rep !== 'ALL' && o.assignedRep !== rep) return false;
      if (stage !== 'ALL' && o.stage !== stage) return false;
      if (lane !== 'ALL' && o.lane !== lane) return false;
      if (sport !== 'ALL' && o.sport !== sport) return false;
      if (search && !o.organizationName.toLowerCase().includes(search.toLowerCase()) && !o.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });

    if (view === 'ACTION_NEEDED') {
      list = list.filter((o) => {
        const stale = daysSince(o.lastActivity) > 14;
        const needsInvoice = ['INVOICE_SENT', 'DECISION_PENDING'].includes(o.stage);
        return stale || needsInvoice;
      });
      list.sort((a, b) => daysSince(b.lastActivity) - daysSince(a.lastActivity));
    } else if (view === 'NEAR_CLOSE') {
      list = getNearCloseOpportunities(list);
    } else if (view === 'STALLED') {
      list = getStuckOpportunities(list);
    }

    return list;
  }, [allOpportunities, search, stage, lane, rep, sport, view, forceRep]);

  const reps = useMemo(() => Array.from(new Set(allOpportunities.map((o) => o.assignedRep))), [allOpportunities]);
  const sports = useMemo(() => Array.from(new Set(allOpportunities.map((o) => o.sport))), [allOpportunities]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const columns: Column<(typeof filtered)[number]>[] = [
    { 
      key: 'opp', 
      header: 'Deal', 
      cell: (r) => {
        const stale = daysSince(r.lastActivity) > 14;
        return (
          <div className="flex items-start gap-2">
            {stale && <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" title="Action Overdue" />}
            {!stale && ['INVOICE_SENT', 'DECISION_PENDING'].includes(r.stage) && <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" title="Due Soon" />}
            <div>
              <p className='font-semibold text-slate-100'>{r.title}</p>
              <p className='text-xs text-slate-400'>{r.organizationName}</p>
            </div>
          </div>
        );
      } 
    },
    { key: 'lane', header: 'Lane', cell: (r) => <LaneBadge lane={r.lane} /> },
    { key: 'stage', header: 'Stage', className: 'min-w-[170px] whitespace-nowrap', cell: (r) => <StageBadge stage={r.stage} /> },
    { key: 'value', header: 'Value', className: 'text-right min-w-[100px]', cell: (r) => formatCurrency(r.value) },
    { key: 'next', header: 'Next Action', cell: (r) => <span className='rounded-md bg-cyan-500/10 px-2 py-1 text-xs text-cyan-100 font-medium'>{r.nextAction}</span> },
    { 
      key: 'last', 
      header: 'Activity', 
      className: 'min-w-[100px] whitespace-nowrap', 
      cell: (r) => {
        const days = daysSince(r.lastActivity);
        return <span className={days > 14 ? 'text-rose-400 font-medium' : 'text-slate-300'}>{days}d ago</span>;
      } 
    },
    {
      key: 'actions',
      header: '',
      cell: (r) => <button className="rounded bg-slate-800 px-2 py-1 text-xs font-bold text-cyan-300 hover:bg-slate-700 transition" onClick={(e) => { e.stopPropagation(); navigate(`/opportunities/${r.id}`); }}>OPEN</button>,
    },
  ];

  const clearFilters = () => {
    setSearch('');
    setStage('ALL');
    setLane('ALL');
    setRep('ALL');
    setSport('ALL');
    setPage(1);
    setView('ALL');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <Button onClick={() => navigate('/opportunities/new')}>+ New Opportunity</Button>
      </div>

      {createdOpportunityId ? (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
          Opportunity created and added to this list. Use the filters below if you need to narrow the pipeline.
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
        {(['ACTION_NEEDED', 'NEAR_CLOSE', 'STALLED', 'ALL'] as const).map((v) => (
          <button
            key={v}
            onClick={() => { setView(v); setPage(1); }}
            className={`px-4 py-2 text-sm font-bold transition-all ${view === v ? 'border-b-2 border-cyan-400 text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            {v.replace('_', ' ')}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 text-xs text-slate-500">
          <span>{filtered.length} found</span>
          <button onClick={clearFilters} className="text-cyan-500 hover:underline">Reset</button>
        </div>
      </div>

      <Card className="min-w-0">
        <div className="safe-grid mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          <Input placeholder="Search organization..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          <Select value={stage} onChange={(e) => { setStage(e.target.value); setPage(1); }}><option value="ALL">All Stages</option>{opportunityStages.map((s: string) => <option key={s}>{s.replace(/_/g, ' ')}</option>)}</Select>
          <Select value={lane} onChange={(e) => { setLane(e.target.value); setPage(1); }}><option value="ALL">All Lanes</option>{revenueLanes.map((l: string) => <option key={l}>{l.replace(/_/g, ' ')}</option>)}</Select>
          {!forceRep && <Select value={rep} onChange={(e) => { setRep(e.target.value); setPage(1); }}><option value="ALL">All Reps</option>{reps.map((r) => <option key={r}>{r}</option>)}</Select>}
          <Select value={sport} onChange={(e) => { setSport(e.target.value); setPage(1); }}><option value="ALL">All Sports</option>{sports.map((s) => <option key={s}>{s}</option>)}</Select>
        </div>
        
        {paged.length ? (
          <DataTable 
            columns={columns} 
            rows={paged} 
            getRowId={(r) => r.id} 
            onRowClick={(r) => navigate(`/opportunities/${r.id}`)} 
          />
        ) : (
          <EmptyState 
            title="No matches in this view" 
            description={view === 'ACTION_NEEDED' ? "Great job! No opportunities currently need immediate follow-up." : "Adjust filters to find what you're looking for."} 
          />
        )}
        
        {totalPages > 1 && <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />}
      </Card>
    </div>
  );
}
