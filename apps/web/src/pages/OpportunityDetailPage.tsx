import { Link, useParams } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { Button, Card, EmptyState } from '../components/primitives';
import { formatCurrency } from '../utils/format';
import { useOpportunityById } from '../hooks/useOpportunities';
import { useOrderByOpportunityId } from '../hooks/useOrders';
import { useOrganizationById } from '../hooks/useOrganizations';
import { useActivities } from '../hooks/useReports';
import { updateOpportunityStage } from '../services/opportunitiesService';
import { createMockOrderFromOpportunity } from '../services/ordersService';
import type { Opportunity, OpportunityStage } from '../data/mockSalesData';
import { daysSince } from '../services/kpiUtils';
import { canAdvanceOpportunity, getAdvanceDeniedMessage } from '../services/roleScope';
import { notify } from '../services/feedbackService';
import { getLaneLabel } from '../utils/naming';

const stageFlow = ['LEAD_ASSIGNED','CONTACTED','DISCOVERY','MOCKUP_REQUESTED','MOCKUP_DELIVERED','INVOICE_SENT','DECISION_PENDING','PAYMENT_RECEIVED','CLOSED_WON'] as const;

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

  const activeOpp = localOpp ?? opp;

  const linkedOrder = useOrderByOpportunityId(activeOpp?.id, orderRefreshKey);
  const activityTimeline = useMemo(() => [...dealActivity].sort((a, b) => b.timestamp.localeCompare(a.timestamp)), [dealActivity]);

  if (!activeOpp) return <EmptyState title="Opportunity not found" description="Select another opportunity from the pipeline table." />;

  const currentStageIndex = stageFlow.indexOf(activeOpp.stage as any);
  const nextStage = currentStageIndex >= 0 && currentStageIndex < stageFlow.length - 1 ? stageFlow[currentStageIndex + 1] : null;
  const dueState = buildDueState(activeOpp.lastActivity);
  const canAdvance = canAdvanceOpportunity(activeOpp);
  const decisionMaker = organization?.athleticDirectorName;
  const champion = organization?.headCoachName;
  const contactPhone = !isPlaceholderPhone(organization?.headCoachPhone) ? organization?.headCoachPhone : !isPlaceholderPhone(organization?.athleticDirectorPhone) ? organization?.athleticDirectorPhone : undefined;
  const contactEmail = !isPlaceholderEmail(organization?.headCoachEmail) ? organization?.headCoachEmail : !isPlaceholderEmail(organization?.athleticDirectorEmail) ? organization?.athleticDirectorEmail : undefined;

  const createOrderHandoff = () => {
    try {
      const created = createMockOrderFromOpportunity(activeOpp);
      setOrderRefreshKey((value) => value + 1);
      setActionMessage(`Order created: ${created.id}`);
      notify('Order handoff created.', 'success');
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Unable to create order handoff.';
      setActionMessage(detail);
      notify(`Order handoff failed: ${detail}`, 'error');
    }
  };

  const requiredFieldsByStage: Partial<Record<OpportunityStage, { key: string; label: string; type?: 'date' | 'text' }[]>> = {
    CONTACTED: [{ key: 'contactMethod', label: 'Contact Method' }, { key: 'outcome', label: 'Outcome' }, { key: 'nextFollowupDate', label: 'Next Follow-up Date', type: 'date' }],
    MOCKUP_REQUESTED: [{ key: 'sport', label: 'Sport' }, { key: 'lane', label: 'Lane' }, { key: 'designNotes', label: 'Design Notes' }, { key: 'neededItems', label: 'Needed Items' }, { key: 'urgency', label: 'Urgency / Due Date' }],
    MOCKUP_DELIVERED: [{ key: 'assetLink', label: 'Asset / Link' }, { key: 'deliveryDate', label: 'Delivery Date', type: 'date' }, { key: 'nextFollowupDate', label: 'Next Follow-up Date', type: 'date' }],
    INVOICE_SENT: [{ key: 'invoiceAmount', label: 'Invoice Amount' }, { key: 'invoiceDate', label: 'Invoice Date', type: 'date' }, { key: 'paymentFollowupDate', label: 'Payment Follow-up Date', type: 'date' }],
    PAYMENT_RECEIVED: [{ key: 'paymentAmount', label: 'Payment Amount' }, { key: 'paymentDate', label: 'Payment Date', type: 'date' }, { key: 'handoffReady', label: 'Handoff Ready (Yes/No)' }],
    CLOSED_WON: [{ key: 'confirmPaymentReceived', label: 'Confirm Payment Received (Yes/No)' }, { key: 'confirmOrderHandoff', label: 'Confirm Order Handoff Created (Yes/No)' }],
  };
  const requiredAdvanceFields = nextStage ? (requiredFieldsByStage[nextStage] ?? []) : [];

  const advanceToStage = (stage: OpportunityStage, message: string) => {
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

      {activeOpp.stage === 'CLOSED_WON' ? (
        <Card title="Order Handoff">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Closed Won → Order Created</p>
              <p className="text-xs text-slate-400">Uses organization, opportunity, lane/product, sport, value, and assigned rep.</p>
            </div>
            {linkedOrder ? <Link className="rounded-lg border border-cyan-500/50 px-3 py-2 text-sm font-bold text-cyan-200" to={`/orders/${linkedOrder.id}`}>Open linked order</Link> : <Button onClick={createOrderHandoff}>Create Order Handoff</Button>}
          </div>
        </Card>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <Card title="Next Action">
          <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
            <div className="space-y-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Next Action</p>
                <p className="text-lg font-black text-white">{activeOpp.nextAction}</p>
              </div>
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-1.5 text-slate-200"><span className="text-slate-500">Due:</span> {dueState.due}</span>
                {dueState.overdue && <span className="rounded-lg border border-rose-500/50 bg-rose-500/10 px-3 py-1.5 font-bold text-rose-200">Overdue warning</span>}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button className="min-w-44 text-sm" disabled={!canAdvance || !nextStage} onClick={openAdvanceDrawer}>{nextStage ? 'Advance Stage' : nextActionCtas[activeOpp.stage]}</Button>
              <button className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-xs font-bold text-slate-300 transition hover:bg-slate-800" onClick={() => setActionMessage('Log Activity placeholder: modal planned for a future sprint.')}>Log Activity</button>
            </div>
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
