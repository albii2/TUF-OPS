import { Link, useParams } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { Button, Card, EmptyState, StageBadge } from '../components/primitives';
import { formatCurrency } from '../utils/format';
import { useOpportunityById, useOpportunityStages } from '../hooks/useOpportunities';
import { useActivities } from '../hooks/useReports';
import { submitCreativeRequest, useCreativeRequests } from '../hooks/useCreativeRequests';
import { neededItemOptions, type CreativePriority, type CreativeRequestType, type DesignTeam } from '../services/creativeRequestsService';

const stageCtas = {
  LEAD_ASSIGNED: 'Contact coach',
  CONTACTED: 'Log discovery',
  DISCOVERY: 'Request mockup',
  MOCKUP_REQUESTED: 'Mark mockup delivered',
  MOCKUP_DELIVERED: 'Send invoice',
  INVOICE_SENT: 'Follow up payment',
  DECISION_PENDING: 'Push decision',
  CLOSED_WON: 'View order',
  CLOSED_LOST: 'Review loss reason',
} as const;


const stageFlow = ['LEAD_ASSIGNED','CONTACTED','DISCOVERY','MOCKUP_REQUESTED','MOCKUP_DELIVERED','INVOICE_SENT','DECISION_PENDING','CLOSED_WON'] as const;

function daysSince(dateIso: string) {
  const d = new Date(dateIso);
  return Number.isNaN(d.getTime()) ? 0 : Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

export function OpportunityDetailPage() {
  const { id } = useParams();
  const opp = useOpportunityById(id);
  const opportunityStages = useOpportunityStages();
  const dealActivity = useActivities({ entityType: 'OPPORTUNITY', entityId: id });
  if (!opp) return <EmptyState title="Opportunity not found" description="Select another opportunity from the pipeline table." />;

  const creativeRequests = useCreativeRequests(id);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [refreshTick, setRefreshTick] = useState(0);
  const [form, setForm] = useState({ requestType: 'MOCKUP' as CreativeRequestType, designTeam: 'APPAREL_MOCKUP' as DesignTeam, priority: 'NORMAL' as CreativePriority, title: '', sport: opp?.sport ?? '', season: opp?.season ?? '', neededItems: [] as string[], designNotes: '', inspirationNotes: '', dueDate: '', assetLinks: '', internalNotes: '' });
  const summary = useMemo(() => ({ total: creativeRequests.length, active: creativeRequests.filter((r) => !['DELIVERED','ARCHIVED'].includes(r.status)).length, delivered: creativeRequests.filter((r) => r.status === 'DELIVERED').length, highUrgent: creativeRequests.filter((r) => ['HIGH','URGENT'].includes(r.priority)).length }), [creativeRequests, refreshTick]);
  const currentStageIndex = stageFlow.indexOf(opp.stage as any);
  const nextStage = currentStageIndex >= 0 && currentStageIndex < stageFlow.length - 1 ? stageFlow[currentStageIndex + 1] : null;
  const staleDays = daysSince(opp.lastActivity);

  return (
    <div className="space-y-3">
      <Card title="Deal Summary">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-semibold">{opp.title}</p>
            <Link to={`/organizations/${opp.organizationId}`} className="text-sm text-cyan-300">{opp.organizationName}</Link>
            <p className="text-xs text-slate-400">{opp.lane} · {opp.sport} · {opp.season}</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xl font-semibold text-cyan-300">{formatCurrency(opp.value)}</p>
            <p className="text-xs text-slate-400">Assigned Rep: {opp.assignedRep}</p>
          </div>
        </div>
      </Card>

      <Card title="Close Path Progress">
        <div className="grid gap-2 grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
          {opportunityStages.map((stage) => (
            <div key={stage} className={`rounded-md border p-2 ${stage === opp.stage ? 'border-cyan-400 bg-cyan-500/15' : 'border-slate-800 bg-slate-950/70'}`}>
              <StageBadge stage={stage} />
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-3 lg:grid-cols-3">
        <Card title="What Needs to Happen Next to Close" className="lg:col-span-2"><p className="text-sm text-slate-300">{opp.nextAction}</p></Card>
        <Card title="Best Next Move"><div className='space-y-2'><Button className="w-full">{stageCtas[opp.stage]}</Button>{nextStage ? <Button className='w-full border-slate-600 bg-slate-800/60 text-slate-200'>Advance to {nextStage.replace(/_/g,' ')}</Button> : null}</div></Card>
      </div>

      {staleDays >= 7 ? <Card title="⚠ Follow-up Warning"><p className='text-sm text-amber-300'>No follow-up logged in {staleDays} days. Rep should log activity and advance next action today.</p></Card> : null}

      <div className="grid gap-3 lg:grid-cols-3">
        <Card title="Decision Timeline" className="lg:col-span-2">
          <div className="space-y-2 text-sm">
            {dealActivity.length ? dealActivity.map((entry) => <div key={entry.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">{entry.message}<p className="text-xs text-slate-400">{entry.timestamp} · {entry.user}</p></div>) : <p className="text-slate-400">No activity entries yet.</p>}
          </div>
        </Card>
        <Card title="Files / Mockup"><p className="text-sm text-slate-400">Attach mockups, approvals, and production files here.</p></Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Card title="Close Risk: Invoice / Payment" className="lg:col-span-2"><p className="text-sm text-slate-300">Priority close step: align invoice/payment timing and confirm buyer decision path.</p></Card>
        <Card title="Outcome Controls"><div className="space-y-2"><Button className="w-full">Closed Won</Button><Button className="w-full border-slate-600 bg-slate-800/60 text-slate-200">Closed Lost</Button></div></Card>
      </div>

      <Card title="Creative Requests">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm">
          <p>Total: {summary.total} · Active: {summary.active} · Delivered: {summary.delivered} · High/Urgent: {summary.highUrgent}</p>
          <Button onClick={() => { setShowForm((v) => !v); setError(''); setSuccess(''); }}>{showForm ? 'Cancel' : 'Create Creative Request'}</Button>
        </div>
        {showForm ? <div className="mb-3 rounded-lg border border-slate-800 bg-slate-950/60 p-3 space-y-2 text-sm">
          <p className="text-slate-300">Submit structured requests for mockups, apparel graphics, social visuals, event logos, sales materials, and brand documents.</p>
          <div className="grid gap-2 md:grid-cols-3">
            <select className='rounded border border-slate-700 bg-slate-900 px-2 py-1' value={form.requestType} onChange={(e)=>setForm({...form,requestType:e.target.value as CreativeRequestType})}><option>MOCKUP</option><option>APPAREL_GRAPHIC</option><option>COLLECTION_DESIGN</option><option>SOCIAL_MEDIA_GRAPHIC</option><option>EVENT_LOGO</option><option>BRAND_DOCUMENT</option><option>SALES_FLYER</option><option>OTHER</option></select>
            <select className='rounded border border-slate-700 bg-slate-900 px-2 py-1' value={form.designTeam} onChange={(e)=>setForm({...form,designTeam:e.target.value as DesignTeam})}><option>APPAREL_MOCKUP</option><option>SOCIAL_BRAND</option></select>
            <select className='rounded border border-slate-700 bg-slate-900 px-2 py-1' value={form.priority} onChange={(e)=>setForm({...form,priority:e.target.value as CreativePriority})}><option>LOW</option><option>NORMAL</option><option>HIGH</option><option>URGENT</option></select>
          </div>
          <input className='w-full rounded border border-slate-700 bg-slate-900 px-2 py-1' placeholder='Request Title' value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})} />
          <div className='grid gap-2 md:grid-cols-2'><input className='rounded border border-slate-700 bg-slate-900 px-2 py-1' placeholder='Sport' value={form.sport} onChange={(e)=>setForm({...form,sport:e.target.value})} /><input className='rounded border border-slate-700 bg-slate-900 px-2 py-1' placeholder='Season' value={form.season} onChange={(e)=>setForm({...form,season:e.target.value})} /></div>
          <div className='grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'>{neededItemOptions.map((item)=><label key={item} className='text-xs'><input type='checkbox' checked={form.neededItems.includes(item)} onChange={()=>setForm({...form,neededItems:form.neededItems.includes(item)?form.neededItems.filter((x)=>x!==item):[...form.neededItems,item]})} /> {item}</label>)}</div>
          <textarea className='w-full rounded border border-slate-700 bg-slate-900 px-2 py-1' rows={3} placeholder='Design Notes (required)' value={form.designNotes} onChange={(e)=>setForm({...form,designNotes:e.target.value})} />
          <textarea className='w-full rounded border border-slate-700 bg-slate-900 px-2 py-1' rows={2} placeholder='Inspiration / Reference Notes' value={form.inspirationNotes} onChange={(e)=>setForm({...form,inspirationNotes:e.target.value})} />
          <input type='date' className='rounded border border-slate-700 bg-slate-900 px-2 py-1' value={form.dueDate} onChange={(e)=>setForm({...form,dueDate:e.target.value})} />
          <textarea className='w-full rounded border border-slate-700 bg-slate-900 px-2 py-1' rows={2} placeholder='Asset Links' value={form.assetLinks} onChange={(e)=>setForm({...form,assetLinks:e.target.value})} />
          <textarea className='w-full rounded border border-slate-700 bg-slate-900 px-2 py-1' rows={2} placeholder='Internal Notes' value={form.internalNotes} onChange={(e)=>setForm({...form,internalNotes:e.target.value})} />
          {error ? <p className='text-rose-300'>{error}</p> : null}{success ? <p className='text-emerald-300'>{success}</p> : null}
          <Button className='w-full sm:w-auto' onClick={()=>{try{submitCreativeRequest({opportunityId:opp.id,organizationId:opp.organizationId,assignedDesigner:'',requestType:form.requestType,designTeam:form.designTeam,priority:form.priority,title:form.title,sport:form.sport,season:form.season,neededItems:form.neededItems,designNotes:form.designNotes,inspirationNotes:form.inspirationNotes,dueDate:form.dueDate||undefined,assetLinks:form.assetLinks,internalNotes:form.internalNotes,trelloCardUrl:''});setSuccess('Creative request submitted.');setError('');setShowForm(false);setRefreshTick((x)=>x+1);}catch(e:any){setError('Unable to submit creative request. Please check required fields and try again.');setSuccess('')}}}>Submit Request</Button>
        </div> : null}
        {creativeRequests.length ? <div className='space-y-2'>{creativeRequests.map((r)=><div key={r.id} className='rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-sm'><p className='font-semibold'>{r.title}</p><p className='text-slate-300'>{r.requestType} · {r.designTeam} · Priority {r.priority} · Status {r.status}</p><p className='text-slate-400'>Due: {r.dueDate || '—'} · Designer: {r.assignedDesigner || 'Unassigned'}</p><p className='text-slate-400'>Trello: {r.trelloCardUrl || 'Pending integration'}</p></div>)}</div> : <p className='text-sm text-slate-400'>No creative requests yet. Create a request when this opportunity needs a mockup, apparel graphic, sales visual, or brand asset.</p>}
      </Card>
    </div>
  );
}
