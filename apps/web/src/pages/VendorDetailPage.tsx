import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, EmptyState, Input, Select } from '../components/primitives';
import {
  getVendorById,
  updateVendor,
  getAgreements,
  getPerformance,
  getPayments,
  getActiveOrdersForVendor,
  type Vendor,
} from '../services/vendorsService';
import { useOrders } from '../hooks/useOrders';
import { formatCurrency, formatDate } from '../utils/format';
import { notify } from '../services/feedbackService';

type TabKey = 'info' | 'orders' | 'performance' | 'payments';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'info', label: 'Info' },
  { key: 'orders', label: 'Orders' },
  { key: 'performance', label: 'Performance' },
  { key: 'payments', label: 'Payments' },
];

const SIZE_LABEL: Record<string, string> = {
  LARGE: 'Large',
  MEDIUM: 'Medium',
  SMALL: 'Small',
};

export function VendorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>('info');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Vendor>>({});
  const [refreshKey, setRefreshKey] = useState(0);

  const vendor = useMemo(() => (id ? getVendorById(id) : undefined), [id, refreshKey]);

  const allOrders = useOrders({ refreshKey });
  const activeOrderIds = useMemo(() => (id ? getActiveOrdersForVendor(id) : []), [id, refreshKey]);
  const vendorOrders = useMemo(
    () => allOrders.filter((o) => activeOrderIds.includes(o.id)),
    [allOrders, activeOrderIds]
  );

  const agreements = useMemo(() => (id ? getAgreements(id) : []), [id, refreshKey]);
  const performance = useMemo(() => (id ? getPerformance(id) : []), [id, refreshKey]);
  const payments = useMemo(() => (id ? getPayments(id) : []), [id, refreshKey]);

  if (!vendor) {
    return <EmptyState title="Vendor not found" description="The vendor could not be found." />;
  }

  const startEdit = () => {
    setEditForm({ ...vendor });
    setEditing(true);
  };

  const saveEdit = () => {
    if (!id) return;
    try {
      updateVendor(id, editForm);
      notify('Vendor updated.', 'success');
      setEditing(false);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      notify('Failed to update vendor.', 'error');
    }
  };

  const cancelEdit = () => {
    setEditing(false);
    setEditForm({});
  };

  const onTimePct = performance.length > 0
    ? Math.round((performance.filter((p) => p.onTimeDelivery).length / performance.length) * 100)
    : 0;
  const avgQuality = performance.length > 0
    ? (performance.reduce((sum, p) => sum + p.qualityRating, 0) / performance.length).toFixed(1)
    : '—';

  return (
    <div className="space-y-3 min-w-0">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">{vendor.name}</h1>
          <p className="text-sm text-slate-400">
            {vendor.specialization} · {SIZE_LABEL[vendor.size] ?? vendor.size} · {vendor.city}, {vendor.country}
          </p>
        </div>
        {!editing && (
          <Button onClick={startEdit}>Edit Vendor</Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-800">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-semibold transition border-b-2 -mb-[1px] ${
              tab === t.key
                ? 'border-[#1FB6FF] text-[#dff5ff]'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'info' && (
        <Card>
          {editing ? (
            <div className="space-y-3 max-w-lg">
              <div>
                <label className="text-xs font-bold uppercase text-slate-400">Name</label>
                <Input
                  value={editForm.name ?? ''}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-400">Email</label>
                  <Input
                    value={editForm.email ?? ''}
                    onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-400">WhatsApp</label>
                  <Input
                    value={editForm.whatsapp ?? ''}
                    onChange={(e) => setEditForm((f) => ({ ...f, whatsapp: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-400">Specialization</label>
                  <Select
                    value={editForm.specialization ?? 'UNIFORMS'}
                    onChange={(e) => setEditForm((f) => ({ ...f, specialization: e.target.value }))}
                  >
                    <option value="UNIFORMS">Uniforms</option>
                    <option value="APPAREL">Apparel</option>
                    <option value="BAGS">Bags</option>
                    <option value="LETTERMAN">Letterman</option>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-400">Size</label>
                  <Select
                    value={editForm.size ?? 'SMALL'}
                    onChange={(e) => setEditForm((f) => ({ ...f, size: e.target.value }))}
                  >
                    <option value="SMALL">Small</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LARGE">Large</option>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-400">Rank</label>
                  <Input
                    type="number"
                    value={editForm.rank ?? 1}
                    onChange={(e) => setEditForm((f) => ({ ...f, rank: Number(e.target.value) }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-400">Turnaround (days)</label>
                  <Input
                    type="number"
                    value={editForm.turnaroundDays ?? 30}
                    onChange={(e) => setEditForm((f) => ({ ...f, turnaroundDays: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-400">Min Order</label>
                  <Input
                    type="number"
                    value={editForm.minimumOrder ?? 5}
                    onChange={(e) => setEditForm((f) => ({ ...f, minimumOrder: Number(e.target.value) }))}
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={saveEdit}>Save Changes</Button>
                <button
                  onClick={cancelEdit}
                  className="rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <InfoField label="Email" value={vendor.email || '—'} />
              <InfoField label="WhatsApp" value={vendor.whatsapp || '—'} />
              <InfoField label="Location" value={`${vendor.city}, ${vendor.country}`} />
              <InfoField label="Specialization" value={vendor.specialization} />
              <InfoField label="Size" value={SIZE_LABEL[vendor.size] ?? vendor.size} />
              <InfoField label="Rank" value={`#${vendor.rank}`} />
              <InfoField label="Turnaround" value={`${vendor.turnaroundDays} days`} />
              <InfoField label="Minimum Order" value={`${vendor.minimumOrder} units`} />
              <InfoField
                label="Status"
                value={vendor.active ? 'Active' : 'Inactive'}
                valueClass={vendor.active ? 'text-emerald-300' : 'text-red-300'}
              />
            </div>
          )}
        </Card>
      )}

      {tab === 'orders' && (
        <Card title={`Active Orders (${vendorOrders.length})`}>
          {vendorOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-2 pr-3">Order ID</th>
                    <th className="py-2 pr-3">School</th>
                    <th className="py-2 pr-3">Lane</th>
                    <th className="py-2 pr-3 text-right">Value</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {vendorOrders.map((order) => (
                    <tr
                      key={order.id}
                      onClick={() => navigate(`/orders/${order.id}`)}
                      className="cursor-pointer transition-colors hover:bg-slate-800/30"
                    >
                      <td className="py-3 pr-3 font-mono text-xs text-slate-300">{order.id}</td>
                      <td className="py-3 pr-3 font-semibold text-slate-100">{order.organizationName}</td>
                      <td className="py-3 pr-3 text-xs text-slate-400">{order.lane ?? '—'}</td>
                      <td className="py-3 pr-3 text-right text-slate-200">{formatCurrency(order.value)}</td>
                      <td className="py-3">
                        <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-bold uppercase ${
                          order.productionStatus === 'COMPLETED'
                            ? 'bg-emerald-900/40 text-emerald-300 border-emerald-600/40'
                            : order.productionStatus === 'IN_PRODUCTION'
                            ? 'bg-blue-900/40 text-blue-300 border-blue-600/40'
                            : order.productionStatus === 'BLOCKED'
                            ? 'bg-red-900/40 text-red-300 border-red-600/40'
                            : 'bg-amber-900/40 text-amber-300 border-amber-600/40'
                        }`}>
                          {order.productionStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No active orders" description="This vendor has no assigned orders yet." />
          )}
        </Card>
      )}

      {tab === 'performance' && (
        <Card>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-3 text-center">
              <p className="text-xs text-slate-400">On-Time %</p>
              <p className={`text-2xl font-black ${onTimePct >= 80 ? 'text-emerald-300' : onTimePct >= 50 ? 'text-amber-300' : 'text-red-300'}`}>
                {onTimePct}%
              </p>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-3 text-center">
              <p className="text-xs text-slate-400">Avg Quality</p>
              <p className="text-2xl font-black text-sky-300">{avgQuality}/5</p>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-3 text-center">
              <p className="text-xs text-slate-400">Orders Completed</p>
              <p className="text-2xl font-black text-slate-200">{performance.length}</p>
            </div>
          </div>
          {performance.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-2 pr-3">Date</th>
                    <th className="py-2 pr-3">Order</th>
                    <th className="py-2 pr-3">On Time</th>
                    <th className="py-2 pr-3">Quality</th>
                    <th className="py-2">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {performance.map((p) => (
                    <tr key={p.id}>
                      <td className="py-3 pr-3 text-xs text-slate-400">{formatDate(p.recordedAt)}</td>
                      <td className="py-3 pr-3 font-mono text-xs text-slate-300">{p.orderId}</td>
                      <td className="py-3 pr-3">
                        <span className={p.onTimeDelivery ? 'text-emerald-300' : 'text-red-300'}>
                          {p.onTimeDelivery ? '✓' : '✗'}
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-xs text-slate-300">{p.qualityRating}/5</td>
                      <td className="py-3 text-xs text-slate-500">{p.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No performance records" description="No performance data available yet." />
          )}
        </Card>
      )}

      {tab === 'payments' && (
        <Card title={`Payment History (${payments.length})`}>
          {payments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-2 pr-3">Date</th>
                    <th className="py-2 pr-3">Order</th>
                    <th className="py-2 pr-3 text-right">Amount</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2">Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td className="py-3 pr-3 text-xs text-slate-400">{formatDate(p.createdAt)}</td>
                      <td className="py-3 pr-3 font-mono text-xs text-slate-300">{p.orderId}</td>
                      <td className="py-3 pr-3 text-right text-slate-200">{formatCurrency(p.amount)}</td>
                      <td className="py-3 pr-3">
                        <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-bold uppercase ${
                          p.status === 'PAID'
                            ? 'bg-emerald-900/40 text-emerald-300 border-emerald-600/40'
                            : p.status === 'PROCESSING'
                            ? 'bg-blue-900/40 text-blue-300 border-blue-600/40'
                            : 'bg-amber-900/40 text-amber-300 border-amber-600/40'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 text-xs text-slate-500">{formatDate(p.dueDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No payments" description="No payment records for this vendor." />
          )}
        </Card>
      )}
    </div>
  );
}

function InfoField({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${valueClass ?? 'text-slate-200'}`}>{value}</p>
    </div>
  );
}
