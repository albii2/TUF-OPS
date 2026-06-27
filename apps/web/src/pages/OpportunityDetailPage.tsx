import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMemo, useState, useRef } from 'react';
import { Button, Card, EmptyState, StageBadge } from '../components/primitives';
import { formatCurrency } from '../utils/format';
import { useOpportunityById, useOpportunityStages } from '../hooks/useOpportunities';
import { useOrganizationById } from '../hooks/useOrganizations';
import { useActivities } from '../hooks/useReports';
import { submitCreativeRequest, useCreativeRequests } from '../hooks/useCreativeRequests';
import { neededItemOptions, type CreativePriority, type CreativeRequestType, type DesignTeam } from '../services/creativeRequestsService';
import { SPORT_OPTIONS, REVENUE_LANES } from '../config/business';
import { getLaneLabel } from '../utils/naming';
import { deleteOpportunity, logOpportunityActivity, updateOpportunityLane, updateOpportunityStage } from '../services/opportunitiesService';
import type { Opportunity, OpportunityStage, RevenueLane } from '../data/mockSalesData';
import { daysSince } from '../services/kpiUtils';
import { canAdvanceOpportunity, getAdvanceDeniedMessage } from '../services/roleScope';
import { notify } from '../services/feedbackService';
import { createMockOrderFromOpportunity, getAnyOrderByOpportunityId } from '../services/ordersService';

const stageCtas = {
  LEAD_ENGAGED: 'Mark as Contacted',
  DISCOVERY: 'Complete Discovery',
  MOCKUP_STAGE: 'Request Mockup',
  INVOICE_SENT: 'Send Invoice',
  CLOSED_WON: 'View Order',
  CLOSED_LOST: 'Review Loss Reason',

  // Legacy mappings for backward compatibility:
  LEAD_ASSIGNED: 'Mark as Contacted',
  CONTACTED: 'Mark as Contacted',
  MOCKUP_REQUESTED: 'Request Mockup',
  MOCKUP_DELIVERED: 'Send Invoice',
  DECISION_PENDING: 'Send Invoice',
  PAYMENT_RECEIVED: 'View Order',
} as const;


const stageFlow = ['LEAD_ENGAGED','DISCOVERY','MOCKUP_STAGE','INVOICE_SENT','CLOSED_WON'] as const;

function formatActivityTime(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }),
  };
}

function getActivityTypeInfo(message: string): { label: string; color: string; borderClass: string; bgClass: string } {
  const isStageChange =
    message.startsWith('Stage advanced') ||
    message.includes('Advanced to') ||
    message.startsWith('Marked') ||
    message.startsWith('Removed');
  const isWarning = message.startsWith('Follow-up');
  if (isStageChange) {
    return { label: 'stage', color: '#38bdf8', borderClass: 'border-l-sky-400', bgClass: 'bg-sky-500/10' };
  }
  if (isWarning) {
    return { label: 'follow-up', color: '#fbbf24', borderClass: 'border-l-amber-400', bgClass: 'bg-amber-500/10' };
  }
  return { label: 'note', color: '#34d399', borderClass: 'border-l-emerald-400', bgClass: 'bg-emerald-500/10' };
}


export function OpportunityDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
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
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpForm, setFollowUpForm] = useState({ date: '', notes: '' });
  const [inlineLaneEditing, setInlineLaneEditing] = useState(false);
  const creativeSectionRef = useRef<HTMLDivElement>(null);
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
    LEAD_ENGAGED: [{ key: 'lane', label: 'Lane' }, { key: 'contactNote', label: 'Note / Description (required)', type: 'text' }],
    DISCOVERY: [{ key: 'lane', label: 'Lane' }, { key: 'budgetConfirmed', label: 'Confirm Budget Alignment (Yes/No)' }, { key: 'rosterSize', label: 'Estimated Roster Size' }, { key: 'timelineConfirmed', label: 'Confirm Season Timeline (Yes/No)' }, { key: 'discoveryDate', label: 'Discovery Date', type: 'date' }],
    MOCKUP_STAGE: [{ key: 'lane', label: 'Lane' }, { key: 'sport', label: 'Sport' }, { key: 'designNotes', label: 'Design Notes' }, { key: 'neededItems', label: 'Needed Items' }, { key: 'urgency', label: 'Urgency / Due Date', type: 'date' }],
    INVOICE_SENT: [{ key: 'lane', label: 'Lane' }, { key: 'invoiceAmount', label: 'Invoice Amount' }, { key: 'invoiceDate', label: 'Invoice Date', type: 'date' }, { key: 'paymentFollowupDate', label: 'Payment Follow-up Date', type: 'date' }],
    CLOSED_WON: [{ key: 'lane', label: 'Lane' }, { key: 'confirmPaymentReceived', label: 'Confirm Payment Received (Yes/No)' }, { key: 'confirmOrderHandoff', label: 'Confirm Order Handoff Created (Yes/No)' }, { key: 'closedDate', label: 'Closed Date', type: 'date' }],
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

  const removeOpportunity = () => {
    if (!window.confirm(`Remove opportunity "${activeOpp.title}" from the pipeline?`)) return;
    deleteOpportunity(activeOpp.id);
    notify('Opportunity removed from pipeline.', 'success');
    navigate('/opportunities');
  };

  return (
    <div className="space-y-3">
      <Card title="Deal Command Center">
        <div className="grid gap-2 lg:grid-cols-2">
          <div className="space-y-1">
            <p className="text-lg font-semibold">{activeOpp.title}</p>
            <Link to={`/organizations/${activeOpp.organizationId}`} className="text-sm text-cyan-300">{activeOpp.organizationName}</Link>
            <p className="text-xs text-slate-400">Sport: {activeOpp.sport} · Zone: {zoneLabel}</p>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Lane:</span>
              {inlineLaneEditing ? (
                <>
                  <select
                    className="rounded border border-slate-700 bg-slate-900 px-1 py-0.5 text-xs text-slate-100"
                    value={activeOpp.lane}
                    onChange={(e) => {
                      const newLane = e.target.value as RevenueLane;
                      if (newLane !== activeOpp.lane) {
                        const confirmed = window.confirm(
                          `Change lane from ${getLaneLabel(activeOpp.lane)} to ${getLaneLabel(newLane)}?\n\nThis replaces the current lane on this opportunity. Previous lane activity is preserved in the log. The organization will show both lanes as active.`
                        );
                        if (!confirmed) return;
                      }
                      const result = updateOpportunityLane(activeOpp.id, newLane);
                      if (result) setLocalOpp(result);
                      setInlineLaneEditing(false);
                    }}
                  >
                    {REVENUE_LANES.map((lane) => (
                      <option key={lane} value={lane}>{getLaneLabel(lane)}</option>
                    ))}
                  </select>
                  <button
                    className="text-slate-500 hover:text-slate-300"
                    onClick={() => setInlineLaneEditing(false)}
                  >✕</button>
                </>
              ) : (
                <>
                  <span className="text-cyan-300">{getLaneLabel(activeOpp.lane)}</span>
                  <button
                    className="ml-1 text-slate-500 hover:text-cyan-300 text-[10px] underline"
                    onClick={() => setInlineLaneEditing(true)}
                  >edit</button>
                </>
              )}
            </div>
            <p className="text-xs text-slate-400">Assigned Rep: {activeOpp.assignedRep}</p>
            <Button className="mt-2 border-rose-500/50 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20" onClick={removeOpportunity}>Remove Opportunity</Button>
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
        <Card title="Next Action Console"><div className='space-y-2'>
          {/* Stage-specific button — opens the stage advancement drawer */}
          {nextStage && canAdvance ? (
            <Button className="w-full" onClick={() => {
              if (activeOpp.stage === 'MOCKUP_STAGE') {
                // For Mockup stage, scroll to creative request section
                setShowForm(true);
                creativeSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
              }
              setShowAdvanceDrawer(true);
              setAdvanceForm({ lane: activeOpp.lane });
            }}>{stageCtas[activeOpp.stage]}</Button>
          ) : nextStage && !canAdvance ? (
            <p className="text-sm text-slate-300">{getAdvanceDeniedMessage(activeOpp)}</p>
          ) : null}
          {/* Schedule / Log Follow-up */}
          <Button className='w-full border-slate-600 bg-slate-800/60 text-slate-200' onClick={() => { setFollowUpForm({ date: '', notes: '' }); setShowFollowUpModal(true); }}>Schedule / Log Follow-up</Button>
          {/* Add Note */}
          <Button className='w-full border-slate-600 bg-slate-800/60 text-slate-200' onClick={() => { setNoteText(''); setShowNoteModal(true); }}>Add Note</Button>
        </div></Card>
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
                // Apply lane change from drawer if different from current
                const newLane = advanceForm['lane'];
                if (newLane && newLane !== activeOpp.lane) {
                  const laneResult = updateOpportunityLane(activeOpp.id, newLane as RevenueLane);
                  if (laneResult) setLocalOpp(laneResult);
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
            {dealActivity.length ? dealActivity.map((entry) => {
              const typeInfo = getActivityTypeInfo(entry.message);
              const { date, time } = formatActivityTime(entry.timestamp);
              return (
                <div key={entry.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 space-y-1 border-l-2" style={{ borderLeftColor: typeInfo.color }}>
                  <p className="text-sm font-bold text-slate-100">{date}</p>
                  <p className="text-xs text-slate-500">{time}</p>
                  <p className="text-sm text-slate-200 leading-relaxed">{entry.message}</p>
                  <p className="text-xs text-slate-500 text-right">{entry.user}</p>
                </div>
              );
            }) : <p className="text-slate-400">No activity entries yet.</p>}
          </div>
        </Card>
        <Card title="Creative / Mockup Panel"><p className="text-sm text-slate-300">Creative requests: {summary.total}. Active requests: {summary.active}. Delivered asset count: {summary.delivered}.</p></Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Card title="Close Risk: Invoice / Payment" className="lg:col-span-2"><p className="text-sm text-slate-300">Invoice status follows the current stage. Payment follow-up is active when the deal is INVOICE SENT or DECISION PENDING, and closes only after PAYMENT RECEIVED.</p></Card>
        <Card title="Outcome Zone">{canAdvance && (activeOpp.stage === 'INVOICE_SENT' || activeOpp.stage === 'DECISION_PENDING' || activeOpp.stage === 'CLOSED_WON') ? <div className="space-y-2"><Button className="w-full" onClick={() => setStage('CLOSED_WON', 'Marked Closed Won. Review Orders for handoff coverage.')}>Closed Won (High Consequence)</Button>{getAnyOrderByOpportunityId(activeOpp.id) ? <Link className="block rounded-md border border-cyan-400/40 px-3 py-2 text-center text-sm font-semibold text-cyan-200" to={`/orders/${getAnyOrderByOpportunityId(activeOpp.id)?.id}`}>Open Order Handoff</Link> : null}<Button className="w-full border-slate-600 bg-slate-800/60 text-slate-200" onClick={() => setStage('CLOSED_LOST', 'Marked Closed Lost. Capture loss reason during follow-up review.')}>Closed Lost (High Consequence)</Button></div> : <p className="text-sm text-slate-300">{activeOpp.stage === 'CLOSED_WON' ? 'Deal closed. No further stage changes.' : 'Closed Won / Closed Lost become available once the invoice is sent.'}</p>}</Card>
      </div>

      <Card title="Creative Requests">
        <div ref={creativeSectionRef} className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm">
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
          <Button className='w-full sm:w-auto' onClick={async()=>{try{const request=await submitCreativeRequest({opportunityId:activeOpp.id,organizationId:activeOpp.organizationId,assignedDesigner:'',requestType:form.requestType,designTeam:form.designTeam,priority:form.priority,title:form.title,sport:form.sport,season:form.season,neededItems:form.neededItems,designNotes:form.designNotes,inspirationNotes:form.inspirationNotes,dueDate:form.dueDate||undefined,assetLinks:form.assetLinks,internalNotes:form.internalNotes,trelloCardUrl:''});setSuccess(request.trelloDispatchStatus==='SENT'?'Creative request submitted and Trello card sent to the intern queue.':request.trelloDispatchStatus==='FAILED'?`Creative request saved, but Trello dispatch failed: ${request.trelloDispatchError}`:'Creative request saved. Configure Trello env vars to send cards to interns automatically.');setError('');setShowForm(false);setRefreshTick((x)=>x+1);}catch{setError('Unable to submit creative request. Please check required fields and try again.');setSuccess('')}}}>Submit Request</Button>
        </div> : null}
        {creativeRequests.length ? <div className='space-y-2'>{creativeRequests.map((r)=><div key={r.id} className='rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-sm'><p className='font-semibold'>{r.title}</p><p className='text-slate-300'>{r.requestType} · {r.designTeam} · Priority {r.priority} · Status {r.status}</p><p className='text-slate-400'>Due: {r.dueDate || '—'} · Designer: {r.assignedDesigner || 'Unassigned'}</p><p className='text-slate-400'>Trello queue: {r.trelloDispatchStatus === 'SENT' ? 'Sent to interns' : r.trelloDispatchStatus === 'FAILED' ? `Failed — ${r.trelloDispatchError}` : r.trelloDispatchStatus === 'NOT_CONFIGURED' ? 'Not configured' : 'Pending'}</p>{r.trelloCardUrl ? <a className='text-cyan-300' href={r.trelloCardUrl} target='_blank' rel='noreferrer'>Open Trello card →</a> : null}</div>)}</div> : <p className='text-sm text-slate-400'>No creative requests yet. Create a request when this opportunity needs a mockup, apparel graphic, sales visual, or brand asset.</p>}
      </Card>

      {/* ── Note Modal ── */}
      {showNoteModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-700 bg-[#070c13] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-white">Add Note</h2>
              <button onClick={() => setShowNoteModal(false)} className="rounded-lg border border-slate-600 px-3 py-1 text-xs text-slate-400 hover:bg-slate-800">✕</button>
            </div>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Enter your note..."
              rows={5}
              className="w-full rounded-lg border border-slate-700 bg-slate-900/60 p-3 text-sm text-slate-200 placeholder-slate-600 focus:border-cyan-400/40 focus:outline-none resize-vertical"
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button className="border-slate-600 bg-slate-800/60 text-slate-200" onClick={() => setShowNoteModal(false)}>Cancel</Button>
              <Button onClick={() => { if (noteText.trim()) { logCrmActivity(noteText.trim()); setShowNoteModal(false); } }} disabled={!noteText.trim()}>Save Note</Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Follow-Up Modal ── */}
      {showFollowUpModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-700 bg-[#070c13] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-white">Schedule / Log Follow-up</h2>
              <button onClick={() => setShowFollowUpModal(false)} className="rounded-lg border border-slate-600 px-3 py-1 text-xs text-slate-400 hover:bg-slate-800">✕</button>
            </div>
            <div className="space-y-3">
              <label className="block text-xs text-slate-300">
                <span className="mb-1 block font-semibold text-slate-200">Follow-up Date</span>
                <input
                  type="date"
                  value={followUpForm.date}
                  onChange={(e) => setFollowUpForm((p) => ({ ...p, date: e.target.value }))}
                  className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-2 text-sm text-slate-100"
                />
              </label>
              <label className="block text-xs text-slate-300">
                <span className="mb-1 block font-semibold text-slate-200">Notes</span>
                <textarea
                  value={followUpForm.notes}
                  onChange={(e) => setFollowUpForm((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Follow-up details..."
                  rows={4}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/60 p-3 text-sm text-slate-200 placeholder-slate-600 focus:border-cyan-400/40 focus:outline-none resize-vertical"
                />
              </label>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button className="border-slate-600 bg-slate-800/60 text-slate-200" onClick={() => setShowFollowUpModal(false)}>Cancel</Button>
              <Button onClick={() => {
                const msg = followUpForm.date
                  ? `Follow-up scheduled for ${followUpForm.date}. ${followUpForm.notes}`.trim()
                  : `Follow-up logged. ${followUpForm.notes}`.trim();
                logCrmActivity(msg);
                setShowFollowUpModal(false);
              }} disabled={!followUpForm.notes.trim() && !followUpForm.date}>Log Follow-up</Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
