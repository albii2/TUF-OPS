import { useMemo, useState } from 'react';
import { Button, Card } from './primitives';
import { getStoredUser } from '../auth';
import { mapCsvHeaders, normalizeLeadRow, parseCsvText } from '../utils/leadImport';

export function OrganizationImportPanel({ existingKeys, onImported }: { existingKeys: string[]; onImported?: (ids: string[]) => void }) {
  const user = getStoredUser();
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [normalized, setNormalized] = useState<ReturnType<typeof normalizeLeadRow>[]>([]);
  const [importMessage, setImportMessage] = useState('');

  const summary = useMemo(() => {
    const invalid = normalized.filter((r) => r.validationErrors.length).length;
    const duplicates = normalized.filter((r) => existingKeys.includes(r.duplicateKey)).length;
    return { rows: rows.length, valid: normalized.length - invalid - duplicates, invalid, duplicates, ready: Math.max(0, normalized.length - invalid - duplicates) };
  }, [rows.length, normalized, existingKeys]);

  if (!user || user.role !== 'ADMIN') return null;

  return (
    <Card title="Lead Import">
      <div className="mb-2 grid gap-2 text-xs sm:grid-cols-4"><p className="rounded border border-slate-700 px-2 py-1">1. Upload CSV</p><p className="rounded border border-slate-700 px-2 py-1">2. Validate Leads</p><p className="rounded border border-slate-700 px-2 py-1">3. Import Accounts</p><p className="rounded border border-slate-700 px-2 py-1">4. Assign Ownership</p></div><div className="flex flex-wrap items-center gap-2 text-xs">
        <input type="file" accept=".csv" onChange={async (e) => {
          const file = e.target.files?.[0]; if (!file) return; const text = await file.text(); const [head = [], ...data] = parseCsvText(text);
          if (!head.length) { setImportMessage('No CSV headers found. Choose a file with the lead import columns.'); return; }
          const mapped = mapCsvHeaders(head);
          const parsed = data.map((r) => Object.fromEntries(head.map((h, i) => [mapped[h], r[i] ?? ''])));
          setRows(parsed);
          setNormalized(parsed.map((row) => {
            return normalizeLeadRow(row);
          }));
        }} />
      </div>
      <p className="mt-2 text-xs text-slate-400">Use this flow to import lead accounts, validate quality, and keep CSV zones locked before assigning directors/reps.</p>
      <div className="mt-2 text-xs text-slate-300">Rows detected: {summary.rows} · Valid: {summary.valid} · Duplicates: {summary.duplicates} · Ready: {summary.ready}</div>
      {rows.length ? <div className="mt-2 overflow-auto rounded border border-slate-700"><table className="min-w-full text-xs"><thead><tr><th className="px-2 py-1 text-left">organizationName</th><th className="px-2 py-1 text-left">accountType</th><th className="px-2 py-1 text-left">territory</th><th className="px-2 py-1 text-left">Contacts</th><th className="px-2 py-1 text-left">validation</th></tr></thead><tbody>{normalized.slice(0,8).map((r, i) => <tr key={i} className="border-t border-slate-800"><td className="px-2 py-1">{r.organizationName}</td><td className="px-2 py-1">{r.accountType}</td><td className="px-2 py-1">{r.territory || 'UNASSIGNED'}</td><td className="px-2 py-1">School {r.phone || '—'} · AD {r.athleticDirectorEmail || r.athleticDirectorPhone || '—'} · Coach {r.headCoachEmail || r.headCoachPhone || '—'}</td><td className="px-2 py-1 text-rose-300">{r.validationErrors.join('; ') || 'ok'}</td></tr>)}</tbody></table></div> : null}
      <div className="mt-2"><Button onClick={() => {
        setImportMessage('Lead import is not available in API mode. Use the API to create organizations.');
      }}>Import Accounts</Button></div>
      {importMessage ? <p className="mt-2 text-xs text-cyan-300">{importMessage}</p> : null}
    </Card>
  );
}
