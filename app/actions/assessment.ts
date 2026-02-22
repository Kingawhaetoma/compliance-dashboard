"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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
  await prisma.finding.update({
    where: { id: findingId },
    data: { status },
  });
  revalidatePath(`/assessments/${assessmentId}`);
  revalidatePath("/dashboard");
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
