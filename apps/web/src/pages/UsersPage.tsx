import { useState } from 'react';
import { Card, Button, Input, Select } from '../components/primitives';
import { createUser, listUsers, resetUserCredential, updateUser, type ManagedUser } from '../services/usersService';
import { getStoredUser } from '../auth';
import type { Role } from '../types';
import type { TerritoryId } from '../data/mockSalesData';
import { useToast } from '../components/toast';

function formatActivityDate(value?: string) {
  if (!value) return 'No login yet';
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

function getActivityStatus(user: ManagedUser) {
  if (user.lockedUntil && new Date(user.lockedUntil).getTime() > Date.now()) return { label: 'Locked', className: 'border-rose-500/60 text-rose-200' };
  if (user.status !== 'ACTIVE') return { label: 'Inactive', className: 'border-slate-500 text-slate-300' };
  if (!user.lastLoginAt) return { label: 'Not logged in', className: 'border-amber-500/60 text-amber-200' };
  const daysSinceLogin = (Date.now() - new Date(user.lastLoginAt).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceLogin <= 7) return { label: 'Active', className: 'border-emerald-500/60 text-emerald-200' };
  if (daysSinceLogin <= 14) return { label: 'Cooling off', className: 'border-cyan-500/60 text-cyan-200' };
  return { label: 'Needs check-in', className: 'border-amber-500/60 text-amber-200' };
}

export function UsersPage() {
  const viewer = getStoredUser();
  const [refresh, setRefresh] = useState(0);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('REP');
  const [territory, setTerritory] = useState<TerritoryId>('metro');
  const [assignedDirectorId, setAssignedDirectorId] = useState('');
  const [message, setMessage] = useState('');
  const [oneTimeCredential, setOneTimeCredential] = useState<{ name: string; credential: string; action: 'created' | 'reset' } | null>(null);
  const { success, error } = useToast();

  const users = listUsers();
  const directors = users.filter((u) => u.role === 'DIRECTOR' && u.status === 'ACTIVE');
  const canManage = viewer?.role === 'OWNER';
  const viewerId = users.find((x) => x.displayName === viewer?.name)?.id;
  const canDirectorManage = viewer?.role === 'DIRECTOR';
  const visible = canDirectorManage ? users.filter((u) => u.id === viewerId || (u.role === 'REP' && u.assignedDirectorId === viewerId)) : users;
  const recentlyActive = visible.filter((u) => u.lastLoginAt && (Date.now() - new Date(u.lastLoginAt).getTime()) <= 7 * 24 * 60 * 60 * 1000).length;
  const neverLoggedIn = visible.filter((u) => !u.lastLoginAt).length;
  const needsCheckIn = visible.filter((u) => getActivityStatus(u).label === 'Needs check-in' || getActivityStatus(u).label === 'Not logged in').length;

  if (!canManage && viewer?.role !== 'DIRECTOR') return <Card title="User Management"><p className="text-sm text-slate-400">Only owner/director access.</p></Card>;

  const createSecureUser = async () => {
    try {
      if (!firstName.trim()) throw new Error('First name required');
      const result = await createUser({ firstName, lastName, email, role, territory, assignedDirectorId: role === 'REP' ? assignedDirectorId : undefined, status: 'ACTIVE' }, viewer);
      setFirstName('');
      setLastName('');
      setEmail('');
      setOneTimeCredential({ name: result.user.displayName, credential: result.temporaryCredential, action: 'created' });
      setMessage('Temporary PIN generated. This user must change their PIN on first login.');
      success('Temporary PIN generated');
      setRefresh((x) => x + 1);
    } catch (e: any) {
      setMessage(e.message || 'Unable to create user');
      error('Failed to save. Please try again.');
    }
  };

  const resetCredential = async (id: string) => {
    try {
      const result = await resetUserCredential(id, viewer);
      setOneTimeCredential({ name: result.user.displayName, credential: result.temporaryCredential, action: 'reset' });
      setMessage('Temporary PIN generated. Copy this now. It will not be shown again.');
      success('Temporary PIN generated');
      setRefresh((x) => x + 1);
    } catch (e: any) {
      setMessage(e.message || 'Unable to reset PIN');
      error('Failed to reset PIN.');
    }
  };

  const copyCredential = async () => {
    if (!oneTimeCredential) return;
    await navigator.clipboard?.writeText(oneTimeCredential.credential);
    success('PIN copied');
  };

  return <Card title="User Management">
    <p className="mb-3 text-xs text-slate-400">4-digit PIN access is active. For security, existing PINs cannot be viewed. You may only reset them.</p>
    {canManage ? <div className="safe-grid mb-3 grid gap-2 md:grid-cols-7">
      <Input placeholder="First name" value={firstName} onChange={(e)=>setFirstName(e.target.value)} />
      <Input placeholder="Last name" value={lastName} onChange={(e)=>setLastName(e.target.value)} />
      <Input placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
      <Select value={role} onChange={(e)=>setRole(e.target.value as Role)}><option value="DIRECTOR">DIRECTOR</option><option value="REP">REP</option><option value="OPS">OPS</option><option value="OWNER">OWNER</option></Select>
      <Select value={territory} onChange={(e)=>setTerritory(e.target.value as TerritoryId)}><option value="metro">metro</option><option value="north">north</option><option value="west">west</option><option value="south">south</option></Select>
      <Select value={assignedDirectorId} onChange={(e)=>setAssignedDirectorId(e.target.value)}><option value="">Assign director</option>{directors.map((d)=><option key={d.id} value={d.id}>{d.displayName}</option>)}</Select>
      <Button onClick={createSecureUser}>Create User</Button>
    </div> : null}

    {oneTimeCredential ? <div className="mb-3 rounded-lg border border-amber-400/50 bg-amber-400/10 p-3 text-sm">
      <p className="font-semibold text-amber-100">Temporary PIN generated</p>
      <p className="text-amber-50">{oneTimeCredential.name}: <span className="font-mono text-lg tracking-[0.25em]">{oneTimeCredential.credential}</span></p>
      <p className="text-xs text-amber-100">Copy this now. It will not be shown again.</p>
      <p className="text-xs text-amber-100">This user must change their PIN on first login.</p>
      <Button className="mt-2 px-2 py-1 text-xs" onClick={copyCredential}>Copy temporary PIN</Button>
    </div> : null}

    <div className="mb-4 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-100">Activity Tracker</p>
          <p className="text-xs text-slate-400">Visible to owners/admins and directors so managers can see who is active, stale, or has never logged in.</p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-lg border border-slate-700 px-3 py-2"><p className="text-lg font-semibold text-cyan-100">{recentlyActive}</p><p className="text-slate-400">Active 7d</p></div>
          <div className="rounded-lg border border-slate-700 px-3 py-2"><p className="text-lg font-semibold text-amber-100">{needsCheckIn}</p><p className="text-slate-400">Needs check-in</p></div>
          <div className="rounded-lg border border-slate-700 px-3 py-2"><p className="text-lg font-semibold text-slate-100">{neverLoggedIn}</p><p className="text-slate-400">No login</p></div>
        </div>
      </div>
      <div key={refresh} className="grid gap-2 lg:grid-cols-2">
        {visible.map((u) => {
          const status = getActivityStatus(u);
          return <div key={u.id} className="rounded-lg border border-slate-800 bg-slate-900/50 p-3 text-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-100">{u.displayName}</p>
                <p className="text-xs text-slate-400">{u.role} · {u.territory || 'unassigned'} · {u.status}{u.mustChangeCredential ? ' · must change PIN' : ''}</p>
              </div>
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${status.className}`}>{status.label}</span>
            </div>
            <div className="mt-3 grid gap-2 text-xs text-slate-300 sm:grid-cols-2">
              <p><span className="text-slate-500">Last login:</span> {formatActivityDate(u.lastLoginAt)}</p>
              <p><span className="text-slate-500">Login count:</span> {u.loginCount || 0}</p>
              <p><span className="text-slate-500">Last attempt:</span> {formatActivityDate(u.lastCredentialAttemptAt)}</p>
              <p><span className="text-slate-500">Failed attempts:</span> {u.failedCredentialAttempts || 0}</p>
            </div>
          </div>;
        })}
      </div>
    </div>

    <div key={`rows-${refresh}`} className="space-y-2">
      {visible.map((u)=><div key={u.id} className="rounded border border-slate-700 p-2 text-sm flex items-center justify-between">
        <div><p className="font-semibold">{u.displayName}</p><p className="text-slate-400">{u.role} · {u.territory || 'unassigned'} · {u.status}{u.mustChangeCredential ? ' · must change PIN' : ''}</p></div>
        {canManage || canDirectorManage ? <div className="flex gap-2 items-center">
          {canManage && u.role === 'REP' ? <Select value={u.assignedDirectorId || ''} onChange={(e)=>{try {updateUser(u.id,{assignedDirectorId:e.target.value||undefined}, viewer); success('Settings saved ✓'); setRefresh((x)=>x+1);} catch { error('Failed to save. Please try again.'); }}}><option value="">unassigned director</option>{directors.map((d)=><option key={d.id} value={d.id}>{d.displayName}</option>)}</Select> : null}
          {canDirectorManage && u.role === 'REP' ? <Select value={u.territory || 'metro'} onChange={(e)=>{try {updateUser(u.id,{territory:e.target.value as TerritoryId}, viewer); success('Settings saved ✓'); setRefresh((x)=>x+1);} catch { error('Failed to save. Please try again.'); }}}><option value="metro">metro</option><option value="north">north</option><option value="west">west</option><option value="south">south</option></Select> : null}
          {canManage ? <Button className="px-2 py-1 text-xs" onClick={()=>resetCredential(u.id)}>Reset PIN</Button> : null}
          <Button className="px-2 py-1 text-xs" onClick={()=>{ try { updateUser(u.id,{status:u.status==='ACTIVE'?'INACTIVE':'ACTIVE'}, viewer); setMessage('User updated.'); success('Settings saved ✓'); setRefresh((x)=>x+1);} catch (e:any) { setMessage(e.message || 'Unable to update user'); error('Failed to save. Please try again.'); } }}>{u.status==='ACTIVE'?'Archive':'Activate'}</Button>
        </div> : null}
      </div>)}
    </div>
    {message ? <p className="mt-2 text-xs text-cyan-300">{message}</p> : null}
  </Card>;
}
