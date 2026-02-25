import type { Prisma, PrismaClient } from "../generated/prisma/client";

import type { DemoProfile, DemoProfileId } from "./demo-profiles";
import { getDemoProfile } from "./demo-profiles";

type Tx = Prisma.TransactionClient;

type AssessmentPlan = {
  name: string;
  frameworkKeys: string[];
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETE";
  startOffsetDays: number;
  endOffsetDays: number;
};

const owners = ["Security", "Compliance", "IT", "Platform", "Engineering", "GRC"];

function addDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function buildDemoFilePath(profile: DemoProfile, controlCode: string, suffix: string) {
  const controlSlug = controlCode.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase();
  return `/demo-uploads/seed/${slugify(profile.organizationName)}/${controlSlug}-${suffix}`;
}

function seededStatus(index: number, assessmentStatus: AssessmentPlan["status"]) {
  if (assessmentStatus === "NOT_STARTED") return "NOT_IMPLEMENTED" as const;
  if (assessmentStatus === "COMPLETE") {
    const pattern = [
      "IMPLEMENTED",
      "IMPLEMENTED",
      "PARTIALLY_IMPLEMENTED",
      "IMPLEMENTED",
      "NOT_APPLICABLE",
      "IMPLEMENTED",
    ] as const;
    return pattern[index % pattern.length];
  }

  const pattern = [
    "PARTIALLY_IMPLEMENTED",
    "IMPLEMENTED",
    "NOT_IMPLEMENTED",
    "IMPLEMENTED",
    "PARTIALLY_IMPLEMENTED",
    "NOT_IMPLEMENTED",
    "IMPLEMENTED",
    "NOT_APPLICABLE",
  ] as const;
  return pattern[index % pattern.length];
}

function seededRisk(index: number, status: string) {
  if (status === "IMPLEMENTED" || status === "NOT_APPLICABLE") {
    return index % 4 === 0 ? "Low" : null;
  }
  const pattern = ["High", "Medium", "High", "Medium", "Low"] as const;
  return pattern[index % pattern.length];
}

function shouldAttachEvidence(index: number, status: string) {
  if (status === "IMPLEMENTED") return true;
  if (status === "PARTIALLY_IMPLEMENTED") return index % 2 === 0;
  if (status === "NOT_APPLICABLE") return index % 3 === 0;
  return false;
}

function seededResponseReviewStatus(
  index: number,
  controlStatus: string,
  hasEvidence: boolean,
  assessmentStatus: AssessmentPlan["status"]
) {
  if (assessmentStatus === "NOT_STARTED") return "DRAFT" as const;
  if (assessmentStatus === "COMPLETE") {
    if (controlStatus === "NOT_IMPLEMENTED") return "NEEDS_INFO" as const;
    return "APPROVED" as const;
  }

  if (!hasEvidence && (controlStatus === "IMPLEMENTED" || controlStatus === "PARTIALLY_IMPLEMENTED")) {
    return "NEEDS_INFO" as const;
  }
  if (controlStatus === "NOT_IMPLEMENTED") {
    return index % 2 === 0 ? "DRAFT" : "SUBMITTED";
  }
  if (controlStatus === "PARTIALLY_IMPLEMENTED") {
    const pattern = ["SUBMITTED", "UNDER_REVIEW", "NEEDS_INFO"] as const;
    return pattern[index % pattern.length];
  }
  if (controlStatus === "NOT_APPLICABLE") return "APPROVED" as const;
  const pattern = ["UNDER_REVIEW", "APPROVED", "SUBMITTED"] as const;
  return pattern[index % pattern.length];
}

function seededEvidenceReviewStatus(index: number, responseReviewStatus: string) {
  if (responseReviewStatus === "APPROVED") return "APPROVED" as const;
  if (responseReviewStatus === "REJECTED") return "REJECTED" as const;
  if (responseReviewStatus === "NEEDS_INFO") return "NEEDS_INFO" as const;
  if (responseReviewStatus === "UNDER_REVIEW") return "UNDER_REVIEW" as const;
  const pattern = ["SUBMITTED", "UNDER_REVIEW", "APPROVED"] as const;
  return pattern[index % pattern.length];
}

function seededPoamStatus(index: number, controlStatus: string, reviewStatus: string) {
  if (controlStatus === "IMPLEMENTED" && reviewStatus === "APPROVED") return "DONE" as const;
  if (controlStatus === "NOT_APPLICABLE") return "DONE" as const;
  if (reviewStatus === "NEEDS_INFO") return "OPEN" as const;
  const pattern = ["OPEN", "IN_PROGRESS", "BLOCKED"] as const;
  return pattern[index % pattern.length];
}

function seededPoamSeverity(risk: string | null) {
  if (!risk) return "LOW" as const;
  const normalized = risk.toLowerCase();
  if (normalized.startsWith("crit")) return "CRITICAL" as const;
  if (normalized.startsWith("high")) return "HIGH" as const;
  if (normalized.startsWith("med")) return "MEDIUM" as const;
  return "LOW" as const;
}

function buildAssessmentPlans(profile: DemoProfile): AssessmentPlan[] {
  const primaryKeys = [...new Set(profile.frameworkKeys)];
  const firstTwo = primaryKeys.slice(0, 2);
  const assuranceCandidates = primaryKeys
    .filter((key) => ["SOC2", "ISO27001", "NIST80053", "CIS"].includes(key))
    .slice(0, 2);
  const assuranceKeys = assuranceCandidates.length > 0 ? assuranceCandidates : primaryKeys.slice(-2);

  return [
    {
      name: `${profile.organizationName.replace(" (Demo Organization)", "")} Annual Security Compliance Audit 2026`,
      frameworkKeys: primaryKeys,
      status: "IN_PROGRESS",
      startOffsetDays: -32,
      endOffsetDays: 90,
    },
    {
      name: `${profile.organizationName.replace(" (Demo Organization)", "")} Control Validation Review`,
      frameworkKeys: firstTwo.length > 0 ? firstTwo : primaryKeys.slice(0, 1),
      status: "IN_PROGRESS",
      startOffsetDays: -15,
      endOffsetDays: 45,
    },
    {
      name: `${profile.organizationName.replace(" (Demo Organization)", "")} Assurance Readiness Sprint`,
      frameworkKeys: assuranceKeys.length > 0 ? assuranceKeys : primaryKeys.slice(0, 2),
      status: "COMPLETE",
      startOffsetDays: -75,
      endOffsetDays: -5,
    },
  ];
}

async function clearDemoWorkspace(tx: Tx) {
  await tx.auditActivityLog.deleteMany();
  await tx.auditFinding.deleteMany();
  await tx.evidenceLink.deleteMany();
  await tx.evidenceSubmission.deleteMany();
  await tx.pOAMItem.deleteMany();
  await tx.controlResponse.deleteMany();
  await tx.finding.deleteMany();
  await tx.evidence.deleteMany();
  await tx.assessment.deleteMany();
  await tx.engagement.deleteMany();
  await tx.organization.deleteMany();
}

async function seedProfileWorkspace(tx: Tx, profile: DemoProfile) {
  const customerOrg = await tx.organization.create({
    data: { name: profile.customerOrgName },
  });

  const vendorOrg = await tx.organization.create({
    data: { name: profile.organizationName },
  });

  const engagement = await tx.engagement.create({
    data: {
      customerOrgId: customerOrg.id,
      vendorOrgId: vendorOrg.id,
      name: profile.engagementName,
      status: "ACTIVE",
      startDate: addDays(-30),
      dueDate: addDays(75),
    },
  });

  const frameworks = await tx.framework.findMany({
    where: { key: { in: profile.frameworkKeys } },
    include: {
      controls: {
        select: { id: true, code: true, title: true },
        orderBy: { code: "asc" },
      },
    },
    orderBy: { key: "asc" },
  });

  const frameworkByKey = new Map(frameworks.map((framework) => [framework.key, framework]));
  for (const key of profile.frameworkKeys) {
    const framework = frameworkByKey.get(key);
    if (!framework || framework.controls.length === 0) {
      throw new Error(
        `Framework ${key} is missing or has no controls. Run prisma seed to provision baseline frameworks/controls.`
      );
    }
  }

  const plans = buildAssessmentPlans(profile);

  for (const [planIndex, plan] of plans.entries()) {
    const assessment = await tx.assessment.create({
      data: {
        organizationId: vendorOrg.id,
        engagementId: engagement.id,
        name: plan.name,
        status: plan.status,
        startDate: addDays(plan.startOffsetDays),
        endDate: addDays(plan.endOffsetDays),
      },
    });

    const scopedControls = plan.frameworkKeys.flatMap(
      (frameworkKey) => frameworkByKey.get(frameworkKey)?.controls ?? []
    );

    let auditFindingsCreatedForPlan = 0;

    for (const [index, control] of scopedControls.entries()) {
      const globalIndex = planIndex * 1000 + index;
      const status = seededStatus(globalIndex, plan.status);
      const risk = seededRisk(globalIndex + profile.organizationName.length, status);
      const hasEvidence = shouldAttachEvidence(globalIndex, status);
      const reviewStatus = seededResponseReviewStatus(globalIndex, status, hasEvidence, plan.status);
      const evidenceReviewStatus = seededEvidenceReviewStatus(globalIndex, reviewStatus);
      const owner = owners[(globalIndex + profile.industry.length) % owners.length];
      const dueDate =
        status === "IMPLEMENTED" || status === "NOT_APPLICABLE"
          ? null
          : addDays((globalIndex % 9) * 4 - 8);

      const finding = await tx.finding.create({
        data: {
          assessmentId: assessment.id,
          controlId: control.id,
          status,
          risk,
          owner,
          dueDate,
          notes:
            status === "IMPLEMENTED"
              ? "Control implemented and evidence collected for demo audit review."
              : status === "NOT_APPLICABLE"
                ? "Control not applicable in this demo assessment scope."
                : "Control requires remediation and/or additional evidence for audit readiness.",
        },
      });

      if (planIndex === 0 && index < 10) {
        await tx.auditActivityLog.create({
          data: {
            action: "CONTROL_STATUS_CHANGED",
            organizationId: vendorOrg.id,
            assessmentId: assessment.id,
            controlId: control.id,
            actor: `${profile.organizationName.replace(" (Demo Organization)", "")} Compliance Team`,
            message: `Updated ${control.code} status to ${status.replace(/_/g, " ")} in ${profile.organizationName}.`,
            metadata: {
              status,
              risk,
              source: "demo-seed",
            } satisfies Prisma.InputJsonValue,
            createdAt: addDays(plan.startOffsetDays + (index % 12)),
          },
        });
      }

      const response = await tx.controlResponse.create({
        data: {
          assessmentId: assessment.id,
          controlId: control.id,
          status,
          reviewStatus,
          risk,
          owner,
          dueDate,
          vendorNotes:
            reviewStatus === "DRAFT"
              ? "Draft vendor response in progress (demo data)."
              : `Vendor response submitted for ${control.code} (demo).`,
          reviewerNotes:
            reviewStatus === "NEEDS_INFO"
              ? "Please attach stronger evidence and updated documentation."
              : reviewStatus === "APPROVED"
                ? "Accepted by reviewer in demo audit workflow."
                : reviewStatus === "UNDER_REVIEW"
                  ? "Awaiting reviewer validation."
                  : null,
          submittedAt: reviewStatus === "DRAFT" ? null : addDays(plan.startOffsetDays + 2 + (index % 5)),
          reviewedAt:
            reviewStatus === "APPROVED" || reviewStatus === "NEEDS_INFO"
              ? addDays(plan.startOffsetDays + 5 + (index % 6))
              : null,
        },
      });

      if (hasEvidence) {
        const evidence = await tx.evidence.create({
          data: {
            controlId: control.id,
            title: `${control.code} - ${slugify(profile.organizationName)} evidence`,
            description: `Seeded sample evidence for ${profile.organizationName} to demonstrate audit evidence workflows.`,
            url: `https://demo.example.com/evidence/${slugify(profile.organizationName)}/${control.code.replace(/[^a-zA-Z0-9]+/g, "-")}`,
            sourceType: index % 3 === 0 ? "FILE" : "URL",
            status:
              evidenceReviewStatus === "APPROVED"
                ? "APPROVED"
                : evidenceReviewStatus === "REJECTED"
                  ? "REJECTED"
                  : "PENDING_REVIEW",
            fileName:
              index % 3 === 0
                ? `${control.code.replace(/[^a-zA-Z0-9]+/g, "-")}-${slugify(profile.industry)}.pdf`
                : null,
            mimeType: index % 3 === 0 ? "application/pdf" : null,
            fileSizeBytes: index % 3 === 0 ? 145_000 + (index % 7) * 23_000 : null,
            storagePath: index % 3 === 0 ? buildDemoFilePath(profile, control.code, "evidence.pdf") : null,
            uploadedBy: `${profile.organizationName.replace(" (Demo Organization)", "")} Compliance Team`,
          },
        });

        await tx.evidenceLink.create({
          data: {
            findingId: finding.id,
            evidenceId: evidence.id,
          },
        });

        await tx.evidenceSubmission.create({
          data: {
            controlResponseId: response.id,
            title: `${control.code} - ${profile.avatarInitials} submission`,
            url: `https://demo.example.com/submissions/${slugify(profile.organizationName)}/${control.code.replace(/[^a-zA-Z0-9]+/g, "-")}`,
            description: `Sample evidence submission for ${control.code} under ${plan.name}.`,
            submittedBy: `${profile.organizationName.replace(" (Demo Organization)", "")} Compliance Team`,
            reviewStatus: evidenceReviewStatus,
            reviewerComment:
              evidenceReviewStatus === "NEEDS_INFO"
                ? "Sample reviewer note: upload timestamped screenshot or signed policy."
                : evidenceReviewStatus === "REJECTED"
                  ? "Sample reviewer note: evidence is outdated and requires replacement."
                  : evidenceReviewStatus === "APPROVED"
                    ? "Sample reviewer note: evidence accepted."
                    : null,
            reviewedBy:
              evidenceReviewStatus === "APPROVED" ||
              evidenceReviewStatus === "REJECTED" ||
              evidenceReviewStatus === "NEEDS_INFO"
                ? `${profile.customerOrgName} Reviewer`
                : null,
            submittedAt: addDays(plan.startOffsetDays + 1 + (index % 4)),
            reviewedAt:
              evidenceReviewStatus === "APPROVED" ||
              evidenceReviewStatus === "REJECTED" ||
              evidenceReviewStatus === "NEEDS_INFO"
                ? addDays(plan.startOffsetDays + 4 + (index % 5))
                : null,
          },
        });

        if (planIndex === 0 && index < 8) {
          await tx.auditActivityLog.create({
            data: {
              action: "EVIDENCE_ADDED",
              organizationId: vendorOrg.id,
              assessmentId: assessment.id,
              controlId: control.id,
              evidenceId: evidence.id,
              actor: `${profile.organizationName.replace(" (Demo Organization)", "")} Compliance Team`,
              message: `Added evidence for ${control.code} in ${profile.organizationName}.`,
              metadata: {
                evidenceTitle: evidence.title,
                evidenceStatus:
                  evidenceReviewStatus === "APPROVED"
                    ? "APPROVED"
                    : evidenceReviewStatus === "REJECTED"
                      ? "REJECTED"
                      : "PENDING_REVIEW",
                sourceType: index % 3 === 0 ? "FILE" : "URL",
                source: "demo-seed",
              } satisfies Prisma.InputJsonValue,
              createdAt: addDays(plan.startOffsetDays + 2 + (index % 10)),
            },
          });
        }
      }

      const needsPoam =
        status !== "IMPLEMENTED" &&
        status !== "NOT_APPLICABLE" &&
        (risk !== null || reviewStatus === "NEEDS_INFO");

      if (needsPoam) {
        const poamStatus = seededPoamStatus(globalIndex, status, reviewStatus);
        await tx.pOAMItem.create({
          data: {
            controlResponseId: response.id,
            title: `${control.code} remediation`,
            description: `Sample POA&M remediation item for ${control.code} (${control.title}).`,
            status: poamStatus,
            severity: seededPoamSeverity(risk),
            owner,
            dueDate,
            closedAt: poamStatus === "DONE" ? addDays(-2) : null,
          },
        });
      }

      const canCreateAuditFinding =
        auditFindingsCreatedForPlan < (planIndex === 0 ? 5 : 2) &&
        !!risk &&
        (risk.toLowerCase() === "high" || (planIndex > 0 && risk.toLowerCase() === "medium")) &&
        status !== "NOT_APPLICABLE";

      if (canCreateAuditFinding && index % (planIndex === 0 ? 4 : 7) === 0) {
        const auditFindingStatus =
          plan.status === "COMPLETE" && status === "IMPLEMENTED" ? "RESOLVED" : "OPEN";
        const auditFinding = await tx.auditFinding.create({
          data: {
            organizationId: vendorOrg.id,
            assessmentId: assessment.id,
            controlId: control.id,
            title: `${control.code} control gap identified during ${profile.industry} audit review`,
            severity: risk.toLowerCase() === "high" ? "HIGH" : "MEDIUM",
            status: auditFindingStatus,
            recommendation:
              status === "NOT_IMPLEMENTED"
                ? `Implement ${control.code} controls and attach supporting evidence for reviewer validation.`
                : `Complete remediation for ${control.code} and provide updated proof of implementation.`,
            details: `Sample audit finding for ${profile.organizationName}. This record is seeded to demonstrate findings workflow in a demo environment.`,
            owner,
            resolvedAt: auditFindingStatus === "RESOLVED" ? addDays(-3) : null,
          },
        });
        auditFindingsCreatedForPlan += 1;

        const findingMessagePrefix =
          auditFindingStatus === "RESOLVED" ? "Resolved audit finding for" : "Created audit finding for";
        await tx.auditActivityLog.create({
          data: {
            action: auditFindingStatus === "RESOLVED" ? "FINDING_RESOLVED" : "FINDING_CREATED",
            organizationId: vendorOrg.id,
            assessmentId: assessment.id,
            controlId: control.id,
            auditFindingId: auditFinding.id,
            actor: `${profile.customerOrgName} Reviewer`,
            message: `${findingMessagePrefix} ${control.code} (${profile.organizationName}).`,
            metadata: {
              severity: auditFinding.severity,
              status: auditFinding.status,
              source: "demo-seed",
            } satisfies Prisma.InputJsonValue,
            createdAt:
              auditFindingStatus === "RESOLVED"
                ? addDays(plan.endOffsetDays - 2)
                : addDays(plan.startOffsetDays + 6 + (index % 10)),
          },
        });
      }
    }

    if (plan.status === "COMPLETE") {
      await tx.auditActivityLog.create({
        data: {
          action: "ASSESSMENT_COMPLETED",
          organizationId: vendorOrg.id,
          assessmentId: assessment.id,
          actor: `${profile.customerOrgName} Reviewer`,
          message: `Marked assessment "${assessment.name}" complete for ${profile.organizationName}.`,
          metadata: {
            assessmentStatus: "COMPLETE",
            source: "demo-seed",
          } satisfies Prisma.InputJsonValue,
          createdAt: addDays(plan.endOffsetDays),
        },
      });
    }
  }
}

export async function resetAndSeedDemoWorkspace(
  prisma: PrismaClient,
  profileId: DemoProfileId | string
) {
  const profile = getDemoProfile(profileId);

  return prisma.$transaction(
    async (tx) => {
      await clearDemoWorkspace(tx);
      await seedProfileWorkspace(tx, profile);

      const [
        organizationCount,
        engagementCount,
        assessmentCount,
        findingCount,
        auditFindingCount,
        evidenceCount,
        evidenceSubmissionCount,
        controlResponseCount,
        poamCount,
        auditActivityCount,
      ] = await Promise.all([
        tx.organization.count(),
        tx.engagement.count(),
        tx.assessment.count(),
        tx.finding.count(),
        tx.auditFinding.count(),
        tx.evidence.count(),
        tx.evidenceSubmission.count(),
        tx.controlResponse.count(),
        tx.pOAMItem.count(),
        tx.auditActivityLog.count(),
      ]);

      return {
        profile,
        counts: {
          organizations: organizationCount,
          engagements: engagementCount,
          assessments: assessmentCount,
          findings: findingCount,
          auditFindings: auditFindingCount,
          evidence: evidenceCount,
          evidenceSubmissions: evidenceSubmissionCount,
          controlResponses: controlResponseCount,
          poamItems: poamCount,
          auditActivityLogs: auditActivityCount,
        },
      };
    },
    {
      maxWait: 10_000,
      timeout: 60_000,
    }
  );
}
