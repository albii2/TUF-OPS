/**
 * Executive Command Center — Meridian OS v1.0
 * 
 * The unified command view for leadership. Combines:
 * — Lighthouse (what requires attention — scored & classified)
 * — Intake (executive decisions — owned & tracked)
 * — Forge (execution — recommendations & pipeline gaps)
 * — Pulse (health scores — territory, people, revenue)
 */

import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getStoredUser } from '../auth';
import { apiClient } from '../services/apiClient';
import { useOrganizations } from '../hooks/useOrganizations';
import { useOpportunities } from '../hooks/useOpportunities';
import { useOrders } from '../hooks/useOrders';
import { formatCurrency } from '../utils/format';

// ── Types ──

interface LighthouseView {
  items: IntakeItemEnhanced[];
  byClassification: Record<string, number>;
  highAttention: IntakeItemEnhanced[];
  overdue: IntakeItemEnhanced[];
}

interface IntakeItemEnhanced {
  id: number;
  title: string;
  description: string;
  source: string;
  priority: string;
  status: string;
  owner: string;
  classification_type: string | null;
  attention_score: number;
  due_date: string | null;
  related_person_id: number | null;
  related_organization_id: number | null;
  tags: string[];
  created_at: string;
}

interface TerritoryHealth {
  label: string;
  coverage: number;
  pipeline: string;
  recruiting: string;
  revenue: string;
  attention: string;
}

interface PulseScore {
  label: string;
  score: number;
  detail: string;
  trend: 'up' | 'down' | 'steady';
}

// ── Helpers ──

const CLASSIFICATION_LABELS: Record<string, string> = {
  recruiting_application: '📋 New Applicant',
  recruiting_offer_accepted: '✅ Offer Accepted',
  rep_inactive: '⚠️ Rep Inactive',
  coach_reply: '💬 Coach Reply',
  order_paid: '💰 Order Paid',
  mockup_requested: '🎨 Mockup Requested',
  vendor_delayed: '🚚 Vendor Delayed',
  email_received: '📧 Email Received',
  meeting_completed: '🤝 Meeting Done',
  territory_assigned: '🗺️ Territory Assigned',
  executive_decision: '🔴 Exec Decision',
  hr_onboarding: '👥 Onboarding',
  academy_certification: '🎓 Certification',
  revenue_blocker: '🛑 Revenue Blocker',
  pipeline_update: '📊 Pipeline Update',
  other: '📌 Other',
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'bg-red-500/20 border-red-500 text-red-200',
  high: 'bg-orange-500/20 border-orange-500 text-orange-200',
  medium: 'bg-yellow-500/20 border-yellow-500 text-yellow-200',
  low: 'bg-slate-500/20 border-slate-500 text-slate-300',
};

const ATTENTION_COLORS = (score: number): string => {
  if (score >= 80) return 'text-red-300';
  if (score >= 50) return 'text-orange-300';
  if (score >= 30) return 'text-yellow-300';
  return 'text-slate-400';
};

// ── Component ──

export default function ExecutiveCommandCenter() {
  const user = getStoredUser();
  const [lighthouse, setLighthouse] = useState<LighthouseView | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshAt, setRefreshAt] = useState(Date.now());

  const { data: orgs = [] } = useOrganizations({ refreshKey: refreshAt });
  const { data: opps = [] } = useOpportunities({ refreshKey: refreshAt });
  const { data: orders = [] } = useOrders({ refreshKey: refreshAt });

  useEffect(() => {
    apiClient('/intake/lighthouse?recalculate=1')
      .then((d: any) => { setLighthouse(d as LighthouseView); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [refreshAt]);

  // ── Pulse: Territory Health ──
  const territoryHealth: TerritoryHealth = useMemo(() => {
    const totalOrgs = orgs.length;
    const contactedOrgs = orgs.filter(o => o.coverageStatus !== 'UNTOUCHED').length;
    const coverage = totalOrgs > 0 ? Math.round((contactedOrgs / totalOrgs) * 100) : 0;
    const activeOpps = opps.filter(o => o.stage !== 'CLOSED_WON' && o.stage !== 'CLOSED_LOST');
    const pipelineValue = activeOpps.reduce((s, o) => s + o.value, 0);
    const wonValue = opps.filter(o => o.stage === 'CLOSED_WON').reduce((s, o) => s + o.value, 0);

    let pipelineLabel: string;
    if (pipelineValue > 100000) pipelineLabel = 'Strong';
    else if (pipelineValue > 50000) pipelineLabel = 'Healthy';
    else if (pipelineValue > 20000) pipelineLabel = 'Building';
    else pipelineLabel = 'Early';

    let attentionLabel: string;
    if (coverage < 20) attentionLabel = 'Critical';
    else if (coverage < 50) attentionLabel = 'High';
    else if (coverage < 75) attentionLabel = 'Moderate';
    else attentionLabel = 'Low';

    return {
      label: user?.territory || 'Territory',
      coverage,
      pipeline: formatCurrency(pipelineValue),
      recruiting: 'N/A',
      revenue: formatCurrency(wonValue),
      attention: attentionLabel,
    };
  }, [orgs, opps, user]);

  // ── Pulse: Organization Scores ──
  const pulseScores: PulseScore[] = useMemo(() => {
    const openCount = (lighthouse?.items || []).filter(i => i.status === 'open').length;
    const highAttnCount = (lighthouse?.highAttention || []).length;
    const openOpps = opps.filter(o => o.stage !== 'CLOSED_WON' && o.stage !== 'CLOSED_LOST').length;
    const nearClose = opps.filter(o => ['MOCKUP_DELIVERED', 'INVOICE_SENT', 'DECISION_PENDING'].includes(o.stage)).length;
    const activeOrders = orders.filter(o => o.productionStatus === 'IN_PRODUCTION').length;

    const orgScore = Math.min(100, Math.round((orgs.filter(o => o.coverageStatus !== 'UNTOUCHED').length / Math.max(1, orgs.length)) * 100));
    const pipelineScore = Math.min(100, openOpps * 10);
    const execScore = Math.max(0, 100 - highAttnCount * 10);
    const opsScore = Math.min(100, (activeOrders + nearClose) * 15);

    return [
      { label: 'Coverage', score: orgScore, detail: `${orgs.filter(o => o.coverageStatus !== 'UNTOUCHED').length}/${orgs.length} contacted`, trend: orgScore > 50 ? 'up' : 'down' },
      { label: 'Pipeline', score: pipelineScore, detail: `${openOpps} open opportunities`, trend: openOpps > 5 ? 'up' : 'down' },
      { label: 'Executive', score: execScore, detail: `${highAttnCount} high-attention items`, trend: highAttnCount === 0 ? 'up' : 'down' },
      { label: 'Operations', score: opsScore, detail: `${activeOrders} in production`, trend: 'steady' },
    ];
  }, [lighthouse, orgs, opps, orders]);

  // ── Guard ──
  if (!user || (user.role !== 'ADMIN' && user.role !== 'DIRECTOR' && user.role !== 'REGIONAL_DIRECTOR')) {
    return <div className="p-6"><p className="text-slate-400">Leadership access only.</p></div>;
  }

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Executive Command Center</h1>
          <p className="text-sm text-slate-400">Meridian OS — Lighthouse · Forge · Pulse</p>
        </div>
        <button
          onClick={() => { setLoading(true); setRefreshAt(Date.now()); }}
          className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm text-slate-300 hover:bg-slate-700"
        >
          🔄 Refresh
        </button>
      </div>

      {/* ══ PULSE — Health Scores ══ */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
        <h2 className="font-semibold text-white mb-3">📡 Pulse — Organizational Health</h2>
        <div className="grid grid-cols-4 gap-3">
          {pulseScores.map(p => (
            <div key={p.label} className="bg-slate-800 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1">
                <p className={`text-2xl font-bold ${p.score >= 70 ? 'text-emerald-300' : p.score >= 40 ? 'text-yellow-300' : 'text-red-300'}`}>{p.score}</p>
                <span className="text-xs">{p.trend === 'up' ? '📈' : p.trend === 'down' ? '📉' : '➡️'}</span>
              </div>
              <p className="text-sm font-semibold text-slate-200">{p.label}</p>
              <p className="text-[10px] text-slate-400">{p.detail}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* ══ LIGHTHOUSE — High Attention ══ */}
        <div className="col-span-2 space-y-4">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
            <h2 className="font-semibold text-white mb-3">
              🔦 Lighthouse — What Requires Attention
              {lighthouse && <span className="text-sm text-slate-500 ml-2">({lighthouse.highAttention.length} high-priority)</span>}
            </h2>
            {loading ? (
              <p className="text-slate-500 text-sm">Scanning...</p>
            ) : lighthouse ? (
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {lighthouse.highAttention.length === 0 ? (
                  <p className="text-emerald-400 text-sm">✓ No high-attention items — all clear.</p>
                ) : (
                  lighthouse.highAttention.slice(0, 10).map(item => (
                    <div key={item.id} className="flex items-center justify-between py-1.5 border-b border-slate-800 text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`text-xs font-bold w-8 text-center ${ATTENTION_COLORS(item.attention_score)}`}>
                          {item.attention_score}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded border bg-slate-800 text-slate-400 whitespace-nowrap">
                          {CLASSIFICATION_LABELS[item.classification_type || 'other'] || item.classification_type}
                        </span>
                        <span className="text-white truncate">{item.title}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {item.owner && <span className="text-xs text-slate-500">{item.owner}</span>}
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${PRIORITY_COLORS[item.priority] || PRIORITY_COLORS.medium}`}>
                          {item.priority}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">Failed to load lighthouse data.</p>
            )}
          </div>

          {/* ══ FORGE — Pipeline & Execution ══ */}
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
            <h2 className="font-semibold text-white mb-3">⚒️ Forge — Execution</h2>
            <div className="grid grid-cols-3 gap-3">
              <ForgeStat label="Active Pipeline" value={String(opps.filter(o => o.stage !== 'CLOSED_WON' && o.stage !== 'CLOSED_LOST').length)} detail={`${formatCurrency(opps.filter(o => o.stage !== 'CLOSED_WON' && o.stage !== 'CLOSED_LOST').reduce((s, o) => s + o.value, 0))} value`} color="text-cyan-300" />
              <ForgeStat label="Near Close" value={String(opps.filter(o => ['MOCKUP_DELIVERED', 'INVOICE_SENT', 'DECISION_PENDING'].includes(o.stage)).length)} detail="Close these now" color="text-emerald-300" />
              <ForgeStat label="Orders In Production" value={String(orders.filter(o => o.productionStatus === 'IN_PRODUCTION').length)} detail="Active fulfillment" color="text-blue-300" />
            </div>
            <div className="mt-3 flex gap-2">
              <Link to="/organizations" className="text-xs text-cyan-400 hover:text-cyan-300">View Accounts →</Link>
              <Link to="/opportunities" className="text-xs text-cyan-400 hover:text-cyan-300">View Pipeline →</Link>
              <Link to="/orders" className="text-xs text-cyan-400 hover:text-cyan-300">View Orders →</Link>
            </div>
          </div>

          {/* ══ STATUS CHECK — Response Tracking (01 Issue Fix) ══ */}
          <StatusCheckPanel />
        </div>

        {/* ══ RIGHT COLUMN — Territory + Classification ══ */}
        <div className="space-y-4">
          {/* Territory Health */}
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
            <h2 className="font-semibold text-white mb-3">🗺️ Territory Health</h2>
            <div className="space-y-2 text-sm">
              <HealthRow label="Coverage" value={`${territoryHealth.coverage}%`} color={territoryHealth.coverage >= 70 ? 'text-emerald-300' : territoryHealth.coverage >= 40 ? 'text-yellow-300' : 'text-red-300'} />
              <HealthRow label="Pipeline" value={territoryHealth.pipeline} color="text-cyan-300" />
              <HealthRow label="Revenue" value={territoryHealth.revenue} color="text-emerald-300" />
              <HealthRow label="Attention" value={territoryHealth.attention} color={territoryHealth.attention === 'Low' ? 'text-emerald-300' : territoryHealth.attention === 'Critical' ? 'text-red-300' : 'text-yellow-300'} />
            </div>
          </div>

          {/* Classification Breakdown */}
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
            <h2 className="font-semibold text-white mb-3">📊 Intake by Type</h2>
            {lighthouse && Object.keys(lighthouse.byClassification).length > 0 ? (
              <div className="space-y-1 text-xs">
                {Object.entries(lighthouse.byClassification)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 8)
                  .map(([type, count]) => (
                    <div key={type} className="flex justify-between py-0.5 border-b border-slate-800">
                      <span className="text-slate-400">{CLASSIFICATION_LABELS[type] || type}</span>
                      <span className="text-slate-200 font-semibold">{count}</span>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">No intake items yet.</p>
            )}
            <Link to="/intake" className="block mt-2 text-xs text-cyan-400 hover:text-cyan-300">Open Intake →</Link>
          </div>

          {/* Overdue */}
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
            <h2 className="font-semibold text-white mb-3">⏰ Overdue Items</h2>
            {lighthouse && lighthouse.overdue.length > 0 ? (
              <div className="space-y-1">
                {lighthouse.overdue.slice(0, 5).map(item => (
                  <div key={item.id} className="text-xs py-1 border-b border-slate-800 text-yellow-300 truncate">
                    {item.title}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No overdue items.</p>
            )}
            <button
              onClick={() => { setLoading(true); setRefreshAt(Date.now()); }}
              className="mt-2 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-400 hover:bg-slate-700"
            >
              Recalculate Scores
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──

function ForgeStat({ label, value, detail, color }: { label: string; value: string; detail: string; color: string }) {
  return (
    <div className="bg-slate-800 rounded-lg p-3 text-center">
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-slate-300">{label}</p>
      <p className="text-[10px] text-slate-500">{detail}</p>
    </div>
  );
}

function HealthRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex justify-between py-1 border-b border-slate-800">
      <span className="text-slate-400">{label}</span>
      <span className={`font-semibold ${color}`}>{value}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Status Check Panel — 01 Issue Fix
   Tracks leadership check-in responses.
   Non-respondents surface here with escalation.
   ═══════════════════════════════════════════ */

function StatusCheckPanel() {
  const [summary, setSummary] = useState<{
    total: number;
    responded: number;
    pending: Array<{ id: number; title: string; owner: string; attention_score: number; due_date: string | null; created_at: string }>;
  } | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: 'Leadership Status Check', description: 'Please reply with territory status, priorities, progress, support needs, and availability confirmation.', due_date: new Date(Date.now() + 86400000).toISOString().slice(0, 16) });
  const user = getStoredUser();

  const fetchSummary = async () => {
    try {
      const d = await apiClient('/intake/status-check') as any;
      setSummary(d);
    } catch { /* offline */ }
  };

  useEffect(() => { fetchSummary(); }, []);

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    try {
      // Use known directors from the user list
      const recipients = [
        { name: 'Primeau Hill', territory: 'MN' },
        { name: 'William Denzer', territory: 'WI,MN' },
        { name: 'Brandon Myers', territory: 'IL' },
      ];
      await apiClient('/intake/status-check', {
        method: 'POST',
        body: { ...form, recipients },
      });
      setShowCreate(false);
      fetchSummary();
    } catch (e) { console.error(e); }
  };

  const pendingCount = summary?.pending?.length ?? 0;
  const respondPercent = summary && summary.total > 0 ? Math.round((summary.responded / summary.total) * 100) : 0;

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-white">📋 Leadership Status Checks</h2>
        {user?.role === 'ADMIN' && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="px-2 py-1 bg-cyan-600 text-white rounded text-xs hover:bg-cyan-500"
          >
            + New Check
          </button>
        )}
      </div>

      {showCreate && (
        <div className="mb-3 bg-slate-800 border border-slate-700 rounded p-3 space-y-2">
          <input
            placeholder="Check-in title"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            className="w-full bg-slate-700 border border-slate-600 rounded p-1.5 text-sm text-white"
          />
          <textarea
            placeholder="What info is needed?"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            className="w-full bg-slate-700 border border-slate-600 rounded p-1.5 text-sm text-white"
            rows={2}
          />
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Due:</span>
            <input
              type="datetime-local"
              value={form.due_date}
              onChange={e => setForm({ ...form, due_date: e.target.value })}
              className="bg-slate-700 border border-slate-600 rounded p-1 text-xs text-white"
            />
            <button onClick={handleCreate} className="px-3 py-1 bg-emerald-600 text-white rounded text-xs">Send to 3 Directors</button>
            <button onClick={() => setShowCreate(false)} className="px-3 py-1 bg-slate-600 text-slate-300 rounded text-xs">Cancel</button>
          </div>
          <p className="text-[10px] text-slate-500">Creates tracked items for Primeau, William, Brandon. Each must respond before deadline.</p>
        </div>
      )}

      {summary ? (
        <>
          <div className="flex items-center gap-4 mb-2">
            <div className="text-center">
              <p className={`text-lg font-bold ${pendingCount === 0 ? 'text-emerald-300' : pendingCount > 1 ? 'text-red-300' : 'text-yellow-300'}`}>
                {pendingCount}
              </p>
              <p className="text-[10px] text-slate-400">Pending</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-emerald-300">{summary.responded}</p>
              <p className="text-[10px] text-slate-400">Responded</p>
            </div>
            <div className="flex-1">
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${respondPercent}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">{respondPercent}% response rate</p>
            </div>
          </div>

          {summary.pending.length > 0 && (
            <div className="space-y-1 mt-2">
              <p className="text-xs text-red-300 font-semibold mb-1">⚠️ Awaiting Response:</p>
              {summary.pending.map(item => {
                const isOverdue = item.due_date && new Date(item.due_date) < new Date();
                const daysSince = Math.floor((Date.now() - new Date(item.created_at).getTime()) / 86400000);
                return (
                  <div key={item.id} className={`flex items-center justify-between text-xs py-1 border-b ${isOverdue ? 'border-red-500/30 bg-red-500/5' : 'border-slate-800'}`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`font-bold ${isOverdue ? 'text-red-300' : 'text-yellow-300'}`}>
                        {item.attention_score}
                      </span>
                      <span className="text-white truncate">{item.owner || 'Unknown'}</span>
                      {isOverdue && <span className="text-[10px] text-red-400">OVERDUE</span>}
                      {!isOverdue && daysSince >= 1 && <span className="text-[10px] text-slate-500">{daysSince}d ago</span>}
                    </div>
                    <button
                      onClick={async () => {
                        await apiClient(`/intake/${item.id}`, { method: 'PUT', body: { status: 'closed' } });
                        fetchSummary();
                      }}
                      className="px-2 py-0.5 bg-slate-700 border border-slate-600 rounded text-[10px] text-slate-300 hover:bg-slate-600"
                    >
                      Mark Responded
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {pendingCount === 0 && summary.total > 0 && (
            <p className="text-emerald-400 text-xs mt-2">✓ All directors have responded.</p>
          )}
          {summary.total === 0 && (
            <p className="text-slate-500 text-xs">No status checks yet. HR can create one above.</p>
          )}
        </>
      ) : (
        <p className="text-slate-500 text-xs">Loading status checks...</p>
      )}
    </div>
  );
}
