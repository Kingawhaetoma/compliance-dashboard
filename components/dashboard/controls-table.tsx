import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type ControlRow = {
  id: string;
  code: string;
  title: string;
  framework: string;
  status: string;
  risk: string | null;
};

const statusStyles: Record<string, string> = {
  IMPLEMENTED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  PARTIALLY_IMPLEMENTED: "bg-amber-100 text-amber-800 border-amber-200",
  NOT_IMPLEMENTED: "bg-red-100 text-red-800 border-red-200",
  NOT_APPLICABLE: "bg-slate-100 text-slate-600 border-slate-200",
};

const riskStyles: Record<string, string> = {
  Low: "bg-emerald-100 text-emerald-700",
  Medium: "bg-amber-100 text-amber-700",
  High: "bg-red-100 text-red-700",
};

export function DashboardControlsTable({ controls }: { controls: ControlRow[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50/80 px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-900">
          Controls Overview
        </h2>
        <p className="text-sm text-slate-500">
          Control status and risk level across all frameworks
        </p>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-200 hover:bg-transparent">
              <TableHead className="text-slate-600">Control Code</TableHead>
              <TableHead className="text-slate-600">Title</TableHead>
              <TableHead className="text-slate-600">Framework</TableHead>
              <TableHead className="text-slate-600">Status</TableHead>
              <TableHead className="text-slate-600">Risk Level</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {controls.map((row) => (
              <TableRow
                key={row.id}
                className="border-slate-100 transition-colors hover:bg-slate-50/50"
              >
                <TableCell className="font-mono text-sm font-medium text-slate-900">
                  {row.code}
                </TableCell>
                <TableCell className="max-w-[280px] text-slate-700">
                  {row.title}
                </TableCell>
                <TableCell className="text-slate-600">{row.framework}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn(
                      "font-medium",
                      statusStyles[row.status] ?? "bg-slate-100 text-slate-700"
                    )}
                  >
                    {row.status.replace(/_/g, " ")}
                  </Badge>
                </TableCell>
                <TableCell>
                  {row.risk ? (
                    <Badge
                      variant="secondary"
                      className={cn(
                        "font-medium",
                        riskStyles[row.risk] ?? "bg-slate-100 text-slate-600"
                      )}
                    >
                      {row.risk}
                    </Badge>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
