export const dynamic = "force-dynamic";
export const revalidate = 0;

import { cookies } from "next/headers";
import Link from "next/link";
import { FileDown, ShieldAlert } from "lucide-react";

import { prisma } from "@/lib/prisma";
import {
  clampPercent,
  computeReadinessScore,
  isAnsweredControlStatus,
  isOpenControlStatus,
  pickBestStatus,
  pickWorstRisk,
  riskWeight,
} from "@/lib/compliance-dashboard";
import { PageStack } from "@/components/compliance/page-chrome";
import { DemoOrganizationHeader } from "@/components/dashboard/demo-organization-header";
import { ExecutiveSummaryCards } from "@/components/dashboard/executive-summary-cards";
import { ComplianceOverviewCharts } from "@/components/dashboard/compliance-overview-charts";
import { AuditWorkspace } from "@/components/dashboard/audit-workspace";
import { DEMO_PROFILE_COOKIE, getDemoProfile } from "@/lib/demo-profiles";
import { MetricCard } from "@/components/compliance/dashboard-ui";
import { RecentAuditActivity } from "@/components/dashboard/recent-audit-activity";
import { Button } from "@/components/ui/button";

type AggregatedControlState = {
  controlId: string;
  status: string;
  risk: string | null;
  evidenceCount: number;
};

function aggregateControls(
  sources: Array<{
    controlId: string;
    status: string;
    risk: string | null;
    evidenceCount: number;
  }>
) {
  const byControl = new Map<string, AggregatedControlState>();

  for (const row of sources) {
    const current = byControl.get(row.controlId);
    if (!current) {
      byControl.set(row.controlId, {
        controlId: row.controlId,
        status: row.status,
        risk: row.risk,
        evidenceCount: row.evidenceCount,
      });
      continue;
    }

    byControl.set(row.controlId, {
      controlId: row.controlId,
      status: pickBestStatus(current.status, row.status),
      risk: pickWorstRisk(current.risk, row.risk),
      evidenceCount: current.evidenceCount + row.evidenceCount,
    });
  }

  return [...byControl.values()];
}

function buildDemoTrendData(currentComplianceScore: number) {
  const labels = [
    { month: "Jan 2026", label: "Jan" },
    { month: "Feb 2026", label: "Feb" },
    { month: "Mar 2026", label: "Mar" },
    { month: "Apr 2026", label: "Apr" },
    { month: "May 2026", label: "May" },
    { month: "Jun 2026", label: "Jun" },
    { month: "Jul 2026", label: "Jul" },
    { month: "Aug 2026", label: "Aug" },
    { month: "Sep 2026", label: "Sep" },
    { month: "Oct 2026", label: "Oct" },
    { month: "Nov 2026", label: "Nov" },
    { month: "Dec 2026", label: "Dec" },
  ];
  const targetByMonth = [35, 40, 44, 48, 52, 57, 61, 66, 70, 74, 78, 82];
  const current = clampPercent(Math.round(currentComplianceScore));
  const start = clampPercent(Math.max(18, Math.round(current * 0.55)));
  const variance = [0, 2, -1, 1, 0, 2, -2, 1, 2, -1, 1, 0];

  return labels.map((month, index) => {
    const ratio = labels.length > 1 ? index / (labels.length - 1) : 1;
    const interpolated = start + (current - start) * ratio + variance[index];
    const compliance = index === labels.length - 1 ? current : clampPercent(Math.round(interpolated));
    return {
      month: month.month,
      label: month.label,
      compliance,
      target: targetByMonth[index],
    };
  });
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const activeDemoProfile = getDemoProfile(cookieStore.get(DEMO_PROFILE_COOKIE)?.value);
  const activeOrganization = await prisma.organization.findUnique({
    where: { name: activeDemoProfile.organizationName },
    select: { id: true },
  });

  // Avoid exhausting low-connection hosted Postgres pools (e.g. Supabase session mode)
  // by reducing per-request query fan-out on the dashboard.
  const controls = await prisma.control.findMany({
    include: {
      framework: true,
    },
    orderBy: [{ code: "asc" }],
  });
  const frameworks = await prisma.framework.findMany({
    include: { controls: { select: { id: true } } },
    orderBy: [{ key: "asc" }],
  });
  const findingsSummary = await prisma.finding.findMany({
    select: {
      controlId: true,
      status: true,
      risk: true,
      evidenceLinks: { select: { id: true } },
    },
  });
  const controlResponsesSummary = await prisma.controlResponse.findMany({
    select: {
      controlId: true,
      status: true,
      risk: true,
      _count: { select: { evidenceSubmissions: true } },
    },
  });
  const recentAssessmentsRaw = await prisma.assessment.findMany({
    take: 5,
    orderBy: [{ updatedAt: "desc" }],
    include: {
      organization: true,
      engagement: {
        include: { customerOrg: true },
      },
      findings: { select: { status: true } },
      controlResponses: { select: { status: true } },
    },
  });
  const recentEvidenceSubmissionsRaw = await prisma.evidenceSubmission.findMany({
    take: 5,
    orderBy: [{ updatedAt: "desc" }],
    include: {
      controlResponse: {
        include: {
          control: {
            include: {
              framework: { select: { key: true } },
            },
          },
          assessment: {
            include: {
              organization: { select: { name: true } },
            },
          },
        },
      },
    },
  });
  const recentLegacyEvidenceRaw = await prisma.evidence.findMany({
    take: 5,
    orderBy: [{ createdAt: "desc" }],
    include: {
      control: {
        include: {
          framework: { select: { key: true } },
        },
      },
    },
  });
  const recentControlResponsesRaw = await prisma.controlResponse.findMany({
    take: 6,
    orderBy: [{ updatedAt: "desc" }],
    include: {
      control: {
        include: {
          framework: { select: { key: true } },
        },
      },
      assessment: {
        include: {
          organization: { select: { name: true } },
        },
      },
    },
  });
  const recentFindingsRaw = await prisma.finding.findMany({
    take: 6,
    orderBy: [{ updatedAt: "desc" }],
    include: {
      control: {
        include: {
          framework: { select: { key: true } },
        },
      },
      assessment: {
        include: {
          organization: { select: { name: true } },
        },
      },
    },
  });

  const auditFindings = activeOrganization
    ? await prisma.auditFinding.findMany({
        where: { organizationId: activeOrganization.id },
        include: {
          control: { select: { code: true } },
        },
      })
    : [];
  const recentAuditActivityRaw = activeOrganization
    ? await prisma.auditActivityLog.findMany({
        where: { organizationId: activeOrganization.id },
        include: {
          control: { select: { code: true } },
          evidence: { select: { title: true } },
          auditFinding: { select: { title: true } },
        },
        orderBy: [{ createdAt: "desc" }],
        take: 8,
      })
    : [];

  const aggregatedControlStates = aggregateControls([
    ...findingsSummary.map((row) => ({
      controlId: row.controlId,
      status: row.status,
      risk: row.risk ?? null,
      evidenceCount: row.evidenceLinks.length,
    })),
    ...controlResponsesSummary.map((row) => ({
      controlId: row.controlId,
      status: row.status,
      risk: row.risk ?? null,
      evidenceCount: row._count.evidenceSubmissions,
    })),
  ]);

  const totalControls = controls.length;
  const implementedControls = aggregatedControlStates.filter(
    (row) => row.status === "IMPLEMENTED"
  ).length;
  const missingControls = Math.max(0, totalControls - implementedControls);
  const highRiskControls = aggregatedControlStates.filter(
    (row) => isOpenControlStatus(row.status) && riskWeight(row.risk) >= 3
  ).length;
  const evidenceCollectedControls = aggregatedControlStates.filter(
    (row) => row.evidenceCount > 0
  ).length;
  const evidenceCollectedPercent =
    totalControls > 0 ? (evidenceCollectedControls / totalControls) * 100 : 0;
  const answeredControls = aggregatedControlStates.filter((row) =>
    isAnsweredControlStatus(row.status)
  ).length;
  const completionPercent =
    totalControls > 0 ? (answeredControls / totalControls) * 100 : 0;
  const overallComplianceScorePercent = computeReadinessScore({
    completionPercent,
    evidenceCoveragePercent: evidenceCollectedPercent,
    highRiskOpen: highRiskControls,
    totalControls,
  });
  const compliancePercentage =
    totalControls > 0 ? (implementedControls / totalControls) * 100 : 0;

  const implementedByControl = new Set(
    aggregatedControlStates
      .filter((row) => row.status === "IMPLEMENTED")
      .map((row) => row.controlId)
  );
  const frameworkProgress = frameworks.map((framework) => {
    const total = framework.controls.length;
    const implemented = framework.controls.filter((control) =>
      implementedByControl.has(control.id)
    ).length;
    const percent = total > 0 ? (implemented / total) * 100 : 0;
    return {
      key: framework.key,
      name: framework.name,
      percent,
      implementedCount: implemented,
      totalControls: total,
    };
  });

  const recentEvidence =
    recentEvidenceSubmissionsRaw.length > 0
      ? recentEvidenceSubmissionsRaw.map((item) => ({
          id: item.id,
          title: item.title,
          organizationName: item.controlResponse.assessment.organization.name,
          controlCode: item.controlResponse.control.code,
          frameworkKey: item.controlResponse.control.framework.key,
          reviewStatus: item.reviewStatus,
          updatedAt: item.updatedAt,
          sourceLabel: "Submission",
        }))
      : recentLegacyEvidenceRaw.map((item) => ({
          id: item.id,
          title: item.title,
          organizationName: "Legacy Evidence Library",
          controlCode: item.control.code,
          frameworkKey: item.control.framework.key,
          reviewStatus: null,
          updatedAt: item.createdAt,
          sourceLabel: "Legacy",
        }));

  const recentAssessments = recentAssessmentsRaw.map((assessment) => {
    const rows =
      assessment.controlResponses.length > 0
        ? assessment.controlResponses
        : assessment.findings;
    const implemented = rows.filter((row) => row.status === "IMPLEMENTED").length;
    const total = rows.length;
    const progressPercent = total > 0 ? (implemented / total) * 100 : 0;

    return {
      id: assessment.id,
      name: assessment.name,
      organizationName: assessment.organization.name,
      customerName: assessment.engagement?.customerOrg.name ?? null,
      status: assessment.status,
      updatedAt: assessment.updatedAt,
      progressPercent,
    };
  });

  const recentControlUpdates =
    recentControlResponsesRaw.length > 0
      ? recentControlResponsesRaw.map((row) => ({
          id: row.id,
          controlCode: row.control.code,
          controlTitle: row.control.title,
          frameworkKey: row.control.framework.key,
          organizationName: row.assessment.organization.name,
          status: row.status,
          risk: row.risk,
          updatedAt: row.updatedAt,
          reviewStatus: row.reviewStatus,
        }))
      : recentFindingsRaw.map((row) => ({
          id: row.id,
          controlCode: row.control.code,
          controlTitle: row.control.title,
          frameworkKey: row.control.framework.key,
          organizationName: row.assessment.organization.name,
          status: row.status,
          risk: row.risk,
          updatedAt: row.updatedAt,
          reviewStatus: null,
        }));

  const trend = buildDemoTrendData(overallComplianceScorePercent);
  const openFindingsCount = auditFindings.filter((finding) => finding.status === "OPEN").length;
  const highSeverityFindingsCount = auditFindings.filter(
    (finding) => finding.status === "OPEN" && finding.severity === "HIGH"
  ).length;

  const recentAuditActivity = recentAuditActivityRaw.map((item) => ({
    id: item.id,
    action: item.action,
    message: item.message,
    actor: item.actor ?? null,
    createdAt: item.createdAt,
    controlCode: item.control?.code ?? null,
    evidenceTitle: item.evidence?.title ?? null,
    findingTitle: item.auditFinding?.title ?? null,
  }));

  return (
    <PageStack>
      <DemoOrganizationHeader
        organizationName={activeDemoProfile.organizationName}
        description={activeDemoProfile.description}
        industry={activeDemoProfile.industry}
        complianceScope={activeDemoProfile.complianceScopeLabels}
        auditStatus={activeDemoProfile.auditStatus}
        auditProgressPercent={activeDemoProfile.auditProgressPercent}
        auditPeriodLabel={activeDemoProfile.auditPeriodLabel}
        avatarInitials={activeDemoProfile.avatarInitials}
        actions={
          <>
            <Button size="sm" variant="outline" asChild>
              <a
                href="/api/reports/dashboard/demo-audit-summary/pdf"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FileDown className="size-4" />
                Generate Audit Report
              </a>
            </Button>
            <Button size="sm" asChild>
              <Link href="/findings">Open Findings Workspace</Link>
            </Button>
          </>
        }
      />

      <ExecutiveSummaryCards
        overallComplianceScorePercent={overallComplianceScorePercent}
        totalControls={totalControls}
        implementedControls={implementedControls}
        missingControls={missingControls}
        highRiskControls={highRiskControls}
        evidenceCollectedPercent={evidenceCollectedPercent}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <MetricCard
          label="Open Findings"
          value={openFindingsCount}
          helper="Dedicated audit findings requiring remediation"
          icon={ShieldAlert}
          tone={openFindingsCount > 0 ? "amber" : "emerald"}
        />
        <MetricCard
          label="High Severity Findings"
          value={highSeverityFindingsCount}
          helper="Open high-severity findings for active demo org"
          icon={ShieldAlert}
          tone={highSeverityFindingsCount > 0 ? "rose" : "emerald"}
        />
      </div>

      <ComplianceOverviewCharts
        compliancePercentage={compliancePercentage}
        totalControls={totalControls}
        implementedControls={implementedControls}
        missingControls={missingControls}
        frameworks={frameworkProgress}
        trend={trend}
      />

      <AuditWorkspace
        recentEvidence={recentEvidence}
        recentAssessments={recentAssessments}
        recentControlUpdates={recentControlUpdates}
      />

      <RecentAuditActivity items={recentAuditActivity} />

      <footer className="rounded-2xl border border-border bg-card/70 px-4 py-3 text-xs text-muted-foreground">
        <p>Demo platform built and designed by King Awhaetoma.</p>
        <p>Sample data used for demonstration purposes.</p>
      </footer>
    </PageStack>
  );
}
