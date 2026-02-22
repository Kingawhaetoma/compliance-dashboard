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
