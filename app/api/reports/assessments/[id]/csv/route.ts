import { prisma } from "@/lib/prisma";

function escapeCsv(value: unknown) {
  if (value === null || value === undefined) return "";
  const stringValue = String(value);
  if (/["\n,]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function formatDate(date: Date | null | undefined) {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const assessment = await prisma.assessment.findUnique({
    where: { id },
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
              framework: true,
            },
          },
          evidenceSubmissions: {
            select: {
              id: true,
              title: true,
              reviewStatus: true,
            },
          },
          poamItems: {
            select: {
              id: true,
              status: true,
              severity: true,
              dueDate: true,
            },
          },
        },
      },
      findings: {
        include: {
          control: {
            include: {
              framework: true,
            },
          },
          evidenceLinks: true,
        },
      },
    },
  });

  if (!assessment) {
    return new Response("Assessment not found", { status: 404 });
  }

  const rows =
    assessment.controlResponses.length > 0
      ? assessment.controlResponses.map((response) => ({
          frameworkKey: response.control.framework.key,
          frameworkName: response.control.framework.name,
          controlCode: response.control.code,
          controlTitle: response.control.title,
          domain: response.control.domain ?? "",
          controlStatus: response.status,
          reviewStatus: response.reviewStatus,
          risk: response.risk ?? "",
          owner: response.owner ?? "",
          dueDate: formatDate(response.dueDate),
          evidenceCount: response.evidenceSubmissions.length,
          evidenceReviewStatuses: response.evidenceSubmissions
            .map((submission) => submission.reviewStatus)
            .join(" | "),
          poamOpenCount: response.poamItems.filter((item) => item.status !== "DONE").length,
          poamStatuses: response.poamItems.map((item) => item.status).join(" | "),
          poamSeverities: response.poamItems.map((item) => item.severity).join(" | "),
        }))
      : assessment.findings.map((finding) => ({
          frameworkKey: finding.control.framework.key,
          frameworkName: finding.control.framework.name,
          controlCode: finding.control.code,
          controlTitle: finding.control.title,
          domain: finding.control.domain ?? "",
          controlStatus: finding.status,
          reviewStatus: "",
          risk: finding.risk ?? "",
          owner: finding.owner ?? "",
          dueDate: formatDate(finding.dueDate),
          evidenceCount: finding.evidenceLinks.length,
          evidenceReviewStatuses: "",
          poamOpenCount: "",
          poamStatuses: "",
          poamSeverities: "",
        }));

  const header = [
    "assessment_id",
    "assessment_name",
    "vendor_org",
    "customer_org",
    "engagement_name",
    "assessment_status",
    "start_date",
    "due_date",
    "framework_key",
    "framework_name",
    "control_code",
    "control_title",
    "domain",
    "control_status",
    "review_status",
    "risk",
    "owner",
    "control_due_date",
    "evidence_count",
    "evidence_review_statuses",
    "poam_open_count",
    "poam_statuses",
    "poam_severities",
  ];

  const csv = [
    header.join(","),
    ...rows.map((row) =>
      [
        assessment.id,
        assessment.name,
        assessment.engagement?.vendorOrg.name ?? assessment.organization.name,
        assessment.engagement?.customerOrg.name ?? "",
        assessment.engagement?.name ?? "",
        assessment.status,
        formatDate(assessment.startDate),
        formatDate(assessment.endDate ?? assessment.engagement?.dueDate),
        row.frameworkKey,
        row.frameworkName,
        row.controlCode,
        row.controlTitle,
        row.domain,
        row.controlStatus,
        row.reviewStatus,
        row.risk,
        row.owner,
        row.dueDate,
        row.evidenceCount,
        row.evidenceReviewStatuses,
        row.poamOpenCount,
        row.poamStatuses,
        row.poamSeverities,
      ]
        .map(escapeCsv)
        .join(",")
    ),
  ].join("\n");

  const filename = `assessment-${assessment.id}.csv`;

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

