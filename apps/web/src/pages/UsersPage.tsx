import { useState } from 'react';
import { Card, Button, Input, Select } from '../components/primitives';
import { createUser, listUsers, updateUser } from '../services/usersService';
import { getStoredUser } from '../auth';
import type { Role } from '../types';
import type { TerritoryId } from '../data/mockSalesData';

export function UsersPage() {
  const viewer = getStoredUser();
  const [refresh, setRefresh] = useState(0);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<Role>('REP');
  const [territory, setTerritory] = useState<TerritoryId>('metro');
  const [assignedDirectorId, setAssignedDirectorId] = useState('u-director');
  const [message, setMessage] = useState('');

  const users = listUsers();
  const directors = users.filter((u) => u.role === 'DIRECTOR');
  const canManage = viewer?.role === 'OWNER';
  const visible = users;

  if (!canManage) return <Card title='User Management'><p className='text-sm text-slate-400'>Only Owner access.</p></Card>;

  return <Card title='User Management'>
    {canManage ? <div className='safe-grid mb-3 grid gap-2 md:grid-cols-6'>
      <Input placeholder='First name' value={firstName} onChange={(e)=>setFirstName(e.target.value)} />
      <Input placeholder='Last name' value={lastName} onChange={(e)=>setLastName(e.target.value)} />
      <Select value={role} onChange={(e)=>setRole(e.target.value as Role)}><option value='DIRECTOR'>DIRECTOR</option><option value='REP'>REP</option><option value='OPS'>OPS</option><option value='OWNER'>OWNER</option></Select>
      <Select value={territory} onChange={(e)=>setTerritory(e.target.value as TerritoryId)}><option value='metro'>metro</option><option value='north'>north</option><option value='west'>west</option><option value='south'>south</option></Select>
      <Select value={assignedDirectorId} onChange={(e)=>setAssignedDirectorId(e.target.value)}>{directors.map((d)=><option key={d.id} value={d.id}>{d.displayName}</option>)}</Select>
      <Button onClick={()=>{ try { if(!firstName.trim()) throw new Error('First name required'); createUser({ firstName, lastName, role, territory, assignedDirectorId: role==='REP'?assignedDirectorId:undefined, status:'ACTIVE' }); setFirstName(''); setLastName(''); setMessage('User created.'); setRefresh((x)=>x+1);} catch (e:any) { setMessage(e.message || 'Unable to create user'); } }}>Create User</Button>
    </div> : null}
    <div key={refresh} className='space-y-2'>
      {visible.map((u)=><div key={u.id} className='rounded border border-slate-700 p-2 text-sm flex items-center justify-between'>
        <div><p className='font-semibold'>{u.displayName}</p><p className='text-slate-400'>{u.role} · {u.territory || 'unassigned'} · {u.status}</p></div>
        {canManage ? <div className='flex gap-2 items-center'>
          {canManage && u.role === 'REP' ? <Select value={u.assignedDirectorId || ''} onChange={(e)=>{updateUser(u.id,{assignedDirectorId:e.target.value||undefined}); setRefresh((x)=>x+1);}}><option value=''>unassigned director</option>{directors.map((d)=><option key={d.id} value={d.id}>{d.displayName}</option>)}</Select> : null}
          <Button className='px-2 py-1 text-xs' onClick={()=>{ try { updateUser(u.id,{status:u.status==='ACTIVE'?'INACTIVE':'ACTIVE'}); setMessage('User updated.'); setRefresh((x)=>x+1);} catch (e:any) { setMessage(e.message || 'Unable to update user'); } }}>{u.status==='ACTIVE'?'Archive':'Activate'}</Button>
        </div> : null}
      </div>)}
    </div>
    {message ? <p className='mt-2 text-xs text-cyan-300'>{message}</p> : null}
  </Card>;
}
