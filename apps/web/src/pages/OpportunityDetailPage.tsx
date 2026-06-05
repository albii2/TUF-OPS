import { Link, useParams } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { Button, Card, EmptyState, StageBadge } from '../components/primitives';
import { formatCurrency } from '../utils/format';
import { useOpportunityById, useOpportunityStages } from '../hooks/useOpportunities';
import { useOrganizationById } from '../hooks/useOrganizations';
import { useActivities } from '../hooks/useReports';
import { submitCreativeRequest, useCreativeRequests } from '../hooks/useCreativeRequests';
import { neededItemOptions, type CreativePriority, type CreativeRequestType, type DesignTeam } from '../services/creativeRequestsService';
import { updateOpportunityStage } from '../services/opportunitiesService';
import type { Opportunity, OpportunityStage } from '../data/mockSalesData';
import { daysSince } from '../services/kpiUtils';
import { canAdvanceOpportunity, getAdvanceDeniedMessage } from '../services/roleScope';
import { notify } from '../services/feedbackService';

const stageCtas = {
  LEAD_ASSIGNED: 'Contact coach',
  CONTACTED: 'Log discovery',
  DISCOVERY: 'Request mockup',
  MOCKUP_REQUESTED: 'Mark mockup delivered',
  MOCKUP_DELIVERED: 'Send invoice',
  INVOICE_SENT: 'Follow up payment',
  DECISION_PENDING: 'Confirm payment received',
  PAYMENT_RECEIVED: 'Mark ready to close won',
  CLOSED_WON: 'View order',
  CLOSED_LOST: 'Review loss reason',
} as const;

const stageFlow = ['LEAD_ASSIGNED','CONTACTED','DISCOVERY','MOCKUP_REQUESTED','MOCKUP_DELIVERED','INVOICE_SENT','DECISION_PENDING','PAYMENT_RECEIVED','CLOSED_WON'] as const;

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
  
  const summary = useMemo(() => ({ 
    total: creativeRequests.length, 
    active: creativeRequests.filter((r) => !['DELIVERED','ARCHIVED'].includes(r.status)).length, 
    delivered: creativeRequests.filter((r) => r.status === 'DELIVERED').length, 
    highUrgent: creativeRequests.filter((r) => ['HIGH','URGENT'].includes(r.priority)).length 
  }), [creativeRequests, refreshTick]);

  if (!activeOpp) return <EmptyState title="Opportunity not found" description="Select another opportunity from the pipeline table." />;

  const currentStageIndex = stageFlow.indexOf(activeOpp.stage as any);
  const nextStage = currentStageIndex >= 0 && currentStageIndex < stageFlow.length - 1 ? stageFlow[currentStageIndex + 1] : null;
  const staleDays = daysSince(activeOpp.lastActivity);
  const followupTone = staleDays >= 7 ? 'AT RISK' : staleDays >= 3 ? 'NEEDS FOLLOW-UP' : 'ON TRACK';
  const canAdvance = canAdvanceOpportunity(activeOpp);

  const requiredFieldsByStage: Partial<Record<OpportunityStage, { key: string; label: string; type?: 'date' | 'text' }[]>> = {
    CONTACTED: [{ key: 'contactMethod', label: 'Contact Method' }, { key: 'outcome', label: 'Outcome' }, { key: 'nextFollowupDate', label: 'Next Follow-up Date', type: 'date' }],
    MOCKUP_REQUESTED: [{ key: 'sport', label: 'Sport' }, { key: 'lane', label: 'Lane' }, { key: 'designNotes', label: 'Design Notes' }, { key: 'neededItems', label: 'Needed Items' }, { key: 'urgency', label: 'Urgency / Due Date' }],
    MOCKUP_DELIVERED: [{ key: 'assetLink', label: 'Asset / Link' }, { key: 'deliveryDate', label: 'Delivery Date', type: 'date' }, { key: 'nextFollowupDate', label: 'Next Follow-up Date', type: 'date' }],
    INVOICE_SENT: [{ key: 'invoiceAmount', label: 'Invoice Amount' }, { key: 'invoiceDate', label: 'Invoice Date', type: 'date' }, { key: 'paymentFollowupDate', label: 'Payment Follow-up Date', type: 'date' }],
    PAYMENT_RECEIVED: [{ key: 'paymentAmount', label: 'Payment Amount' }, { key: 'paymentDate', label: 'Payment Date', type: 'date' }, { key: 'handoffReady', label: 'Handoff Ready (Yes/No)' }],
    CLOSED_WON: [{ key: 'confirmPaymentReceived', label: 'Confirm Payment Received (Yes/No)' }, { key: 'confirmOrderHandoff', label: 'Confirm Order Handoff Created (Yes/No)' }],
  };
  const requiredAdvanceFields = nextStage ? (requiredFieldsByStage[nextStage] ?? []) : [];

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

  return (
    <div className="space-y-3">
      <Card title="Deal Command Center">
        <div className="grid gap-2 lg:grid-cols-2">
          <div className="space-y-1">
            <p className="text-lg font-semibold">{activeOpp.title}</p>
            <Link to={`/organizations/${activeOpp.organizationId}`} className="text-sm text-cyan-300 hover:underline">{activeOpp.organizationName}</Link>
            <div className="mt-1 flex gap-2">
              <a href={`tel:5550123`} className="rounded bg-slate-800 px-2 py-1 text-[10px] font-bold text-emerald-400 hover:bg-slate-700 transition">CALL COACH</a>
              <a href={`mailto:coach@school.edu`} className="rounded bg-slate-800 px-2 py-1 text-[10px] font-bold text-sky-400 hover:bg-slate-700 transition">EMAIL COACH</a>
            </div>
          </div>
          <div className="text-left lg:text-right">
            <p className="text-xl font-semibold text-cyan-300">{formatCurrency(activeOpp.value)}</p>
            <p className="text-xs text-slate-400">Assigned Rep: {activeOpp.assignedRep}</p>
            <div className="mt-1 flex flex-wrap gap-2 lg:justify-end">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest">{activeOpp.lane} · {activeOpp.sport}</span>
              <span className={`text-[10px] font-bold uppercase ${followupTone === 'AT RISK' ? 'text-rose-400' : 'text-emerald-400'}`}>{followupTone}</span>
            </div>
          </div>
        </div>
      </Card>

      <Card title="Close Path Progress">
        <div className="flex flex-wrap gap-2">
          {opportunityStages.map((stage) => {
            const stageIndex = stageFlow.indexOf(stage as any);
            const done = stageIndex >= 0 && stageIndex < currentStageIndex;
            const isCurrent = stage === activeOpp.stage;
            return (
              <div key={stage} className={`rounded-md border px-3 py-2 transition-all ${isCurrent ? 'border-cyan-400 bg-cyan-500/15 scale-105 z-10' : done ? 'border-emerald-500/40 bg-emerald-500/10 opacity-70' : 'border-slate-800 bg-slate-950/40 opacity-50'}`}>
                <StageBadge stage={stage} />
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid gap-3 lg:grid-cols-3">
        <Card title="Next Action" className="lg:col-span-2">
          <div className="flex items-start gap-3">
            <div className="mt-1 rounded-full bg-cyan-400 p-1.5 shadow-[0_0_12px_rgba(34,211,238,0.4)]" />
            <div>
              <p className="text-base font-bold text-white leading-tight">{activeOpp.nextAction}</p>
              {staleDays >= 7 && <p className='mt-1 text-xs font-bold text-rose-400 uppercase tracking-tighter'>Action overdue by {staleDays} days</p>}
            </div>
          </div>
          {actionMessage && <p className="mt-3 rounded border border-cyan-500/20 bg-cyan-500/5 p-2 text-xs text-cyan-200">{actionMessage}</p>}
        </Card>
        <Card title="Quick Execution">
          {canAdvance ? (
            <div className='space-y-2'>
              <Button className="w-full text-xs py-2" onClick={() => setActionMessage(`${stageCtas[activeOpp.stage]} logged.`)}>
                {stageCtas[activeOpp.stage].toUpperCase()}
              </Button>
              {nextStage && (
                <button 
                  className='w-full rounded-lg border border-slate-700 bg-slate-800/40 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800 transition' 
                  onClick={() => setShowAdvanceDrawer(true)}
                >
                  ADVANCE TO {nextStage.replace(/_/g,' ')}
                </button>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic text-center py-2">{getAdvanceDeniedMessage(activeOpp)}</p>
          )}
        </Card>
      </div>

      {showAdvanceDrawer && nextStage && canAdvance && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm">
          <div className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto border-l border-slate-700 bg-[#08111a] p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xl font-bold text-white uppercase tracking-tight">Advance to {nextStage.replace(/_/g, ' ')}</p>
                <p className="text-xs text-slate-400 mt-1">Capture required fields to maintain data integrity.</p>
              </div>
              <button className="text-slate-500 hover:text-white transition" onClick={() => setShowAdvanceDrawer(false)}>✕</button>
            </div>
            
            <div className="space-y-4">
              {requiredAdvanceFields.length > 0 ? requiredAdvanceFields.map((field) => (
                <div key={field.key}>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">{field.label}</label>
                  <input 
                    type={field.type ?? 'text'} 
                    value={advanceForm[field.key] ?? ''} 
                    onChange={(e) => setAdvanceForm((prev) => ({ ...prev, [field.key]: e.target.value }))} 
                    className="w-full rounded-md border border-slate-800 bg-slate-900/50 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500" 
                  />
                </div>
              )) : (
                <p className="text-sm text-slate-300 italic">No additional fields required for this stage transition.</p>
              )}
            </div>

            <div className="mt-8 flex flex-col gap-3">
              <Button className="w-full py-3" onClick={() => {
                const missing = requiredAdvanceFields.filter((field) => !(advanceForm[field.key] ?? '').trim());
                if (missing.length) {
                  notify(`Missing required fields: ${missing.map((m) => m.label).join(', ')}`, 'error');
                  return;
                }
                setStage(nextStage, `Advanced to ${nextStage.replace(/_/g, ' ')}.`);
                setShowAdvanceDrawer(false);
                setAdvanceForm({});
              }}>CONFIRM ADVANCEMENT</Button>
              <button 
                className="w-full rounded-md border border-slate-800 bg-slate-900/30 py-2.5 text-sm font-bold text-slate-400 hover:bg-slate-800 transition" 
                onClick={() => setShowAdvanceDrawer(false)}
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-3 lg:grid-cols-3">
        <Card title="Decision Timeline" className="lg:col-span-2">
          <div className="space-y-2">
            {dealActivity.length ? dealActivity.map((entry) => (
              <div key={entry.id} className="border-l-2 border-slate-800 pl-4 py-1">
                <p className="text-sm text-slate-200 leading-snug">{entry.message}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">{entry.timestamp} · {entry.user}</p>
              </div>
            )) : <p className="text-xs text-slate-500 italic">No activity logs yet.</p>}
          </div>
        </Card>
        <Card title="Files / Assets">
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 uppercase font-medium">Requests</span>
              <span className="font-bold text-white">{summary.total}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 uppercase font-medium">Delivered</span>
              <span className="font-bold text-emerald-400">{summary.delivered}</span>
            </div>
            <Button className="w-full text-[10px] h-8 py-0" onClick={() => { setShowForm((v) => !v); setError(''); setSuccess(''); }}>
              {showForm ? 'CANCEL' : 'NEW REQUEST'}
            </Button>
          </div>
        </Card>
      </div>

      <Card title="Outcome Controls">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="flex-1">
            <p className="text-sm text-slate-300">Invoice status follows the current stage. Payment follow-up is active when the deal is INVOICE SENT or DECISION PENDING.</p>
          </div>
          <div className="shrink-0 flex gap-2">
            {canAdvance ? (
              <>
                <Button className="text-xs px-4" onClick={() => setStage('CLOSED_WON', 'Marked Closed Won. Review Orders for handoff coverage.')}>Mark Won</Button>
                <Button className="text-xs px-4 border-slate-600 bg-slate-800/60 text-slate-200" onClick={() => setStage('CLOSED_LOST', 'Marked Closed Lost. Capture loss reason during follow-up review.')}>Mark Lost</Button>
              </>
            ) : (
              <p className="text-sm text-slate-400 italic">Outcome changes are read-only for your current role.</p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
