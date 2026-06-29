import { useState, useRef } from 'react';
import { Card, Button, Select } from '../components/primitives';
import { DocumentPreview, downloadDocument, printDocument } from '../components/DocumentPreview';
import { type DocumentType, type DocumentData } from '../lib/documentGenerator';
import { convertMarkdownToTufHtml } from '../lib/markdownToTufDocument';
import { listUsers, type ManagedUser } from '../services/usersService';
import { getStoredUser } from '../auth';

const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'nda', label: 'NDA — Non-Disclosure Agreement' },
  { value: 'performance_agreement', label: '90-Day Performance Agreement' },
  { value: 'commission_form', label: 'Commission Payment Form' },
  { value: 'territory_letter', label: 'Territory Assignment Letter' },
  { value: 'offer_letter', label: 'Offer Letter' },
];

const POSITIONS = ['Territory Account Executive (TAE)', 'State Director', 'Regional Director'];

type TabMode = 'generated' | 'markdown';

// ========== Inline HTML preview for markdown mode ==========
function MarkdownPreview({ html }: { html: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const urlRef = useRef<string>('');

  // Create blob URL when html changes
  if (html && (!urlRef.current || urlRef.current)) {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    const blob = new Blob([html], { type: 'text/html' });
    urlRef.current = URL.createObjectURL(blob);
  }

  if (!html) return null;

  return (
    <iframe
      ref={iframeRef}
      src={urlRef.current}
      sandbox="allow-same-origin"
      title="Markdown Document Preview"
      style={{
        width: '100%',
        height: '700px',
        border: '1px solid #d8d8d8',
        borderRadius: '4px',
        backgroundColor: '#ffffff',
      }}
    />
  );
}

function downloadMarkdownHtml(html: string, fallbackName = 'document') {
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `TUF_${fallbackName}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function printMarkdownHtml(html: string) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => printWindow.print();
  if (printWindow.document.readyState === 'complete') {
    printWindow.print();
  }
}

export function DocumentGeneratorPage() {
  const viewer = getStoredUser();
  const users = listUsers().filter((u) => u.status === 'ACTIVE');
  const directors = users.filter((u) => u.role === 'DIRECTOR');

  // ── Tab state ──
  const [tab, setTab] = useState<TabMode>('generated');

  // ── Generated Forms state ──
  const [docType, setDocType] = useState<DocumentType>('nda');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [generated, setGenerated] = useState(false);
  const [extraFields, setExtraFields] = useState<Record<string, string | number>>({});

  // ── Markdown state ──
  const [rawMd, setRawMd] = useState('');
  const [mdHtml, setMdHtml] = useState('');
  const [mdGenerated, setMdGenerated] = useState(false);

  const selectedUser: ManagedUser | undefined = users.find((u) => u.id === selectedUserId);

  const handleMarkdownFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setRawMd(reader.result as string);
      setMdGenerated(false);
    };
    reader.readAsText(file);
  };

  const handleConvertMarkdown = () => {
    if (!rawMd.trim()) return;
    try {
      const html = convertMarkdownToTufHtml(rawMd);
      setMdHtml(html);
      setMdGenerated(true);
    } catch (err) {
      console.error('Markdown conversion failed:', err);
    }
  };

  // ── Generate form document data ──
  const buildDocumentData = (): DocumentData | null => {
    if (!selectedUser) return null;
    const today = new Date().toISOString().split('T')[0];
    const assignedDirector = directors.find((d) => d.id === selectedUser.assignedDirectorId);
    const base: DocumentData = {
      type: docType,
      repName: selectedUser.displayName,
      repEmail: selectedUser.email,
      territory: selectedUser.territory || '',
      subterritory: selectedUser.subterritory || '',
      date: today,
      directorName: assignedDirector?.displayName || '',
    };
    switch (docType) {
      case 'nda': return { ...base, companyName: (extraFields.companyName as string) || '', ndaTermMonths: (extraFields.ndaTermMonths as number) || 24 };
      case 'performance_agreement': return { ...base, callsPerDay: (extraFields.callsPerDay as number) || 25, meetingsPerWeek: (extraFields.meetingsPerWeek as number) || 5, dealsPerMonth: (extraFields.dealsPerMonth as number) || 2, reviewDate: (extraFields.reviewDate as string) || '' };
      case 'commission_form': return { ...base, commissionRate: (extraFields.commissionRate as string) || 'Standard Rate', paymentSchedule: (extraFields.paymentSchedule as string) || 'monthly' };
      case 'territory_letter': return { ...base, schoolCount: (extraFields.schoolCount as number) || undefined, zone: (extraFields.zone as string) || '', assignedDirector: assignedDirector?.displayName || '', effectiveDate: (extraFields.effectiveDate as string) || today };
      case 'offer_letter': return { ...base, position: (extraFields.position as string) || 'Territory Account Executive (TAE)', startDate: (extraFields.startDate as string) || '', compensation: (extraFields.compensation as string) || 'Commission-based compensation per the TUF Sports Commission Schedule.', reportsTo: assignedDirector?.displayName || '' };
      default: return base;
    }
  };

  if (viewer?.role !== 'ADMIN') {
    return <Card title="Document Generator"><p className="text-sm text-slate-400">Only Admin users can access the document generator.</p></Card>;
  }

  const handleGenerate = () => {
    if (!selectedUserId || !buildDocumentData()) return;
    setGenerated(true);
  };

  const docData = buildDocumentData();

  const updateField = (key: string, value: string | number) => {
    setExtraFields((prev) => ({ ...prev, [key]: value }));
    if (generated) setGenerated(false);
  };

  const tabStyle = (active: boolean) =>
    `px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition ${
      active
        ? 'border-[#3b82f6] text-[#dff5ff] bg-[#0d2234]'
        : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#0d1723]'
    }`;

  return (
    <div className="space-y-4">
      <Card title="TUF Document Generator">
        <p className="mb-4 text-sm text-slate-400">
          Generate TUF-branded legal and operational documents.
        </p>

        {/* ── Tabs ── */}
        <div className="mb-6 flex gap-1 border-b border-slate-700">
          <button onClick={() => setTab('generated')} className={tabStyle(tab === 'generated')}>
            📋 Generated Forms
          </button>
          <button onClick={() => setTab('markdown')} className={tabStyle(tab === 'markdown')}>
            📝 Markdown → PDF Style
          </button>
        </div>

        {/* ══════════════ GENERATED FORMS TAB ══════════════ */}
        {tab === 'generated' && (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">Document Type</label>
                <Select value={docType} onChange={(e) => { setDocType(e.target.value as DocumentType); setExtraFields({}); setGenerated(false); }} className="w-full">
                  {DOCUMENT_TYPES.map((dt) => (<option key={dt.value} value={dt.value}>{dt.label}</option>))}
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">Representative</label>
                <Select value={selectedUserId} onChange={(e) => { setSelectedUserId(e.target.value); setExtraFields({}); setGenerated(false); }} className="w-full">
                  <option value="">— Select a representative —</option>
                  {users.map((u) => (<option key={u.id} value={u.id}>{u.displayName} ({u.role})</option>))}
                </Select>
              </div>
            </div>

            {selectedUser && (
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                {docType === 'nda' && (<>
                  <div><label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">Company / Organization</label><input className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-200 placeholder:text-slate-600" placeholder="Enter company name" value={(extraFields.companyName as string) || ''} onChange={(e) => updateField('companyName', e.target.value)} /></div>
                  <div><label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">NDA Term (months)</label><input type="number" className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-200" value={extraFields.ndaTermMonths ?? 24} onChange={(e) => updateField('ndaTermMonths', parseInt(e.target.value) || 24)} /></div>
                </>)}
                {docType === 'performance_agreement' && (<>
                  <div><label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">Calls Per Day</label><input type="number" className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-200" value={extraFields.callsPerDay ?? 25} onChange={(e) => updateField('callsPerDay', parseInt(e.target.value) || 25)} /></div>
                  <div><label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">Meetings Per Week</label><input type="number" className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-200" value={extraFields.meetingsPerWeek ?? 5} onChange={(e) => updateField('meetingsPerWeek', parseInt(e.target.value) || 5)} /></div>
                  <div><label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">Deals Per Month</label><input type="number" className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-200" value={extraFields.dealsPerMonth ?? 2} onChange={(e) => updateField('dealsPerMonth', parseInt(e.target.value) || 2)} /></div>
                  <div><label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">Review Date</label><input type="date" className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-200" value={(extraFields.reviewDate as string) || ''} onChange={(e) => updateField('reviewDate', e.target.value)} /></div>
                </>)}
                {docType === 'commission_form' && (<>
                  <div><label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">Commission Rate</label><input className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-200" placeholder="e.g., Standard Rate" value={(extraFields.commissionRate as string) || ''} onChange={(e) => updateField('commissionRate', e.target.value)} /></div>
                  <div><label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">Payment Schedule</label><select className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-200" value={(extraFields.paymentSchedule as string) || 'monthly'} onChange={(e) => updateField('paymentSchedule', e.target.value)}><option value="monthly">Monthly</option><option value="bi-weekly">Bi-Weekly</option><option value="weekly">Weekly</option></select></div>
                </>)}
                {docType === 'territory_letter' && (<>
                  <div><label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">School Count</label><input type="number" className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-200" placeholder="Number of schools" value={extraFields.schoolCount ?? ''} onChange={(e) => updateField('schoolCount', parseInt(e.target.value) || '')} /></div>
                  <div><label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">Zone</label><input className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-200" placeholder="e.g., Metro, North" value={(extraFields.zone as string) || ''} onChange={(e) => updateField('zone', e.target.value)} /></div>
                  <div><label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">Effective Date</label><input type="date" className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-200" value={(extraFields.effectiveDate as string) || ''} onChange={(e) => updateField('effectiveDate', e.target.value)} /></div>
                </>)}
                {docType === 'offer_letter' && (<>
                  <div><label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">Position Title</label><select className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-200" value={(extraFields.position as string) || 'Territory Account Executive (TAE)'} onChange={(e) => updateField('position', e.target.value)}>{POSITIONS.map((p) => (<option key={p} value={p}>{p}</option>))}</select></div>
                  <div><label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">Start Date</label><input type="date" className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-200" value={(extraFields.startDate as string) || ''} onChange={(e) => updateField('startDate', e.target.value)} /></div>
                  <div><label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">Compensation Summary</label><input className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-200" placeholder="Commission-based compensation..." value={(extraFields.compensation as string) || ''} onChange={(e) => updateField('compensation', e.target.value)} /></div>
                </>)}
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <Button onClick={handleGenerate} disabled={!selectedUserId} className="min-w-[140px]">Preview</Button>
              <Button onClick={() => docData && downloadDocument(docData)} disabled={!generated || !docData} className="min-w-[140px]">Download HTML</Button>
              <Button onClick={() => docData && printDocument(docData)} disabled={!generated || !docData} className="min-w-[140px]">Print</Button>
            </div>
            {!selectedUserId && <p className="mt-4 text-sm text-slate-500">Select a document type and representative to generate a document.</p>}
          </>
        )}

        {/* ══════════════ MARKDOWN TAB ══════════════ */}
        {tab === 'markdown' && (
          <>
            <p className="mb-3 text-xs text-slate-400">
              Paste markdown below or upload a <code className="text-cyan-300">.md</code> file. It will be converted to a TUF PDF-style document matching the exact design of the Launch Packet.
            </p>

            <div className="mb-4 flex gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-300 hover:bg-slate-900 transition">
                📁 Upload .md File
                <input type="file" accept=".md,.markdown,text/markdown" onChange={handleMarkdownFile} className="hidden" />
              </label>
              {rawMd && (
                <button
                  onClick={() => { setRawMd(''); setMdHtml(''); setMdGenerated(false); }}
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                >
                  Clear
                </button>
              )}
            </div>

            <textarea
              className="h-64 w-full rounded-lg border border-slate-700 bg-slate-950 p-4 text-sm text-slate-200 font-mono placeholder:text-slate-600 resize-y"
              placeholder={`---
title: Territory Account Executive Launch Packet
subtitle: Your Territory. Your Relationships. Your Results.
confidential: CONFIDENTIAL
version: 1.0
date: SUMMER 2026
---

## SECTION 01 — WELCOME

Welcome to TUF Sports Apparel. You are now part of one of the most
motivated sales teams in the athletic apparel industry.

### KEY METRICS

| Metric | Target | Frequency |
|--------|--------|-----------|
| Calls | 40+ | Weekly |
| Meetings | 5+ | Weekly |
| Orders | 4+ | Monthly |

> The market is full of opportunity. Your results come down entirely
> to what you put in.

- Build relationships with Athletic Directors
- Develop multi-sport partnerships
- Generate consistent recurring revenue
`}
              value={rawMd}
              onChange={(e) => { setRawMd(e.target.value); setMdGenerated(false); }}
            />

            <div className="mt-4 flex gap-3">
              <Button onClick={handleConvertMarkdown} disabled={!rawMd.trim()} className="min-w-[140px]">
                Convert &amp; Preview
              </Button>
              <Button onClick={() => mdHtml && downloadMarkdownHtml(mdHtml, 'document')} disabled={!mdGenerated} className="min-w-[140px]">
                Download HTML
              </Button>
              <Button onClick={() => mdHtml && printMarkdownHtml(mdHtml)} disabled={!mdGenerated} className="min-w-[140px]">
                Print
              </Button>
            </div>

            {!rawMd.trim() && (
              <p className="mt-4 text-sm text-slate-500">
                Paste or upload markdown content, then click Convert &amp; Preview.
              </p>
            )}
          </>
        )}
      </Card>

      {/* ── Generated Forms Preview ── */}
      {tab === 'generated' && generated && docData && (
        <Card title="Document Preview">
          <DocumentPreview data={docData} />
        </Card>
      )}

      {/* ── Markdown Preview ── */}
      {tab === 'markdown' && mdGenerated && mdHtml && (
        <Card title="Document Preview — PDF Style">
          <MarkdownPreview html={mdHtml} />
        </Card>
      )}
    </div>
  );
}
