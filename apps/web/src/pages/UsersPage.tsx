import { useState } from 'react';
import { Card, Button, Input, Select } from '../components/primitives';
import { createUser, listUsers, resetUserCredential, updateUser } from '../services/usersService';
import { getStoredUser } from '../auth';
import type { Role } from '../types';
import type { TerritoryId } from '../data/mockSalesData';
import { useToast } from '../components/toast';

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
  const visible = canDirectorManage ? users.filter((u) => u.role === 'REP' && u.assignedDirectorId === viewerId) : users;

  if (!canManage && viewer?.role !== 'DIRECTOR') return <Card title="User Management"><p className="text-sm text-slate-400">Only owner/director access.</p></Card>;

  const createSecureUser = async () => {
    try {
      if (!firstName.trim()) throw new Error('First name required');
      const result = await createUser({ firstName, lastName, email, role, territory, assignedDirectorId: role === 'REP' ? assignedDirectorId : undefined, status: 'ACTIVE' }, viewer);
      setFirstName('');
      setLastName('');
      setEmail('');
      setOneTimeCredential({ name: result.user.displayName, credential: result.temporaryCredential, action: 'created' });
      setMessage('Temporary credential generated. This user must change their credential on first login.');
      success('Temporary credential generated');
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
      setMessage('Temporary credential generated. Copy this now. It will not be shown again.');
      success('Temporary credential generated');
      setRefresh((x) => x + 1);
    } catch (e: any) {
      setMessage(e.message || 'Unable to reset credential');
      error('Failed to reset credential.');
    }
  };

  const copyCredential = async () => {
    if (!oneTimeCredential) return;
    await navigator.clipboard?.writeText(oneTimeCredential.credential);
    success('Credential copied');
  };

  return <Card title="User Management">
    <p className="mb-3 text-xs text-slate-400">For security, existing credentials cannot be viewed. You may only reset them.</p>
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
      <p className="font-semibold text-amber-100">Temporary credential generated</p>
      <p className="text-amber-50">{oneTimeCredential.name}: <span className="font-mono text-lg">{oneTimeCredential.credential}</span></p>
      <p className="text-xs text-amber-100">Copy this now. It will not be shown again.</p>
      <p className="text-xs text-amber-100">This user must change their credential on first login.</p>
      <Button className="mt-2 px-2 py-1 text-xs" onClick={copyCredential}>Copy temporary credential</Button>
    </div> : null}

    <div key={refresh} className="space-y-2">
      {visible.map((u)=><div key={u.id} className="rounded border border-slate-700 p-2 text-sm flex items-center justify-between">
        <div><p className="font-semibold">{u.displayName}</p><p className="text-slate-400">{u.role} · {u.territory || 'unassigned'} · {u.status}{u.mustChangeCredential ? ' · must change credential' : ''}</p></div>
        {canManage || canDirectorManage ? <div className="flex gap-2 items-center">
          {canManage && u.role === 'REP' ? <Select value={u.assignedDirectorId || ''} onChange={(e)=>{try {updateUser(u.id,{assignedDirectorId:e.target.value||undefined}, viewer); success('Settings saved ✓'); setRefresh((x)=>x+1);} catch { error('Failed to save. Please try again.'); }}}><option value="">unassigned director</option>{directors.map((d)=><option key={d.id} value={d.id}>{d.displayName}</option>)}</Select> : null}
          {canDirectorManage ? <Select value={u.territory || 'metro'} onChange={(e)=>{try {updateUser(u.id,{territory:e.target.value as TerritoryId}, viewer); success('Settings saved ✓'); setRefresh((x)=>x+1);} catch { error('Failed to save. Please try again.'); }}}><option value="metro">metro</option><option value="north">north</option><option value="west">west</option><option value="south">south</option></Select> : null}
          {canManage ? <Button className="px-2 py-1 text-xs" onClick={()=>resetCredential(u.id)}>Reset Credential</Button> : null}
          <Button className="px-2 py-1 text-xs" onClick={()=>{ try { updateUser(u.id,{status:u.status==='ACTIVE'?'INACTIVE':'ACTIVE'}, viewer); setMessage('User updated.'); success('Settings saved ✓'); setRefresh((x)=>x+1);} catch (e:any) { setMessage(e.message || 'Unable to update user'); error('Failed to save. Please try again.'); } }}>{u.status==='ACTIVE'?'Archive':'Activate'}</Button>
        </div> : null}
      </div>)}
    </div>
    {message ? <p className="mt-2 text-xs text-cyan-300">{message}</p> : null}
  </Card>;
}
