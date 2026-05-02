import { useMemo, useState } from 'react';
import { Button, Card } from './primitives';
import { getStoredUser } from '../auth';
import { mapCsvHeaders, normalizeLeadRow, parseCsvText } from '../utils/leadImport';

export function OrganizationImportPanel({ existingKeys }: { existingKeys: string[] }) {
  const user = getStoredUser();
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [normalized, setNormalized] = useState<ReturnType<typeof normalizeLeadRow>[]>([]);
  const [headerMap, setHeaderMap] = useState<Record<string, string>>({});
  const [defaultRep, setDefaultRep] = useState('Maya Cole');
  const [defaultDirector, setDefaultDirector] = useState('Dana Holt');
  const [defaultTerritory, setDefaultTerritory] = useState('metro');

  const summary = useMemo(() => {
    const invalid = normalized.filter((r) => r.validationErrors.length).length;
    const duplicates = normalized.filter((r) => existingKeys.includes(r.duplicateKey)).length;
    return { rows: rows.length, valid: normalized.length - invalid - duplicates, invalid, duplicates, ready: Math.max(0, normalized.length - invalid - duplicates) };
  }, [rows.length, normalized, existingKeys]);

  if (!user || user.role !== 'OWNER') return null;

  return (
    <Card title="Owner Lead Import (Mock)">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <input type="file" accept=".csv" onChange={async (e) => {
          const file = e.target.files?.[0]; if (!file) return; const text = await file.text(); const [head, ...data] = parseCsvText(text);
          const mapped = mapCsvHeaders(head); setHeaderMap(mapped);
          const parsed = data.map((r) => Object.fromEntries(head.map((h, i) => [mapped[h], r[i] ?? ''])));
          setRows(parsed);
          setNormalized(parsed.map((row) => {
            const n = normalizeLeadRow(row); n.territory = (n.territory || defaultTerritory) as any; if (!row.assigned_rep) row.assigned_rep = defaultRep; if (!row.assigned_director) row.assigned_director = defaultDirector; return n;
          }));
        }} />
        <input className="rounded border border-slate-700 bg-slate-900 px-2 py-1" value={defaultRep} onChange={(e) => setDefaultRep(e.target.value)} placeholder="default rep" />
        <input className="rounded border border-slate-700 bg-slate-900 px-2 py-1" value={defaultDirector} onChange={(e) => setDefaultDirector(e.target.value)} placeholder="default director" />
        <select className="rounded border border-slate-700 bg-slate-900 px-2 py-1" value={defaultTerritory} onChange={(e) => setDefaultTerritory(e.target.value)}><option>metro</option><option>north</option><option>west</option><option>south</option></select>
      </div>
      <div className="mt-2 text-xs text-slate-300">Rows detected: {summary.rows} · Valid: {summary.valid} · Invalid: {summary.invalid} · Duplicates: {summary.duplicates} · Ready to import: {summary.ready}</div>
      {rows.length ? <div className="mt-2 overflow-auto rounded border border-slate-700"><table className="min-w-full text-xs"><thead><tr><th className="px-2 py-1 text-left">organizationName</th><th className="px-2 py-1 text-left">accountType</th><th className="px-2 py-1 text-left">territory</th><th className="px-2 py-1 text-left">sports</th><th className="px-2 py-1 text-left">validation</th></tr></thead><tbody>{normalized.slice(0,8).map((r, i) => <tr key={i} className="border-t border-slate-800"><td className="px-2 py-1">{r.organizationName}</td><td className="px-2 py-1">{r.accountType}</td><td className="px-2 py-1">{r.territory || defaultTerritory}</td><td className="px-2 py-1">{r.sportsOffered.join(', ')}</td><td className="px-2 py-1 text-rose-300">{r.validationErrors.join('; ') || 'ok'}</td></tr>)}</tbody></table></div> : null}
      <div className="mt-2"><Button>Import (preview-only)</Button></div>
    </Card>
  );
}
