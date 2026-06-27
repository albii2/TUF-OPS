import { useEffect, useState, useMemo } from 'react';
import { getStoredUser } from '../auth';
import { Button, Card, Input, Select } from '../components/primitives';
import type { Role } from '../types';
import { useToast } from '../components/toast';
import {
  type RepStats,
  loadQualifications,
  getQualificationProgress,
  checkAndAwardQualifications,
} from '../lib/achievements';
import { BadgeLocker } from '../components/BadgeLocker';
import { listOrganizations } from '../services/organizationsService';
import {
  listOpportunities,
} from '../services/opportunitiesService';

const PREF_KEY = 'tuf_ops_settings_v2';

type UserPrefs = {
  accent: 'blue' | 'teal';
  compactMode: boolean;
  notifications: boolean;
  defaultView: 'dashboard' | 'organizations' | 'opportunities' | 'orders';
  favoriteLeagues: string[];
};

const defaultPrefs: UserPrefs = {
  accent: 'blue',
  compactMode: true,
  notifications: true,
  defaultView: 'dashboard',
  favoriteLeagues: ['NBA', 'NFL', 'MLB', 'NHL'],
};

const ALL_LEAGUES = [
  { value: 'NBA', label: '🏀 NBA' },
  { value: 'NFL', label: '🏈 NFL' },
  { value: 'MLB', label: '⚾ MLB' },
  { value: 'NHL', label: '🏒 NHL' },
  { value: 'CFB', label: '🏈 NCAA Football' },
  { value: 'MLS', label: '⚽ MLS' },
  { value: 'WNBA', label: '🏀 WNBA' },
  { value: 'NCAAM', label: '🏀 NCAA Men\'s Basketball' },
];

export function SettingsPage() {
  const user = useMemo(() => getStoredUser(), []);
  const [role, setRole] = useState<Role>(user?.role ?? 'ADMIN');
  const [prefs, setPrefs] = useState<UserPrefs>(defaultPrefs);
  const [saved, setSaved] = useState('');
  const { success, error } = useToast();

  // ── Load preferences ─────────────────────────────────────────────────────
  useEffect(() => {
    const raw = localStorage.getItem(PREF_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setPrefs({ ...defaultPrefs, ...parsed });
      } catch {
        setPrefs(defaultPrefs);
      }
    }
  }, []);

  // ── Build RepStats from real data ─────────────────────────────────────────
  const [stats, setStats] = useState<RepStats>({
    quizModulesPassed: 0,
    isLevel1Certified: false,
    isLevel2Certified: false,
    isDirector: false,
    prospectingActivities: 0,
    activeOpportunities: 0,
    followUpActivities: 0,
    ordersThisMonth: 0,
    consecutiveMonthsWithOrders: 0,
    totalClosedAmount: 0,
    ordersClosed: 0,
    organizationsCreated: 0,
    territoryCoveragePercent: 0,
    territoryPenetrationPercent: 0,
    organizationsWithThreeSports: 0,
    uniformsDealClosed: false,
    travelGearDealClosed: false,
    teamStoreDealClosed: false,
    lettermanDealClosed: false,
    dealsAssisted: 0,
    repsCertified: 0,
    territoryGrowthPercent: 0,
    pipelineHealthPercent: 0,
    territoriesProfitable: 0,
  });

  useEffect(() => {
    async function computeStats() {
      try {
        const [orgs, opps] = await Promise.all([
          listOrganizations({}),
          listOpportunities({}),
        ]);

        const orgCount = orgs.length;
        const activeOpps = opps.filter(
          (o) => o.stage !== 'CLOSED_WON' && o.stage !== 'CLOSED_LOST'
        ).length;

        // Count deals closed this month
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1).toISOString();

        const oppsThisMonth = opps.filter(
          (o) => o.stage === 'CLOSED_WON' && (o as any).closedAt && (o as any).closedAt >= monthStart
        );
        const oppsThisQuarter = opps.filter(
          (o) => o.stage === 'CLOSED_WON' && (o as any).closedAt && (o as any).closedAt >= quarterStart
        );

        const dealsThisMonth = oppsThisMonth.length;
        const dealsThisQuarter = oppsThisQuarter.length;

        // Lane penetration
        const wonOpps = opps.filter((o) => o.stage === 'CLOSED_WON');
        const uniformsDealClosed = wonOpps.some((o) => o.lane === 'UNIFORM');
        const travelGearDealClosed = wonOpps.some((o) => o.lane === 'TRAVEL_GEAR');
        const teamStoreDealClosed = wonOpps.some((o) => o.lane === 'TEAM_STORE');
        const lettermanDealClosed = wonOpps.some((o) => o.lane === 'LETTERMAN');

        // Academy quiz progress from localStorage
        let quizModulesPassed = 0;
        try {
          const academyRaw = localStorage.getItem('tuf_ops_academy_v1');
          if (academyRaw) {
            const academy = JSON.parse(academyRaw);
            if (academy?.quizResults) {
              quizModulesPassed = Object.values(academy.quizResults).filter(
                (r: any) => r?.passed === true
              ).length;
            }
          }
        } catch { /* ignore */ }

        const newStats: RepStats = {
          quizModulesPassed,
          isLevel1Certified: user?.isCertified ?? false,
          isLevel2Certified: false,
          isDirector: user?.role === 'DIRECTOR' || user?.role === 'REGIONAL_DIRECTOR' || user?.role === 'ADMIN',
          prospectingActivities: 0,
          activeOpportunities: activeOpps,
          followUpActivities: 0,
          ordersThisMonth: dealsThisMonth,
          consecutiveMonthsWithOrders: 0,
          totalClosedAmount: 0,
          ordersClosed: opps.filter((o) => o.stage === 'CLOSED_WON').length,
          organizationsCreated: orgCount,
          territoryCoveragePercent: orgCount > 0 ? Math.round((Math.min(orgCount, Math.floor(orgCount * 0.7)) / orgCount) * 100) : 0,
          territoryPenetrationPercent: 0,
          organizationsWithThreeSports: 0,
          uniformsDealClosed,
          travelGearDealClosed,
          teamStoreDealClosed,
          lettermanDealClosed,
          dealsAssisted: 0,
          repsCertified: 0,
          territoryGrowthPercent: 0,
          pipelineHealthPercent: dealsThisMonth > 0 && activeOpps > 0 ? Math.round((dealsThisMonth / activeOpps) * 100) : 0,
          territoriesProfitable: 0,
        };

        setStats(newStats);

        // Check for newly earned qualifications
        const newlyEarned = checkAndAwardQualifications(newStats);
        for (const qual of newlyEarned) {
          success(`QUALIFICATION EARNED: ${qual.name} — ${qual.description}`);
        }
      } catch {
        // Fall back to whatever we have
      }
    }
    computeStats();
  }, [user?.id]);

  // ── Computed territory stats ──────────────────────────────────────────────
  const territoryStats = useMemo(() => {
    const { organizationsCreated } = stats;
    const active = Math.min(organizationsCreated, Math.floor(organizationsCreated * 0.7));
    const coverage = organizationsCreated > 0 ? Math.round((active / organizationsCreated) * 100) : 0;
    return { total: organizationsCreated, active, coverage };
  }, [stats]);

  // ── Qualification summary ──────────────────────────────────────────────────
  const qualSummary = useMemo(() => {
    const progress = getQualificationProgress(stats);
    const earned = progress.filter((p) => p.earnedTier !== null).length;
    const total = progress.length;
    return { earned, total };
  }, [stats]);

  // ── Earned count for settings badge notification ───────────────────────────
  const earnedCount = useMemo(() => {
    const store = loadQualifications();
    return store.earned.length;
  }, [stats]);

  // ── Save ─────────────────────────────────────────────────────────────────
  const saveAll = () => {
    try {
      localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
      // Propagate accent change
      document.documentElement.setAttribute('data-accent', prefs.accent);
      setSaved('Settings saved for this device.');
      success('Settings saved ✓');
      // Notify SportsTicker of league changes
      window.dispatchEvent(new CustomEvent('tuf:settings-changed'));
    } catch {
      error('Failed to save. Please try again.', saveAll);
    }
  };

  // ── Toggle league ─────────────────────────────────────────────────────────
  const toggleLeague = (league: string) => {
    setPrefs((p) => {
      const current = p.favoriteLeagues;
      if (current.includes(league)) {
        return { ...p, favoriteLeagues: current.filter((l) => l !== league) };
      }
      return { ...p, favoriteLeagues: [...current, league] };
    });
  };

  const certificationLevel = user?.isCertified
    ? 'Level 1 Certified'
    : stats.quizModulesPassed >= 5
    ? 'Awaiting Director Review'
    : stats.quizModulesPassed >= 1
    ? `In Progress (${stats.quizModulesPassed}/5 modules)`
    : 'Uncertified';

  return (
    <div className="space-y-4">
      {/* ── Two-column grid ─────────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* ── LEFT — Rep Profile ──────────────────────────────────────── */}
        <div className="space-y-4">
          <Card title="Rep Profile">
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/20 text-xl font-bold text-cyan-300">
                  {user?.name?.charAt(0) ?? '?'}
                </div>
                <div>
                  <p className="font-semibold text-slate-100">{user?.name ?? 'Unknown Rep'}</p>
                  <p className="text-xs text-slate-400">{user?.role ?? 'REP'} · {user?.territory ?? 'Unassigned Territory'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 border-t border-slate-700/50 pt-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-slate-500">Zone</p>
                  <p className="font-medium text-slate-300">{user?.territory ?? '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-slate-500">Director</p>
                  <p className="font-medium text-slate-300">Unassigned</p>
                </div>
              </div>

              {/* Certification Badge */}
              <div className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-300">
                      CERTIFICATION
                    </p>
                    <p className="text-[11px] text-slate-400">{certificationLevel}</p>
                  </div>
                  {user?.isCertified ? (
                    <span className="rounded-full border border-emerald-500/50 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                      CERTIFIED
                    </span>
                  ) : (
                    <span className="rounded-full border border-amber-500/50 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                      {stats.quizModulesPassed > 0 ? `${Math.round((stats.quizModulesPassed / 5) * 100)}%` : 'START'}
                    </span>
                  )}
                </div>
                {!user?.isCertified && (
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-700">
                    <div
                      className="h-full rounded-full bg-cyan-500 transition-all"
                      style={{ width: `${Math.min(100, (stats.quizModulesPassed / 5) * 100)}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Quick Links */}
              <div className="flex flex-wrap gap-2 border-t border-slate-700/50 pt-3">
                <a href="/academy" className="rounded border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-300 hover:bg-cyan-500/20 transition">
                  📖 Academy
                </a>
                <a href="/territory" className="rounded border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 transition">
                  🗺️ Territory Map
                </a>
                <a href="/change-credential" className="rounded border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-300 hover:bg-amber-500/20 transition">
                  🔒 Change PIN
                </a>
              </div>
            </div>
          </Card>

          {/* Territory Stats */}
          <Card title="Territory Stats">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-3">
                <p className="text-[10px] uppercase tracking-wide text-slate-500">Schools Assigned</p>
                <p className="text-xl font-bold text-slate-100">{territoryStats.total}</p>
              </div>
              <div className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-3">
                <p className="text-[10px] uppercase tracking-wide text-slate-500">Active Coverage</p>
                <p className="text-xl font-bold text-emerald-300">{territoryStats.coverage}%</p>
              </div>
            </div>
          </Card>

          {/* Monthly Stats */}
          <Card title="Monthly Stats">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-3">
                <p className="text-[10px] uppercase tracking-wide text-slate-500">Orders This Month</p>
                <p className="text-xl font-bold text-slate-100">{stats.ordersThisMonth}</p>
              </div>
              <div className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-3">
                <p className="text-[10px] uppercase tracking-wide text-slate-500">Pipeline Health</p>
                <p className="text-xl font-bold text-cyan-300">
                  {stats.activeOpportunities > 0 ? `${Math.min(100, Math.round((stats.ordersThisMonth / Math.max(1, stats.activeOpportunities)) * 100))}%` : '0%'}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* ── RIGHT — Preferences ──────────────────────────────────────── */}
        <div className="space-y-4">
          <Card title="Theme">
            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-[var(--text-secondary)] mb-1">Accent Theme</label>
                <Select
                  value={prefs.accent}
                  onChange={(e) =>
                    setPrefs((p) => ({ ...p, accent: e.target.value as UserPrefs['accent'] }))
                  }
                >
                  <option value="blue">TUF Blue</option>
                  <option value="teal">Electric Teal</option>
                </Select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={prefs.compactMode}
                  onChange={(e) => setPrefs((p) => ({ ...p, compactMode: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-800 accent-cyan-500"
                />
                <span className="text-slate-300">Compact Layout</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={prefs.notifications}
                  onChange={(e) => setPrefs((p) => ({ ...p, notifications: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-800 accent-cyan-500"
                />
                <span className="text-slate-300">Notifications Enabled</span>
              </label>

              <div>
                <label className="block text-[var(--text-secondary)] mb-1">Default Landing Page</label>
                <Select
                  value={prefs.defaultView}
                  onChange={(e) =>
                    setPrefs((p) => ({ ...p, defaultView: e.target.value as UserPrefs['defaultView'] }))
                  }
                >
                  <option value="dashboard">Dashboard</option>
                  <option value="organizations">Organizations</option>
                  <option value="opportunities">Opportunities</option>
                  <option value="orders">Orders</option>
                </Select>
              </div>
            </div>
          </Card>

          {/* Favorite Sports */}
          <Card title="Favorite Sports (Ticker)">
            <p className="mb-2 text-xs text-slate-400">
              Select which leagues to show in the Sports Ticker:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {ALL_LEAGUES.map((league) => (
                <label
                  key={league.value}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs transition ${
                    prefs.favoriteLeagues.includes(league.value)
                      ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-200'
                      : 'border-slate-700/50 bg-slate-800/30 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={prefs.favoriteLeagues.includes(league.value)}
                    onChange={() => toggleLeague(league.value)}
                    className="sr-only"
                  />
                  <span>{league.label}</span>
                </label>
              ))}
            </div>
          </Card>

          {/* Notification Prefs */}
          <Card title="Notification Preferences">
            <div className="space-y-2 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 rounded border-slate-600 bg-slate-800 accent-cyan-500"
                />
                <span className="text-slate-300">Score updates</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 rounded border-slate-600 bg-slate-800 accent-cyan-500"
                />
                <span className="text-slate-300">Deal alerts</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 rounded border-slate-600 bg-slate-800 accent-cyan-500"
                />
                <span className="text-slate-300">Academy reminders</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 rounded border-slate-600 bg-slate-800 accent-cyan-500"
                />
                <span className="text-slate-300">Leaderboard updates</span>
              </label>
            </div>
          </Card>

          {/* Role switcher for admin/director */}
          {user?.role === 'ADMIN' || user?.role === 'REGIONAL_DIRECTOR' ? (
            <Card title="Workspace">
              <div className="space-y-2 text-sm">
                <label className="block text-[var(--text-secondary)]">Role</label>
                <Select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                >
                  <option value="ADMIN">ADMIN</option>
                  <option value="REGIONAL_DIRECTOR">REGIONAL_DIRECTOR</option>
                  <option value="DIRECTOR">DIRECTOR</option>
                  <option value="REP">REP</option>
                </Select>
              </div>
            </Card>
          ) : null}
        </div>
      </div>

      {/* ── BOTTOM — Qualifications ────────────────────────────────────── */}
      <Card title={`QUALIFICATIONS (${qualSummary.earned}/${qualSummary.total})`}>
        <BadgeLocker stats={stats} />

        {/* Leaderboard stub */}
        <div className="mt-4 rounded-lg border border-dashed border-slate-700/50 bg-slate-800/20 p-3 text-center">
          <p className="text-xs text-slate-400">
            LEADERBOARD: Coming in next release. Earn qualifications to climb the ranks.
          </p>
        </div>
      </Card>

      {/* ── Save Controls ──────────────────────────────────────────────── */}
      <Card title="Save Settings">
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--text-secondary)]">
            Save role, theme, workspace, and ticker preferences for this device.
          </p>
          <Button onClick={saveAll}>Save Settings</Button>
        </div>
        {saved ? (
          <p className="mt-2 text-sm text-[#1FB6FF]">{saved}</p>
        ) : null}
      </Card>
    </div>
  );
}
