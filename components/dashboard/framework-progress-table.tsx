import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export type FrameworkProgress = {
  id: string;
  key: string;
  name: string;
  version: string | null;
  totalControls: number;
  implementedCount: number;
  percent: number;
};

export function FrameworkProgressTable({
  frameworks,
}: {
  frameworks: FrameworkProgress[];
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50/80 px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-900">Framework Progress</h2>
        <p className="text-sm text-slate-500">
          Implementation status across compliance frameworks
        </p>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="border-slate-200 hover:bg-transparent">
            <TableHead className="text-slate-600">Framework</TableHead>
            <TableHead className="text-slate-600">Version</TableHead>
            <TableHead className="text-center text-slate-600">Controls</TableHead>
            <TableHead className="text-slate-600">Implemented</TableHead>
            <TableHead className="w-[200px] text-slate-600">Progress</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {frameworks.map((f) => (
            <TableRow key={f.id} className="border-slate-100 hover:bg-slate-50/50">
              <TableCell>
                <div className="font-medium text-slate-900">{f.name}</div>
                <div className="text-xs text-slate-500">{f.key}</div>
              </TableCell>
              <TableCell className="text-slate-600">
                {f.version ?? "—"}
              </TableCell>
              <TableCell className="text-center">{f.totalControls}</TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={
                    f.implementedCount === f.totalControls && f.totalControls > 0
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-slate-50 text-slate-700"
                  }
                >
                  {f.implementedCount} / {f.totalControls}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Progress value={f.percent} className="flex-1" />
                  <span className="text-sm font-medium tabular-nums text-slate-600">
                    {f.percent.toFixed(0)}%
                  </span>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
