import { NextAction } from "@/types/dashboard";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

export function DashboardActionItem({ action }: { action: NextAction }) {
  const formattedValue = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(action.value);

  return (
    <Link href={`/opportunities/${action.id}`} className="flex items-center justify-between rounded-md p-3 hover:bg-muted">
      <div>
        <p className="font-semibold">{action.description}</p>
        <p className="text-sm text-muted-foreground">{action.opportunityName} @ {action.programName}</p>
      </div>
      <div className="flex items-center gap-4">
        <span className="font-semibold">{formattedValue}</span>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </div>
    </Link>
  );
}
