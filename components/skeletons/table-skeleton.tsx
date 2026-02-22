import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
}

export function TableSkeleton({
  rows = 5,
  columns = 5,
  showHeader = true,
}: TableSkeletonProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      {showHeader && (
        <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-4 sm:px-6">
          <Skeleton className="mb-2 h-5 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow className="border-slate-200">
            {Array.from({ length: columns }).map((_, i) => (
              <TableHead key={i} className="text-slate-600">
                <Skeleton className="h-4 w-20" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <TableRow key={rowIdx} className="border-slate-100">
              {Array.from({ length: columns }).map((_, colIdx) => (
                <TableCell key={colIdx}>
                  <Skeleton
                    className={`h-4 ${colIdx === 1 ? "w-full max-w-[200px]" : "w-16"}`}
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
