import { FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStoredUser } from '../auth';
import { Button, Card, Input, Select } from '../components/primitives';
import { ACCOUNT_TYPES, CLUB_PROGRAM_LEVELS, REVENUE_LANES, SCHOOL_PROGRAM_LEVELS, SEASON_CODES, SPORT_OPTIONS, YOUTH_PROGRAM_LEVELS } from '../config/business';
import { buildOpportunityDisplayName, normalizeAccountName } from '../utils/naming';
import { createMockOrganization } from '../services/organizationsService';
import { createMockOpportunity } from '../services/opportunitiesService';
import { useOrganizations } from '../hooks/useOrganizations';
import type { TerritoryId } from '../data/mockSalesData';

export function OrganizationNewPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('MN');
  const [accountType, setAccountType] = useState<string>(ACCOUNT_TYPES[0]);
  const [territory, setTerritory] = useState<TerritoryId>('metro');
  const [assignedRep, setAssignedRep] = useState(getStoredUser()?.role === 'REP' ? getStoredUser()?.name ?? 'Maya Cole' : 'Maya Cole');
  const [assignedDirector, setAssignedDirector] = useState('Dana Holt');
  const [message, setMessage] = useState('');

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setMessage('Account name is required.');
      return;
    }
    const created = createMockOrganization({ name: normalizeAccountName(name), accountType, city, state, territory, assignedRep, assignedDirector });
    navigate(`/organizations/${created.id}`);
  };

  return <Card title="New Organization"><form onSubmit={onSubmit} className="grid gap-2 md:grid-cols-2"><Input value={name} onChange={(e)=>setName(e.target.value)} onBlur={()=>setName(normalizeAccountName(name))} placeholder="Account Name" /><Select value={accountType} onChange={(e)=>setAccountType(e.target.value)}>{ACCOUNT_TYPES.map((t)=><option key={t}>{t}</option>)}</Select><Input value={city} onChange={(e)=>setCity(e.target.value)} placeholder="City" /><Input value={state} onChange={(e)=>setState(e.target.value.toUpperCase().slice(0, 2))} placeholder="State" /><Select value={territory} onChange={(e)=>setTerritory(e.target.value as TerritoryId)}><option value="metro">Metro</option><option value="north">North</option><option value="west">West</option><option value="south">South</option></Select><Input value={assignedRep} onChange={(e)=>setAssignedRep(e.target.value)} placeholder="Assigned Rep" /><Input value={assignedDirector} onChange={(e)=>setAssignedDirector(e.target.value)} placeholder="Assigned Director" /><Button type="submit" className="md:col-span-2">Save Organization</Button>{message ? <p className="text-sm text-amber-200 md:col-span-2">{message}</p> : null}</form></Card>;
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
  const [assignedRep, setAssignedRep] = useState(user?.role === 'REP' ? user.name : organizations[0]?.assignedRep ?? 'Maya Cole');
  const [value, setValue] = useState('15000');
  const [message, setMessage] = useState('');

  const levels = useMemo(() => [...SCHOOL_PROGRAM_LEVELS, ...YOUTH_PROGRAM_LEVELS, ...CLUB_PROGRAM_LEVELS], []);
  const preview = buildOpportunityDisplayName({ programLevel, sport, seasonCode, lane });
  const selectedOrg = organizations.find((org) => org.id === organizationId) ?? organizations[0];

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedOrg) {
      setMessage('Select an organization before creating the opportunity.');
      return;
    }
    const created = createMockOpportunity({
      organizationId: selectedOrg.id,
      organizationName: selectedOrg.name,
      programLevel,
      sport,
      seasonCode,
      lane,
      assignedRep: assignedRep || selectedOrg.assignedRep,
      value: Number(value) || 0,
    });
    navigate(`/opportunities/${created.id}`);
  };

  return <Card title="New Opportunity"><form onSubmit={onSubmit} className="grid gap-2 md:grid-cols-2"><Select value={organizationId} onChange={(e)=>{ const next = organizations.find((org) => org.id === e.target.value); setOrganizationId(e.target.value); if (next) setAssignedRep(next.assignedRep); }}>{organizations.map((org)=><option key={org.id} value={org.id}>{org.name}</option>)}</Select><Input value={assignedRep} onChange={(e)=>setAssignedRep(e.target.value)} placeholder="Assigned Rep" /><Select value={programLevel} onChange={(e)=>setProgramLevel(e.target.value as typeof programLevel)}>{levels.map((l)=><option key={l}>{l}</option>)}</Select><Select value={sport} onChange={(e)=>setSport(e.target.value as typeof sport)}>{SPORT_OPTIONS.map((s)=><option key={s}>{s}</option>)}</Select><Input value={seasonCode} onChange={(e)=>setSeasonCode(e.target.value.toUpperCase())} placeholder={`Season code (${SEASON_CODES.join('/')})`} /><Select value={lane} onChange={(e)=>setLane(e.target.value as typeof lane)}>{REVENUE_LANES.map((l)=><option key={l}>{l}</option>)}</Select><Input inputMode="numeric" value={value} onChange={(e)=>setValue(e.target.value.replace(/[^\d]/g, ''))} placeholder="Estimated Value" /><p className="md:col-span-2 text-sm text-cyan-200">Display Name Preview: {preview}</p><Button type="submit" className="md:col-span-2">Create Opportunity</Button>{message ? <p className="text-sm text-amber-200 md:col-span-2">{message}</p> : null}</form></Card>;
}
