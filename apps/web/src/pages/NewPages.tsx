import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStoredUser } from '../auth';
import { Button, Card, Input, Select } from '../components/primitives';
import { ACCOUNT_TYPES, CLUB_PROGRAM_LEVELS, REVENUE_LANES, SCHOOL_PROGRAM_LEVELS, SEASON_CODES, SPORT_OPTIONS, YOUTH_PROGRAM_LEVELS } from '../config/business';
import { buildOpportunityDisplayName, normalizeAccountName } from '../utils/naming';
import { createMockOrganization } from '../services/organizationsService';
import { createMockOpportunity } from '../services/opportunitiesService';
import { useOrganizations } from '../hooks/useOrganizations';
import type { TerritoryId } from '../data/mockSalesData';
import { useToast } from '../components/toast';
import { listUsers } from '../services/usersService';

export function OrganizationNewPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('MN');
  const [accountType, setAccountType] = useState<string>(ACCOUNT_TYPES[0]);
  const [territory, setTerritory] = useState<TerritoryId | ''>('');
  const [assignedRep, setAssignedRep] = useState(getStoredUser()?.role === 'REP' ? getStoredUser()?.name ?? '' : '');
  const [assignedDirector, setAssignedDirector] = useState('');
  const directors = listUsers().filter((u) => u.role === 'DIRECTOR' && u.status === 'ACTIVE');
  const { success, error } = useToast();

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      error('Failed to save. Please try again.');
      return;
    }
    if (!territory) {
      error('Failed to save. Please try again.');
      return;
    }
    try {
      const created = createMockOrganization({ name: normalizeAccountName(name), accountType, city, state, territory: territory as TerritoryId, assignedRep: assignedRep || 'Unassigned Rep', assignedDirector: assignedDirector || 'Unassigned' });
      success('Organization saved ✓');
      navigate(`/organizations/${created.id}`);
    } catch (err) {
      const detail = err instanceof Error ? err.message : 'Please check the organization fields and try again.';
      error(`Organization save failed: ${detail}`);
    }
  };

  return <Card title="New Organization"><form onSubmit={onSubmit} className="grid gap-2 md:grid-cols-2"><div><label className="text-xs text-slate-400">Account Name <span className="text-rose-300">*</span></label><Input value={name} onChange={(e)=>setName(e.target.value)} onBlur={()=>setName(normalizeAccountName(name))} placeholder="Account Name" /></div><div><label className="text-xs text-slate-400">Account Type <span className="text-rose-300">*</span></label><Select value={accountType} onChange={(e)=>setAccountType(e.target.value)}>{ACCOUNT_TYPES.map((t)=><option key={t}>{t}</option>)}</Select></div><div><label className="text-xs text-slate-400">City <span className="text-slate-500">(Optional)</span></label><Input value={city} onChange={(e)=>setCity(e.target.value)} placeholder="City" /></div><div><label className="text-xs text-slate-400">State <span className="text-slate-500">(Optional)</span></label><Input value={state} onChange={(e)=>setState(e.target.value.toUpperCase().slice(0, 2))} placeholder="State" /></div><div><label className="text-xs text-slate-400">Metro <span className="text-rose-300">*</span></label><p className="text-[11px] text-slate-500">Select the sales region.</p><Select value={territory} onChange={(e)=>setTerritory(e.target.value as TerritoryId | '')}><option value="">—</option><option value="metro">Metro</option><option value="north">North</option><option value="west">West</option><option value="south">South</option></Select></div><div><label className="text-xs text-slate-400">Assigned Rep <span className="text-slate-500">(Optional)</span></label><Input value={assignedRep} onChange={(e)=>setAssignedRep(e.target.value)} placeholder="Assigned Rep" /></div><div><label className="text-xs text-slate-400">Assigned Director <span className="text-slate-500">(Optional)</span></label><Select value={assignedDirector} onChange={(e)=>setAssignedDirector(e.target.value)}><option value="">Unassigned</option>{directors.map((director)=><option key={director.id} value={director.displayName}>{director.displayName}</option>)}</Select></div><Button type="submit" className="md:col-span-2">Save Organization</Button></form></Card>;
}

export function OpportunityNewPage() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const organizations = useOrganizations({});
  const [programLevel, setProgramLevel] = useState(SCHOOL_PROGRAM_LEVELS[0]);
  const [sport, setSport] = useState(SPORT_OPTIONS[0]);
  const [seasonCode, setSeasonCode] = useState('FA26');
  const [lane, setLane] = useState(REVENUE_LANES[0]);
  const [organizationId, setOrganizationId] = useState(organizations[0]?.id ?? '');
  const [assignedRep, setAssignedRep] = useState(user?.role === 'REP' ? user.name : organizations[0]?.assignedRep ?? '');
  const [value, setValue] = useState('15000');
  const [message, setMessage] = useState('');
  const { success, error } = useToast();

  const levels = useMemo(() => [...SCHOOL_PROGRAM_LEVELS, ...YOUTH_PROGRAM_LEVELS, ...CLUB_PROGRAM_LEVELS], []);
  const preview = buildOpportunityDisplayName({ programLevel, sport, seasonCode, lane });
  const selectedOrg = organizations.find((org) => org.id === organizationId) ?? organizations[0];

  useEffect(() => {
    if (!organizationId && organizations[0]) {
      setOrganizationId(organizations[0].id);
      if (user?.role !== 'REP') setAssignedRep(organizations[0].assignedRep);
    }
  }, [organizationId, organizations, user?.role]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setMessage('');
    const missing: string[] = [];
    if (!selectedOrg) missing.push('Organization');
    if (!((assignedRep || selectedOrg?.assignedRep || user?.name) ?? '').trim()) missing.push('Assigned Rep');
    if (!programLevel.trim()) missing.push('Program Level');
    if (!sport.trim()) missing.push('Sport');
    if (!seasonCode.trim()) missing.push('Season');
    if (!lane.trim()) missing.push('Lane');
    if (missing.length) {
      const detail = `Missing required field${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}.`;
      setMessage(detail);
      error(`Opportunity creation failed: ${detail}`);
      return;
    }
    try {
      const created = createMockOpportunity({
        organizationId: selectedOrg.id,
        organizationName: selectedOrg.name,
        programLevel,
        sport,
        seasonCode,
        lane,
        assignedRep: assignedRep || selectedOrg.assignedRep,
        organizationAssignedDirector: selectedOrg.assignedDirector,
        value: Number(value) || 0,
      });
      success('Opportunity created.');
      navigate(`/opportunities/${created.id}`);
    } catch (err) {
      const detail = err instanceof Error ? err.message : 'Please check the opportunity fields and try again.';
      setMessage(detail);
      error(`Opportunity creation failed: ${detail}`);
    }
  };

  return <Card title="New Opportunity"><form onSubmit={onSubmit} className="grid gap-2 md:grid-cols-2"><Select value={organizationId} onChange={(e)=>{ const next = organizations.find((org) => org.id === e.target.value); setOrganizationId(e.target.value); if (next && user?.role !== 'REP') setAssignedRep(next.assignedRep); }}>{organizations.map((org)=><option key={org.id} value={org.id}>{org.name}</option>)}</Select><Input value={assignedRep} onChange={(e)=>setAssignedRep(e.target.value)} placeholder="Assigned Rep" disabled={user?.role === 'REP'} /><Select value={programLevel} onChange={(e)=>setProgramLevel(e.target.value as typeof programLevel)}>{levels.map((l)=><option key={l}>{l}</option>)}</Select><Select value={sport} onChange={(e)=>setSport(e.target.value as typeof sport)}>{SPORT_OPTIONS.map((s)=><option key={s}>{s}</option>)}</Select><Input value={seasonCode} onChange={(e)=>setSeasonCode(e.target.value.toUpperCase())} placeholder={`Season code (${SEASON_CODES.join('/')})`} /><Select value={lane} onChange={(e)=>setLane(e.target.value as typeof lane)}>{REVENUE_LANES.map((l)=><option key={l}>{l}</option>)}</Select><Input inputMode="numeric" value={value} onChange={(e)=>setValue(e.target.value.replace(/[^\d]/g, ''))} placeholder="Estimated Value" /><p className="md:col-span-2 text-sm text-cyan-200">Display Name Preview: {preview}</p><Button type="submit" className="md:col-span-2">Create Opportunity</Button>{message ? <p className="text-sm text-amber-200 md:col-span-2">{message}</p> : null}</form></Card>;
}
