import PDFDocument from "pdfkit";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import { DEMO_PROFILE_COOKIE, getDemoProfile } from "@/lib/demo-profiles";
import {
  clampPercent,
  computeReadinessScore,
  isAnsweredControlStatus,
  isOpenControlStatus,
  riskWeight,
} from "@/lib/compliance-dashboard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function currencylessPercent(value: number) {
  return `${Math.round(clampPercent(value))}%`;
}

function formatTimestamp(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function buildPdfBuffer(doc: PDFKit.PDFDocument) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.end();
  });
}

function sectionTitle(doc: PDFKit.PDFDocument, title: string) {
  doc.moveDown(0.6);
  doc.font("Helvetica-Bold").fontSize(12).fillColor("#0f172a").text(title);
  doc.moveDown(0.15);
  doc.strokeColor("#e2e8f0").lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(0.35);
}

function labelValueRow(doc: PDFKit.PDFDocument, label: string, value: string) {
  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor("#334155")
    .text(label, { continued: true });
  doc.font("Helvetica").fillColor("#0f172a").text(` ${value}`);
}

export async function GET() {
  const cookieStore = await cookies();
  const activeProfile = getDemoProfile(cookieStore.get(DEMO_PROFILE_COOKIE)?.value);

  const organization = await prisma.organization.findUnique({
    where: { name: activeProfile.organizationName },
    select: { id: true, name: true },
  });
  if (!organization) {
    return new Response("Active demo organization not found. Reset demo data first.", { status: 404 });
  }

  const [allControls, controlResponses, auditFindings, evidence, assessments, frameworks] =
    await Promise.all([
      prisma.control.findMany({
        include: { framework: true },
        orderBy: [{ framework: { key: "asc" } }, { code: "asc" }],
      }),
      prisma.controlResponse.findMany({
        where: {
          assessment: { organizationId: organization.id },
        },
        include: {
          control: {
            include: { framework: true },
          },
          assessment: true,
          evidenceSubmissions: true,
        },
      }),
      prisma.auditFinding.findMany({
        where: { organizationId: organization.id },
        include: {
          control: { include: { framework: true } },
        },
        orderBy: [{ severity: "desc" }, { updatedAt: "desc" }],
      }),
      prisma.evidence.findMany({
        include: {
          control: { include: { framework: true } },
        },
        orderBy: [{ updatedAt: "desc" }],
      }),
      prisma.assessment.findMany({
        where: { organizationId: organization.id },
        include: {
          engagement: { include: { customerOrg: true } },
        },
        orderBy: [{ updatedAt: "desc" }],
      }),
      prisma.framework.findMany({
        where: { key: { in: activeProfile.frameworkKeys } },
        include: { controls: { select: { id: true } } },
      }),
    ]);

  const latestResponseByControl = new Map<string, (typeof controlResponses)[number]>();
  for (const row of controlResponses.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())) {
    if (!latestResponseByControl.has(row.controlId)) {
      latestResponseByControl.set(row.controlId, row);
    }
  }

  const totalControls = allControls.length;
  const implementedControls = [...latestResponseByControl.values()].filter(
    (row) => row.status === "IMPLEMENTED"
  ).length;
  const answeredControls = [...latestResponseByControl.values()].filter((row) =>
    isAnsweredControlStatus(row.status)
  ).length;
  const missingControls = Math.max(0, totalControls - implementedControls);
  const evidenceCoverageControls = new Set(evidence.map((item) => item.controlId)).size;
  const evidenceCoveragePercent = totalControls > 0 ? (evidenceCoverageControls / totalControls) * 100 : 0;
  const completionPercent = totalControls > 0 ? (answeredControls / totalControls) * 100 : 0;
  const highRiskOpen = [...latestResponseByControl.values()].filter(
    (row) => isOpenControlStatus(row.status) && riskWeight(row.risk) >= 3
  ).length;
  const complianceScore = computeReadinessScore({
    completionPercent,
    evidenceCoveragePercent,
    highRiskOpen,
    totalControls,
  });

  const frameworkProgress = frameworks
    .map((framework) => {
      const controlIds = new Set(framework.controls.map((control) => control.id));
      const implemented = [...latestResponseByControl.values()].filter(
        (row) => controlIds.has(row.controlId) && row.status === "IMPLEMENTED"
      ).length;
      const total = framework.controls.length;
      return {
        key: framework.key,
        name: framework.name,
        percent: total > 0 ? (implemented / total) * 100 : 0,
        implemented,
        total,
      };
    })
    .sort((a, b) => b.percent - a.percent);

  const topFindings = auditFindings
    .slice()
    .sort((a, b) => {
      const severityWeight = (severity: "LOW" | "MEDIUM" | "HIGH") =>
        severity === "HIGH" ? 3 : severity === "MEDIUM" ? 2 : 1;
      const severityDelta = severityWeight(b.severity) - severityWeight(a.severity);
      if (severityDelta !== 0) return severityDelta;
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    })
    .slice(0, 5);

  const timestamp = new Date();
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  doc.info.Title = `${activeProfile.organizationName} Demo Audit Report`;
  doc.info.Author = "King Awhaetoma";
  doc.info.Subject = "Demo compliance audit summary";

  doc.rect(0, 0, doc.page.width, 72).fill("#0f172a");
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(18).text("Compliance Audit Summary Report", 50, 24);
  doc.font("Helvetica").fontSize(10).fillColor("#cbd5e1").text("Sample / Demo Data Export", 50, 48);

  doc.moveDown(3.2);
  doc.fillColor("#0f172a");
  labelValueRow(doc, "Organization:", activeProfile.organizationName);
  labelValueRow(doc, "Description:", activeProfile.description);
  labelValueRow(doc, "Industry:", activeProfile.industry);
  labelValueRow(doc, "Audit Period:", activeProfile.auditPeriodLabel);
  labelValueRow(doc, "Generated:", formatTimestamp(timestamp));

  doc.moveDown(0.4);
  doc
    .roundedRect(50, doc.y, 495, 42, 8)
    .fillAndStroke("#fef3c7", "#fde68a");
  doc
    .fillColor("#92400e")
    .font("Helvetica-Bold")
    .fontSize(10)
    .text(
      `Demo Notice: This PDF contains sample data for ${activeProfile.organizationName}. No real customer data is included.`,
      62,
      doc.y + 12,
      { width: 470 }
    );
  doc.moveDown(2.3);

  sectionTitle(doc, "Executive Summary");
  labelValueRow(doc, "Overall Compliance Score:", currencylessPercent(complianceScore));
  labelValueRow(doc, "Total Controls:", String(totalControls));
  labelValueRow(doc, "Implemented Controls:", String(implementedControls));
  labelValueRow(doc, "Missing Controls:", String(missingControls));
  labelValueRow(doc, "Evidence Coverage:", currencylessPercent(evidenceCoveragePercent));
  labelValueRow(doc, "Open Findings:", String(auditFindings.filter((f) => f.status === "OPEN").length));
  labelValueRow(doc, "High Severity Findings:", String(auditFindings.filter((f) => f.status === "OPEN" && f.severity === "HIGH").length));

  sectionTitle(doc, "Framework Progress");
  if (frameworkProgress.length === 0) {
    doc.font("Helvetica").fontSize(10).fillColor("#475569").text("No framework progress data available.");
  } else {
    frameworkProgress.slice(0, 8).forEach((row) => {
      doc.font("Helvetica-Bold").fontSize(10).fillColor("#0f172a").text(`${row.key} (${row.implemented}/${row.total})`, {
        continued: true,
      });
      doc.font("Helvetica").fillColor("#334155").text(` ${currencylessPercent(row.percent)}`);
    });
  }

  sectionTitle(doc, "Controls Summary");
  const statusCounts = [...latestResponseByControl.values()].reduce<Record<string, number>>((acc, row) => {
    acc[row.status] = (acc[row.status] ?? 0) + 1;
    return acc;
  }, {});
  ["IMPLEMENTED", "PARTIALLY_IMPLEMENTED", "NOT_IMPLEMENTED", "NOT_APPLICABLE"].forEach((status) => {
    labelValueRow(doc, `${status.replace(/_/g, " ")}:`, String(statusCounts[status] ?? 0));
  });

  sectionTitle(doc, "Top Findings");
  if (topFindings.length === 0) {
    doc.font("Helvetica").fontSize(10).fillColor("#475569").text("No findings recorded.");
  } else {
    topFindings.forEach((finding, index) => {
      doc.font("Helvetica-Bold").fontSize(10).fillColor("#0f172a").text(
        `${index + 1}. [${finding.severity}] ${finding.title} (${finding.status})`
      );
      if (finding.control) {
        doc.font("Helvetica").fontSize(9).fillColor("#334155").text(
          `Control: ${finding.control.framework.key} · ${finding.control.code} · ${finding.control.title}`
        );
      }
      doc.font("Helvetica").fontSize(9).fillColor("#475569").text(`Recommendation: ${finding.recommendation}`);
      doc.moveDown(0.25);
    });
  }

  sectionTitle(doc, "Evidence Summary");
  const evidenceByFramework = evidence.reduce<Record<string, number>>((acc, item) => {
    const key = item.control.framework.key;
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  labelValueRow(doc, "Total Evidence Items:", String(evidence.length));
  labelValueRow(doc, "File Uploads:", String(evidence.filter((e) => e.sourceType === "FILE").length));
  labelValueRow(doc, "URL Links:", String(evidence.filter((e) => e.sourceType === "URL").length));
  labelValueRow(doc, "Approved Evidence:", String(evidence.filter((e) => e.status === "APPROVED").length));
  labelValueRow(doc, "Pending Review Evidence:", String(evidence.filter((e) => e.status === "PENDING_REVIEW").length));
  if (Object.keys(evidenceByFramework).length > 0) {
    doc.moveDown(0.25);
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#334155").text("Evidence by Framework:");
    Object.entries(evidenceByFramework)
      .sort((a, b) => b[1] - a[1])
      .forEach(([frameworkKey, count]) => {
        doc.font("Helvetica").fontSize(9).fillColor("#475569").text(`• ${frameworkKey}: ${count}`);
      });
  }

  sectionTitle(doc, "Assessments in Scope");
  assessments.forEach((assessment, index) => {
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#0f172a").text(`${index + 1}. ${assessment.name}`);
    doc.font("Helvetica").fontSize(9).fillColor("#475569").text(
      `Status: ${assessment.status} · Customer: ${assessment.engagement?.customerOrg.name ?? "Demo Customer"}`
    );
  });

  const pdfBuffer = await buildPdfBuffer(doc);
  const filename = `demo-audit-summary-${activeProfile.id}-${timestamp.toISOString().slice(0, 10)}.pdf`;

  return new Response(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
