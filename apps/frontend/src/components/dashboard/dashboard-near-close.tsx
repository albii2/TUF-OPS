import { DealNearClose } from "@/types/dashboard";
import { DashboardSectionCard } from "./dashboard-section-card";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

export function DashboardNearClose({ deals }: { deals: DealNearClose[] }) {
  return (
    <DashboardSectionCard title="Deals Near Close">
      {deals.length > 0 ? (
        <div className="space-y-2">
          {deals.map((deal) => (
            <Link href={`/opportunities/${deal.id}`} key={deal.id} className="flex items-center justify-between rounded-md p-3 hover:bg-muted">
                <div>
                    <p className="font-semibold">{deal.opportunityName}</p>
                    <p className="text-sm text-muted-foreground">Ready to Invoice</p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="font-semibold">{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(deal.value)}</span>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No deals are currently near close.</p>
      )}
    </DashboardSectionCard>
  );
}
