import { useMemo, useState } from 'react';
import { Button, Card, Input, Select } from './primitives';
import { normalizeAccountName } from '../utils/naming';

type ParsedRow = Record<string, string>;
const REQUIRED = ['organization_name', 'account_type', 'city', 'state'] as const;
const TARGET_FIELDS = ['organization_name','account_type','city','state','classification_enrollment','primary_contact_name','primary_contact_email','sport_program','assigned_rep','assigned_director','territory'] as const;

function parseCsv(text: string): string[][] { return text.trim().split(/\r?\n/).map((line) => line.split(',').map((c) => c.trim())); }

export function OrganizationImportPanel({ existingKeys }: { existingKeys: string[] }) {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [mapping, setMapping] = useState<Record<string,string>>({});
  const [defaultRep, setDefaultRep] = useState('Maya Cole');
  const [defaultDirector, setDefaultDirector] = useState('Dana Holt');
  const [defaultTerritory, setDefaultTerritory] = useState('MN Territory');

  const headers = useMemo(() => Object.keys(rows[0] ?? {}), [rows]);

  const validation = useMemo(() => {
    if (!rows.length) return { valid: 0, invalid: 0, duplicates: 0, errors: [] as string[], normalized: [] as ParsedRow[] };
    const errors: string[] = [];
    const normalized = rows.map((row, idx) => {
      const mapped: ParsedRow = {};
      TARGET_FIELDS.forEach((field) => {
        const source = Object.entries(mapping).find(([,target]) => target===field)?.[0];
        mapped[field] = (source ? row[source] : '') || '';
      });
      mapped.organization_name = normalizeAccountName(mapped.organization_name);
      mapped.assigned_rep = mapped.assigned_rep || defaultRep;
      mapped.assigned_director = mapped.assigned_director || defaultDirector;
      mapped.territory = mapped.territory || defaultTerritory;
      REQUIRED.forEach((f) => { if (!mapped[f]) errors.push(`Row ${idx + 1}: missing ${f}`); });
      return mapped;
    });
    const duplicates = normalized.filter((r) => existingKeys.includes(`${r.organization_name}|${r.state}`.toLowerCase())).length;
    return { valid: Math.max(0, normalized.length - errors.length - duplicates), invalid: errors.length, duplicates, errors, normalized };
  }, [rows, mapping, defaultRep, defaultDirector, defaultTerritory, existingKeys]);

  return (
    <Card title="Owner CSV Import (Mock)">
      <div className="grid gap-2 lg:grid-cols-4">
        <input type="file" accept=".csv" className="text-sm" onChange={async (e) => {
          const file = e.target.files?.[0]; if (!file) return; const text = await file.text(); const [head, ...data] = parseCsv(text); const parsed = data.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? '']))); setRows(parsed); setMapping(Object.fromEntries(head.map((h) => [h, h])));
        }} />
        <Input value={defaultRep} onChange={(e) => setDefaultRep(e.target.value)} placeholder="Default Rep" />
        <Input value={defaultDirector} onChange={(e) => setDefaultDirector(e.target.value)} placeholder="Default Director" />
        <Input value={defaultTerritory} onChange={(e) => setDefaultTerritory(e.target.value)} placeholder="Default Territory" />
      </div>

      {headers.length ? <div className="mt-3 grid gap-2 md:grid-cols-2">{headers.map((h) => <div key={h} className="flex items-center gap-2"><span className="w-40 text-xs text-slate-300">{h}</span><Select value={mapping[h] ?? ''} onChange={(e) => setMapping((m) => ({ ...m, [h]: e.target.value }))}>{TARGET_FIELDS.map((f) => <option key={f} value={f}>{f}</option>)}</Select></div>)}</div> : null}

      {rows.length ? <div className="mt-3 overflow-auto rounded border border-slate-700"><table className="min-w-full text-xs"><thead><tr>{headers.map((h) => <th key={h} className="px-2 py-1 text-left">{h}</th>)}</tr></thead><tbody>{rows.slice(0,5).map((r,i) => <tr key={i} className="border-t border-slate-800">{headers.map((h)=><td key={h} className="px-2 py-1">{r[h]}</td>)}</tr>)}</tbody></table></div> : null}

      <div className="mt-3 rounded border border-slate-700 p-2 text-xs text-slate-300">
        <p>Import summary: valid {validation.valid} · duplicates {validation.duplicates} · invalid {validation.invalid}</p>
        {validation.errors.slice(0, 4).map((e) => <p key={e} className="text-rose-300">{e}</p>)}
      </div>
      <div className="mt-2"><Button>Import (mock only)</Button></div>
    </Card>
  );
}
