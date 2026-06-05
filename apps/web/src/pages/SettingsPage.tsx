import { useEffect, useState } from 'react';
import { getStoredUser, updateUserProfile } from '../auth';
import { Button, Card, Input, Select } from '../components/primitives';
import type { Role } from '../types';
import { notify } from '../services/feedbackService';

const PREF_KEY = 'tuf_ops_settings_v1';

type UserPrefs = {
  accent: 'blue' | 'teal';
  compactMode: boolean;
  notifications: boolean;
  defaultView: 'dashboard' | 'organizations' | 'opportunities' | 'orders';
};

const defaultPrefs: UserPrefs = {
  accent: 'blue',
  compactMode: true,
  notifications: true,
  defaultView: 'dashboard',
};

export function SettingsPage() {
  const user = getStoredUser();
  const [name, setName] = useState(user?.name ?? '');
  const [role, setRole] = useState<Role>(user?.role ?? 'OWNER');
  const [pin, setPin] = useState('0000');
  const [prefs, setPrefs] = useState<UserPrefs>(defaultPrefs);
  const [saved, setSaved] = useState('');

  useEffect(() => {
    const raw = localStorage.getItem(PREF_KEY);
    if (raw) {
      try { setPrefs({ ...defaultPrefs, ...JSON.parse(raw) }); } catch { setPrefs(defaultPrefs); }
    }
  }, []);

  const saveAll = () => {
    try {
      const nextRole = user?.role === 'OWNER' ? role : user?.role ?? role;
      localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
      updateUserProfile({ name, role: nextRole });
      setSaved('Settings saved for this device.');
      notify('Settings saved.', 'success');
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Please check the settings and try again.';
      setSaved(detail);
      notify(`Settings save failed: ${detail}`, 'error');
    }
  };

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <Card title="Profile">
        <div className="space-y-2 text-sm">
          <label className="block text-[var(--text-secondary)]">Display Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
          <p className="text-xs text-[var(--text-secondary)]">Profile settings are local to this internal rollout device.</p>
        </div>
      </Card>

      <Card title="Workspace">
        <div className="space-y-2 text-sm">
          <label className="block text-[var(--text-secondary)]">Role</label>
          <Select value={role} onChange={(e) => setRole(e.target.value as Role)} disabled={user?.role !== 'OWNER'}>
            <option value="OWNER">OWNER</option>
            <option value="DIRECTOR">DIRECTOR</option>
            <option value="REP">REP</option>
            <option value="OPS">OPS</option>
          </Select>
          {user?.role !== 'OWNER' ? <p className="text-xs text-[var(--text-secondary)]">Role changes require Owner access.</p> : null}
        </div>
      </Card>

      <Card title="Theme">
        <div className="space-y-2 text-sm">
          <label className="block text-[var(--text-secondary)]">Accent Theme</label>
          <Select value={prefs.accent} onChange={(e) => setPrefs((p) => ({ ...p, accent: e.target.value as UserPrefs['accent'] }))}>
            <option value="blue">TUF Blue</option>
            <option value="teal">Electric Teal</option>
          </Select>
          <label className="flex items-center gap-2"><input type="checkbox" checked={prefs.compactMode} onChange={(e) => setPrefs((p) => ({ ...p, compactMode: e.target.checked }))} /> Compact Layout</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={prefs.notifications} onChange={(e) => setPrefs((p) => ({ ...p, notifications: e.target.checked }))} /> Notifications Enabled</label>
          <label className="block text-[var(--text-secondary)]">Default Landing Page</label>
          <Select value={prefs.defaultView} onChange={(e) => setPrefs((p) => ({ ...p, defaultView: e.target.value as UserPrefs['defaultView'] }))}>
            <option value="dashboard">Dashboard</option>
            <option value="organizations">Organizations</option>
            <option value="opportunities">Opportunities</option>
            <option value="orders">Orders</option>
          </Select>
        </div>
      </Card>

      <Card title="Security">
        <div className="space-y-2 text-sm">
          <label className="block text-[var(--text-secondary)]">PIN (4 digits)</label>
          <Input type="password" value={pin} maxLength={4} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))} />
          <p className="text-xs text-[var(--text-secondary)]">PIN is local for internal beta sign-in only.</p>
        </div>
      </Card>

      <Card title="Ticker">
        <p className="text-sm text-slate-300">National scoreboard shows only today/tomorrow games and auto-refreshes every 5 minutes.</p>
        <p className="text-xs text-slate-500 mt-1">Post-Beta: league/source customization.</p>
      </Card>

      <Card title="Beta Controls" className="lg:col-span-2">
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--text-secondary)]">Save role, theme, and workspace preferences for this device profile.</p>
          <Button onClick={saveAll}>Save Settings</Button>
        </div>
        {saved ? <p className="mt-2 text-sm text-[#1FB6FF]">{saved}</p> : null}
      </Card>
    </div>
  );
}
