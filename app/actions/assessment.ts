"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { recordAuditActivity } from "@/lib/audit-activity";

type ControlStatus =
  | "NOT_APPLICABLE"
  | "NOT_IMPLEMENTED"
  | "PARTIALLY_IMPLEMENTED"
  | "IMPLEMENTED";

export async function updateFindingStatus(
  findingId: string,
  status: ControlStatus,
  assessmentId: string
) {
  const previousFinding = await prisma.finding.findUnique({
    where: { id: findingId },
    include: {
      assessment: {
        select: {
          id: true,
          organizationId: true,
          organization: { select: { name: true } },
        },
      },
      control: { select: { id: true, code: true } },
    },
  });
  if (!previousFinding) {
    throw new Error("Finding not found");
  }

  const finding = await prisma.finding.update({
    where: { id: findingId },
    data: { status },
    select: { assessmentId: true, controlId: true },
  });

  await prisma.controlResponse.updateMany({
    where: {
      assessmentId: finding.assessmentId,
      controlId: finding.controlId,
    },
    data: { status },
  });

  if (previousFinding.status !== status) {
    await recordAuditActivity({
      action: "CONTROL_STATUS_CHANGED",
      message: `Updated ${previousFinding.control.code} status to ${status.replace(/_/g, " ")} in ${previousFinding.assessment.organization.name}.`,
      actor: "Demo Compliance Analyst",
      organizationId: previousFinding.assessment.organizationId,
      assessmentId: previousFinding.assessment.id,
      controlId: previousFinding.control.id,
      metadata: {
        previousStatus: previousFinding.status,
        newStatus: status,
        source: "assessment-controls-table",
      },
    });
  }

  revalidatePath(`/assessments/${assessmentId}`);
  revalidatePath("/dashboard");
  revalidatePath("/customer");
  revalidatePath("/vendor");
}

export type CreateAssessmentInput = {
  name: string;
  organizationId: string;
};

export async function createAssessment(input: CreateAssessmentInput) {
  const assessment = await prisma.assessment.create({
    data: {
      name: input.name,
      organizationId: input.organizationId,
      status: "NOT_STARTED",
      startDate: new Date(),
    },
  });
  revalidatePath("/assessments");
  revalidatePath("/dashboard");
  return { id: assessment.id };
}
