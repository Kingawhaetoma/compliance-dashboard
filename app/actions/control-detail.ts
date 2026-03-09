"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import { DEMO_PROFILE_COOKIE, getDemoProfile } from "@/lib/demo-profiles";
import { recordAuditActivity } from "@/lib/audit-activity";

type DemoControlStatus = "NOT_IMPLEMENTED" | "PARTIALLY_IMPLEMENTED" | "IMPLEMENTED";

export async function updateDemoControlWorkspaceState(input: {
  controlId: string;
  status: DemoControlStatus;
  owner: string | null;
}) {
  const controlId = input.controlId.trim();
  const owner = input.owner?.trim() ? input.owner.trim() : null;
  const status = input.status;

  if (!controlId) throw new Error("Control is required");

  const cookieStore = await cookies();
  const activeProfile = getDemoProfile(cookieStore.get(DEMO_PROFILE_COOKIE)?.value);

  const control = await prisma.control.findUnique({
    where: { id: controlId },
    select: { id: true, code: true, title: true },
  });
  if (!control) throw new Error("Control not found");

  const org = await prisma.organization.findUnique({
    where: { name: activeProfile.organizationName },
    select: { id: true, name: true },
  });
  if (!org) throw new Error("Active demo organization not found. Reset demo data and try again.");

  const assessment = await prisma.assessment.findFirst({
    where: { organizationId: org.id },
    orderBy: [{ updatedAt: "desc" }],
    select: { id: true, name: true },
  });
  if (!assessment) throw new Error("No demo assessment available for the active organization.");

  const existingResponse = await prisma.controlResponse.findUnique({
    where: {
      assessmentId_controlId: {
        assessmentId: assessment.id,
        controlId,
      },
    },
    select: { id: true, status: true, owner: true },
  });

  const response = await prisma.controlResponse.upsert({
    where: {
      assessmentId_controlId: {
        assessmentId: assessment.id,
        controlId,
      },
    },
    update: {
      status,
      owner,
      reviewStatus: "UNDER_REVIEW",
      submittedAt: new Date(),
    },
    create: {
      assessmentId: assessment.id,
      controlId,
      status,
      owner,
      reviewStatus: "UNDER_REVIEW",
      vendorNotes: "Updated from the control detail page in demo mode.",
      submittedAt: new Date(),
    },
    select: { id: true, status: true, owner: true },
  });

  const existingFinding = await prisma.finding.findFirst({
    where: { assessmentId: assessment.id, controlId },
    orderBy: [{ updatedAt: "desc" }],
    select: { id: true, status: true, owner: true, risk: true },
  });

  if (existingFinding) {
    await prisma.finding.update({
      where: { id: existingFinding.id },
      data: {
        status,
        owner,
        notes: "Updated from control detail page (demo workflow).",
      },
    });
  } else {
    await prisma.finding.create({
      data: {
        assessmentId: assessment.id,
        controlId,
        status,
        owner,
        notes: "Created from control detail page (demo workflow).",
      },
    });
  }

  const actor = `${activeProfile.organizationName.replace(" (Demo Organization)", "")} Compliance Team`;
  if (!existingResponse || existingResponse.status !== status) {
    await recordAuditActivity({
      action: "CONTROL_STATUS_CHANGED",
      message: `Changed ${control.code} status to ${status.replace(/_/g, " ")} for ${activeProfile.organizationName}.`,
      actor,
      organizationId: org.id,
      assessmentId: assessment.id,
      controlId: control.id,
      metadata: {
        previousStatus: existingResponse?.status ?? null,
        newStatus: status,
        source: "control-detail-page",
      },
    });
  }

  if (!existingResponse || (existingResponse.owner ?? null) !== owner) {
    await recordAuditActivity({
      action: "CONTROL_OWNER_ASSIGNED",
      message: `Assigned ${control.code} owner to ${owner ?? "Unassigned"} for ${activeProfile.organizationName}.`,
      actor,
      organizationId: org.id,
      assessmentId: assessment.id,
      controlId: control.id,
      metadata: {
        previousOwner: existingResponse?.owner ?? null,
        newOwner: owner,
        source: "control-detail-page",
      },
    });
  }

  revalidatePath("/controls");
  revalidatePath(`/controls/${control.id}`);
  revalidatePath("/dashboard");
  revalidatePath("/vendor");
  revalidatePath("/customer");
  revalidatePath(`/assessments/${assessment.id}`);

  return {
    controlId: control.id,
    status: response.status,
    owner: response.owner,
    assessmentId: assessment.id,
  };
}

