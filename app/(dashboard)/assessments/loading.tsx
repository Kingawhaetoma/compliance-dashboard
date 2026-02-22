import { AssessmentCardSkeleton } from "@/components/skeletons/card-skeleton";

export default function AssessmentsLoading() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <div className="h-8 w-36 animate-pulse rounded bg-slate-200" />
        <div className="mt-2 h-4 w-64 animate-pulse rounded bg-slate-100" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <AssessmentCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
