import { Skeleton } from "@/components/ui/skeleton";

export function LoadingCardSkeleton() {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="space-y-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  );
}
