export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import {
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  FileUp,
  FolderOpen,
  Layers,
  Wrench,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import {
  clampPercent,
  computeReadinessScore,
  dueLabel,
  formatDate,
  isAnsweredControlStatus,
  isOpenControlStatus,
  pickBestStatus,
  pickWorstRisk,
  riskWeight,
  sortByRiskThenDue,
} from "@/lib/compliance-dashboard";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import {
  DomainProgressAccordion,
  InlineProgress,
  MetricCard,
  RiskBadge,
  RingMetricCard,
  SectionCard,
  StatusBadge,
} from "@/components/compliance/dashboard-ui";
import {
  DonutBreakdownCard,
  HorizontalBarChartCard,
} from "@/components/compliance/chart-cards";
import { PageCallout, PageHero, PageStack } from "@/components/compliance/page-chrome";

type SearchParamsShape = Record<string, string | string[] | undefined>;

type AggregatedVendorFinding = {
  controlId: string;
  status: string;
  risk: string | null;
  owner: string | null;
  dueDate: Date | null;
  evidenceCount: number;
};

function aggregateFindingsByControl(
  findings: Array<{
    controlId: string;
    status: string;
    risk: string | null;
    owner: string | null;
    dueDate: Date | null;
    evidenceLinks: Array<{ id: string }>;
  }>
) {
  const byControl = new Map<string, AggregatedVendorFinding>();

  for (const finding of findings) {
    const current = byControl.get(finding.controlId);
    const evidenceCount = finding.evidenceLinks.length;

    if (!current) {
      byControl.set(finding.controlId, {
        controlId: finding.controlId,
        status: finding.status,
        risk: finding.risk,
        owner: finding.owner,
        dueDate: finding.dueDate,
        evidenceCount,
      });
      continue;
    }

    byControl.set(finding.controlId, {
      ...current,
      status: pickBestStatus(current.status, finding.status),
      risk: pickWorstRisk(current.risk, finding.risk),
      owner: current.owner ?? finding.owner,
      dueDate:
        current.dueDate && finding.dueDate
          ? current.dueDate < finding.dueDate
            ? current.dueDate
            : finding.dueDate
          : current.dueDate ?? finding.dueDate,
      evidenceCount: current.evidenceCount + evidenceCount,
    });
  }

  return byControl;
}

function summarizeEvidenceReviewStatus(statuses: string[]) {
  if (statuses.length === 0) return null;
  const order = ["REJECTED", "NEEDS_INFO", "UNDER_REVIEW", "SUBMITTED", "APPROVED"];
  return [...statuses].sort(
    (a, b) =>
      (order.indexOf(a) === -1 ? order.length : order.indexOf(a)) -
      (order.indexOf(b) === -1 ? order.length : order.indexOf(b))
  )[0];
}

function summarizePoamStatus(statuses: string[]) {
  if (statuses.length === 0) return null;
  const order = ["BLOCKED", "OPEN", "IN_PROGRESS", "DONE"];
  return [...statuses].sort(
    (a, b) =>
      (order.indexOf(a) === -1 ? order.length : order.indexOf(a)) -
      (order.indexOf(b) === -1 ? order.length : order.indexOf(b))
  )[0];
}

export default async function VendorDashboardPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParamsShape> | SearchParamsShape;
}) {
  const resolvedParams = (searchParams ? await searchParams : {}) ?? {};
  const requestedAssessmentId = Array.isArray(resolvedParams.assessmentId)
    ? resolvedParams.assessmentId[0]
    : resolvedParams.assessmentId;

  const assessments = await prisma.assessment.findMany({
    include: {
      organization: true,
      engagement: {
        include: {
          customerOrg: true,
          vendorOrg: true,
        },
      },
      controlResponses: {
        include: {
          control: {
            include: {
              framework: { select: { id: true, key: true, name: true, version: true } },
            },
          },
          evidenceSubmissions: {
            select: { id: true, reviewStatus: true, reviewedAt: true },
          },
          poamItems: {
            select: { id: true, status: true, dueDate: true, severity: true },
          },
        },
      },
      findings: {
        include: {
          control: {
            include: {
              framework: { select: { id: true, key: true, name: true, version: true } },
            },
          },
          evidenceLinks: { select: { id: true } },
        },
      },
    },
    orderBy: [{ updatedAt: "desc" }],
  });

  if (assessments.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Vendor Compliance Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-600 sm:text-base">
            Self-assessment workspace for controls, evidence, and remediation tasks.
          </p>
        </div>
        <EmptyState
          icon={FolderOpen}
          title="No assigned assessments yet"
          description="Create or assign an assessment to start the vendor readiness workflow."
          secondaryAction={{ label: "Go to Assessments", href: "/assessments" }}
        />
      </div>
    );
  }

  const selectedAssessment =
    assessments.find((assessment) => assessment.id === requestedAssessmentId) ??
    assessments[0];

  const now = new Date();
  const frameworkIds = [
    ...new Set(
      (
        selectedAssessment.controlResponses.length > 0
          ? selectedAssessment.controlResponses.map((response) => response.control.frameworkId)
          : selectedAssessment.findings.map((finding) => finding.control.frameworkId)
      )
    ),
  ];

  const controls = await prisma.control.findMany({
    where: frameworkIds.length > 0 ? { frameworkId: { in: frameworkIds } } : undefined,
    include: {
      framework: { select: { id: true, key: true, name: true, version: true } },
    },
    orderBy: [{ domain: "asc" }, { code: "asc" }],
  });

  const findingsByControl = aggregateFindingsByControl(selectedAssessment.findings);
  const responsesByControl = new Map(
    selectedAssessment.controlResponses.map((response) => [response.controlId, response] as const)
  );

  const controlRows = controls.map((control) => {
    const response = responsesByControl.get(control.id);
    const finding = findingsByControl.get(control.id);

    const evidenceReviewStatuses = response
      ? response.evidenceSubmissions.map((submission) => submission.reviewStatus)
      : [];
    const poamStatuses = response ? response.poamItems.map((item) => item.status) : [];
    const poamOpenCount = response
      ? response.poamItems.filter((item) => item.status !== "DONE").length
      : isOpenControlStatus(finding?.status ?? "NOT_IMPLEMENTED")
        ? 1
        : 0;
    const poamOverdueCount = response
      ? response.poamItems.filter(
          (item) => item.status !== "DONE" && item.dueDate !== null && item.dueDate < now
        ).length
      : isOpenControlStatus(finding?.status ?? "NOT_IMPLEMENTED") &&
          finding?.dueDate &&
          finding.dueDate < now
        ? 1
        : 0;

    const status = response?.status ?? finding?.status ?? "NOT_IMPLEMENTED";
    const risk = response?.risk ?? finding?.risk ?? null;
    const evidenceCount = response?.evidenceSubmissions.length ?? finding?.evidenceCount ?? 0;
    const owner = response?.owner ?? finding?.owner ?? null;
    const dueDate = response?.dueDate ?? finding?.dueDate ?? null;
    const reviewStatus = response?.reviewStatus ?? null;
    const evidenceReviewStatus = summarizeEvidenceReviewStatus(evidenceReviewStatuses);
    const pendingEvidenceReviewCount = response
      ? response.evidenceSubmissions.filter((submission) =>
          ["SUBMITTED", "UNDER_REVIEW", "NEEDS_INFO", "REJECTED"].includes(
            submission.reviewStatus
          )
        ).length
      : 0;

    const hasCustomerRequest =
      isOpenControlStatus(status) ||
      evidenceCount === 0 ||
      reviewStatus === "NEEDS_INFO" ||
      reviewStatus === "REJECTED" ||
      evidenceReviewStatus === "NEEDS_INFO" ||
      evidenceReviewStatus === "REJECTED" ||
      poamOpenCount > 0;

    return {
      id: control.id,
      code: control.code,
      title: control.title,
      domain: control.domain ?? "Uncategorized",
      frameworkName: control.framework.name,
      frameworkKey: control.framework.key,
      status,
      risk,
      evidenceCount,
      owner,
      dueDate,
      reviewStatus,
      evidenceReviewStatus,
      pendingEvidenceReviewCount,
      poamOpenCount,
      poamOverdueCount,
      poamStatusSummary: summarizePoamStatus(poamStatuses),
      hasCustomerRequest,
    };
  });

  const totalControls = controlRows.length;
  const answeredControls = controlRows.filter((row) => isAnsweredControlStatus(row.status)).length;
  const implementedControls = controlRows.filter((row) => row.status === "IMPLEMENTED").length;
  const openControls = controlRows.filter((row) => isOpenControlStatus(row.status)).length;
  const evidenceCoveredControls = controlRows.filter((row) => row.evidenceCount > 0).length;
  const highRiskOpen = controlRows.filter(
    (row) => isOpenControlStatus(row.status) && riskWeight(row.risk) >= 3
  ).length;
  const overdueTasks = controlRows.reduce((sum, row) => sum + row.poamOverdueCount, 0);
  const awaitingCustomerReview = controlRows.filter(
    (row) => row.reviewStatus === "SUBMITTED" || row.reviewStatus === "UNDER_REVIEW"
  ).length;
  const needsInfoOrRejected = controlRows.filter(
    (row) =>
      row.reviewStatus === "NEEDS_INFO" ||
      row.reviewStatus === "REJECTED" ||
      row.evidenceReviewStatus === "NEEDS_INFO" ||
      row.evidenceReviewStatus === "REJECTED"
  ).length;

  const completionPercent = totalControls > 0 ? (answeredControls / totalControls) * 100 : 0;
  const evidenceCoveragePercent =
    totalControls > 0 ? (evidenceCoveredControls / totalControls) * 100 : 0;
  const submissionReadinessPercent = computeReadinessScore({
    completionPercent,
    evidenceCoveragePercent,
    highRiskOpen,
    totalControls,
  });

  const openRiskWeight = controlRows.reduce((sum, row) => {
    if (!isOpenControlStatus(row.status)) return sum;
    return sum + Math.max(1, riskWeight(row.risk));
  }, 0);
  const maxRiskWeight = Math.max(1, totalControls * 4);
  const riskAssessmentScore = clampPercent(100 - (openRiskWeight / maxRiskWeight) * 100);

  const domainProgress = Object.values(
    controlRows.reduce<
      Record<
        string,
        {
          domain: string;
          rows: typeof controlRows;
        }
      >
    >((acc, row) => {
      if (!acc[row.domain]) acc[row.domain] = { domain: row.domain, rows: [] };
      acc[row.domain].rows.push(row);
      return acc;
    }, {})
  )
    .map(({ domain, rows }) => {
      const total = rows.length;
      const answered = rows.filter((row) => isAnsweredControlStatus(row.status)).length;
      const implemented = rows.filter((row) => row.status === "IMPLEMENTED").length;
      const partial = rows.filter((row) => row.status === "PARTIALLY_IMPLEMENTED").length;
      const missing = rows.filter((row) => !isAnsweredControlStatus(row.status)).length;
      const evidenceCovered = rows.filter((row) => row.evidenceCount > 0).length;
      const highRiskCount = rows.filter(
        (row) => isOpenControlStatus(row.status) && riskWeight(row.risk) >= 3
      ).length;
      const topGaps = sortByRiskThenDue(
        rows.filter((row) => isOpenControlStatus(row.status))
      )
        .slice(0, 3)
        .map((row) => ({
          id: row.id,
          code: row.code,
          title: row.title,
          status: row.status,
          risk: row.risk,
        }));

      return {
        domain,
        totalControls: total,
        answeredControls: answered,
        implementedControls: implemented,
        partialControls: partial,
        missingControls: missing,
        evidenceCoveragePercent: total > 0 ? (evidenceCovered / total) * 100 : 0,
        highRiskCount,
        topGaps,
      };
    })
    .sort((a, b) => {
      const aCompletion =
        a.totalControls > 0 ? a.answeredControls / a.totalControls : 0;
      const bCompletion =
        b.totalControls > 0 ? b.answeredControls / b.totalControls : 0;
      if (aCompletion !== bCompletion) return aCompletion - bCompletion;
      return a.domain.localeCompare(b.domain);
    });

  const requestQueue = sortByRiskThenDue(
    controlRows
      .filter((row) => row.hasCustomerRequest)
      .map((row) => ({
        ...row,
        dueDate: row.dueDate,
        risk: row.risk,
      }))
  ).slice(0, 15);

  const frameworksInAssessment = [
    ...new Map(
      (
        selectedAssessment.controlResponses.length > 0
          ? selectedAssessment.controlResponses.map((response) => [
              response.control.framework.id,
              response.control.framework,
            ] as const)
          : selectedAssessment.findings.map((finding) => [
              finding.control.framework.id,
              finding.control.framework,
            ] as const)
      )
    ).values(),
  ];

  const partialControls = controlRows.filter(
    (row) => row.status === "PARTIALLY_IMPLEMENTED"
  ).length;
  const notApplicableControls = controlRows.filter(
    (row) => row.status === "NOT_APPLICABLE"
  ).length;
  const statusBreakdownData = [
    { label: "Implemented", value: implementedControls, color: "#16a34a" },
    { label: "Partial", value: partialControls, color: "#f59e0b" },
    { label: "Open", value: openControls, color: "#ef4444" },
    { label: "Not Applicable", value: notApplicableControls, color: "#94a3b8" },
  ];

  const requestQueueBreakdownData = [
    { label: "Awaiting customer review", value: awaitingCustomerReview, color: "#0ea5e9" },
    { label: "Needs info / rejected", value: needsInfoOrRejected, color: "#f97316" },
    { label: "High-risk gaps", value: highRiskOpen, color: "#ef4444" },
    { label: "Overdue POA&M", value: overdueTasks, color: "#e11d48" },
  ];

  const domainCompletionChartData = domainProgress.map((domain) => ({
    label: domain.domain,
    value:
      domain.totalControls > 0
        ? Math.round((domain.answeredControls / domain.totalControls) * 100)
        : 0,
    color:
      domain.totalControls > 0 &&
      (domain.answeredControls / domain.totalControls) * 100 >= 80
        ? "#16a34a"
        : "#0ea5e9",
  }));

  return (
    <PageStack>
      <PageHero
        badge="Vendor self-assessment workspace"
        title={selectedAssessment.organization.name}
        description={selectedAssessment.name}
        chips={[
          {
            label: `Status: ${selectedAssessment.status.replace(/_/g, " ")}`,
            tone:
              selectedAssessment.status === "COMPLETE"
                ? "success"
                : selectedAssessment.status === "IN_PROGRESS"
                  ? "info"
                  : "neutral",
          },
          ...(selectedAssessment.engagement?.customerOrg
            ? [
                {
                  label: `Customer: ${selectedAssessment.engagement.customerOrg.name}`,
                  tone: "info" as const,
                },
              ]
            : []),
          ...(selectedAssessment.engagement?.name
            ? [{ label: `Engagement: ${selectedAssessment.engagement.name}` }]
            : []),
          {
            label: `Due: ${formatDate(selectedAssessment.endDate)}`,
            tone: overdueTasks > 0 ? "danger" : "neutral",
          },
          {
            label: `${frameworksInAssessment.length} framework${frameworksInAssessment.length === 1 ? "" : "s"}`,
            tone: "neutral",
          },
        ]}
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link href="/controls">Control Library</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/evidence">
                <FileUp className="size-4" />
                Evidence Center
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href={`/assessments/${selectedAssessment.id}`}>
                <ClipboardCheck className="size-4" />
                Open Audit Review
              </Link>
            </Button>
          </>
        }
      />

      <SectionCard
        title="Assigned Assessments"
        description="Switch between vendor audits and framework-specific questionnaires."
      >
        <div className="flex flex-wrap gap-2 px-4 py-4 sm:px-6">
          {assessments.map((assessment) => {
            const selected = assessment.id === selectedAssessment.id;
            return (
              <Button
                key={assessment.id}
                asChild
                variant={selected ? "default" : "outline"}
                size="sm"
                className={selected ? "shadow-sm" : ""}
              >
                <Link href={`/vendor?assessmentId=${assessment.id}`}>
                  <span className="truncate max-w-[220px]">{assessment.name}</span>
                </Link>
              </Button>
            );
          })}
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Total Controls"
          value={totalControls}
          helper={`${frameworksInAssessment.length} framework scope`}
          icon={Layers}
          tone="slate"
        />
        <MetricCard
          label="Applied Controls"
          value={answeredControls}
          helper={`${implementedControls} fully implemented`}
          icon={CheckCircle2}
          tone="emerald"
        />
        <MetricCard
          label="Tasks (Open)"
          value={openControls}
          helper={`${overdueTasks} overdue POA&M items`}
          icon={Wrench}
          tone={overdueTasks > 0 ? "rose" : "amber"}
        />
        <MetricCard
          label="Evidence Linked"
          value={evidenceCoveredControls}
          helper={`${awaitingCustomerReview} awaiting customer review`}
          icon={FileUp}
          tone="sky"
        />
        <MetricCard
          label="High-Risk Gaps"
          value={highRiskOpen}
          helper={`${needsInfoOrRejected} needs info/rejected`}
          icon={CircleAlert}
          tone={highRiskOpen > 0 ? "rose" : "emerald"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <RingMetricCard
          title="Control Completion"
          subtitle="Answered controls vs total in scope"
          value={`${answeredControls} / ${totalControls}`}
          percent={completionPercent}
          color="#f59e0b"
        />
        <RingMetricCard
          title="Submission Readiness"
          subtitle="Combines completion, evidence, and open high-risk gaps"
          value={`${submissionReadinessPercent.toFixed(0)}%`}
          percent={submissionReadinessPercent}
          color={submissionReadinessPercent >= 80 ? "#16a34a" : "#0ea5e9"}
        />
        <RingMetricCard
          title="Risk Assessment Score"
          subtitle="Higher is better (lower open-risk exposure)"
          value={`${riskAssessmentScore.toFixed(0)}`}
          percent={riskAssessmentScore}
          color={riskAssessmentScore >= 75 ? "#16a34a" : "#fb7185"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <DonutBreakdownCard
          title="Control Status Breakdown"
          description="Implementation state distribution across this audit scope."
          data={statusBreakdownData}
          centerLabel="Controls"
        />
        <HorizontalBarChartCard
          title="Request Queue Breakdown"
          description="What is blocking submission or requires follow-up."
          data={requestQueueBreakdownData}
          maxItems={4}
        />
        <HorizontalBarChartCard
          title="Domain Completion"
          description="Answered controls by domain (top incomplete domains surface first)."
          data={domainCompletionChartData}
          valueSuffix="%"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <SectionCard
          title="Framework Scope"
          description="Frameworks currently included in this vendor assessment."
        >
          <div className="space-y-0">
            {frameworksInAssessment.length === 0 ? (
              <div className="px-6 py-8 text-sm text-slate-500">
                No framework controls linked to this assessment yet.
              </div>
            ) : (
              frameworksInAssessment.map((framework) => {
                const controlsInFramework = controlRows.filter(
                  (row) => row.frameworkKey === framework.key
                );
                const answeredInFramework = controlsInFramework.filter((row) =>
                  isAnsweredControlStatus(row.status)
                ).length;
                const percent =
                  controlsInFramework.length > 0
                    ? (answeredInFramework / controlsInFramework.length) * 100
                    : 0;
                return (
                  <div
                    key={framework.id}
                    className="border-b border-slate-100 px-4 py-4 last:border-b-0 sm:px-6"
                  >
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900">{framework.name}</p>
                        <p className="text-xs text-slate-500">
                          {framework.key}
                          {framework.version ? ` · ${framework.version}` : ""}
                        </p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                        {controlsInFramework.length} controls
                      </span>
                    </div>
                    <InlineProgress value={percent} />
                  </div>
                );
              })
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Domain Progress"
          description="Accordion view for control domains, completion, evidence, and top gaps."
        >
          <DomainProgressAccordion domains={domainProgress} />
        </SectionCard>

        <SectionCard
          title="Customer Requests / POA&M"
          description="Controls needing remediation action, evidence, or reviewer follow-up."
        >
          <div className="space-y-2 px-4 py-4 sm:px-6">
            {requestQueue.length === 0 ? (
              <p className="text-sm text-slate-500">
                No pending requests. This assessment is ready for submission.
              </p>
            ) : (
              requestQueue.slice(0, 8).map((row) => (
                <div
                  key={row.id}
                  className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
                >
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-slate-900">
                      <span className="font-mono">{row.code}</span> {row.title}
                    </p>
                    <RiskBadge risk={row.risk} />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={row.status} />
                    {row.reviewStatus ? <StatusBadge status={row.reviewStatus} /> : null}
                    {row.evidenceReviewStatus ? (
                      <StatusBadge status={row.evidenceReviewStatus} className="text-[10px]" />
                    ) : null}
                    {row.poamStatusSummary ? (
                      <StatusBadge status={row.poamStatusSummary} />
                    ) : null}
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">
                      {row.evidenceCount > 0 ? `${row.evidenceCount} evidence` : "evidence needed"}
                    </span>
                    {row.pendingEvidenceReviewCount > 0 ? (
                      <span className="rounded-full bg-amber-50 px-2 py-1 text-xs text-amber-700">
                        {row.pendingEvidenceReviewCount} pending review
                      </span>
                    ) : null}
                    {row.poamOpenCount > 0 ? (
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">
                        {row.poamOpenCount} POA&M open
                      </span>
                    ) : null}
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                      {row.owner ?? "owner unassigned"}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                      {dueLabel(row.dueDate)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Control Workbench"
        description="Vendor-ready questionnaire table for implementation status, risk, owners, and evidence."
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-200 hover:bg-transparent">
                <TableHead className="text-slate-600">Control</TableHead>
                <TableHead className="text-slate-600">Domain</TableHead>
                <TableHead className="text-slate-600">Framework</TableHead>
                <TableHead className="text-slate-600">Status</TableHead>
                <TableHead className="text-slate-600">Customer Review</TableHead>
                <TableHead className="text-slate-600">Evidence Review</TableHead>
                <TableHead className="text-slate-600">Risk</TableHead>
                <TableHead className="text-slate-600">Evidence</TableHead>
                <TableHead className="text-slate-600">POA&M</TableHead>
                <TableHead className="text-slate-600">Owner</TableHead>
                <TableHead className="text-slate-600">Due</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {controlRows.map((row) => (
                <TableRow key={row.id} className="border-slate-100 hover:bg-slate-50/50">
                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-900">
                        <span className="font-mono">{row.code}</span> {row.title}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600">{row.domain}</TableCell>
                  <TableCell className="text-slate-600">{row.frameworkKey}</TableCell>
                  <TableCell>
                    <StatusBadge status={row.status} />
                  </TableCell>
                  <TableCell>
                    {row.reviewStatus ? (
                      <StatusBadge status={row.reviewStatus} />
                    ) : (
                      <span className="text-xs text-slate-400">Legacy</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {row.evidenceReviewStatus ? (
                      <StatusBadge status={row.evidenceReviewStatus} />
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <RiskBadge risk={row.risk} />
                  </TableCell>
                  <TableCell className="text-slate-600">
                    <div className="space-y-1">
                      <div>{row.evidenceCount > 0 ? `${row.evidenceCount} linked` : "Missing"}</div>
                      {row.pendingEvidenceReviewCount > 0 ? (
                        <div className="text-xs text-amber-700">
                          {row.pendingEvidenceReviewCount} pending
                        </div>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600">
                    <div className="space-y-1">
                      <div>{row.poamStatusSummary ?? "—"}</div>
                      {row.poamOpenCount > 0 ? (
                        <div className="text-xs text-slate-500">
                          {row.poamOpenCount} open
                          {row.poamOverdueCount > 0 ? ` · ${row.poamOverdueCount} overdue` : ""}
                        </div>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600">{row.owner ?? "—"}</TableCell>
                  <TableCell className="text-slate-600">
                    <div className="space-y-1">
                      <div>{formatDate(row.dueDate)}</div>
                      <div className="text-xs text-slate-500">{dueLabel(row.dueDate)}</div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </SectionCard>

      <PageCallout>
        This vendor workspace is designed for customer-facing audits and self-assessments. It supports framework-scoped progress tracking, evidence collection, and POA&M-style remediation queues for HIPAA, NIST CSF, SOC 2, ISO 27001, CIS Controls, and the added NIST 800-171 / 800-172 / 800-53 frameworks.
      </PageCallout>
    </PageStack>
  );
}
