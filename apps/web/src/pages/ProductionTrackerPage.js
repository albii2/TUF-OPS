import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, EmptyState } from '../components/primitives';
import { formatCurrency, formatDate } from '../utils/format';
import { useOrders } from '../hooks/useOrders';
import { getStoredUser } from '../auth';
import { getOrderDueDate } from '../services/orderWorkflow';
const PRODUCTION_STAGES = [
    { key: 'ORDER_RECEIVED', label: '1. Order Received', color: 'bg-blue-400/20 text-blue-200 border-blue-400/30' },
    { key: 'ART_REVIEW', label: '2. Art Review', color: 'bg-purple-400/20 text-purple-200 border-purple-400/30' },
    { key: 'IN_PRODUCTION', label: '3. In Production', color: 'bg-amber-400/20 text-amber-200 border-amber-400/30' },
    { key: 'QC', label: '4. Quality Check', color: 'bg-cyan-400/20 text-cyan-200 border-cyan-400/30' },
    { key: 'SHIPPED', label: '5. Shipped', color: 'bg-emerald-400/20 text-emerald-200 border-emerald-400/30' },
    { key: 'COMPLETED', label: '6. Completed', color: 'bg-emerald-400/20 text-emerald-200 border-emerald-400/30' },
];
export function ProductionTrackerPage() {
    const navigate = useNavigate();
    const user = getStoredUser();
    const { data: allOrders = [] } = useOrders({});
    const [expandedStage, setExpandedStage] = useState(null);
    const myOrders = useMemo(() => {
        if (!user)
            return [];
        return allOrders.filter((order) => order.assignedRep === user.name);
    }, [allOrders, user]);
    const ordersByStage = useMemo(() => {
        const grouped = {};
        PRODUCTION_STAGES.forEach((stage) => {
            grouped[stage.key] = myOrders.filter((order) => order.productionStatus === stage.key);
        });
        return grouped;
    }, [myOrders]);
    return (<div className="space-y-3 min-w-0">
      <Card title="Production Tracker" className="min-w-0">
        <p className="mb-3 text-sm text-slate-400">
          Track where your orders are in the fulfillment pipeline.
        </p>
        {myOrders.length === 0 ? (<EmptyState title="No orders in production" description="Orders will appear here once deals are handed off to production."/>) : (<div className="space-y-2">
            {PRODUCTION_STAGES.map((stage) => {
                const orders = ordersByStage[stage.key] || [];
                const isExpanded = expandedStage === stage.key;
                return (<div key={stage.key}>
                  <button onClick={() => setExpandedStage(isExpanded ? null : stage.key)} className="w-full rounded-lg border border-slate-800 bg-slate-950/70 p-4 text-left transition hover:border-cyan-500/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold border ${stage.color}`}>
                          {orders.length}
                        </span>
                        <span className="text-sm font-bold text-white">
                          {stage.label}
                        </span>
                      </div>
                      <span className="text-slate-400 text-sm">
                        {isExpanded ? '\u25B2' : '\u25BC'}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${orders.length > 0 ? 'bg-cyan-400' : 'bg-slate-700'}`} style={{
                        width: `${Math.min((orders.length / Math.max(myOrders.length, 1)) * 100, 100)}%`,
                    }}/>
                    </div>
                  </button>
                  {isExpanded && orders.length > 0 && (<div className="mt-1 space-y-1 pl-4">
                      {orders.map((order) => (<div key={order.id} className="rounded-lg border border-slate-800 bg-slate-950/50 p-3 cursor-pointer hover:border-cyan-500/50 transition" onClick={() => navigate(`/orders/${order.id}`)}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-bold text-white text-sm">
                                {order.organizationName}
                              </p>
                              <p className="text-xs text-slate-500">
                                {order.id} · Due{' '}
                                {formatDate(getOrderDueDate(order))}
                              </p>
                            </div>
                            <span className="text-sm font-semibold text-cyan-200">
                              {formatCurrency(order.value)}
                            </span>
                          </div>
                        </div>))}
                    </div>)}
                </div>);
            })}
          </div>)}
      </Card>
    </div>);
}
//# sourceMappingURL=ProductionTrackerPage.js.map