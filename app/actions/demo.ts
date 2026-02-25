"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import {
  DEFAULT_DEMO_PROFILE,
  DEMO_PROFILE_COOKIE,
  getDemoProfile,
  isDemoProfileId,
  type DemoProfileId,
} from "@/lib/demo-profiles";
import { resetAndSeedDemoWorkspace } from "@/lib/demo-seed";

function revalidateDemoRoutes() {
  revalidatePath("/", "layout");
  revalidatePath("/dashboard");
  revalidatePath("/customer");
  revalidatePath("/vendor");
  revalidatePath("/audits");
  revalidatePath("/audits/new");
  revalidatePath("/assessments");
  revalidatePath("/controls");
  revalidatePath("/frameworks");
  revalidatePath("/evidence");
}

export async function switchDemoOrganizationProfile(profileId: string) {
  if (!isDemoProfileId(profileId)) {
    throw new Error("Invalid demo organization profile.");
  }

  const result = await resetAndSeedDemoWorkspace(prisma, profileId);

  const cookieStore = await cookies();
  cookieStore.set(DEMO_PROFILE_COOKIE, profileId, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });

  revalidateDemoRoutes();

  return {
    profile: result.profile,
    counts: result.counts,
    message: `Switched demo organization to ${result.profile.organizationName}`,
  };
}

export async function resetDemoData(profileId?: string) {
  const cookieStore = await cookies();
  const activeProfileId = isDemoProfileId(profileId)
    ? profileId
    : isDemoProfileId(cookieStore.get(DEMO_PROFILE_COOKIE)?.value)
      ? (cookieStore.get(DEMO_PROFILE_COOKIE)?.value as DemoProfileId)
      : DEFAULT_DEMO_PROFILE;

  const result = await resetAndSeedDemoWorkspace(prisma, activeProfileId);

  cookieStore.set(DEMO_PROFILE_COOKIE, activeProfileId, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });

  revalidateDemoRoutes();

  return {
    profile: getDemoProfile(activeProfileId),
    counts: result.counts,
    message: `Reset demo data for ${result.profile.organizationName}`,
  };
}

