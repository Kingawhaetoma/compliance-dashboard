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
    <div className="rounded-xl border bg-card">
      <div className="border-b px-6 py-4">
        <h2 className="text-lg font-semibold">Framework Progress</h2>
        <p className="text-sm text-muted-foreground">
          Implementation status across compliance frameworks
        </p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Framework</TableHead>
            <TableHead>Version</TableHead>
            <TableHead className="text-center">Controls</TableHead>
            <TableHead>Implemented</TableHead>
            <TableHead className="w-[200px]">Progress</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {frameworks.map((f) => (
            <TableRow key={f.id}>
              <TableCell>
                <div className="font-medium">{f.name}</div>
                <div className="text-xs text-muted-foreground">{f.key}</div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {f.version ?? "—"}
              </TableCell>
              <TableCell className="text-center">{f.totalControls}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    f.implementedCount === f.totalControls && f.totalControls > 0
                      ? "default"
                      : "secondary"
                  }
                >
                  {f.implementedCount} / {f.totalControls}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Progress value={f.percent} className="flex-1" />
                  <span className="text-sm font-medium tabular-nums text-muted-foreground">
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
