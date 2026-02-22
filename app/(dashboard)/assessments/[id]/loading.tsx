import { TableSkeleton } from "@/components/skeletons/table-skeleton";

export default function AssessmentDetailLoading() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="size-9 shrink-0 animate-pulse rounded-md bg-slate-200" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-8 w-56 animate-pulse rounded bg-slate-200" />
          <div className="flex gap-3">
            <div className="h-5 w-24 animate-pulse rounded bg-slate-100" />
            <div className="h-6 w-20 animate-pulse rounded-full bg-slate-100" />
          </div>
        </div>
      </div>
      <TableSkeleton rows={10} columns={7} showHeader />
    </div>
  );
}
