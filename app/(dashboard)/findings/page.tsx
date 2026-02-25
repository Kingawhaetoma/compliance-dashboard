import { cookies } from "next/headers";
import Link from "next/link";
import { AlertTriangle, ClipboardList, ShieldAlert, ShieldCheck } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { DEMO_PROFILE_COOKIE, getDemoProfile } from "@/lib/demo-profiles";
import { formatDate } from "@/lib/compliance-dashboard";
import { MetricCard, RiskBadge, SectionCard, StatusBadge } from "@/components/compliance/dashboard-ui";
import { PageCallout, PageHero, PageStack } from "@/components/compliance/page-chrome";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreateFindingDialog } from "@/components/findings/create-finding-dialog";
import { FindingStatusAction } from "@/components/findings/finding-status-action";

export default async function FindingsPage() {
  const cookieStore = await cookies();
  const activeProfile = getDemoProfile(cookieStore.get(DEMO_PROFILE_COOKIE)?.value);

  const organization = await prisma.organization.findUnique({
    where: { name: activeProfile.organizationName },
    select: { id: true },
  });

  const findings = organization
    ? await prisma.auditFinding.findMany({
        where: { organizationId: organization.id },
        include: {
          control: { include: { framework: true } },
          assessment: { select: { id: true, name: true } },
        },
        orderBy: [{ updatedAt: "desc" }],
      })
    : [];

  const controls = await prisma.control.findMany({
    where: {
      framework: { key: { in: activeProfile.frameworkKeys } },
    },
    include: { framework: true },
    orderBy: [{ framework: { key: "asc" } }, { code: "asc" }],
  });

  const controlOptions = controls.map((control) => ({
    id: control.id,
    code: control.code,
    title: control.title,
    frameworkKey: control.framework.key,
  }));

  const openCount = findings.filter((finding) => finding.status === "OPEN").length;
  const highCount = findings.filter((finding) => finding.severity === "HIGH").length;
  const resolvedCount = findings.filter((finding) => finding.status === "RESOLVED").length;

  return (
    <PageStack>
      <PageHero
        badge="Findings"
        badgeIcon={AlertTriangle}
        title="Audit Findings"
        description="Track demo audit findings, severity, linked controls, and remediation recommendations for the active King’s demo organization."
        chips={[
          { label: activeProfile.organizationName },
          { label: `${findings.length} findings`, tone: "info" },
          { label: `${openCount} open` },
        ]}
        actions={
          <CreateFindingDialog
            controls={controlOptions}
            trigger={
              <Button size="sm">
                <ClipboardList className="size-4" />
                Create Finding
              </Button>
            }
          />
        }
      />

      {findings.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Open Findings"
            value={openCount}
            helper="Findings requiring remediation"
            icon={ShieldAlert}
            tone={openCount > 0 ? "amber" : "emerald"}
          />
          <MetricCard
            label="High Severity"
            value={highCount}
            helper="High severity audit findings"
            icon={AlertTriangle}
            tone={highCount > 0 ? "rose" : "emerald"}
          />
          <MetricCard
            label="Resolved"
            value={resolvedCount}
            helper="Findings marked resolved"
            icon={ShieldCheck}
            tone="emerald"
          />
          <MetricCard
            label="Scoped Controls"
            value={controlOptions.length}
            helper="Controls available for finding linkage"
            icon={ClipboardList}
            tone="sky"
          />
        </div>
      ) : null}

      {findings.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title="No findings yet"
          description={`Create a demo finding for ${activeProfile.organizationName} so reviewers can see remediation tracking in context.`}
          action={<CreateFindingDialog controls={controlOptions} trigger={<Button size="sm">Create Finding</Button>} />}
          secondaryAction={{ label: "View Controls", href: "/controls" }}
        />
      ) : (
        <SectionCard
          title="Findings Register"
          description="Severity, recommendation, linked controls, and remediation status"
        >
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Finding</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Linked Control</TableHead>
                  <TableHead>Recommendation</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {findings.map((finding) => (
                  <TableRow key={finding.id} className="align-top">
                    <TableCell className="min-w-[240px]">
                      <div>
                        <p className="font-medium text-slate-900">{finding.title}</p>
                        {finding.owner ? (
                          <p className="mt-1 text-xs text-slate-500">Owner: {finding.owner}</p>
                        ) : null}
                        {finding.assessment ? (
                          <p className="mt-1 text-xs text-slate-500">
                            Assessment: {finding.assessment.name}
                          </p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <RiskBadge risk={finding.severity} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={finding.status} />
                    </TableCell>
                    <TableCell className="min-w-[180px]">
                      {finding.control ? (
                        <Link
                          href={`/controls/${finding.control.id}`}
                          className="inline-flex flex-col hover:underline"
                        >
                          <span className="font-mono text-xs text-slate-700">
                            {finding.control.framework.key} · {finding.control.code}
                          </span>
                          <span className="truncate text-sm text-slate-600">
                            {finding.control.title}
                          </span>
                        </Link>
                      ) : (
                        <span className="text-sm text-slate-400">Unlinked</span>
                      )}
                    </TableCell>
                    <TableCell className="min-w-[280px] text-sm text-slate-700">
                      <p>{finding.recommendation}</p>
                      {finding.details ? (
                        <p className="mt-1 text-xs text-slate-500">{finding.details}</p>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {formatDate(finding.updatedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <FindingStatusAction
                        findingId={finding.id}
                        currentStatus={finding.status}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </SectionCard>
      )}

      <PageCallout tone="warning">
        Demo mode only: the findings register contains seeded sample findings for{" "}
        <strong>{activeProfile.organizationName}</strong> and is intended for workflow demonstrations.
      </PageCallout>
    </PageStack>
  );
}
