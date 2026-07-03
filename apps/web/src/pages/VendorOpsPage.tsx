import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, SmallKpi } from '../components/primitives';
import { useOrders } from '../hooks/useOrders';
import { useOpportunities } from '../hooks/useOpportunities';
import { listVendors, getActiveOrdersForVendor } from '../services/vendorsService';
import { formatCurrency } from '../utils/format';
import type { Order } from '../data/mockSalesData';

const STAGE_LABELS: Record<string, { label: string; color: string }> = {
  UNASSIGNED: { label: 'Unassigned', color: 'bg-slate-600' },
  NEEDS_REVIEW: { label: 'Needs Review', color: 'bg-amber-500' },
  READY_FOR_VENDOR: { label: 'Ready for Vendor', color: 'bg-blue-500' },
  IN_PRODUCTION: { label: 'In Production', color: 'bg-sky-400' },
  BLOCKED: { label: 'Blocked', color: 'bg-red-500' },
  COMPLETED: { label: 'Completed', color: 'bg-emerald-500' },
};

function pipelineStage(order: Order): string {
  if (order.productionStatus === 'COMPLETED') return 'SHIPPED';
  if (order.productionStatus === 'BLOCKED') return 'BLOCKED';
  if (order.productionStatus === 'IN_PRODUCTION') {
    if (order.orderStage === 'QUALITY_CHECK') return 'QC';
    return 'IN_PRODUCTION';
  }
  if (order.productionStatus === 'READY_FOR_VENDOR') return 'VENDOR_READY';
  return 'UNASSIGNED';
}

const PIPELINE_ORDER = ['UNASSIGNED', 'VENDOR_READY', 'IN_PRODUCTION', 'QC', 'SHIPPED', 'BLOCKED'];

const PIPELINE_LABELS: Record<string, string> = {
  UNASSIGNED: 'Unassigned',
  VENDOR_READY: 'Vendor Ready',
  IN_PRODUCTION: 'In Production',
  QC: 'Quality Check',
  SHIPPED: 'Shipped',
  BLOCKED: 'Blocked',
};

function MetricCard({ label, value, colorClass }: { label: string; value: string | number; colorClass: string }) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`mt-1 text-3xl font-black ${colorClass}`}>{value}</p>
    </div>
  );
}

export function VendorOpsPage() {
  const navigate = useNavigate();
  const allOrders = useOrders({});
  const allOpportunities = useOpportunities({});
  const vendors = useMemo(() => listVendors(), []);

  const metrics = useMemo(() => {
    const activeVendors = vendors.filter((v) => v.active).length;
    const inProduction = allOrders.filter((o) => o.productionStatus === 'IN_PRODUCTION').length;
    const pendingAssignment = allOrders.filter(
      (o) => o.productionStatus === 'NEEDS_REVIEW' || o.productionStatus === 'READY_FOR_VENDOR'
    ).length;
    const completedThisWeek = allOrders.filter((o) => o.productionStatus === 'COMPLETED').length;
    return { activeVendors, inProduction, pendingAssignment, completedThisWeek };
  }, [vendors, allOrders]);

  const pipelineGroups = useMemo(() => {
    const groups: Record<string, Order[]> = {};
    PIPELINE_ORDER.forEach((stage) => { groups[stage] = []; });
    allOrders.forEach((order) => {
      const stage = pipelineStage(order);
      if (groups[stage]) groups[stage].push(order);
    });
    return groups;
  }, [allOrders]);

  const vendorCapacity = useMemo(() => {
    return vendors
      .filter((v) => v.active)
      .map((v) => {
        const activeCount = getActiveOrdersForVendor(v.id ?? '').length;
        const capacity = v.size === 'LARGE' ? 50 : v.size === 'MEDIUM' ? 30 : 15;
        const pct = Math.min(100, Math.round((activeCount / capacity) * 100));
        return { name: v.name, activeCount, capacity, pct, specialization: v.specialization };
      })
      .sort((a, b) => b.pct - a.pct);
  }, [vendors]);

  return (
    <div className="space-y-4 min-w-0">
      {/* Header */}
      <div className="mb-2">
        <h1 className="text-2xl font-black tracking-tight text-white">VENDOR OPERATIONS</h1>
        <p className="text-sm text-slate-400">Production pipeline, vendor capacity, and order assignments</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard label="Active Vendors" value={metrics.activeVendors} colorClass="text-blue-300" />
        <MetricCard label="In Production" value={metrics.inProduction} colorClass="text-sky-300" />
        <MetricCard label="Pending Assignment" value={metrics.pendingAssignment} colorClass="text-amber-300" />
        <MetricCard label="Completed (Total)" value={metrics.completedThisWeek} colorClass="text-emerald-300" />
      </div>

      {/* Production Pipeline */}
      <Card title="PRODUCTION PIPELINE">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {PIPELINE_ORDER.map((stage) => {
            const orders = pipelineGroups[stage];
            const colorMap: Record<string, string> = {
              UNASSIGNED: 'border-slate-600 bg-slate-900/50',
              VENDOR_READY: 'border-blue-700 bg-blue-950/30',
              IN_PRODUCTION: 'border-sky-700 bg-sky-950/30',
              QC: 'border-yellow-700 bg-yellow-950/30',
              SHIPPED: 'border-emerald-700 bg-emerald-950/30',
              BLOCKED: 'border-red-700 bg-red-950/30',
            };
            return (
              <div key={stage} className={`rounded-lg border p-3 ${colorMap[stage] ?? 'border-slate-700 bg-slate-900/50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                    {PIPELINE_LABELS[stage]}
                  </span>
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-bold text-slate-300">
                    {orders.length}
                  </span>
                </div>
                {orders.length === 0 ? (
                  <p className="text-xs text-slate-600 italic">No orders</p>
                ) : (
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {orders.slice(0, 6).map((order) => {
                      const opp = allOpportunities.find((o) => o.id === order.opportunityId);
                      return (
                        <div
                          key={order.id}
                          onClick={() => navigate(`/orders/${order.id}`)}
                          className="cursor-pointer rounded border border-slate-700/50 bg-slate-800/40 px-2 py-1 text-xs hover:bg-slate-700/40"
                        >
                          <p className="font-semibold text-slate-200 truncate">{order.organizationName}</p>
                          <p className="text-[10px] text-slate-500">
                            {opp?.lanes?.[0] ?? order.lane ?? '—'} · {formatCurrency(order.value)}
                          </p>
                        </div>
                      );
                    })}
                    {orders.length > 6 && (
                      <p className="text-[10px] text-slate-500 italic">+{orders.length - 6} more</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Vendor Capacity */}
      <Card title="VENDOR CAPACITY">
        <div className="space-y-3">
          {vendorCapacity.map((vc) => (
            <div key={vc.name} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">
                  {vc.name}
                  <span className="ml-2 text-[10px] text-slate-500">{vc.specialization}</span>
                </span>
                <span className="text-slate-400">
                  {vc.activeCount} / {vc.capacity} orders
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    vc.pct > 80 ? 'bg-red-500' : vc.pct > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${vc.pct}%` }}
                />
              </div>
            </div>
          ))}
          {vendorCapacity.length === 0 && (
            <p className="text-sm text-slate-500">No active vendors.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
