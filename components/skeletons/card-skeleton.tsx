import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function KPICardSkeleton() {
  return (
    <Card className="overflow-hidden border border-slate-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="size-5 rounded" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16" />
      </CardContent>
    </Card>
  );
}

export function KPICardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <KPICardSkeleton key={i} />
      ))}
    </div>
  );
}

export function AssessmentCardSkeleton() {
  return (
    <Card className="overflow-hidden border border-slate-200">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-9 w-full rounded-md" />
      </CardContent>
    </Card>
  );
}

export function EvidenceCardSkeleton() {
  return (
    <Card className="overflow-hidden border border-slate-200">
      <CardHeader className="pb-2">
        <Skeleton className="size-10 rounded-lg" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-5 w-36" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-4 w-28" />
      </CardContent>
    </Card>
  );
}
