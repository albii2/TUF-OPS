import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, DataTable, Input, Select, SmallKpi } from '../components/primitives';
import { useEcosystemReferrals } from '../hooks/useEcosystemReferrals';
import { getEcosystemReferralSummary, getReferralRepEffectiveness, getReferralSourceEffectiveness, warmIntroductionStatuses, } from '../services/ecosystemReferralsService';
import { formatCurrency } from '../utils/format';
const statusTone = {
    Mentioned: 'border-slate-500 text-slate-200',
    Referred: 'border-sky-500/60 text-sky-200',
    Introduced: 'border-cyan-500/60 text-cyan-200',
    Contacted: 'border-amber-500/60 text-amber-200',
    Qualified: 'border-emerald-500/60 text-emerald-200',
};
function StatusBadge({ status }) {
    return <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusTone[status]}`}>{status}</span>;
}
export function EcosystemPipelinePage() {
    const [status, setStatus] = useState('ALL');
    const [search, setSearch] = useState('');
    const referrals = useEcosystemReferrals({ status, search });
    const summary = getEcosystemReferralSummary(referrals);
    const sourceEffectiveness = useMemo(() => getReferralSourceEffectiveness(referrals), [referrals]);
    const repEffectiveness = useMemo(() => getReferralRepEffectiveness(referrals), [referrals]);
    const columns = [
        { key: 'referred', header: 'Referred Organization', cell: (row) => <div><p className="font-medium text-slate-100">{row.referredOrganizationName}</p><p className="text-xs text-slate-400">{row.referredOrganizationType}</p></div> },
        { key: 'source', header: 'Referral Source', cell: (row) => <div><Link className="font-medium text-cyan-200" to={`/organizations/${row.referralSourceOrganizationId}`}>{row.referralSourceOrganization}</Link><p className="text-xs text-slate-400">{row.referralSourceContact} · {row.referralSourceRole}</p></div> },
        { key: 'contact', header: 'Contact', cell: (row) => <div><p>{row.contactName}</p><p className="text-xs text-slate-400">{row.contactEmail || row.contactPhone || 'No contact details'}</p></div> },
        { key: 'status', header: 'Warm Intro', cell: (row) => <StatusBadge status={row.warmIntroductionStatus}/> },
        { key: 'rep', header: 'Rep', cell: (row) => row.assignedRep },
        { key: 'revenue', header: 'Revenue', cell: (row) => formatCurrency(row.revenueGenerated || row.estimatedRevenue) },
    ];
    return (<div className="space-y-3">
      <Card title="Ecosystem Pipeline">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-lg font-semibold text-white">Secondary opportunities without primary-deal disruption</p>
            <p className="text-sm text-slate-400">Track youth, booster, club, and parent-led referrals by source organization and rep.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Input placeholder="Search referrals..." value={search} onChange={(e) => setSearch(e.target.value)}/>
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="ALL">All statuses</option>
              {warmIntroductionStatuses.map((item) => <option key={item} value={item}>{item}</option>)}
            </Select>
          </div>
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-3">
        <SmallKpi label="Ecosystem Referrals Created" value={String(summary.created)} note="Unlimited child referrals can be captured from every organization."/>
        <SmallKpi label="Qualified Referrals" value={String(summary.qualified)} note="Warm introductions that reached qualified status."/>
        <SmallKpi label="Revenue Generated from Referrals" value={formatCurrency(summary.revenueGenerated)} note="Closed/qualified referral-attributed revenue."/>
      </div>

      <Card title="Dedicated Ecosystem Pipeline">
        <DataTable columns={columns} rows={referrals} getRowId={(row) => row.id}/>
      </Card>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card title="Source Effectiveness by Organization">
          <div className="space-y-2">
            {sourceEffectiveness.slice(0, 8).map((row) => (<div key={row.source} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-sm">
                <p className="font-medium text-slate-100">{row.source}</p>
                <p className="text-slate-300">Created {row.created} · Qualified {row.qualified} · Revenue {formatCurrency(row.revenueGenerated)}</p>
              </div>))}
          </div>
        </Card>
        <Card title="Referral Effectiveness by Rep">
          <div className="space-y-2">
            {repEffectiveness.slice(0, 8).map((row) => (<div key={row.rep} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-sm">
                <p className="font-medium text-slate-100">{row.rep}</p>
                <p className="text-slate-300">Created {row.created} · Qualified {row.qualified} · Revenue {formatCurrency(row.revenueGenerated)}</p>
              </div>))}
          </div>
        </Card>
      </div>

      <Button onClick={() => setSearch('')}>Reset Pipeline Filters</Button>
    </div>);
}
//# sourceMappingURL=EcosystemPipelinePage.js.map