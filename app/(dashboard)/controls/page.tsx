import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { MetricCard, RiskBadge, SectionCard, StatusBadge } from "@/components/compliance/dashboard-ui";
import { PageCallout, PageHero, PageStack } from "@/components/compliance/page-chrome";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { AddControlDialog } from "@/components/controls/add-control-dialog";
import { CheckCircle2, Gauge, Layers, ShieldAlert } from "lucide-react";

export default async function ControlsPage() {
  const [controls, frameworks] = await Promise.all([
    prisma.control.findMany({
    include: {
      framework: true,
    },
  }),
    prisma.framework.findMany({
      select: { id: true, name: true, key: true },
      orderBy: { key: "asc" },
    }),
  ]);

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

  const frameworkCount = new Set(controls.map((control) => control.frameworkId)).size;
  const domainCount = new Set(controls.map((control) => control.domain ?? "Uncategorized")).size;
  const implementedCount = [...statusByControl.values()].filter(
    (meta) => meta.status === "IMPLEMENTED"
  ).length;
  const openHighRiskCount = [...statusByControl.values()].filter(
    (meta) =>
      meta.risk?.toLowerCase() === "high" &&
      !["IMPLEMENTED", "NOT_APPLICABLE"].includes(meta.status)
  ).length;

  return (
    <PageStack>
      <PageHero
        badge="Control library"
        badgeIcon={Gauge}
        title="Controls"
        description="All compliance controls across frameworks, with summarized implementation and risk signals."
        chips={[
          { label: `${controls.length} controls`, tone: "info" },
          { label: `${frameworkCount} frameworks` },
          { label: `${domainCount} domains` },
        ]}
        actions={
          frameworks.length > 0 && controls.length > 0 ? (
            <AddControlDialog
              frameworks={frameworks}
              trigger={
                <Button size="sm" className="shrink-0">
                  Add Control
                </Button>
              }
            />
          ) : undefined
        }
      />

      {controls.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Total Controls"
            value={controls.length}
            helper="Across all loaded frameworks"
            icon={Layers}
            tone="slate"
          />
          <MetricCard
            label="Frameworks"
            value={frameworkCount}
            helper="Frameworks represented in control library"
            icon={Gauge}
            tone="sky"
          />
          <MetricCard
            label="Implemented"
            value={implementedCount}
            helper="Controls with at least one implemented finding"
            icon={CheckCircle2}
            tone="emerald"
          />
          <MetricCard
            label="Open High Risk"
            value={openHighRiskCount}
            helper="High-risk controls not fully implemented"
            icon={ShieldAlert}
            tone={openHighRiskCount > 0 ? "rose" : "emerald"}
          />
        </div>
      ) : null}

      {controls.length === 0 ? (
        <EmptyState
          icon={Gauge}
          title="No controls yet"
          description="Add controls from your frameworks or import them from a compliance standard."
          action={
            frameworks.length > 0 ? (
              <AddControlDialog
                frameworks={frameworks}
                trigger={<Button size="sm">Add Control</Button>}
              />
            ) : undefined
          }
          secondaryAction={{ label: "View Frameworks", href: "/frameworks" }}
        />
      ) : (
        <SectionCard
          title="Control Library"
          description={`${controls.length} controls across ${frameworkCount} frameworks`}
        >
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
                        <Link href={`/controls/${c.id}`} className="hover:underline">
                          {c.code}
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-[320px] text-slate-700">
                        <Link href={`/controls/${c.id}`} className="hover:underline">
                          {c.title}
                        </Link>
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {c.framework.name}
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {c.domain ?? "—"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={meta.status} />
                      </TableCell>
                      <TableCell>
                        <RiskBadge risk={meta.risk} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </SectionCard>
      )}

      <PageCallout>
        Controls in this library are reused by the New Audit Wizard to generate
        assessment scope. Add or extend controls here before creating production
        audits.
      </PageCallout>
    </PageStack>
  );
}
