import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, EmptyState } from '../components/primitives';
import { formatCurrency, formatDate } from '../utils/format';
import { useOrders } from '../hooks/useOrders';
import { getStoredUser } from '../auth';
import { getOrderStageLabel, getOrderRisk, getOrderDueDate } from '../services/orderWorkflow';
import type { Order } from '../data/mockSalesData';

export function RepOrdersPage() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const { data: allOrders = [] } = useOrders({});

  const myOrders = useMemo(() => {
    if (!user) return [];
    return allOrders.filter((order: Order) => order.assignedRep === user.name);
  }, [allOrders, user]);

  return (
    <div className="space-y-3 min-w-0">
      <Card title="My Orders" className="min-w-0">
        <p className="mb-3 text-sm text-slate-400">
          Your orders and their production status.
        </p>
        {myOrders.length === 0 ? (
          <EmptyState
            title="No orders yet"
            description="Orders will appear here once deals are Closed Won and handed off to production."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50">
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    School
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Due Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {myOrders.map((order) => {
                  const risk = getOrderRisk(order);
                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-900/30 transition-colors cursor-pointer"
                      onClick={() => navigate(`/orders/${order.id}`)}
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-cyan-300">{order.id}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-white">{order.organizationName}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${risk.tone}`}>
                          {getOrderStageLabel(order)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-semibold text-cyan-200">
                          {formatCurrency(order.value)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-slate-400">
                          {formatDate(getOrderDueDate(order))}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
