import { NextAction } from "@/types/dashboard";
import { DashboardSectionCard } from "./dashboard-section-card";
import { DashboardActionItem } from "./dashboard-action-item";

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
        <p className="text-sm text-muted-foreground">No immediate actions required. Well done!</p>
      )}
    </DashboardSectionCard>
  );
}
