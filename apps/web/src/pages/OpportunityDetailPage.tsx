import { Link, useParams } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { Button, Card, EmptyState } from '../components/primitives';
import { formatCurrency } from '../utils/format';
import { useOpportunityById } from '../hooks/useOpportunities';
import { useOrderByOpportunityId } from '../hooks/useOrders';
import { useOrganizationById } from '../hooks/useOrganizations';
import { useActivities } from '../hooks/useReports';
import { updateOpportunityStage } from '../services/opportunitiesService';
import { createMockOrderFromOpportunity, getAnyOrderByOpportunityId } from '../services/ordersService';
import type { Order } from '../data/mockSalesData';
import { getStoredUser } from '../auth';
import type { Opportunity, OpportunityStage } from '../data/mockSalesData';
import { daysSince } from '../services/kpiUtils';
import { canAdvanceOpportunity, getAdvanceDeniedMessage } from '../services/roleScope';
import { notify } from '../services/feedbackService';

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

const stageGroups: { key: string; label: string; stages: OpportunityStage[] }[] = [
  { key: 'lead', label: 'Lead', stages: ['LEAD_ASSIGNED'] },
  { key: 'contact', label: 'Contact', stages: ['CONTACTED'] },
  { key: 'discovery', label: 'Discovery', stages: ['DISCOVERY'] },
  { key: 'mockup', label: 'Mockup', stages: ['MOCKUP_REQUESTED', 'MOCKUP_DELIVERED'] },
  { key: 'invoice', label: 'Invoice', stages: ['INVOICE_SENT'] },
  { key: 'decision', label: 'Decision', stages: ['DECISION_PENDING'] },
  { key: 'payment', label: 'Payment', stages: ['PAYMENT_RECEIVED'] },
  { key: 'closed', label: 'Closed', stages: ['CLOSED_WON', 'CLOSED_LOST'] },
];

const nextActionCtas: Record<OpportunityStage, string> = {
  LEAD_ASSIGNED: 'Contact coach',
  CONTACTED: 'Log discovery',
  DISCOVERY: 'Request mockup',
  MOCKUP_REQUESTED: 'Advance stage',
  MOCKUP_DELIVERED: 'Advance stage',
  INVOICE_SENT: 'Advance stage',
  DECISION_PENDING: 'Advance stage',
  PAYMENT_RECEIVED: 'Advance stage',
  CLOSED_WON: 'Review handoff',
  CLOSED_LOST: 'Review loss',
};

function humanizeStage(stage: OpportunityStage) {
  return stage
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}

function buildDueState(lastActivity: string) {
  const staleDays = daysSince(lastActivity);
  if (staleDays >= 7) return { label: `Overdue ${staleDays}d`, tone: 'border-rose-500/50 bg-rose-500/10 text-rose-200', due: 'Now', overdue: true, staleDays };
  if (staleDays >= 3) return { label: 'Due Today', tone: 'border-amber-500/50 bg-amber-500/10 text-amber-200', due: 'Today', overdue: false, staleDays };
  return { label: 'On Track', tone: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-200', due: 'On track', overdue: false, staleDays };
}

function isPlaceholderPhone(value?: string) {
  if (!value) return true;
  const digits = value.replace(/\D/g, '');
  return digits.length < 10 || digits.startsWith('555') || /^(0+|1+|2+|3+|4+|5+|6+|7+|8+|9+)$/.test(digits);
}

function isPlaceholderEmail(value?: string) {
  if (!value) return true;
  return /(@school\.edu|\.local$|example\.|test\.)/i.test(value);
}

function DetailChip({ label, value, tone = 'border-slate-700 bg-slate-900/60 text-slate-100' }: { label: string; value: string; tone?: string }) {
  return <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${tone}`}><span className="text-slate-400">{label}:</span> {value}</span>;
}

export function OpportunityDetailPage() {
  const { id } = useParams();
  const opp = useOpportunityById(id);
  const dealActivity = useActivities({ entityType: 'OPPORTUNITY', entityId: id });
  const organization = useOrganizationById(opp?.organizationId);
  const [actionMessage, setActionMessage] = useState('');
  const [localOpp, setLocalOpp] = useState<Opportunity | undefined>();
  const [showAdvanceDrawer, setShowAdvanceDrawer] = useState(false);
  const [advanceForm, setAdvanceForm] = useState<Record<string, string>>({});
  const [showPlaybook, setShowPlaybook] = useState(false);
  const [orderRefreshKey, setOrderRefreshKey] = useState(0);
  const [localLinkedOrder, setLocalLinkedOrder] = useState<Order | undefined>();

  const activeOpp = localOpp ?? opp;

  const scopedLinkedOrder = useOrderByOpportunityId(activeOpp?.id, orderRefreshKey);
  const linkedOrder = localLinkedOrder ?? scopedLinkedOrder;
  const activityTimeline = useMemo(() => [...dealActivity].sort((a, b) => b.timestamp.localeCompare(a.timestamp)), [dealActivity]);

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
      setLocalOpp(updated);
      setActionMessage(message);
      notify('Opportunity stage advanced.', 'success');
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'You do not have permission to advance this opportunity.';
      setActionMessage(detail);
      notify(`Opportunity stage advance failed: ${detail}`, 'error');
    }
  };

  const openAdvanceDrawer = () => {
    if (!canAdvance) return;
    setShowAdvanceDrawer(true);
  };

  return (
    <div className="space-y-3">
      <Card>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-xl font-bold leading-tight text-white">{activeOpp.title}</p>
            <Link to={`/organizations/${activeOpp.organizationId}`} className="text-sm font-semibold text-cyan-300 hover:underline">{activeOpp.organizationName}</Link>
          </div>
          <div className="text-left lg:text-right">
            <p className="text-3xl font-black leading-none text-cyan-200">{formatCurrency(activeOpp.value)}</p>
            <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-slate-500">Value</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <DetailChip label="Stage" value={humanizeStage(activeOpp.stage)} tone="border-cyan-500/50 bg-cyan-500/10 text-cyan-100" />
          <DetailChip label="Lane" value={getLaneLabel(activeOpp.lane)} />
          <DetailChip label="Sport" value={activeOpp.sport} />
          <DetailChip label="Rep" value={activeOpp.assignedRep} />
          <DetailChip label="Due" value={dueState.label} tone={dueState.tone} />
        </div>
      </Card>

      <Card title="Stage Progress">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-8">
          {stageGroups.map((group) => {
            const groupIndexes = group.stages.map((stage) => stageFlow.indexOf(stage as any)).filter((index) => index >= 0);
            const isCurrent = group.stages.includes(activeOpp.stage);
            const isDone = groupIndexes.length > 0 && Math.max(...groupIndexes) < currentStageIndex;
            const stageLabel = group.stages.includes(activeOpp.stage) ? humanizeStage(activeOpp.stage) : group.label;
            return (
              <div key={group.key} className={`rounded-lg border p-2 ${isCurrent ? 'border-cyan-300 bg-cyan-500/20 shadow-[0_0_20px_rgba(34,211,238,0.2)]' : isDone ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-slate-800 bg-slate-950/40 opacity-60'}`}>
                <p className={`text-sm font-black ${isCurrent ? 'text-cyan-100' : isDone ? 'text-emerald-200' : 'text-slate-400'}`}>{isDone ? '✓ ' : ''}{group.label}</p>
                <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">{stageLabel}</p>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid gap-3 lg:grid-cols-3">
        <Card title="Mission Priority" className="lg:col-span-2"><p className="text-sm text-slate-300"><span className="font-semibold text-slate-100">Issue:</span> {staleDays >= 7 ? `No follow-up in ${staleDays} days.` : 'Deal has not reached close path finish.'}</p><p className="text-sm text-slate-300"><span className="font-semibold text-slate-100">Action:</span> {activeOpp.nextAction}</p><p className="text-sm text-slate-300"><span className="font-semibold text-slate-100">Impact:</span> Protect {formatCurrency(activeOpp.value)} and keep 4-order pace.</p>{actionMessage ? <p className={`mt-2 text-sm ${actionMessage.includes('permission') || actionMessage.includes('read-only') ? 'text-amber-200' : 'text-cyan-200'}`}>{actionMessage}</p> : null}</Card>
        <Card title="Next Action Console"><div className='space-y-2'><Button className="w-full" onClick={() => setActionMessage(`${stageCtas[activeOpp.stage]} logged in mock mode.`)}>{stageCtas[activeOpp.stage]}</Button>{nextStage && canAdvance ? <Button className='w-full border-slate-600 bg-slate-800/60 text-slate-200' onClick={() => setShowAdvanceDrawer(true)}>Open Stage Advancement Drawer</Button> : null}{nextStage && !canAdvance ? <p className="text-sm text-slate-300">{getAdvanceDeniedMessage(activeOpp)}</p> : null}<Button className='w-full border-slate-600 bg-slate-800/60 text-slate-200' onClick={() => setActionMessage('Follow-up scheduled in mock mode.')}>Schedule / Log Follow-up</Button><Button className='w-full border-slate-600 bg-slate-800/60 text-slate-200' onClick={() => setActionMessage('Note captured in mock mode.')}>Add Note</Button></div></Card>
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
            <div className="flex flex-wrap items-center gap-2">
              {linkedOrder ? <span className="text-xs font-semibold text-emerald-200">Order already created for this opportunity.</span> : null}
              {linkedOrder ? <Link className="rounded-lg border border-cyan-500/50 px-3 py-2 text-sm font-bold text-cyan-200" to={`/orders/${linkedOrder.id}`}>Open Linked Order</Link> : <Button onClick={createOrderHandoff}>Create Order Handoff</Button>}
            </div>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-3">
        <Card title="Close Risk: Invoice / Payment" className="lg:col-span-2"><p className="text-sm text-slate-300">Invoice status follows the current stage. Payment follow-up is active when the deal is INVOICE SENT or DECISION PENDING, and closes only after PAYMENT RECEIVED.</p></Card>
        <Card title="Outcome Zone">{canAdvance ? <div className="space-y-2"><Button className="w-full" onClick={() => setStage('CLOSED_WON', 'Marked Closed Won in mock mode. Review Orders for handoff coverage.')}>Closed Won (High Consequence)</Button><Button className="w-full border-slate-600 bg-slate-800/60 text-slate-200" onClick={() => setStage('CLOSED_LOST', 'Marked Closed Lost in mock mode. Capture loss reason during follow-up review.')}>Closed Lost (High Consequence)</Button></div> : <p className="text-sm text-slate-300">Outcome changes are read-only for your current role.</p>}</Card>
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
          {!canAdvance && <p className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-100">{getAdvanceDeniedMessage(activeOpp)}</p>}
          {actionMessage && <p className="mt-2 rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-2 text-xs text-cyan-200">{actionMessage}</p>}
        </Card>

        <Card title="Quick Execution">
          <div className="space-y-2">
            <Button className="w-full" disabled={!canAdvance || !nextStage} onClick={openAdvanceDrawer}>{nextStage ? `Advance to ${humanizeStage(nextStage)}` : 'No Stage Advance'}</Button>
            {!canAdvance && <p className="text-xs text-slate-400">{getAdvanceDeniedMessage(activeOpp)}</p>}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {contactPhone && <a href={`tel:${contactPhone}`} className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-center text-xs font-bold text-emerald-200">Call</a>}
              {contactEmail && <a href={`mailto:${contactEmail}`} className="rounded-lg border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-center text-xs font-bold text-sky-200">Email</a>}
            </div>
            {!contactPhone && !contactEmail && <button className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-xs font-bold text-slate-300" onClick={() => setActionMessage('Add Contact Info placeholder: update the organization record before calling or emailing.')}>Add Contact Info</button>}
          </div>
        </Card>
      </div>

      {showAdvanceDrawer && nextStage && canAdvance && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm">
          <div className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto border-l border-slate-700 bg-[#08111a] p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xl font-bold text-white">Advance to {humanizeStage(nextStage)}</p>
                <p className="text-xs text-slate-400">Capture required fields before moving the deal.</p>
              </div>
              <button className="text-slate-500 transition hover:text-white" onClick={() => setShowAdvanceDrawer(false)}>✕</button>
            </div>

            <div className="space-y-4">
              {requiredAdvanceFields.length > 0 ? requiredAdvanceFields.map((field) => (
                <div key={field.key}>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">{field.label}</label>
                  <input
                    type={field.type ?? 'text'}
                    value={advanceForm[field.key] ?? ''}
                    onChange={(e) => setAdvanceForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    className="w-full rounded-md border border-slate-800 bg-slate-900/50 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              )) : (
                <p className="text-sm italic text-slate-300">No additional fields required for this stage transition.</p>
              )}
            </div>

            <div className="mt-8 flex flex-col gap-3">
              <Button className="w-full py-3" onClick={() => {
                const missing = requiredAdvanceFields.filter((field) => !(advanceForm[field.key] ?? '').trim());
                if (missing.length) {
                  notify(`Missing required fields: ${missing.map((m) => m.label).join(', ')}`, 'error');
                  return;
                }
                advanceToStage(nextStage, `Advanced to ${humanizeStage(nextStage)}.`);
                setShowAdvanceDrawer(false);
                setAdvanceForm({});
              }}>Confirm Advancement</Button>
              <button className="w-full rounded-md border border-slate-800 bg-slate-900/30 py-2.5 text-sm font-bold text-slate-400 transition hover:bg-slate-800" onClick={() => setShowAdvanceDrawer(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        <Card title="Relationship Intelligence">
          {decisionMaker || champion ? (
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <p className="rounded-lg border border-slate-800 bg-slate-950/40 p-2"><span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Decision Maker</span>{decisionMaker ?? 'Not recorded'}</p>
              <p className="rounded-lg border border-slate-800 bg-slate-950/40 p-2"><span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Champion / Contact</span>{champion ?? 'Not recorded'}</p>
              <p className="rounded-lg border border-slate-800 bg-slate-950/40 p-2"><span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Last Activity</span>{activeOpp.lastActivity}</p>
              <p className="rounded-lg border border-slate-800 bg-slate-950/40 p-2"><span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Refresh Window</span>{activeOpp.season || 'Not recorded'}</p>
              <p className="rounded-lg border border-slate-800 bg-slate-950/40 p-2"><span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Competitor</span>Not recorded</p>
              <p className="rounded-lg border border-slate-800 bg-slate-950/40 p-2"><span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Buying Process</span>Not recorded</p>
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-slate-700 p-3 text-sm text-slate-400">No decision path recorded yet.</p>
          )}
        </Card>

        <Card title="Activity Timeline">
          <div className="mb-2 flex justify-end">
            <button className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-xs font-bold text-slate-300" onClick={() => setActionMessage('Log Activity placeholder: modal planned for a future sprint.')}>Log Activity</button>
          </div>
          <div className="space-y-2">
            {activityTimeline.length ? activityTimeline.map((entry) => (
              <div key={entry.id} className="rounded-lg border border-slate-800 bg-slate-950/30 p-2">
                <p className="text-sm leading-snug text-slate-200">{entry.message}</p>
                <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">{entry.timestamp} · {entry.user}</p>
              </div>
            )) : <p className="rounded-lg border border-dashed border-slate-700 p-3 text-sm text-slate-400">No activity logged yet.</p>}
          </div>
        </Card>
      </div>

      <Card>
        <button className="flex w-full items-center justify-between text-left" onClick={() => setShowPlaybook((value) => !value)}>
          <span className="text-sm font-semibold text-white">Strategy & Playbook Guidance</span>
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-300">{showPlaybook ? 'Hide' : 'Show'}</span>
        </button>
        {showPlaybook && (
          <div className="mt-3 grid gap-2 text-sm text-slate-300 md:grid-cols-2">
            <p><span className="font-bold text-white">Expansion Ladder:</span> Win the active lane first, then identify the next logical sport or gear category.</p>
            <p><span className="font-bold text-white">Refresh Cycle:</span> Confirm season timing and uniform replacement windows before asking for commitment.</p>
            <p><span className="font-bold text-white">Ecosystem Referral:</span> Ask trusted coaches or administrators for warm introductions to adjacent programs.</p>
            <p><span className="font-bold text-white">Competitive Displacement:</span> Capture incumbent vendor, pain points, and decision timing before positioning TUF.</p>
            <p><span className="font-bold text-white">Decision Path Mapping:</span> Record the decision maker, champion, approval steps, and payment owner.</p>
          </div>
        )}
      </Card>
    </div>
  );
}
