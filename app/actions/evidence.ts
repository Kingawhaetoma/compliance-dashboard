"use server";

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { getDemoProfile, DEMO_PROFILE_COOKIE } from "@/lib/demo-profiles";
import { recordAuditActivity } from "@/lib/audit-activity";

export type CreateEvidenceInput = {
  title: string;
  description?: string | null;
  url?: string | null;
  controlId: string;
  status?: "COLLECTED" | "PENDING_REVIEW" | "APPROVED" | "REJECTED";
};

export async function createEvidence(input: CreateEvidenceInput) {
  const created = await prisma.evidence.create({
    data: {
      title: input.title,
      description: input.description ?? null,
      url: input.url || null,
      controlId: input.controlId,
      sourceType: "URL",
      status: input.status ?? "COLLECTED",
    },
  });
  await recordEvidenceActivity(created.id, input.controlId, input.title, "URL");
  revalidatePath("/evidence");
  revalidatePath(`/controls/${input.controlId}`);
  revalidatePath("/dashboard");
  return created;
}

const ALLOWED_FILE_TYPES = new Set(["application/pdf", "image/png", "image/jpeg"]);
const MAX_FILE_BYTES = 10 * 1024 * 1024;

function sanitizeFilename(name: string) {
  const trimmed = name.trim();
  return trimmed.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-");
}

async function recordEvidenceActivity(
  evidenceId: string,
  controlId: string,
  title: string,
  sourceType: "FILE" | "URL"
) {
  const cookieStore = await cookies();
  const activeProfile = getDemoProfile(cookieStore.get(DEMO_PROFILE_COOKIE)?.value);

  const latestResponse = await prisma.controlResponse.findFirst({
    where: {
      controlId,
      assessment: { organization: { name: activeProfile.organizationName } },
    },
    select: { assessmentId: true, assessment: { select: { organizationId: true } } },
    orderBy: [{ updatedAt: "desc" }],
  });

  await recordAuditActivity({
    action: "EVIDENCE_ADDED",
    message: `Added ${sourceType.toLowerCase()} evidence "${title}" for a demo control in ${activeProfile.organizationName}.`,
    actor: `${activeProfile.organizationName.replace(" (Demo Organization)", "")} Compliance Team`,
    organizationId: latestResponse?.assessment.organizationId ?? null,
    assessmentId: latestResponse?.assessmentId ?? null,
    controlId,
    evidenceId,
    metadata: {
      sourceType,
      demo: true,
    },
  });
}

export async function createEvidenceAttachment(formData: FormData) {
  const controlId = String(formData.get("controlId") ?? "").trim();
  const sourceType = String(formData.get("sourceType") ?? "URL").toUpperCase();
  const titleInput = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const status = String(formData.get("status") ?? "COLLECTED").toUpperCase() as
    | "COLLECTED"
    | "PENDING_REVIEW"
    | "APPROVED"
    | "REJECTED";
  const urlInput = String(formData.get("url") ?? "").trim();

  if (!controlId) throw new Error("Control is required");
  if (!["URL", "FILE"].includes(sourceType)) throw new Error("Invalid evidence source type");

  await prisma.control.findUniqueOrThrow({
    where: { id: controlId },
    select: { id: true },
  });

  if (sourceType === "URL") {
    if (!urlInput) throw new Error("Evidence URL is required");
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(urlInput);
    } catch {
      throw new Error("Enter a valid URL");
    }
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new Error("Only http(s) URLs are supported");
    }

    const title = titleInput || "Linked evidence";
    const created = await prisma.evidence.create({
      data: {
        controlId,
        title,
        description,
        url: parsedUrl.toString(),
        sourceType: "URL",
        status,
      },
    });
    await recordEvidenceActivity(created.id, controlId, title, "URL");
    revalidateEvidenceRoutes(controlId);
    return { id: created.id, sourceType: "URL" as const, title };
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new Error("Upload a PDF, PNG, or JPG file");
  }
  if (file.size <= 0) throw new Error("Uploaded file is empty");
  if (file.size > MAX_FILE_BYTES) throw new Error("File must be 10MB or less");
  if (!ALLOWED_FILE_TYPES.has(file.type)) {
    throw new Error("Only PDF, PNG, and JPG files are supported");
  }

  const originalName = sanitizeFilename(file.name || "evidence-upload");
  const extension = path.extname(originalName) || (file.type === "application/pdf" ? ".pdf" : ".bin");
  const storedBase = `${Date.now()}-${randomUUID()}${extension.toLowerCase()}`;
  const relativeDir = path.join("demo-uploads", "manual");
  const publicDir = path.join(process.cwd(), "public", relativeDir);
  await mkdir(publicDir, { recursive: true });
  const absolutePath = path.join(publicDir, storedBase);
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(absolutePath, bytes);

  const title = titleInput || originalName.replace(/\.[^.]+$/, "");
  const publicUrl = `/${relativeDir.replace(/\\/g, "/")}/${storedBase}`;
  const created = await prisma.evidence.create({
    data: {
      controlId,
      title,
      description,
      url: publicUrl,
      sourceType: "FILE",
      status,
      fileName: originalName,
      mimeType: file.type,
      fileSizeBytes: file.size,
      storagePath: absolutePath,
    },
  });
  await recordEvidenceActivity(created.id, controlId, title, "FILE");
  revalidateEvidenceRoutes(controlId);
  return { id: created.id, sourceType: "FILE" as const, title };
}

function revalidateEvidenceRoutes(controlId: string) {
  revalidatePath("/evidence");
  revalidatePath(`/controls/${controlId}`);
  revalidatePath("/dashboard");
  revalidatePath("/customer");
  revalidatePath("/vendor");
}

export async function updateEvidenceStatus(
  evidenceId: string,
  status: "COLLECTED" | "PENDING_REVIEW" | "APPROVED" | "REJECTED"
) {
  const evidence = await prisma.evidence.update({
    where: { id: evidenceId },
    data: { status },
    select: { id: true, controlId: true },
  });
  revalidateEvidenceRoutes(evidence.controlId);
}
