export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import {
  Building2,
  ClipboardList,
  FileSearch,
  ShieldAlert,
  Timer,
  FolderOpen,
  ArrowRight,
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

type AggregatedControlFinding = {
  controlId: string;
  frameworkId: string;
  frameworkName: string;
  frameworkKey: string;
  code: string;
  title: string;
  status: string;
  risk: string | null;
  evidenceCount: number;
  dueDate: Date | null;
  owner: string | null;
};

type NormalizedCustomerControl = AggregatedControlFinding & {
  responseReviewStatus: string | null;
  evidenceReviewStatus: string | null;
  pendingEvidenceReviewCount: number;
  rejectedEvidenceCount: number;
  poamOpenCount: number;
  poamOverdueCount: number;
};

function aggregateControlsForAssessment(
  findings: Array<{
    controlId: string;
    status: string;
    risk: string | null;
    owner: string | null;
    dueDate: Date | null;
    evidenceLinks: Array<{ id: string }>;
    control: {
      id: string;
      code: string;
      title: string;
      frameworkId: string;
      framework: { id: string; key: string; name: string };
    };
  }>
) {
  const byControl = new Map<string, AggregatedControlFinding>();

  for (const finding of findings) {
    const current = byControl.get(finding.controlId);
    const evidenceCount = finding.evidenceLinks.length;

    if (!current) {
      byControl.set(finding.controlId, {
        controlId: finding.controlId,
        frameworkId: finding.control.frameworkId,
        frameworkName: finding.control.framework.name,
        frameworkKey: finding.control.framework.key,
        code: finding.control.code,
        title: finding.control.title,
        status: finding.status,
        risk: finding.risk,
        evidenceCount,
        dueDate: finding.dueDate,
        owner: finding.owner,
      });
      continue;
    }

    byControl.set(finding.controlId, {
      ...current,
      status: pickBestStatus(current.status, finding.status),
      risk: pickWorstRisk(current.risk, finding.risk),
      evidenceCount: current.evidenceCount + evidenceCount,
      dueDate:
        current.dueDate && finding.dueDate
          ? current.dueDate < finding.dueDate
            ? current.dueDate
            : finding.dueDate
          : current.dueDate ?? finding.dueDate,
      owner: current.owner ?? finding.owner,
    });
  }

  return [...byControl.values()];
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

export default async function CustomerDashboardPage() {
  const [frameworks, assessments] = await Promise.all([
    prisma.framework.findMany({
      include: { controls: { select: { id: true } } },
      orderBy: { key: "asc" },
    }),
    prisma.assessment.findMany({
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
                framework: { select: { id: true, key: true, name: true } },
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
                framework: { select: { id: true, key: true, name: true } },
              },
            },
            evidenceLinks: { select: { id: true } },
          },
        },
      },
      orderBy: [{ updatedAt: "desc" }],
    }),
  ]);

  if (assessments.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Customer Audit Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-600 sm:text-base">
            Portfolio oversight for vendor audits, evidence review, and remediation.
          </p>
        </div>
        <EmptyState
          icon={FolderOpen}
          title="No audits in the portfolio yet"
          description="Create assessments and findings to populate the customer review dashboard."
          secondaryAction={{ label: "Go to Assessments", href: "/assessments" }}
        />
      </div>
    );
  }

  const now = new Date();
  const frameworkControlCountById = new Map(
    frameworks.map((framework) => [framework.id, framework.controls.length] as const)
  );

  const normalizedAssessments = assessments.map((assessment) => {
    const responseRows: NormalizedCustomerControl[] =
      assessment.controlResponses.length > 0
        ? assessment.controlResponses.map((response) => {
            const evidenceReviewStatuses = response.evidenceSubmissions.map(
              (submission) => submission.reviewStatus
            );
            const pendingEvidenceReviewCount = response.evidenceSubmissions.filter((submission) =>
              ["SUBMITTED", "UNDER_REVIEW", "NEEDS_INFO", "REJECTED"].includes(
                submission.reviewStatus
              )
            ).length;
            const rejectedEvidenceCount = response.evidenceSubmissions.filter(
              (submission) => submission.reviewStatus === "REJECTED"
            ).length;
            const poamOpenCount = response.poamItems.filter((item) => item.status !== "DONE").length;
            const poamOverdueCount = response.poamItems.filter(
              (item) =>
                item.status !== "DONE" && item.dueDate !== null && item.dueDate < now
            ).length;

            return {
              controlId: response.controlId,
              frameworkId: response.control.frameworkId,
              frameworkName: response.control.framework.name,
              frameworkKey: response.control.framework.key,
              code: response.control.code,
              title: response.control.title,
              status: response.status,
              risk: response.risk,
              evidenceCount: response.evidenceSubmissions.length,
              dueDate: response.dueDate,
              owner: response.owner,
              responseReviewStatus: response.reviewStatus,
              evidenceReviewStatus: summarizeEvidenceReviewStatus(evidenceReviewStatuses),
              pendingEvidenceReviewCount,
              rejectedEvidenceCount,
              poamOpenCount,
              poamOverdueCount,
            };
          })
        : aggregateControlsForAssessment(assessment.findings).map((row) => ({
            ...row,
            responseReviewStatus: null,
            evidenceReviewStatus: null,
            pendingEvidenceReviewCount: row.evidenceCount > 0 && isOpenControlStatus(row.status) ? 1 : 0,
            rejectedEvidenceCount: 0,
            poamOpenCount: isOpenControlStatus(row.status) ? 1 : 0,
            poamOverdueCount:
              isOpenControlStatus(row.status) && row.dueDate && row.dueDate < now ? 1 : 0,
          }));

    return {
      assessment,
      vendorName: assessment.engagement?.vendorOrg.name ?? assessment.organization.name,
      customerName: assessment.engagement?.customerOrg.name ?? "Internal Program",
      engagementName: assessment.engagement?.name ?? null,
      rows: responseRows,
    };
  });

  const portfolioRows = normalizedAssessments.map((entry) => {
    const { assessment, rows } = entry;
    const frameworkIds = [...new Set(rows.map((item) => item.frameworkId))];
    const totalControls = frameworkIds.reduce(
      (sum, frameworkId) => sum + (frameworkControlCountById.get(frameworkId) ?? 0),
      0
    );
    const answeredControls = rows.filter((item) => isAnsweredControlStatus(item.status)).length;
    const implementedControls = rows.filter((item) => item.status === "IMPLEMENTED").length;
    const openControls = rows.filter((item) => isOpenControlStatus(item.status)).length;
    const evidenceCoveredControls = rows.filter((item) => item.evidenceCount > 0).length;
    const highRiskOpen = rows.filter(
      (item) => isOpenControlStatus(item.status) && riskWeight(item.risk) >= 3
    ).length;
    const completionPercent = totalControls > 0 ? (answeredControls / totalControls) * 100 : 0;
    const evidenceCoveragePercent =
      totalControls > 0 ? (evidenceCoveredControls / totalControls) * 100 : 0;
    const readinessScore = computeReadinessScore({
      completionPercent,
      evidenceCoveragePercent,
      highRiskOpen,
      totalControls,
    });
    const reviewerQueueCount = rows.filter(
      (item) =>
        item.responseReviewStatus === "SUBMITTED" ||
        item.responseReviewStatus === "UNDER_REVIEW" ||
        item.responseReviewStatus === "NEEDS_INFO" ||
        item.evidenceReviewStatus === "SUBMITTED" ||
        item.evidenceReviewStatus === "UNDER_REVIEW" ||
        item.evidenceReviewStatus === "NEEDS_INFO" ||
        item.evidenceReviewStatus === "REJECTED"
    ).length;

    return {
      assessmentId: assessment.id,
      assessmentName: assessment.name,
      assessmentStatus: assessment.status,
      vendorName: entry.vendorName,
      customerName: entry.customerName,
      engagementName: entry.engagementName,
      frameworks: [...new Set(rows.map((item) => item.frameworkName))],
      frameworkKeys: [...new Set(rows.map((item) => item.frameworkKey))],
      totalControls,
      answeredControls,
      implementedControls,
      openControls,
      highRiskOpen,
      evidenceCoveredControls,
      completionPercent,
      evidenceCoveragePercent,
      readinessScore,
      dueDate: assessment.endDate ?? assessment.engagement?.dueDate ?? null,
      updatedAt: assessment.updatedAt,
      reviewerQueueCount,
      poamOverdueCount: rows.reduce((sum, item) => sum + item.poamOverdueCount, 0),
    };
  });

  const flattenedFindings = normalizedAssessments.flatMap((entry) =>
    entry.rows.map((row) => ({
      id: `${entry.assessment.id}:${row.controlId}`,
      assessmentId: entry.assessment.id,
      assessmentName: entry.assessment.name,
      assessmentStatus: entry.assessment.status,
      organizationName: entry.vendorName,
      customerName: entry.customerName,
      engagementName: entry.engagementName,
      controlCode: row.code,
      controlTitle: row.title,
      frameworkName: row.frameworkName,
      frameworkKey: row.frameworkKey,
      status: row.status,
      risk: row.risk,
      dueDate: row.dueDate,
      owner: row.owner,
      evidenceCount: row.evidenceCount,
      responseReviewStatus: row.responseReviewStatus,
      evidenceReviewStatus: row.evidenceReviewStatus,
      pendingEvidenceReviewCount: row.pendingEvidenceReviewCount,
      rejectedEvidenceCount: row.rejectedEvidenceCount,
      poamOpenCount: row.poamOpenCount,
      poamOverdueCount: row.poamOverdueCount,
    }))
  );

  const reviewQueue = sortByRiskThenDue(
    flattenedFindings.filter(
      (row) =>
        row.pendingEvidenceReviewCount > 0 ||
        row.responseReviewStatus === "SUBMITTED" ||
        row.responseReviewStatus === "UNDER_REVIEW" ||
        row.responseReviewStatus === "NEEDS_INFO" ||
        row.responseReviewStatus === "REJECTED" ||
        row.poamOpenCount > 0 ||
        (isAnsweredControlStatus(row.status) && row.evidenceCount === 0)
    )
  ).slice(0, 12);

  const vendorCount = new Set(
    normalizedAssessments.map((entry) => entry.assessment.organizationId)
  ).size;
  const activeAudits = assessments.filter((assessment) => assessment.status !== "COMPLETE").length;
  const pendingEvidenceReview = flattenedFindings.filter(
    (row) =>
      row.evidenceReviewStatus === "SUBMITTED" || row.evidenceReviewStatus === "UNDER_REVIEW"
  ).length;
  const needsInfoOrRejected = flattenedFindings.filter(
    (row) =>
      row.responseReviewStatus === "NEEDS_INFO" ||
      row.responseReviewStatus === "REJECTED" ||
      row.evidenceReviewStatus === "NEEDS_INFO" ||
      row.evidenceReviewStatus === "REJECTED"
  ).length;
  const missingEvidence = flattenedFindings.filter(
    (row) => row.evidenceCount === 0 && isOpenControlStatus(row.status)
  ).length;
  const highRiskOpenTotal = flattenedFindings.filter(
    (row) => isOpenControlStatus(row.status) && riskWeight(row.risk) >= 3
  ).length;
  const overduePoam = flattenedFindings.reduce((sum, row) => sum + row.poamOverdueCount, 0);

  const totalControlsAcrossPortfolio = portfolioRows.reduce((sum, row) => sum + row.totalControls, 0);
  const answeredAcrossPortfolio = portfolioRows.reduce((sum, row) => sum + row.answeredControls, 0);
  const evidenceCoveredAcrossPortfolio = portfolioRows.reduce(
    (sum, row) => sum + row.evidenceCoveredControls,
    0
  );
  const completionPortfolioPercent =
    totalControlsAcrossPortfolio > 0 ? (answeredAcrossPortfolio / totalControlsAcrossPortfolio) * 100 : 0;
  const evidencePortfolioPercent =
    totalControlsAcrossPortfolio > 0
      ? (evidenceCoveredAcrossPortfolio / totalControlsAcrossPortfolio) * 100
      : 0;

  const openPortfolioItems = flattenedFindings.filter((row) => isOpenControlStatus(row.status));
  const slaAdherencePercent =
    openPortfolioItems.length > 0
      ? (openPortfolioItems.filter((row) => !row.dueDate || row.dueDate >= now).length /
          openPortfolioItems.length) *
        100
      : 100;

  const frameworkUsage = frameworks
    .map((framework) => {
      const rowsUsingFramework = portfolioRows.filter((row) =>
        row.frameworkKeys.includes(framework.key)
      );
      const avgCompletion =
        rowsUsingFramework.length > 0
          ? rowsUsingFramework.reduce((sum, row) => sum + row.completionPercent, 0) /
            rowsUsingFramework.length
          : 0;
      const openHighRisk = flattenedFindings.filter(
        (row) =>
          row.frameworkKey === framework.key &&
          isOpenControlStatus(row.status) &&
          riskWeight(row.risk) >= 3
      ).length;
      const openCount = flattenedFindings.filter(
        (row) => row.frameworkKey === framework.key && isOpenControlStatus(row.status)
      ).length;

      return {
        id: framework.id,
        key: framework.key,
        name: framework.name,
        version: framework.version,
        controlsCount: framework.controls.length,
        auditsCount: rowsUsingFramework.length,
        avgCompletion,
        openCount,
        openHighRisk,
      };
    })
    .sort((a, b) => {
      if (b.auditsCount !== a.auditsCount) return b.auditsCount - a.auditsCount;
      return a.name.localeCompare(b.name);
    });

  const implementedAcrossPortfolio = flattenedFindings.filter(
    (row) => row.status === "IMPLEMENTED"
  ).length;
  const partialAcrossPortfolio = flattenedFindings.filter(
    (row) => row.status === "PARTIALLY_IMPLEMENTED"
  ).length;
  const notApplicableAcrossPortfolio = flattenedFindings.filter(
    (row) => row.status === "NOT_APPLICABLE"
  ).length;
  const openAcrossPortfolio = flattenedFindings.filter((row) =>
    isOpenControlStatus(row.status)
  ).length;

  const controlStateBreakdown = [
    { label: "Implemented", value: implementedAcrossPortfolio, color: "#16a34a" },
    { label: "Partial", value: partialAcrossPortfolio, color: "#f59e0b" },
    { label: "Open", value: openAcrossPortfolio, color: "#ef4444" },
    { label: "Not Applicable", value: notApplicableAcrossPortfolio, color: "#94a3b8" },
  ];

  const queueBreakdownData = [
    { label: "Pending evidence review", value: pendingEvidenceReview, color: "#0ea5e9" },
    { label: "Needs info / rejected", value: needsInfoOrRejected, color: "#f43f5e" },
    { label: "Missing evidence", value: missingEvidence, color: "#f59e0b" },
    { label: "Overdue POA&M", value: overduePoam, color: "#ef4444" },
  ];

  const frameworkCompletionChartData = frameworkUsage
    .filter((framework) => framework.auditsCount > 0)
    .map((framework) => ({
      label: framework.key,
      value: Math.round(framework.avgCompletion),
      color:
        framework.avgCompletion >= 80
          ? "#16a34a"
          : framework.avgCompletion >= 50
            ? "#0ea5e9"
            : "#f59e0b",
    }));

  return (
    <PageStack>
      <PageHero
        badge="Customer review operations"
        title="Customer Audit Command Center"
        description="Monitor vendor readiness, review evidence, and track remediation across frameworks."
        chips={[
          { label: `${vendorCount} vendors`, tone: "info" },
          { label: `${activeAudits} active audits`, tone: "neutral" },
          {
            label: overduePoam > 0 ? `${overduePoam} overdue POA&M` : "No overdue POA&M",
            tone: overduePoam > 0 ? "danger" : "success",
          },
        ]}
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link href="/audits/new">Start New Audit</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/assessments">View Assessments</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/evidence">
                Review Evidence
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Vendors"
          value={vendorCount}
          helper="Organizations currently under review"
          icon={Building2}
          tone="sky"
        />
        <MetricCard
          label="Active Audits"
          value={activeAudits}
          helper={`${assessments.length} total assessments`}
          icon={ClipboardList}
          tone="slate"
        />
        <MetricCard
          label="Evidence Review Queue"
          value={pendingEvidenceReview}
          helper={`${needsInfoOrRejected} needs info/rejected · ${missingEvidence} missing evidence`}
          icon={FileSearch}
          tone="amber"
        />
        <MetricCard
          label="High-Risk Open Gaps"
          value={highRiskOpenTotal}
          helper="Requires priority remediation"
          icon={ShieldAlert}
          tone="rose"
        />
        <MetricCard
          label="Overdue POA&M Items"
          value={overduePoam}
          helper="Remediation tasks past due date"
          icon={Timer}
          tone={overduePoam > 0 ? "rose" : "emerald"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <RingMetricCard
          title="Portfolio Completion"
          subtitle="Answered controls across all active assessments"
          value={`${answeredAcrossPortfolio} / ${totalControlsAcrossPortfolio}`}
          percent={completionPortfolioPercent}
          color="#0ea5e9"
        />
        <RingMetricCard
          title="Evidence Coverage"
          subtitle="Controls with linked evidence"
          value={`${evidenceCoveredAcrossPortfolio} / ${totalControlsAcrossPortfolio}`}
          percent={evidencePortfolioPercent}
          color="#16a34a"
        />
        <RingMetricCard
          title="Remediation SLA Adherence"
          subtitle="Open items not overdue"
          value={`${clampPercent(slaAdherencePercent).toFixed(0)}%`}
          percent={slaAdherencePercent}
          color={slaAdherencePercent >= 85 ? "#16a34a" : "#f59e0b"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <DonutBreakdownCard
          title="Portfolio Control State"
          description="Current implementation state across all vendor audit control responses."
          centerLabel="Controls"
          data={controlStateBreakdown}
        />
        <HorizontalBarChartCard
          title="Review Queue Breakdown"
          description="At-a-glance counts for customer review workload and blockers."
          data={queueBreakdownData}
          maxItems={4}
        />
        <HorizontalBarChartCard
          title="Framework Completion (Avg)"
          description="Average completion across audits using each framework."
          data={frameworkCompletionChartData}
          valueSuffix="%"
        />
      </div>

      <SectionCard
        title="Vendor Audit Portfolio"
        description="Customer-ready view of vendor assessment readiness, evidence coverage, and risk posture."
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-200 hover:bg-transparent">
                <TableHead className="text-slate-600">Vendor</TableHead>
                <TableHead className="text-slate-600">Assessment</TableHead>
                <TableHead className="text-slate-600">Framework</TableHead>
                <TableHead className="text-slate-600">Status</TableHead>
                <TableHead className="text-slate-600">Review</TableHead>
                <TableHead className="min-w-[170px] text-slate-600">Completion</TableHead>
                <TableHead className="text-slate-600">Evidence</TableHead>
                <TableHead className="text-slate-600">High Risk</TableHead>
                <TableHead className="text-slate-600">Due</TableHead>
                <TableHead className="text-right text-slate-600">Readiness</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {portfolioRows
                .sort((a, b) => {
                  const aDue = a.dueDate?.getTime() ?? Number.POSITIVE_INFINITY;
                  const bDue = b.dueDate?.getTime() ?? Number.POSITIVE_INFINITY;
                  if (aDue !== bDue) return aDue - bDue;
                  return b.updatedAt.getTime() - a.updatedAt.getTime();
                })
                .map((row) => (
                  <TableRow
                    key={row.assessmentId}
                    className="border-slate-100 hover:bg-slate-50/50"
                  >
                    <TableCell className="font-medium text-slate-900">
                      <div className="space-y-1">
                        <p>{row.vendorName}</p>
                        <p className="text-xs font-normal text-slate-500">
                          Customer: {row.customerName}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium text-slate-900">{row.assessmentName}</p>
                        <p className="text-xs text-slate-500">
                          Updated {formatDate(row.updatedAt)}
                        </p>
                        {row.engagementName ? (
                          <p className="text-xs text-slate-500">{row.engagementName}</p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600">
                      <div className="flex flex-wrap gap-1">
                        {row.frameworks.slice(0, 2).map((name) => (
                          <span
                            key={name}
                            className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                          >
                            {name}
                          </span>
                        ))}
                        {row.frameworks.length > 2 ? (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                            +{row.frameworks.length - 2}
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={row.assessmentStatus} />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col items-start gap-1">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                          {row.reviewerQueueCount} queued
                        </span>
                        {row.poamOverdueCount > 0 ? (
                          <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700">
                            {row.poamOverdueCount} overdue POA&M
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <InlineProgress value={row.completionPercent} />
                        <p className="text-xs text-slate-500">
                          {row.answeredControls} / {row.totalControls} answered
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {row.evidenceCoveredControls} / {row.totalControls}
                    </TableCell>
                    <TableCell>
                      <RiskBadge risk={row.highRiskOpen > 0 ? "High" : "Low"} />
                    </TableCell>
                    <TableCell className="text-slate-600">
                      <div className="space-y-1">
                        <div>{formatDate(row.dueDate)}</div>
                        <div className="text-xs text-slate-500">{dueLabel(row.dueDate)}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-sm font-semibold tabular-nums text-slate-900">
                        {row.readinessScore.toFixed(0)}%
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SectionCard
          title="Framework Coverage"
          description="Audit usage and average completion across supported compliance frameworks."
        >
          <div className="space-y-0">
            {frameworkUsage.map((framework) => (
              <div
                key={framework.id}
                className="grid gap-3 border-b border-slate-100 px-4 py-4 last:border-b-0 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_auto]"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">{framework.name}</p>
                  <p className="text-xs text-slate-500">
                    {framework.key} {framework.version ? `· ${framework.version}` : ""} ·{" "}
                    {framework.controlsCount} controls
                  </p>
                </div>
                <div className="space-y-2">
                  <InlineProgress value={framework.avgCompletion} />
                  <p className="text-xs text-slate-500">
                    {framework.auditsCount} audit{framework.auditsCount === 1 ? "" : "s"} using framework
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                    {framework.openCount} open
                  </span>
                  <span className="rounded-full bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700">
                    {framework.openHighRisk} high risk
                  </span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Evidence Review Queue"
          description="Priority review items that need evidence verification or remediation follow-up."
          right={
            <Button variant="outline" size="sm" asChild>
              <Link href="/evidence">Open evidence workspace</Link>
            </Button>
          }
        >
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200 hover:bg-transparent">
                  <TableHead className="text-slate-600">Vendor / Assessment</TableHead>
                  <TableHead className="text-slate-600">Control</TableHead>
                  <TableHead className="text-slate-600">Status</TableHead>
                  <TableHead className="text-slate-600">Review</TableHead>
                  <TableHead className="text-slate-600">Risk</TableHead>
                  <TableHead className="text-slate-600">Evidence</TableHead>
                  <TableHead className="text-slate-600">Due</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviewQueue.length === 0 ? (
                  <TableRow className="border-slate-100">
                    <TableCell colSpan={7} className="py-8 text-center text-sm text-slate-500">
                      No items in the review queue.
                    </TableCell>
                  </TableRow>
                ) : (
                  reviewQueue.map((row) => (
                    <TableRow key={row.id} className="border-slate-100 hover:bg-slate-50/50">
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium text-slate-900">{row.organizationName}</p>
                          <p className="text-xs text-slate-500">{row.assessmentName}</p>
                          <p className="text-xs text-slate-500">{row.customerName}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-slate-900">
                            <span className="font-mono">{row.controlCode}</span> {row.controlTitle}
                          </p>
                          <p className="text-xs text-slate-500">{row.frameworkName}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={row.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col items-start gap-1">
                          {row.responseReviewStatus ? (
                            <StatusBadge status={row.responseReviewStatus} />
                          ) : (
                            <span className="text-xs text-slate-400">Legacy</span>
                          )}
                          {row.evidenceReviewStatus ? (
                            <StatusBadge status={row.evidenceReviewStatus} className="text-[10px]" />
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <RiskBadge risk={row.risk} />
                      </TableCell>
                      <TableCell className="text-slate-600">
                        <div className="space-y-1">
                          <div>{row.evidenceCount > 0 ? `${row.evidenceCount} linked` : "Missing"}</div>
                          {row.pendingEvidenceReviewCount > 0 ? (
                            <div className="text-xs text-amber-700">
                              {row.pendingEvidenceReviewCount} pending review
                            </div>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600">
                        <div className="space-y-1">
                          <div>{formatDate(row.dueDate)}</div>
                          <div className="text-xs text-slate-500">{dueLabel(row.dueDate)}</div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </SectionCard>
      </div>

      <PageCallout>
        Supported audit frameworks now include NIST 800-171, NIST 800-172, and NIST 800-53 in addition to HIPAA, SOC 2, ISO 27001, CIS Controls, and NIST CSF. Use the Frameworks page to manage mappings and extend the control library.
      </PageCallout>
    </PageStack>
  );
}
