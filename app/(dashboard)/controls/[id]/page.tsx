import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import {
  ArrowLeft,
  Clock3,
  FileCheck2,
  Gauge,
  Layers,
  Shield,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { DEMO_PROFILE_COOKIE, getDemoProfile } from "@/lib/demo-profiles";
import { formatDate } from "@/lib/compliance-dashboard";
import { formatAuditActionLabel } from "@/lib/audit-activity";
import { ControlDetailActions } from "@/components/controls/control-detail-actions";
import { AddEvidenceDialog } from "@/components/evidence/add-evidence-dialog";
import { PageCallout, PageHero, PageStack } from "@/components/compliance/page-chrome";
import {
  MetricCard,
  RiskBadge,
  SectionCard,
  StatusBadge,
} from "@/components/compliance/dashboard-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function maxDate(...values: Array<Date | null | undefined>) {
  const timestamps = values
    .filter((value): value is Date => value instanceof Date)
    .map((value) => value.getTime());
  if (timestamps.length === 0) return null;
  return new Date(Math.max(...timestamps));
}

export default async function ControlDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const activeProfile = getDemoProfile(cookieStore.get(DEMO_PROFILE_COOKIE)?.value);

  const control = await prisma.control.findUnique({
    where: { id },
    include: {
      framework: true,
      evidence: {
        orderBy: [{ updatedAt: "desc" }],
      },
    },
  });

  if (!control) notFound();

  const [demoResponses, demoFindings, auditFindings, activity, demoScopeFrameworks] =
    await Promise.all([
      prisma.controlResponse.findMany({
        where: {
          controlId: control.id,
          assessment: {
            organization: { name: activeProfile.organizationName },
          },
        },
        include: {
          assessment: true,
          evidenceSubmissions: {
            orderBy: [{ updatedAt: "desc" }],
            take: 5,
          },
        },
        orderBy: [{ updatedAt: "desc" }],
      }),
      prisma.finding.findMany({
        where: {
          controlId: control.id,
          assessment: {
            organization: { name: activeProfile.organizationName },
          },
        },
        include: {
          assessment: true,
        },
        orderBy: [{ updatedAt: "desc" }],
      }),
      prisma.auditFinding.findMany({
        where: {
          controlId: control.id,
          organization: { name: activeProfile.organizationName },
        },
        include: {
          assessment: true,
        },
        orderBy: [{ updatedAt: "desc" }],
      }),
      prisma.auditActivityLog.findMany({
        where: {
          controlId: control.id,
          organization: { name: activeProfile.organizationName },
        },
        include: {
          assessment: { select: { id: true, name: true } },
          evidence: { select: { id: true, title: true } },
          auditFinding: { select: { id: true, title: true } },
        },
        orderBy: [{ createdAt: "desc" }],
        take: 20,
      }),
      prisma.framework.findMany({
        where: { key: { in: activeProfile.frameworkKeys } },
        select: { id: true, key: true, name: true },
        orderBy: { key: "asc" },
      }),
    ]);

  const latestResponse = demoResponses[0] ?? null;
  const latestLegacyFinding = demoFindings[0] ?? null;
  const derivedStatus =
    latestResponse?.status ?? latestLegacyFinding?.status ?? "NOT_IMPLEMENTED";
  const derivedOwner = latestResponse?.owner ?? latestLegacyFinding?.owner ?? null;
  const lastUpdated = maxDate(
    latestResponse?.updatedAt,
    latestLegacyFinding?.updatedAt,
    control.evidence[0]?.updatedAt,
    activity[0]?.createdAt,
    control.createdAt
  );

  const latestEvidenceSubmissions = latestResponse?.evidenceSubmissions ?? [];
  const openAuditFindingsCount = auditFindings.filter((item) => item.status === "OPEN").length;
  const highAuditFindingsCount = auditFindings.filter((item) => item.severity === "HIGH").length;

  return (
    <PageStack>
      <PageHero
        badge="Control detail"
        badgeIcon={Gauge}
        title={`${control.code} · ${control.title}`}
        description={`Control workspace for ${activeProfile.organizationName}. Update demo owner/status, review linked evidence, and inspect per-control audit activity.`}
        chips={[
          { label: control.framework.key, tone: "info" },
          { label: control.domain ?? "Uncategorized domain" },
          { label: activeProfile.organizationName },
        ]}
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link href="/controls">
                <ArrowLeft className="size-4" />
                Back to Controls
              </Link>
            </Button>
            <AddEvidenceDialog
              controls={[
                {
                  id: control.id,
                  code: control.code,
                  title: control.title,
                  frameworkName: control.framework.name,
                },
              ]}
              trigger={
                <Button size="sm">
                  <FileCheck2 className="size-4" />
                  Attach Evidence
                </Button>
              }
            />
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Current Status"
          value={derivedStatus.replace(/_/g, " ")}
          helper="Demo workspace control status"
          icon={Shield}
          tone={derivedStatus === "IMPLEMENTED" ? "emerald" : derivedStatus === "PARTIALLY_IMPLEMENTED" ? "amber" : "rose"}
        />
        <MetricCard
          label="Assigned Owner"
          value={derivedOwner ?? "Unassigned"}
          helper="Owner for active demo assessment"
          icon={Layers}
          tone="sky"
        />
        <MetricCard
          label="Linked Evidence"
          value={control.evidence.length}
          helper={`${latestEvidenceSubmissions.length} recent evidence submissions`}
          icon={FileCheck2}
          tone="emerald"
        />
        <MetricCard
          label="Open Findings"
          value={openAuditFindingsCount}
          helper={`${highAuditFindingsCount} high severity`}
          icon={Clock3}
          tone={openAuditFindingsCount > 0 ? "amber" : "emerald"}
        />
      </div>

      <SectionCard
        title="Control Metadata"
        description="Control definition and current demo workspace state"
      >
        <div className="grid gap-6 p-4 sm:grid-cols-2 sm:p-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Owner
                </p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {derivedOwner ?? "Unassigned"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Last Updated
                </p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {formatDate(lastUpdated)}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                Description
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {control.description ?? "No control description is available for this library item yet."}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                Mapped Frameworks (Demo Scope)
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="secondary" className="border border-slate-200 bg-sky-50 text-sky-800">
                  {control.framework.key} (Native)
                </Badge>
                {demoScopeFrameworks
                  .filter((framework) => framework.key !== control.framework.key)
                  .map((framework) => (
                    <Badge key={framework.id} variant="outline">
                      {framework.key}
                    </Badge>
                  ))}
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Demo scope mappings reflect the active King’s demo organization program scope.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <p className="mb-3 text-sm font-semibold text-slate-900">Update Demo Workspace State</p>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <StatusBadge status={derivedStatus} />
              <Badge variant="outline">{control.framework.name}</Badge>
            </div>
            <ControlDetailActions
              controlId={control.id}
              defaultStatus={
                derivedStatus === "IMPLEMENTED" || derivedStatus === "PARTIALLY_IMPLEMENTED"
                  ? derivedStatus
                  : "NOT_IMPLEMENTED"
              }
              defaultOwner={derivedOwner}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Linked Evidence"
        description={`Evidence records attached to ${control.code} in the demo evidence module`}
      >
        {control.evidence.length === 0 ? (
          <div className="px-6 py-8 text-sm text-slate-500">
            No evidence is linked to this control yet for the demo library. Use “Attach Evidence” to add a file or URL link.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Open</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {control.evidence.map((evidence) => (
                  <TableRow key={evidence.id}>
                    <TableCell>
                      <div className="min-w-[240px]">
                        <p className="font-medium text-slate-900">{evidence.title}</p>
                        {evidence.fileName ? (
                          <p className="text-xs text-slate-500">{evidence.fileName}</p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {evidence.sourceType === "FILE" ? "File Upload" : "URL Link"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={evidence.status} />
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {formatDate(evidence.updatedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      {evidence.url ? (
                        <Button size="sm" variant="ghost" asChild>
                          <a href={evidence.url} target="_blank" rel="noopener noreferrer">
                            Open
                          </a>
                        </Button>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SectionCard
          title="Audit Findings"
          description="Findings linked to this control in the dedicated findings module"
        >
          {auditFindings.length === 0 ? (
            <div className="px-6 py-8 text-sm text-slate-500">
              No findings linked to this control yet in the audit findings module.
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {auditFindings.map((finding) => (
                <div key={finding.id} className="px-6 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <RiskBadge risk={finding.severity} />
                    <StatusBadge status={finding.status} />
                    {finding.assessment ? (
                      <Badge variant="outline">{finding.assessment.name}</Badge>
                    ) : null}
                  </div>
                  <p className="mt-2 font-medium text-slate-900">{finding.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{finding.recommendation}</p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Activity History"
          description="Per-control audit activity log for the active demo organization"
        >
          {activity.length === 0 ? (
            <div className="px-6 py-8 text-sm text-slate-500">
              No activity has been recorded for this control yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {activity.map((item) => (
                <div key={item.id} className="px-6 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{formatAuditActionLabel(item.action)}</Badge>
                    <span className="text-xs text-slate-500">{formatDate(item.createdAt)}</span>
                    {item.actor ? <span className="text-xs text-slate-500">· {item.actor}</span> : null}
                  </div>
                  <p className="mt-1 text-sm text-slate-700">{item.message}</p>
                  {item.evidence?.title ? (
                    <p className="mt-1 text-xs text-slate-500">Evidence: {item.evidence.title}</p>
                  ) : null}
                  {item.auditFinding?.title ? (
                    <p className="mt-1 text-xs text-slate-500">Finding: {item.auditFinding.title}</p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      <PageCallout tone="warning">
        Demo only: this control detail page shows sample workflow data for{" "}
        <strong>{activeProfile.organizationName}</strong>. No real customer control evidence or audit history is displayed.
      </PageCallout>
    </PageStack>
  );
}

