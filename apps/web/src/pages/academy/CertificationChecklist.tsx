import { useEffect, useState } from 'react';
import { getStoredUser } from '../../auth';
import { getApiBaseUrl } from '../../services/apiBaseUrl';

interface GraduationCheck {
  passed: boolean;
  requirements: {
    orgs: { current: number; required: number; met: boolean };
    contacts: { current: number; required: number; met: boolean };
    opportunities: { current: number; required: number; met: boolean };
    activities: { current: number; required: number; met: boolean };
    oppDetails: { met: boolean };
    territoryApproved: { met: boolean };
  };
}

interface ChecklistRow {
  id: number;
  user_id: number;
  orgs_created: number;
  orgs_required: number;
  contacts_added: number;
  contacts_required: number;
  opportunities_created: number;
  opportunities_required: number;
  activities_logged: number;
  activities_required: number;
  all_opps_have_details: boolean;
  territory_approved: boolean;
  last_synced_at: string | null;
}

export default function CertificationChecklist() {
  const user = getStoredUser();
  const [check, setCheck] = useState<GraduationCheck | null>(null);
  const [checklist, setChecklist] = useState<ChecklistRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [approving, setApproving] = useState(false);

  const userId = user?.id ?? '';
  const isDirector =
    user?.role === 'DIRECTOR' || user?.role === 'REGIONAL_DIRECTOR' || user?.role === 'ADMIN';
  const isRep = user?.role === 'REP';

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const [checkRes, progressRes] = await Promise.all([
        fetch(`${getApiBaseUrl()}/academy/graduation-check?userId=${userId}`),
        fetch(`${getApiBaseUrl()}/academy/progress?userId=${userId}`),
      ]);

      if (checkRes.ok) {
        const data = await checkRes.json();
        setCheck(data);
      }

      if (progressRes.ok) {
        const data = await progressRes.json();
        setChecklist(data.checklist);
      }
    } catch (e) {
      console.error('Failed to load certification data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await fetch(`${getApiBaseUrl()}/academy/checklist/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      await loadData();
    } catch (e) {
      console.error('Sync failed:', e);
    } finally {
      setSyncing(false);
    }
  };

  const handleApprove = async () => {
    if (!user) return;
    setApproving(true);
    try {
      await fetch(`${getApiBaseUrl()}/academy/territory/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, directorId: user.id }),
      });
      await loadData();
    } catch (e) {
      console.error('Approval failed:', e);
    } finally {
      setApproving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-slate-400 animate-pulse">Loading certification data...</div>
      </div>
    );
  }

  if (!check) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center">
        <p className="text-slate-400">No certification data available. Start the Academy first.</p>
      </div>
    );
  }

  const allMet =
    check.requirements.orgs.met &&
    check.requirements.contacts.met &&
    check.requirements.opportunities.met &&
    check.requirements.activities.met &&
    check.requirements.oppDetails.met &&
    check.requirements.territoryApproved.met;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300 mb-2">
              Certification Checklist
            </p>
            <h1 className="text-3xl font-black text-white mb-2">
              {allMet ? '🎓 Ready to Graduate' : 'Building Your Pipeline'}
            </h1>
            <p className="text-slate-400">
              {allMet
                ? 'All requirements met! Your territory has been built and approved.'
                : 'Complete all requirements to earn your certification. Graduate with a pipeline, not a certificate.'}
            </p>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="rounded-lg border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 text-xs font-bold text-cyan-200 hover:bg-cyan-400/20 disabled:opacity-50 transition-colors shrink-0"
          >
            {syncing ? 'Syncing...' : 'Refresh from CRM'}
          </button>
        </div>
      </div>

      {/* Requirements Checklist */}
      <div className="rounded-2xl border border-slate-700 bg-slate-950/50 p-6 mb-6">
        <h2 className="text-lg font-black text-white mb-5">Graduation Requirements</h2>

        <div className="space-y-4">
          {/* Organizations */}
          <ChecklistItem
            icon="🏫"
            title="Organizations Created"
            description="Research and create 5 school organizations with enrollment data and sports programs"
            met={check.requirements.orgs.met}
            current={check.requirements.orgs.current}
            required={check.requirements.orgs.required}
          />

          {/* Contacts */}
          <ChecklistItem
            icon="👥"
            title="Contacts Added"
            description="Create 15-20 contacts (Principal, AD, Football Coach, Volleyball Coach, Activities Director) across your organizations"
            met={check.requirements.contacts.met}
            current={check.requirements.contacts.current}
            required={check.requirements.contacts.required}
          />

          {/* Opportunities */}
          <ChecklistItem
            icon="💰"
            title="Opportunities Created"
            description="Create 5 real opportunities with estimated values, stages, and next actions"
            met={check.requirements.opportunities.met}
            current={check.requirements.opportunities.current}
            required={check.requirements.opportunities.required}
          />

          {/* Activities */}
          <ChecklistItem
            icon="📞"
            title="Activities Logged"
            description="Log 15 outreach activities (calls, emails, visits) with dates and notes"
            met={check.requirements.activities.met}
            current={check.requirements.activities.current}
            required={check.requirements.activities.required}
          />

          {/* Opportunity Details */}
          <ChecklistItem
            icon="📋"
            title="Opportunity Completeness"
            description="Every opportunity must have an estimated value, stage, next action date, and notes"
            met={check.requirements.oppDetails.met}
          />

          {/* Territory Approved */}
          <ChecklistItem
            icon="✅"
            title="Territory Approval"
            description="Director reviews and approves your entire territory"
            met={check.requirements.territoryApproved.met}
          />
        </div>
      </div>

      {/* Director Actions */}
      {isDirector && !check.requirements.territoryApproved.met && (
        <div className="rounded-2xl border border-amber-400/20 bg-amber-950/10 p-6 mb-6">
          <h2 className="text-lg font-black text-amber-200 mb-3">Director Action Required</h2>
          <p className="text-sm text-slate-300 mb-4">
            Review this TAE's territory. Once approved, they can graduate if all other requirements are met.
          </p>
          <button
            onClick={handleApprove}
            disabled={approving || !allMet}
            className="rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-6 py-3 text-sm font-bold text-emerald-200 hover:bg-emerald-400/20 disabled:opacity-40 transition-colors"
          >
            {approving ? 'Approving...' : 'Approve Territory'}
          </button>
          {!allMet && (
            <p className="text-xs text-slate-500 mt-2">
              TAE has not yet met all graduation requirements. Review the checklist above.
            </p>
          )}
        </div>
      )}

      {/* Graduation Status */}
      <div
        className={`rounded-2xl border p-6 text-center ${
          allMet
            ? 'border-emerald-400/20 bg-emerald-950/10'
            : 'border-slate-700 bg-slate-950/50'
        }`}
      >
        {allMet ? (
          <>
            <p className="text-3xl mb-3">🎓</p>
            <h2 className="text-xl font-black text-emerald-200 mb-1">
              Level 1 Certified Territory Account Executive
            </h2>
            <p className="text-sm text-slate-400">
              You have graduated with a real pipeline — {check.requirements.orgs.current} organizations,{' '}
              {check.requirements.contacts.current} contacts, {check.requirements.opportunities.current}{' '}
              opportunities, and {check.requirements.activities.current} logged activities.
            </p>
          </>
        ) : (
          <>
            <p className="text-3xl mb-3">🔨</p>
            <h2 className="text-xl font-black text-slate-200 mb-1">
              Pipeline Under Construction
            </h2>
            <p className="text-sm text-slate-400">
              Keep building. Every organization, contact, opportunity, and activity moves you closer to
              certification.
            </p>
          </>
        )}
      </div>

      {/* Sync Info */}
      {checklist?.last_synced_at && (
        <p className="text-xs text-slate-600 mt-4 text-center">
          Last synced: {new Date(checklist.last_synced_at).toLocaleString()}
        </p>
      )}

      {/* Philosophy */}
      <div className="mt-8 rounded-2xl border border-cyan-400/20 bg-gradient-to-r from-cyan-950/30 to-slate-950/30 p-6 text-center">
        <p className="text-sm font-black text-cyan-200 mb-1">
          "Graduate with a pipeline, not a certificate."
        </p>
        <p className="text-xs text-slate-400">
          Certification proves you can operate TUF Ops — not just answer questions about it.
        </p>
      </div>
    </div>
  );
}

// ─── Sub-component ─────────────────────────────────────────────────

function ChecklistItem({
  icon,
  title,
  description,
  met,
  current,
  required,
}: {
  icon: string;
  title: string;
  description: string;
  met: boolean;
  current?: number;
  required?: number;
}) {
  return (
    <div
      className={`rounded-xl border p-4 flex items-start gap-4 ${
        met ? 'border-emerald-400/20 bg-emerald-400/5' : 'border-slate-700 bg-slate-900/40'
      }`}
    >
      <span className="text-2xl shrink-0 mt-0.5">{icon}</span>
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-1">
          <h3 className={`text-sm font-black ${met ? 'text-emerald-200' : 'text-white'}`}>{title}</h3>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-bold ${
              met
                ? 'bg-emerald-400/20 text-emerald-300'
                : 'bg-slate-800 text-slate-500'
            }`}
          >
            {met ? '✓ Met' : 'In Progress'}
          </span>
        </div>
        <p className="text-xs text-slate-400 mb-2">{description}</p>
        {current !== undefined && required !== undefined && (
          <div className="flex items-center gap-2">
            <div className="flex-1 max-w-[200px] h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  met ? 'bg-emerald-400' : 'bg-cyan-500'
                }`}
                style={{ width: `${Math.min(100, Math.round((current / required) * 100))}%` }}
              />
            </div>
            <span className={`text-xs font-bold ${met ? 'text-emerald-400' : 'text-slate-400'}`}>
              {current} / {required}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
