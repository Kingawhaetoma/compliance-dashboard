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
    <div className="rounded-xl border bg-card">
      <div className="border-b px-6 py-4">
        <h2 className="text-lg font-semibold">Assessment Controls</h2>
        <p className="text-sm text-muted-foreground">
          Control status and implementation progress
        </p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Control</TableHead>
            <TableHead>Domain</TableHead>
            <TableHead>Framework</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Risk</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead className="max-w-[200px]">Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.findingId}>
              <TableCell>
                <div className="font-mono text-sm font-medium">
                  {row.controlCode}
                </div>
                <div className="text-sm text-muted-foreground">
                  {row.controlTitle}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {row.domain ?? "—"}
              </TableCell>
              <TableCell className="text-sm">{row.frameworkName}</TableCell>
              <TableCell>
                <Select
                  value={row.status}
                  onValueChange={(v) => handleStatusChange(row.findingId, v)}
                >
                  <SelectTrigger className="w-[140px]">
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
                    variant={
                      row.risk.toLowerCase() === "high"
                        ? "destructive"
                        : row.risk.toLowerCase() === "medium"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {row.risk}
                  </Badge>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {row.owner ?? "—"}
              </TableCell>
              <TableCell className="max-w-[200px] truncate text-muted-foreground">
                {row.notes ?? "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
