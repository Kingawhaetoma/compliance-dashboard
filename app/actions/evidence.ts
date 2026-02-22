"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type CreateEvidenceInput = {
  title: string;
  url?: string | null;
  controlId: string;
};

export async function createEvidence(input: CreateEvidenceInput) {
  await prisma.evidence.create({
    data: {
      title: input.title,
      url: input.url || null,
      controlId: input.controlId,
    },
  });
  revalidatePath("/evidence");
  revalidatePath("/dashboard");
}
