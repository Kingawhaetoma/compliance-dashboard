import { TableSkeleton } from "@/components/skeletons/table-skeleton";

export default function ControlsLoading() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <div className="h-8 w-24 animate-pulse rounded bg-slate-200" />
        <div className="mt-2 h-4 w-56 animate-pulse rounded bg-slate-100" />
      </div>
      <TableSkeleton rows={8} columns={6} showHeader />
    </div>
  );
}
