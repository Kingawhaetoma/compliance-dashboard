import { prisma } from "@/lib/prisma";
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

export default async function ControlsPage() {
  const controls = await prisma.control.findMany({
    include: {
      framework: true,
    },
  });

  const findings = await prisma.finding.findMany({
    select: { controlId: true, status: true, risk: true },
  });

  const statusByControl = new Map<string, { status: string; risk: string | null }>();
  const statusOrder = ["IMPLEMENTED", "PARTIALLY_IMPLEMENTED", "NOT_APPLICABLE", "NOT_IMPLEMENTED"];
  const riskOrder = ["High", "Medium", "Low"];
  for (const f of findings) {
    const existing = statusByControl.get(f.controlId);
    const newStatus = f.status;
    const newRisk = f.risk;
    if (!existing) {
      statusByControl.set(f.controlId, { status: newStatus, risk: newRisk });
    } else {
      const bestStatus =
        statusOrder.indexOf(newStatus) < statusOrder.indexOf(existing.status)
          ? newStatus
          : existing.status;
      const worstRisk =
        newRisk && existing.risk
          ? riskOrder.indexOf(newRisk) < riskOrder.indexOf(existing.risk)
            ? newRisk
            : existing.risk
          : newRisk ?? existing.risk;
      statusByControl.set(f.controlId, { status: bestStatus, risk: worstRisk });
    }
  }

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

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          Controls
        </h1>
        <p className="mt-1 text-sm text-slate-600 sm:text-base">
          All compliance controls across frameworks
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-4 sm:px-6">
          <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
            Control Library
          </h2>
          <p className="text-xs text-slate-500 sm:text-sm">
            {controls.length} controls across {new Set(controls.map((c) => c.frameworkId)).size} frameworks
          </p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-200 hover:bg-transparent">
                <TableHead className="text-slate-600">Code</TableHead>
                <TableHead className="text-slate-600">Title</TableHead>
                <TableHead className="text-slate-600">Framework</TableHead>
                <TableHead className="text-slate-600">Domain</TableHead>
                <TableHead className="text-slate-600">Status</TableHead>
                <TableHead className="text-slate-600">Risk</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {controls.map((c) => {
                const meta = statusByControl.get(c.id) ?? {
                  status: "NOT_IMPLEMENTED",
                  risk: null as string | null,
                };
                return (
                  <TableRow
                    key={c.id}
                    className="border-slate-100 transition-colors hover:bg-slate-50/50"
                  >
                    <TableCell className="font-mono text-sm font-medium text-slate-900">
                      {c.code}
                    </TableCell>
                    <TableCell className="max-w-[320px] text-slate-700">
                      {c.title}
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {c.framework.name}
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {c.domain ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "font-medium",
                          statusStyles[meta.status] ?? "bg-slate-100 text-slate-700"
                        )}
                      >
                        {meta.status.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {meta.risk ? (
                        <Badge
                          variant="secondary"
                          className={cn(
                            "font-medium",
                            riskStyles[meta.risk] ?? "bg-slate-100 text-slate-600"
                          )}
                        >
                          {meta.risk}
                        </Badge>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
