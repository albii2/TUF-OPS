import { Card, DataTable, type Column } from '../components/primitives';
import { useOpportunities } from '../hooks/useOpportunities';
import { useOrganizations } from '../hooks/useOrganizations';
import { formatCurrency } from '../utils/format';
import { getNearCloseOpportunities, getStuckOpportunities, getUntouchedAccounts } from '../services/businessSelectors';

export function TeamPerformancePage() {
  const { data: opps = [] } = useOpportunities({});
  const { data: orgs = [] } = useOrganizations({});
  const reps = Array.from(new Set(opps.map((o) => o.assignedRep))).map((rep) => {
    const repOpps = opps.filter((o) => o.assignedRep === rep);
    const repOrgs = orgs.filter((o) => o.assignedRep === rep);
    return { rep, assignedAccounts: repOrgs.length, untouched: getUntouchedAccounts(repOrgs).length, activeOpps: repOpps.length, nearClose: getNearCloseOpportunities(repOpps).length, stuck: getStuckOpportunities(repOpps).length, closedWon: repOpps.filter((o) => o.stage === 'CLOSED_WON').reduce((a,b)=>a+b.value,0), pipeline: repOpps.reduce((a,b)=>a+b.value,0), note: 'Coach invoice follow-up' };
  });
  const columns: Column<(typeof reps)[number]>[] = [
    { key:'rep', header:'Rep', cell:(r)=>r.rep },{ key:'acc', header:'Assigned Accounts', cell:(r)=>r.assignedAccounts },{ key:'unt', header:'Untouched', cell:(r)=>r.untouched },{ key:'active', header:'Active Opportunities', cell:(r)=>r.activeOpps },{ key:'near', header:'Near-close', cell:(r)=>r.nearClose },{ key:'stuck', header:'Stuck Deals', cell:(r)=>r.stuck },{ key:'won', header:'Closed Won MTD', cell:(r)=>formatCurrency(r.closedWon) },{ key:'pipe', header:'Estimated Pipeline', cell:(r)=>formatCurrency(r.pipeline) },{ key:'note', header:'Next Coaching Note', cell:(r)=>r.note },
  ];
  return <Card title='Team Performance'><DataTable columns={columns} rows={reps} getRowId={(r)=>r.rep} /></Card>;
}
