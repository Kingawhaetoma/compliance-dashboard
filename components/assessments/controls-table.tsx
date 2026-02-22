"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateFindingStatus } from "@/app/actions/assessment";
import type { ControlStatus } from "@/generated/prisma/client";

const statusLabels: Record<ControlStatus, string> = {
  NOT_APPLICABLE: "N/A",
  NOT_IMPLEMENTED: "Not Implemented",
  PARTIALLY_IMPLEMENTED: "Partial",
  IMPLEMENTED: "Implemented",
};

export type ControlRow = {
  findingId: string;
  controlCode: string;
  controlTitle: string;
  domain: string | null;
  status: ControlStatus;
  risk: string | null;
  owner: string | null;
  notes: string | null;
  frameworkName: string;
};

export function ControlsTable({
  rows,
  assessmentId,
}: {
  rows: ControlRow[];
  assessmentId: string;
}) {
  async function handleStatusChange(findingId: string, value: string) {
    await updateFindingStatus(
      findingId,
      value as ControlStatus,
      assessmentId
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-4 sm:px-6">
        <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Assessment Controls</h2>
        <p className="text-xs text-slate-500 sm:text-sm">
          Control status and implementation progress
        </p>
      </div>
      <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-200 hover:bg-transparent">
            <TableHead className="text-slate-600">Control</TableHead>
            <TableHead className="text-slate-600">Domain</TableHead>
            <TableHead className="text-slate-600">Framework</TableHead>
            <TableHead className="text-slate-600">Status</TableHead>
            <TableHead className="text-slate-600">Risk</TableHead>
            <TableHead className="text-slate-600">Owner</TableHead>
            <TableHead className="max-w-[200px] text-slate-600">Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.findingId} className="border-slate-100 hover:bg-slate-50/50">
              <TableCell>
                <div className="font-mono text-sm font-medium text-slate-900">
                  {row.controlCode}
                </div>
                <div className="text-sm text-slate-600">
                  {row.controlTitle}
                </div>
              </TableCell>
              <TableCell className="text-slate-600">
                {row.domain ?? "—"}
              </TableCell>
              <TableCell className="text-sm text-slate-600">{row.frameworkName}</TableCell>
              <TableCell>
                <Select
                  value={row.status}
                  onValueChange={(v) => handleStatusChange(row.findingId, v)}
                >
                  <SelectTrigger className="w-[140px] border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(statusLabels) as ControlStatus[]).map(
                      (s) => (
                        <SelectItem key={s} value={s}>
                          {statusLabels[s]}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                {row.risk ? (
                  <Badge
                    variant="outline"
                    className={
                      row.risk.toLowerCase() === "high"
                        ? "border-red-200 bg-red-50 text-red-700"
                        : row.risk.toLowerCase() === "medium"
                          ? "border-amber-200 bg-amber-50 text-amber-700"
                          : "border-emerald-200 bg-emerald-50 text-emerald-700"
                    }
                  >
                    {row.risk}
                  </Badge>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell className="text-slate-600">
                {row.owner ?? "—"}
              </TableCell>
              <TableCell className="max-w-[200px] truncate text-slate-600">
                {row.notes ?? "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
    </div>
  );
}
