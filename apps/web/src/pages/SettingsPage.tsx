import { Card, Input, Select } from '../components/primitives';

export function SettingsPage() {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <Card title="User / Profile Placeholder"><Input placeholder="Coach Bradshaw" /></Card>
      <Card title="Role Selector Placeholder"><Select><option>OWNER</option><option>DIRECTOR</option><option>REP</option><option>OPS</option></Select></Card>
      <Card title="Accent Color Placeholder"><Select><option>Cyan / Blue</option></Select></Card>
      <Card title="PIN Auth Placeholder"><Input type="password" placeholder="••••" maxLength={4} /></Card>
      <Card title="System Preferences Placeholder" className="lg:col-span-2"><p className="text-sm text-slate-300">Compact density, notification, and workspace behavior settings placeholders.</p></Card>
    </div>
  );
}
