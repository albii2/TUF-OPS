import { opsWorkspaceQueue } from '../data/mockSalesData';
import { Card, EmptyState } from '../components/primitives';
import { formatCurrency } from '../utils/format';

const sections: Array<keyof typeof opsWorkspaceQueue> = ['NEEDS_REVIEW', 'READY_FOR_VENDOR', 'IN_PRODUCTION', 'BLOCKED', 'COMPLETED'];

export function OpsWorkspacePage() {
  return (
    <div className="grid gap-3 lg:grid-cols-5">
      {sections.map((section) => (
        <Card key={section} title={section.split('_').join(' ')}>
          {opsWorkspaceQueue[section].length === 0 ? <EmptyState title="No items" description="Queue clear." /> : (
            <div className="space-y-2 text-xs">
              {opsWorkspaceQueue[section].map((order) => (
                <div key={order.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-2">
                  <p className="font-medium text-slate-200">{order.id}</p>
                  <p className="text-slate-400">{order.organizationName}</p>
                  <p className="text-cyan-300">{formatCurrency(order.value)}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
