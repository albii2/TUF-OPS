import { useState } from 'react';
import { Card, Button, Select } from '../components/primitives';
import { DocumentPreview, downloadDocument, printDocument } from '../components/DocumentPreview';
import { type DocumentType, type DocumentData } from '../lib/documentGenerator';
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

export function DocumentGeneratorPage() {
  const viewer = getStoredUser();
  const users = listUsers().filter((u) => u.status === 'ACTIVE');
  const directors = users.filter((u) => u.role === 'DIRECTOR');

  const [docType, setDocType] = useState<DocumentType>('nda');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [generated, setGenerated] = useState(false);

  const selectedUser: ManagedUser | undefined = users.find((u) => u.id === selectedUserId);

  const [extraFields, setExtraFields] = useState<Record<string, string | number>>({});

  const buildDocumentData = (): DocumentData | null => {
    if (!selectedUser) return null;

    const today = new Date().toISOString().split('T')[0];
    const assignedDirector = directors.find(
      (d) => d.id === selectedUser.assignedDirectorId
    );

    const base: DocumentData = {
      type: docType,
      repName: selectedUser.displayName,
      repEmail: selectedUser.email,
      territory: selectedUser.territory || '',
      subterritory: selectedUser.subterritory || '',
      date: today,
      directorName: assignedDirector?.displayName || '',
    };

    // Merge in extra fields based on document type
    switch (docType) {
      case 'nda':
        return {
          ...base,
          companyName: (extraFields.companyName as string) || '',
          ndaTermMonths: (extraFields.ndaTermMonths as number) || 24,
        };
      case 'performance_agreement':
        return {
          ...base,
          callsPerDay: (extraFields.callsPerDay as number) || 25,
          meetingsPerWeek: (extraFields.meetingsPerWeek as number) || 5,
          dealsPerMonth: (extraFields.dealsPerMonth as number) || 2,
          reviewDate: (extraFields.reviewDate as string) || '',
        };
      case 'commission_form':
        return {
          ...base,
          commissionRate: (extraFields.commissionRate as string) || 'Standard Rate',
          paymentSchedule: (extraFields.paymentSchedule as string) || 'monthly',
        };
      case 'territory_letter':
        return {
          ...base,
          schoolCount: (extraFields.schoolCount as number) || undefined,
          zone: (extraFields.zone as string) || '',
          assignedDirector: assignedDirector?.displayName || '',
          effectiveDate: (extraFields.effectiveDate as string) || today,
        };
      case 'offer_letter':
        return {
          ...base,
          position: (extraFields.position as string) || 'Territory Account Executive (TAE)',
          startDate: (extraFields.startDate as string) || '',
          compensation: (extraFields.compensation as string) || 'Commission-based compensation per the TUF Sports Commission Schedule.',
          reportsTo: assignedDirector?.displayName || '',
        };
      default:
        return base;
    }
  };

  if (viewer?.role !== 'ADMIN') {
    return (
      <Card title="Document Generator">
        <p className="text-sm text-slate-400">Only Admin users can access the document generator.</p>
      </Card>
    );
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

  return (
    <div className="space-y-4">
      <Card title="TUF Document Generator">
        <p className="mb-4 text-sm text-slate-400">
          Generate TUF-branded legal and operational documents for representatives.
        </p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Document Type
            </label>
            <Select
              value={docType}
              onChange={(e) => {
                setDocType(e.target.value as DocumentType);
                setExtraFields({});
                setGenerated(false);
              }}
              className="w-full"
            >
              {DOCUMENT_TYPES.map((dt) => (
                <option key={dt.value} value={dt.value}>
                  {dt.label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Representative
            </label>
            <Select
              value={selectedUserId}
              onChange={(e) => {
                setSelectedUserId(e.target.value);
                setExtraFields({});
                setGenerated(false);
              }}
              className="w-full"
            >
              <option value="">— Select a representative —</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.displayName} ({u.role})
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* Dynamic extra fields */}
        {selectedUser && (
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            {docType === 'nda' && (
              <>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Company / Organization
                  </label>
                  <input
                    className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-200 placeholder:text-slate-600"
                    placeholder="Enter company name"
                    value={(extraFields.companyName as string) || ''}
                    onChange={(e) => updateField('companyName', e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    NDA Term (months)
                  </label>
                  <input
                    type="number"
                    className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-200"
                    value={extraFields.ndaTermMonths ?? 24}
                    onChange={(e) => updateField('ndaTermMonths', parseInt(e.target.value) || 24)}
                  />
                </div>
              </>
            )}

            {docType === 'performance_agreement' && (
              <>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Calls Per Day
                  </label>
                  <input
                    type="number"
                    className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-200"
                    value={extraFields.callsPerDay ?? 25}
                    onChange={(e) => updateField('callsPerDay', parseInt(e.target.value) || 25)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Meetings Per Week
                  </label>
                  <input
                    type="number"
                    className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-200"
                    value={extraFields.meetingsPerWeek ?? 5}
                    onChange={(e) => updateField('meetingsPerWeek', parseInt(e.target.value) || 5)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Deals Per Month
                  </label>
                  <input
                    type="number"
                    className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-200"
                    value={extraFields.dealsPerMonth ?? 2}
                    onChange={(e) => updateField('dealsPerMonth', parseInt(e.target.value) || 2)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Review Date
                  </label>
                  <input
                    type="date"
                    className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-200"
                    value={(extraFields.reviewDate as string) || ''}
                    onChange={(e) => updateField('reviewDate', e.target.value)}
                  />
                </div>
              </>
            )}

            {docType === 'commission_form' && (
              <>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Commission Rate
                  </label>
                  <input
                    className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-200"
                    placeholder="e.g., Standard Rate"
                    value={(extraFields.commissionRate as string) || ''}
                    onChange={(e) => updateField('commissionRate', e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Payment Schedule
                  </label>
                  <select
                    className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-200"
                    value={(extraFields.paymentSchedule as string) || 'monthly'}
                    onChange={(e) => updateField('paymentSchedule', e.target.value)}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="bi-weekly">Bi-Weekly</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              </>
            )}

            {docType === 'territory_letter' && (
              <>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    School Count
                  </label>
                  <input
                    type="number"
                    className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-200"
                    placeholder="Number of schools"
                    value={extraFields.schoolCount ?? ''}
                    onChange={(e) => updateField('schoolCount', parseInt(e.target.value) || '')}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Zone
                  </label>
                  <input
                    className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-200"
                    placeholder="e.g., Metro, North"
                    value={(extraFields.zone as string) || ''}
                    onChange={(e) => updateField('zone', e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Effective Date
                  </label>
                  <input
                    type="date"
                    className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-200"
                    value={(extraFields.effectiveDate as string) || ''}
                    onChange={(e) => updateField('effectiveDate', e.target.value)}
                  />
                </div>
              </>
            )}

            {docType === 'offer_letter' && (
              <>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Position Title
                  </label>
                  <select
                    className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-200"
                    value={(extraFields.position as string) || 'Territory Account Executive (TAE)'}
                    onChange={(e) => updateField('position', e.target.value)}
                  >
                    {POSITIONS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Start Date
                  </label>
                  <input
                    type="date"
                    className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-200"
                    value={(extraFields.startDate as string) || ''}
                    onChange={(e) => updateField('startDate', e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Compensation Summary
                  </label>
                  <input
                    className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-200"
                    placeholder="Commission-based compensation..."
                    value={(extraFields.compensation as string) || ''}
                    onChange={(e) => updateField('compensation', e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <Button
            onClick={handleGenerate}
            disabled={!selectedUserId}
            className="min-w-[140px]"
          >
            Preview
          </Button>
          <Button
            onClick={() => docData && downloadDocument(docData)}
            disabled={!generated || !docData}
            className="min-w-[140px]"
          >
            Download HTML
          </Button>
          <Button
            onClick={() => docData && printDocument(docData)}
            disabled={!generated || !docData}
            className="min-w-[140px]"
          >
            Print
          </Button>
        </div>

        {!selectedUserId && (
          <p className="mt-4 text-sm text-slate-500">
            Select a document type and representative to generate a document.
          </p>
        )}
      </Card>

      {generated && docData && (
        <Card title="Document Preview">
          <DocumentPreview data={docData} />
        </Card>
      )}
    </div>
  );
}
