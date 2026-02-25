"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import { DEMO_PROFILE_COOKIE, getDemoProfile } from "@/lib/demo-profiles";
import { recordAuditActivity } from "@/lib/audit-activity";

type AuditFindingSeverity = "LOW" | "MEDIUM" | "HIGH";
type AuditFindingStatus = "OPEN" | "RESOLVED";

async function getActiveDemoOrgContext() {
  const cookieStore = await cookies();
  const profile = getDemoProfile(cookieStore.get(DEMO_PROFILE_COOKIE)?.value);
  const organization = await prisma.organization.findUnique({
    where: { name: profile.organizationName },
    select: { id: true, name: true },
  });
  if (!organization) {
    throw new Error("Active demo organization not found. Reset demo data to continue.");
  }
  const assessment = await prisma.assessment.findFirst({
    where: { organizationId: organization.id },
    orderBy: [{ updatedAt: "desc" }],
    select: { id: true, name: true },
  });

  return { profile, organization, assessment };
}

export async function createAuditFinding(input: {
  controlId?: string | null;
  severity: AuditFindingSeverity;
  status?: AuditFindingStatus;
  title: string;
  recommendation: string;
  details?: string | null;
  owner?: string | null;
}) {
  const { profile, organization, assessment } = await getActiveDemoOrgContext();

  const title = input.title.trim();
  const recommendation = input.recommendation.trim();
  const details = input.details?.trim() ? input.details.trim() : null;
  const owner = input.owner?.trim() ? input.owner.trim() : null;
  const controlId = input.controlId?.trim() || null;

  if (!title) throw new Error("Finding title is required");
  if (!recommendation) throw new Error("Recommendation is required");
  if (!["LOW", "MEDIUM", "HIGH"].includes(input.severity)) {
    throw new Error("Invalid severity");
  }

  const control = controlId
    ? await prisma.control.findUnique({
        where: { id: controlId },
        select: { id: true, code: true, title: true },
      })
    : null;
  if (controlId && !control) throw new Error("Selected control not found");

  const status = input.status ?? "OPEN";
  const finding = await prisma.auditFinding.create({
    data: {
      organizationId: organization.id,
      assessmentId: assessment?.id ?? null,
      controlId: control?.id ?? null,
      title,
      severity: input.severity,
      status,
      recommendation,
      details,
      owner,
      resolvedAt: status === "RESOLVED" ? new Date() : null,
    },
    include: {
      control: {
        include: { framework: true },
      },
    },
  });

  await recordAuditActivity({
    action: status === "RESOLVED" ? "FINDING_RESOLVED" : "FINDING_CREATED",
    message:
      status === "RESOLVED"
        ? `Created and resolved finding "${finding.title}" for ${profile.organizationName}.`
        : `Created finding "${finding.title}" for ${profile.organizationName}.`,
    actor: `${profile.customerOrgName} Reviewer`,
    organizationId: organization.id,
    assessmentId: assessment?.id ?? null,
    controlId: control?.id ?? null,
    auditFindingId: finding.id,
    metadata: {
      severity: finding.severity,
      status: finding.status,
      controlCode: control?.code ?? null,
      source: "findings-page",
    },
  });

  revalidatePath("/findings");
  revalidatePath("/dashboard");
  if (control?.id) revalidatePath(`/controls/${control.id}`);

  return { id: finding.id };
}

export async function updateAuditFindingStatus(input: {
  findingId: string;
  status: AuditFindingStatus;
}) {
  if (!["OPEN", "RESOLVED"].includes(input.status)) throw new Error("Invalid status");

  const existing = await prisma.auditFinding.findUnique({
    where: { id: input.findingId },
    include: {
      control: { select: { id: true, code: true } },
      organization: { select: { id: true, name: true } },
      assessment: { select: { id: true } },
    },
  });
  if (!existing) throw new Error("Finding not found");

  const updated = await prisma.auditFinding.update({
    where: { id: input.findingId },
    data: {
      status: input.status,
      resolvedAt: input.status === "RESOLVED" ? new Date() : null,
    },
  });

  if (existing.status !== updated.status) {
    await recordAuditActivity({
      action: updated.status === "RESOLVED" ? "FINDING_RESOLVED" : "FINDING_CREATED",
      message:
        updated.status === "RESOLVED"
          ? `Resolved finding "${existing.title}" for ${existing.organization?.name ?? "demo organization"}.`
          : `Reopened finding "${existing.title}" for ${existing.organization?.name ?? "demo organization"}.`,
      actor: "Demo Reviewer",
      organizationId: existing.organization?.id ?? null,
      assessmentId: existing.assessment?.id ?? null,
      controlId: existing.control?.id ?? null,
      auditFindingId: existing.id,
      metadata: {
        previousStatus: existing.status,
        newStatus: updated.status,
        controlCode: existing.control?.code ?? null,
        source: "findings-page",
      },
    });
  }

  revalidatePath("/findings");
  revalidatePath("/dashboard");
  if (existing.control?.id) revalidatePath(`/controls/${existing.control.id}`);
}

