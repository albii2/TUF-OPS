import { LoadingCardSkeleton } from "@/components/state/loading-card-skeleton";

export default function Loading() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      <LoadingCardSkeleton />
      <LoadingCardSkeleton />
      <LoadingCardSkeleton />
    </div>
  );
}
