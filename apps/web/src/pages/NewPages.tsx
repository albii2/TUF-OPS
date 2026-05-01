import { FormEvent, useMemo, useState } from 'react';
import { Button, Card, Input, Select } from '../components/primitives';
import { ACCOUNT_TYPES, CLUB_PROGRAM_LEVELS, REVENUE_LANES, SCHOOL_PROGRAM_LEVELS, SEASON_CODES, SPORT_OPTIONS, YOUTH_PROGRAM_LEVELS } from '../config/business';
import { buildOpportunityDisplayName, normalizeAccountName } from '../utils/naming';

export function OrganizationNewPage() {
  const [name, setName] = useState('');
  const [accountType, setAccountType] = useState<string>(ACCOUNT_TYPES[0]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setName(normalizeAccountName(name));
  };

  return <Card title="New Organization"><form onSubmit={onSubmit} className="grid gap-2 md:grid-cols-2"><Input value={name} onChange={(e)=>setName(e.target.value)} onBlur={()=>setName(normalizeAccountName(name))} placeholder="Account Name" /><Select value={accountType} onChange={(e)=>setAccountType(e.target.value)}>{ACCOUNT_TYPES.map((t)=><option key={t}>{t}</option>)}</Select><Button type="submit" className="md:col-span-2">Save (mock)</Button></form></Card>;
}

export function OpportunityNewPage() {
  const [programLevel, setProgramLevel] = useState(SCHOOL_PROGRAM_LEVELS[0]);
  const [sport, setSport] = useState(SPORT_OPTIONS[0]);
  const [seasonCode, setSeasonCode] = useState('FA26');
  const [lane, setLane] = useState(REVENUE_LANES[0]);

  const levels = useMemo(() => [...SCHOOL_PROGRAM_LEVELS, ...YOUTH_PROGRAM_LEVELS, ...CLUB_PROGRAM_LEVELS], []);
  const preview = buildOpportunityDisplayName({ programLevel, sport, seasonCode, lane });

  return <Card title="New Opportunity"><form className="grid gap-2 md:grid-cols-2"><Select value={programLevel} onChange={(e)=>setProgramLevel(e.target.value as typeof programLevel)}>{levels.map((l)=><option key={l}>{l}</option>)}</Select><Select value={sport} onChange={(e)=>setSport(e.target.value as typeof sport)}>{SPORT_OPTIONS.map((s)=><option key={s}>{s}</option>)}</Select><Input value={seasonCode} onChange={(e)=>setSeasonCode(e.target.value.toUpperCase())} placeholder={`Season code (${SEASON_CODES.join('/')})`} /><Select value={lane} onChange={(e)=>setLane(e.target.value as typeof lane)}>{REVENUE_LANES.map((l)=><option key={l}>{l}</option>)}</Select><p className="md:col-span-2 text-sm text-cyan-200">Display Name Preview: {preview}</p><Button className="md:col-span-2">Create (mock)</Button></form></Card>;
}
