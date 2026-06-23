import { Link, useParams } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { Button, Card, EmptyState, StageBadge } from '../components/primitives';
import { formatCurrency } from '../utils/format';
import { useOpportunityById, useOpportunityStages } from '../hooks/useOpportunities';
import { useOrganizationById } from '../hooks/useOrganizations';
import { useActivities } from '../hooks/useReports';
import { submitCreativeRequest, useCreativeRequests } from '../hooks/useCreativeRequests';
import { neededItemOptions, type CreativePriority, type CreativeRequestType, type DesignTeam } from '../services/creativeRequestsService';
import { SPORT_OPTIONS, REVENUE_LANES } from '../config/business';
import { getLaneLabel } from '../utils/naming';
import { logOpportunityActivity, updateOpportunityStage } from '../services/opportunitiesService';
import type { Opportunity, OpportunityStage } from '../data/mockSalesData';
import { daysSince } from '../services/kpiUtils';
import { canAdvanceOpportunity, getAdvanceDeniedMessage } from '../services/roleScope';
import { notify } from '../services/feedbackService';
import { createMockOrderFromOpportunity, getAnyOrderByOpportunityId } from '../services/ordersService';

const stageCtas = {
  LEAD_ENGAGED: 'Contact coach',
  DISCOVERY: 'Conduct discovery',
  MOCKUP_STAGE: 'Send invoice',
  INVOICE_SENT: 'Follow up payment',
  CLOSED_WON: 'View order',
  CLOSED_LOST: 'Review loss reason',

  // Legacy mappings for backward compatibility:
  LEAD_ASSIGNED: 'Contact coach',
  CONTACTED: 'Contact coach',
  MOCKUP_REQUESTED: 'Send invoice',
  MOCKUP_DELIVERED: 'Send invoice',
  DECISION_PENDING: 'Follow up payment',
  PAYMENT_RECEIVED: 'Follow up payment',
} as const;


const stageFlow = ['LEAD_ENGAGED','DISCOVERY','MOCKUP_STAGE','INVOICE_SENT','CLOSED_WON'] as const;


export function OpportunityDetailPage() {
  const { id } = useParams();
  const opp = useOpportunityById(id);
  const opportunityStages = useOpportunityStages();
  const dealActivity = useActivities({ entityType: 'OPPORTUNITY', entityId: id });
  const organization = useOrganizationById(opp?.organizationId);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [refreshTick, setRefreshTick] = useState(0);
  const [actionMessage, setActionMessage] = useState('');
  const [localOpp, setLocalOpp] = useState<Opportunity | undefined>();
  const [showAdvanceDrawer, setShowAdvanceDrawer] = useState(false);
  const [advanceForm, setAdvanceForm] = useState<Record<string, string>>({});
  const activeOpp = localOpp ?? opp;
  const creativeRequests = useCreativeRequests(id, refreshTick);
  const [form, setForm] = useState({ requestType: 'MOCKUP' as CreativeRequestType, designTeam: 'APPAREL_MOCKUP' as DesignTeam, priority: 'NORMAL' as CreativePriority, title: '', sport: opp?.sport ?? '', season: opp?.season ?? '', neededItems: [] as string[], designNotes: '', inspirationNotes: '', dueDate: '', assetLinks: '', internalNotes: '' });
  const summary = useMemo(() => ({ total: creativeRequests.length, active: creativeRequests.filter((r) => !['DELIVERED','ARCHIVED'].includes(r.status)).length, delivered: creativeRequests.filter((r) => r.status === 'DELIVERED').length, highUrgent: creativeRequests.filter((r) => ['HIGH','URGENT'].includes(r.priority)).length }), [creativeRequests, refreshTick]);
  if (!activeOpp) return <EmptyState title="Opportunity not found" description="Select another opportunity from the pipeline table." />;

  const currentStageIndex = stageFlow.indexOf(activeOpp.stage as any);
  const nextStage = currentStageIndex >= 0 && currentStageIndex < stageFlow.length - 1 ? stageFlow[currentStageIndex + 1] : null;
  const staleDays = daysSince(activeOpp.lastActivity);
  const followupTone = staleDays >= 7 ? 'AT RISK' : staleDays >= 3 ? 'NEEDS FOLLOW-UP' : 'ON TRACK';
  const zoneLabel = organization?.territory === 'north' ? 'TUF NORTH' : organization?.territory === 'west' ? 'TUF WEST' : organization?.territory === 'south' ? 'TUF SOUTH' : 'TUF METRO';
  const canAdvance = canAdvanceOpportunity(activeOpp);
  const requiredFieldsByStage: Partial<Record<OpportunityStage, { key: string; label: string; type?: 'date' | 'text' }[]>> = {
    DISCOVERY: [{ key: 'budgetConfirmed', label: 'Confirm Budget Alignment (Yes/No)' }, { key: 'rosterSize', label: 'Estimated Roster Size' }, { key: 'timelineConfirmed', label: 'Confirm Season Timeline (Yes/No)' }],
    MOCKUP_STAGE: [{ key: 'sport', label: 'Sport' }, { key: 'lane', label: 'Lane' }, { key: 'designNotes', label: 'Design Notes' }, { key: 'neededItems', label: 'Needed Items' }, { key: 'urgency', label: 'Urgency / Due Date' }],
    INVOICE_SENT: [{ key: 'invoiceAmount', label: 'Invoice Amount' }, { key: 'invoiceDate', label: 'Invoice Date', type: 'date' }, { key: 'paymentFollowupDate', label: 'Payment Follow-up Date', type: 'date' }],
    CLOSED_WON: [{ key: 'confirmPaymentReceived', label: 'Confirm Payment Received (Yes/No)' }, { key: 'confirmOrderHandoff', label: 'Confirm Order Handoff Created (Yes/No)' }],
  };
  const requiredAdvanceFields = nextStage ? (requiredFieldsByStage[nextStage as OpportunityStage] ?? []) : [];

  const setStage = (stage: OpportunityStage, message: string) => {
    try {
      const updated = updateOpportunityStage(activeOpp.id, stage);
      if (!updated) throw new Error('Opportunity not found.');
      let finalMessage = message;
      if (stage === 'CLOSED_WON') {
        const order = createMockOrderFromOpportunity(updated);
        finalMessage = `${message} Order handoff ${order.id} is ready for Ops review.`;
      }
      setLocalOpp(updated);
      setActionMessage(finalMessage);
      notify('Opportunity stage advanced.', 'success');
      return updated;
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'You do not have permission to advance this opportunity.';
      setActionMessage(detail);
      notify(`Opportunity stage advance failed: ${detail}`, 'error');
      return undefined;
    }
  };

  const logCrmActivity = (message: string) => {
    const updated = logOpportunityActivity(activeOpp.id, message);
    if (updated) setLocalOpp(updated);
    setActionMessage(message);
    notify('CRM activity logged.', 'success');
  };

  return (
    <div className="space-y-3">
      <Card title="Deal Command Center">
        <div className="grid gap-2 lg:grid-cols-2">
          <div className="space-y-1">
            <p className="text-lg font-semibold">{activeOpp.title}</p>
            <Link to={`/organizations/${activeOpp.organizationId}`} className="text-sm text-cyan-300">{activeOpp.organizationName}</Link>
            <p className="text-xs text-slate-400">Sport: {activeOpp.sport} · Lane: {activeOpp.lane} · Zone: {zoneLabel}</p>
            <p className="text-xs text-slate-400">Assigned Rep: {activeOpp.assignedRep}</p>
          </div>
          <div className="text-left lg:text-right">
            <p className="text-xl font-semibold text-cyan-300">{formatCurrency(activeOpp.value)}</p>
            <p className="text-xs text-slate-400">Current Stage: {activeOpp.stage.replace(/_/g, ' ')}</p>
            <p className={`text-xs font-semibold ${followupTone === 'AT RISK' ? 'text-amber-300' : 'text-emerald-200'}`}>Follow-up: {followupTone}</p>
          </div>
        </div>
      </Card>

      <Card title="Close Path Timeline">
        <div className="flex flex-wrap gap-2">
          {opportunityStages.map((stage, idx) => {
            const stageIndex = stageFlow.indexOf(stage as any);
            const done = stageIndex >= 0 && stageIndex <= currentStageIndex;
            const isCurrent = stage === activeOpp.stage;
            return (
              <div key={stage} className={`rounded-md border px-2 py-1 ${isCurrent ? 'border-cyan-400 bg-cyan-500/15' : done ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-slate-800 bg-slate-950/70'}`}>
                <span className="text-[10px] text-slate-400">{idx + 1}</span> <StageBadge stage={stage} />
              </div>
            );
          })}
          {nextStage ? (
            <div className="rounded-md border border-amber-400/50 bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-200">
              Next Stage: {nextStage.replace(/_/g, ' ')}
            </div>
          ) : null}
        </div>
      </Card>

      <div className="grid gap-3 lg:grid-cols-3">
        <Card title="Mission Priority" className="lg:col-span-2"><p className="text-sm text-slate-300"><span className="font-semibold text-slate-100">Issue:</span> {staleDays >= 7 ? `No follow-up in ${staleDays} days.` : 'Deal has not reached close path finish.'}</p><p className="text-sm text-slate-300"><span className="font-semibold text-slate-100">Action:</span> {activeOpp.nextAction}</p><p className="text-sm text-slate-300"><span className="font-semibold text-slate-100">Impact:</span> Protect {formatCurrency(activeOpp.value)} and keep 4-order pace.</p>{actionMessage ? <p className={`mt-2 text-sm ${actionMessage.includes('permission') || actionMessage.includes('read-only') ? 'text-amber-200' : 'text-cyan-200'}`}>{actionMessage}</p> : null}</Card>
        <Card title="Next Action Console"><div className='space-y-2'><Button className="w-full" onClick={() => {
          logCrmActivity(`${stageCtas[activeOpp.stage]} logged.`);
          if (activeOpp.stage === 'LEAD_ENGAGED') {
            setStage('DISCOVERY', 'Initial contact logged. Opportunity advanced to Discovery.');
          }
        }}>{stageCtas[activeOpp.stage]}</Button>{nextStage && canAdvance ? <Button className='w-full border-slate-600 bg-slate-800/60 text-slate-200' onClick={() => setShowAdvanceDrawer(true)}>Open Stage Advancement Drawer</Button> : null}{nextStage && !canAdvance ? <p className="text-sm text-slate-300">{getAdvanceDeniedMessage(activeOpp)}</p> : null}<Button className='w-full border-slate-600 bg-slate-800/60 text-slate-200' onClick={() => logCrmActivity('Follow-up scheduled and logged.')}>Schedule / Log Follow-up</Button><Button className='w-full border-slate-600 bg-slate-800/60 text-slate-200' onClick={() => logCrmActivity('Rep note captured for next touch.')}>Add Note</Button></div></Card>
      </div>

      <Card title="Stage Advancement Drawer (Guided)">
        <p className="text-sm text-slate-300">This flow collects only rep-ready fields and should complete in under 60 seconds.</p>
        <div className="mt-2 grid gap-2 md:grid-cols-2 text-xs text-slate-300">
          <p><span className="font-semibold text-slate-100">Contacted:</span> contact method, outcome, next follow-up date.</p>
          <p><span className="font-semibold text-slate-100">Mockup Requested:</span> sport, lane, design notes, needed items, urgency.</p>
          <p><span className="font-semibold text-slate-100">Mockup Delivered:</span> asset/link, delivery date, next follow-up date.</p>
          <p><span className="font-semibold text-slate-100">Invoice Sent:</span> invoice amount, invoice date, payment follow-up date.</p>
          <p><span className="font-semibold text-slate-100">Payment Received:</span> payment amount, payment date, handoff ready yes/no.</p>
          <p><span className="font-semibold text-slate-100">Closed Won:</span> confirm payment received, confirm order handoff created.</p>
        </div>
      </Card>
      {showAdvanceDrawer && nextStage && canAdvance ? (
        <div className="fixed inset-0 z-40 bg-black/60">
          <div className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto border-l border-slate-700 bg-[#08111a] p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-base font-semibold text-white">Advance to {nextStage.replace(/_/g, ' ')}</p>
              <Button className="border-slate-600 bg-slate-800/60 text-slate-200" onClick={() => setShowAdvanceDrawer(false)}>Close</Button>
            </div>
            <p className="mb-3 text-xs text-slate-400">Required fields only. Target completion: under 60 seconds.</p>
            <div className="space-y-3">
              {requiredAdvanceFields.map((field) => (
                <label key={field.key} className="block text-xs text-slate-300">
                  <span className="mb-1 block font-semibold text-slate-200">{field.label}</span>
                  {field.key === 'sport' ? (
                    <select
                      value={advanceForm[field.key] ?? ''}
                      onChange={(e) => setAdvanceForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-2 text-sm text-slate-100"
                    >
                      <option value="">Select sport…</option>
                      {SPORT_OPTIONS.map((sport) => (
                        <option key={sport} value={sport}>{sport}</option>
                      ))}
                    </select>
                  ) : field.key === 'lane' ? (
                    <select
                      value={advanceForm[field.key] ?? ''}
                      onChange={(e) => setAdvanceForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-2 text-sm text-slate-100"
                    >
                      <option value="">Select lane…</option>
                      {REVENUE_LANES.map((lane) => (
                        <option key={lane} value={lane}>{getLaneLabel(lane)}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type ?? 'text'}
                      value={advanceForm[field.key] ?? ''}
                      onChange={(e) => setAdvanceForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-2 text-sm text-slate-100"
                    />
                  )}
                </label>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={() => {
                const missing = requiredAdvanceFields.filter((field) => !(advanceForm[field.key] ?? '').trim());
                if (missing.length) {
                  setActionMessage(`Missing required fields: ${missing.map((m) => m.label).join(', ')}`);
                  return;
                }
                setStage(nextStage, `Advanced to ${nextStage.replace(/_/g, ' ')} in mock mode with guided drawer fields.`);
                setShowAdvanceDrawer(false);
                setAdvanceForm({});
              }}>Advance Stage</Button>
              <Button className="border-slate-600 bg-slate-800/60 text-slate-200" onClick={() => setShowAdvanceDrawer(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      ) : null}

      {staleDays >= 7 ? <Card title="⚠ Follow-up Warning"><p className='text-sm text-amber-300'>No follow-up logged in {staleDays} days. Rep should log activity and advance next action today.</p></Card> : null}

      <div className="grid gap-3 lg:grid-cols-3">
        <Card title="Decision Timeline" className="lg:col-span-2">
          <div className="space-y-2 text-sm">
            {dealActivity.length ? dealActivity.map((entry) => <div key={entry.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">{entry.message}<p className="text-xs text-slate-400">{entry.timestamp} · {entry.user}</p></div>) : <p className="text-slate-400">No activity entries yet.</p>}
          </div>
        </Card>
        <Card title="Creative / Mockup Panel"><p className="text-sm text-slate-300">Creative requests: {summary.total}. Active requests: {summary.active}. Delivered asset count: {summary.delivered}.</p></Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Card title="Close Risk: Invoice / Payment" className="lg:col-span-2"><p className="text-sm text-slate-300">Invoice status follows the current stage. Payment follow-up is active when the deal is INVOICE SENT or DECISION PENDING, and closes only after PAYMENT RECEIVED.</p></Card>
        <Card title="Outcome Zone">{canAdvance ? <div className="space-y-2"><Button className="w-full" onClick={() => setStage('CLOSED_WON', 'Marked Closed Won. Review Orders for handoff coverage.')}>Closed Won (High Consequence)</Button>{getAnyOrderByOpportunityId(activeOpp.id) ? <Link className="block rounded-md border border-cyan-400/40 px-3 py-2 text-center text-sm font-semibold text-cyan-200" to={`/orders/${getAnyOrderByOpportunityId(activeOpp.id)?.id}`}>Open Order Handoff</Link> : null}<Button className="w-full border-slate-600 bg-slate-800/60 text-slate-200" onClick={() => setStage('CLOSED_LOST', 'Marked Closed Lost. Capture loss reason during follow-up review.')}>Closed Lost (High Consequence)</Button></div> : <p className="text-sm text-slate-300">Outcome changes are read-only for your current role.</p>}</Card>
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
          <Button className='w-full sm:w-auto' onClick={()=>{try{submitCreativeRequest({opportunityId:activeOpp.id,organizationId:activeOpp.organizationId,assignedDesigner:'',requestType:form.requestType,designTeam:form.designTeam,priority:form.priority,title:form.title,sport:form.sport,season:form.season,neededItems:form.neededItems,designNotes:form.designNotes,inspirationNotes:form.inspirationNotes,dueDate:form.dueDate||undefined,assetLinks:form.assetLinks,internalNotes:form.internalNotes,trelloCardUrl:''});setSuccess('Creative request submitted.');setError('');setShowForm(false);setRefreshTick((x)=>x+1);}catch{setError('Unable to submit creative request. Please check required fields and try again.');setSuccess('')}}}>Submit Request</Button>
        </div> : null}
        {creativeRequests.length ? <div className='space-y-2'>{creativeRequests.map((r)=><div key={r.id} className='rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-sm'><p className='font-semibold'>{r.title}</p><p className='text-slate-300'>{r.requestType} · {r.designTeam} · Priority {r.priority} · Status {r.status}</p><p className='text-slate-400'>Due: {r.dueDate || '—'} · Designer: {r.assignedDesigner || 'Unassigned'}</p><p className='text-slate-400'>Design queue: Mock task created for beta review</p></div>)}</div> : <p className='text-sm text-slate-400'>No creative requests yet. Create a request when this opportunity needs a mockup, apparel graphic, sales visual, or brand asset.</p>}
      </Card>
    </div>
  );
}
