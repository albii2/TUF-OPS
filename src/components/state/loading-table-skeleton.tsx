import { Skeleton } from "@/components/ui/skeleton";

export function LoadingTableSkeleton({ 
  rows = 5, 
}: { 
  rows?: number; 
}) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
