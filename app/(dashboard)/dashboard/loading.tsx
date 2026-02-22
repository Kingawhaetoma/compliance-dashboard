import { KPICardsSkeleton } from "@/components/skeletons/card-skeleton";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
        <div className="mt-2 h-4 w-72 animate-pulse rounded bg-slate-100" />
      </div>

      <KPICardsSkeleton />

      <div className="space-y-4">
        <div className="h-6 w-40 animate-pulse rounded bg-slate-200" />
        <TableSkeleton rows={4} columns={5} showHeader />
      </div>

      <div className="space-y-4">
        <div className="h-6 w-36 animate-pulse rounded bg-slate-200" />
        <TableSkeleton rows={6} columns={5} showHeader />
      </div>
    </div>
  );
}
