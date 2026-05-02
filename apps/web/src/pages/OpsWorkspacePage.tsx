import { Card, EmptyState } from '../components/primitives';
import { formatCurrency } from '../utils/format';
import { useOpsWorkspaceQueues } from '../hooks/useOrders';

const labels: Record<string, string> = {
  NEEDS_REVIEW: 'Needs Review',
  READY_FOR_VENDOR: 'Ready for Vendor',
  IN_PRODUCTION: 'In Production',
  BLOCKED: 'Blocked',
  COMPLETED: 'Completed',
};

export function OpsWorkspacePage() {
  const opsWorkspaceQueue = useOpsWorkspaceQueues();
  const sections: Array<keyof typeof opsWorkspaceQueue> = ['NEEDS_REVIEW', 'READY_FOR_VENDOR', 'IN_PRODUCTION', 'BLOCKED', 'COMPLETED'];

  return (
    <div className="grid gap-3 lg:grid-cols-5">
      {sections.map((section) => (
        <Card key={section} title={labels[section]} className="min-h-[340px]">
          {opsWorkspaceQueue[section].length === 0 ? <EmptyState title="No items" description="Queue clear." /> : (
            <div className="space-y-2 text-xs">
              {opsWorkspaceQueue[section].map((order: any) => (
                <button key={order.id} className="w-full rounded-lg panel-elevated p-2 text-left hover:bg-[#132133]">
                  <p className="font-semibold text-[var(--text-primary)]">{order.id}</p>
                  <p className="text-[var(--text-secondary)]">{order.organizationName}</p>
                  <p className="text-[#1FB6FF]">{formatCurrency(order.value)}</p>
                  <p className="text-[10px] text-[var(--text-secondary)]">{order.vendor}</p>
                </button>
              ))}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
