import { DealNearClose } from "@/types/dashboard";
import { DashboardSectionCard } from "./dashboard-section-card";
import { EmptyState } from "@/components/state/empty-state";

export function DashboardDealsNearClose({ deals }: { deals: DealNearClose[] }) {
  return (
    <DashboardSectionCard title="Deals Near Close">
      {deals.length > 0 ? (
        <div className="space-y-2">
          {deals.map((deal) => (
            <div key={deal.id} className="p-2 rounded-lg hover:bg-muted">
              <p className="font-semibold">{deal.opportunityName}</p>
              <p className="text-sm text-muted-foreground">{deal.organizationName}</p>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No deals near close"
          description="As deals advance toward invoice and payment stages, they will appear here."
        />
      )}
    </DashboardSectionCard>
  );
}
