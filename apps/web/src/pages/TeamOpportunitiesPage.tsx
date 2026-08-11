import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStoredUser } from '../auth';
import { Button, Card, DataTable, EmptyState, LaneBadge, Select, type Column } from '../components/primitives';
import { useOpportunities, useOpportunityStages, useRevenueLanes } from '../hooks/useOpportunities';
import { getNearCloseOpportunities, getStuckOpportunities } from '../services/businessSelectors';
import { formatCurrency, formatDate } from '../utils/format';

export function TeamOpportunitiesPage() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [rep, setRep] = useState('ALL'); const [stage, setStage] = useState('ALL'); const [lane, setLane] = useState('ALL'); const [sport, setSport] = useState('ALL'); const [focus, setFocus] = useState('ALL');
  const { data: all = [] } = useOpportunities({});
  const reps = Array.from(new Set(all.map((o) => o.assignedRep)));
  const sports = Array.from(new Set(all.map((o) => o.sport)));
  const { data: stages = [] } = useOpportunityStages(); const { data: lanes = [] } = useRevenueLanes();
  let rows = all.filter((o) => user?.role === 'ADMIN' || user?.role === 'DIRECTOR');
  if (rep !== 'ALL') rows = rows.filter((o) => o.assignedRep === rep);
  if (stage !== 'ALL') rows = rows.filter((o) => o.stage === stage);
  if (lane !== 'ALL') rows = rows.filter((o) => o.lanes.includes(lane as any));
  if (sport !== 'ALL') rows = rows.filter((o) => o.sport === sport);
  if (focus === 'NEAR_CLOSE') rows = getNearCloseOpportunities(rows);
  if (focus === 'STUCK') rows = getStuckOpportunities(rows);

  const columns: Column<(typeof rows)[number]>[] = [
    { key: 'opp', header: 'Opportunity', cell: (r) => r.title },
    { key: 'org', header: 'Organization', cell: (r) => r.organizationName },
    { key: 'rep', header: 'Rep', cell: (r) => r.assignedRep },
    { key: 'lane', header: 'Lane', cell: (r) => <LaneBadge lanes={r.lanes} /> },
    { key: 'sport', header: 'Sport', cell: (r) => r.sport },
    { key: 'stage', header: 'Stage', cell: (r) => r.stage },
    { key: 'value', header: 'Value', cell: (r) => formatCurrency(r.value) },
    { key: 'next', header: 'Next Action', cell: (r) => r.nextAction },
    { key: 'last', header: 'Last Activity', cell: (r) => formatDate(r.lastActivity) },
    { key: 'prob', header: 'Close Probability', cell: (r) => `${r.closeProbability}%` },
  ];
  return <Card title="Team Opportunities"><div className='mb-2 grid gap-2 xl:grid-cols-6'><Select value={rep} onChange={(e)=>setRep(e.target.value)}><option value='ALL'>All Reps</option>{reps.map((r)=><option key={r}>{r}</option>)}</Select><Select value={stage} onChange={(e)=>setStage(e.target.value)}><option value='ALL'>All Stages</option>{stages.map((s)=><option key={s}>{s}</option>)}</Select><Select value={lane} onChange={(e)=>setLane(e.target.value)}><option value='ALL'>All Lanes</option>{lanes.map((l)=><option key={l}>{l}</option>)}</Select><Select value={sport} onChange={(e)=>setSport(e.target.value)}><option value='ALL'>All Sports</option>{sports.map((s)=><option key={s}>{s}</option>)}</Select><Select value={focus} onChange={(e)=>setFocus(e.target.value)}><option value='ALL'>All</option><option value='NEAR_CLOSE'>Near Close</option><option value='STUCK'>Stuck</option></Select><Button onClick={()=>navigate('/opportunities')}>Open Pipeline</Button></div>{rows.length ? <DataTable columns={columns} rows={rows} getRowId={(r)=>r.id} onRowClick={(r)=>navigate(`/opportunities/${r.id}`)} /> : <EmptyState title='No team opportunities' description='Adjust filters.' />}</Card>;
}
