import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function FrameworkCardSkeleton() {
  return (
    <Card className="overflow-hidden border border-slate-200">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="size-5 rounded" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </CardContent>
    </Card>
  );
}

export default function FrameworksLoading() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <div className="h-8 w-28 animate-pulse rounded bg-slate-200" />
        <div className="mt-2 h-4 w-64 animate-pulse rounded bg-slate-100" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <FrameworkCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
