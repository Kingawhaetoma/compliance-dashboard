import { EvidenceCardSkeleton } from "@/components/skeletons/card-skeleton";

export default function EvidenceLoading() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <div className="h-8 w-24 animate-pulse rounded bg-slate-200" />
        <div className="mt-2 h-4 w-64 animate-pulse rounded bg-slate-100" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <EvidenceCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
