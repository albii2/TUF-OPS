import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, EmptyState, Input, Select } from '../components/primitives';
import { listVendors, type Vendor } from '../services/vendorsService';

type SortField = 'rank' | 'name' | 'turnaroundDays' | 'minimumOrder';

const SPECIALIZATIONS = ['All', 'UNIFORMS', 'APPAREL', 'BAGS', 'LETTERMAN'];

const SIZE_BADGE: Record<string, string> = {
  LARGE: 'bg-blue-900/40 text-blue-300 border-blue-600/40',
  MEDIUM: 'bg-amber-900/40 text-amber-300 border-amber-600/40',
  SMALL: 'bg-slate-700/40 text-slate-300 border-slate-600/40',
};

export function VendorListPage() {
  const navigate = useNavigate();
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [filterSpecialization, setFilterSpecialization] = useState('All');
  const [search, setSearch] = useState('');

  const vendors = useMemo(() => listVendors(), []);

  const filtered = useMemo(() => {
    let result = [...vendors];

    if (filterSpecialization !== 'All') {
      result = result.filter((v) => v.specialization === filterSpecialization);
    }

    if (search.trim()) {
      const term = search.toLowerCase();
      result = result.filter(
        (v) =>
          v.name.toLowerCase().includes(term) ||
          v.specialization.toLowerCase().includes(term) ||
          v.email.toLowerCase().includes(term) ||
          v.city.toLowerCase().includes(term)
      );
    }

    result.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal ?? '');
      const bStr = String(bVal ?? '');
      return sortDir === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });

    return result;
  }, [vendors, filterSpecialization, search, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const SortHeader = ({ field, label }: { field: SortField; label: string }) => (
    <th
      className="cursor-pointer select-none py-3 pr-3 text-left hover:text-slate-200"
      onClick={() => toggleSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortField === field && (
          <span className="text-[10px]">{sortDir === 'asc' ? '▲' : '▼'}</span>
        )}
      </span>
    </th>
  );

  return (
    <div className="space-y-3 min-w-0">
      <Card title="VENDORS" className="min-w-0">
        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Input
            placeholder="Search vendors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64"
          />
          <Select
            value={filterSpecialization}
            onChange={(e) => setFilterSpecialization(e.target.value)}
            className="w-full sm:w-44"
          >
            {SPECIALIZATIONS.map((spec) => (
              <option key={spec} value={spec}>
                {spec === 'All' ? 'All Specializations' : spec}
              </option>
            ))}
          </Select>
          <span className="text-xs text-slate-500">
            {filtered.length} vendor{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Table */}
        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <SortHeader field="rank" label="Rank" />
                  <SortHeader field="name" label="Name" />
                  <th className="py-3 pr-3 text-left">Specialization</th>
                  <th className="py-3 pr-3 text-left">Size</th>
                  <SortHeader field="turnaroundDays" label="Turnaround" />
                  <SortHeader field="minimumOrder" label="Min Order" />
                  <th className="py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filtered.map((vendor) => (
                  <tr
                    key={vendor.id ?? vendor.name}
                    onClick={() => navigate(`/vendors/${vendor.id ?? vendor.name}`)}
                    className="cursor-pointer transition-colors hover:bg-slate-800/30"
                  >
                    <td className="py-3 pr-3">
                      <span className="font-mono text-xs font-bold text-slate-300">#{vendor.rank}</span>
                    </td>
                    <td className="py-3 pr-3">
                      <p className="font-semibold text-slate-100">{vendor.name}</p>
                      <p className="text-[11px] text-slate-500">
                        {vendor.city}, {vendor.country}
                      </p>
                    </td>
                    <td className="py-3 pr-3">
                      <span className="rounded-full border border-slate-600 bg-slate-800/50 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                        {vendor.specialization}
                      </span>
                    </td>
                    <td className="py-3 pr-3">
                      <span
                        className={`inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-bold uppercase ${
                          SIZE_BADGE[vendor.size] ?? 'bg-slate-800/40 text-slate-400 border-slate-600/40'
                        }`}
                      >
                        {vendor.size}
                      </span>
                    </td>
                    <td className="py-3 pr-3 text-xs text-slate-400">
                      {vendor.turnaroundDays} days
                    </td>
                    <td className="py-3 pr-3 text-xs text-slate-400">
                      {vendor.minimumOrder}
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-bold uppercase ${
                          vendor.active
                            ? 'bg-emerald-900/40 text-emerald-300 border-emerald-600/40'
                            : 'bg-red-900/40 text-red-300 border-red-600/40'
                        }`}
                      >
                        {vendor.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No vendors found"
            description={search.trim() ? 'Try a different search term or filter.' : 'No vendors match the selected filters.'}
          />
        )}
      </Card>
    </div>
  );
}
