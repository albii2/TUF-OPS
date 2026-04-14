import { NextAction } from "@/types/dashboard";
import { DashboardSectionCard } from "./dashboard-section-card";
import { DashboardActionItem } from "./dashboard-action-item";
import { EmptyState } from "@/components/state/empty-state";

export function DashboardNextActions({ actions }: { actions: NextAction[] }) {
  return (
    <DashboardSectionCard title="Next Actions">
      {actions.length > 0 ? (
        <div className="space-y-2">
          {actions.map((action) => (
            <DashboardActionItem key={action.id} action={action} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No immediate actions"
          description="Your owned pipeline is clear right now."
        />
      )}
    </DashboardSectionCard>
  );
}
