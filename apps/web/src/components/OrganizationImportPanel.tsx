import { useMemo, useState } from 'react';
import { Button, Card } from './primitives';
import { getStoredUser } from '../auth';
import { mapCsvHeaders, normalizeLeadRow, parseCsvText } from '../utils/leadImport';
import { importLeadRows } from '../services/organizationsService';

export function OrganizationImportPanel({ existingKeys, onImported }: { existingKeys: string[]; onImported?: () => void }) {
  const user = getStoredUser();
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [normalized, setNormalized] = useState<ReturnType<typeof normalizeLeadRow>[]>([]);
  const [importMessage, setImportMessage] = useState('');

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
      <p className="mt-2 text-xs text-slate-400">CSV imports add all valid leads to Organizations and leave Rep/Director/Territory unassigned for owner-director routing.</p>
      <div className="mt-2 text-xs text-slate-300">Rows detected: {summary.rows} · Valid: {summary.valid} · Invalid: {summary.invalid} · Duplicates: {summary.duplicates} · Ready to import: {summary.ready}</div>
      {rows.length ? <div className="mt-2 overflow-auto rounded border border-slate-700"><table className="min-w-full text-xs"><thead><tr><th className="px-2 py-1 text-left">organizationName</th><th className="px-2 py-1 text-left">accountType</th><th className="px-2 py-1 text-left">territory</th><th className="px-2 py-1 text-left">validation</th></tr></thead><tbody>{normalized.slice(0,8).map((r, i) => <tr key={i} className="border-t border-slate-800"><td className="px-2 py-1">{r.organizationName}</td><td className="px-2 py-1">{r.accountType}</td><td className="px-2 py-1">{r.territory || 'UNASSIGNED'}</td><td className="px-2 py-1 text-rose-300">{r.validationErrors.join('; ') || 'ok'}</td></tr>)}</tbody></table></div> : null}
      <div className="mt-2"><Button onClick={() => {
        const result = importLeadRows(normalized);
        setImportMessage(result.created ? `Imported ${result.created} accounts into the mock organization table. Invalid: ${result.invalid}. Duplicates: ${result.duplicates}.` : 'No new valid rows to import yet.');
        if (result.created) onImported?.();
      }}>Import to Mock Accounts</Button></div>
      {importMessage ? <p className="mt-2 text-xs text-cyan-300">{importMessage}</p> : null}
    </Card>
  );
}
