"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type CreateControlInput = {
  code: string;
  title: string;
  description?: string | null;
  domain?: string | null;
  frameworkId: string;
};

export async function createControl(input: CreateControlInput) {
  await prisma.control.create({
    data: {
      code: input.code,
      title: input.title,
      description: input.description || null,
      domain: input.domain || null,
      frameworkId: input.frameworkId,
    },
  });
  revalidatePath("/controls");
  revalidatePath("/dashboard");
}
