import type { Prisma, PrismaClient } from "@/generated/prisma/client";

import { prisma } from "@/lib/prisma";

type AuditActivityClient = PrismaClient | Prisma.TransactionClient;

export type RecordAuditActivityInput = {
  action:
    | "CONTROL_STATUS_CHANGED"
    | "CONTROL_OWNER_ASSIGNED"
    | "EVIDENCE_ADDED"
    | "ASSESSMENT_COMPLETED"
    | "FINDING_CREATED"
    | "FINDING_RESOLVED";
  message: string;
  actor?: string | null;
  metadata?: Prisma.InputJsonValue | null;
  organizationId?: string | null;
  assessmentId?: string | null;
  controlId?: string | null;
  evidenceId?: string | null;
  auditFindingId?: string | null;
  createdAt?: Date;
};

export async function recordAuditActivity(
  input: RecordAuditActivityInput,
  client: AuditActivityClient = prisma
) {
  return client.auditActivityLog.create({
    data: {
      action: input.action,
      message: input.message,
      actor: input.actor ?? null,
      metadata: input.metadata ?? undefined,
      organizationId: input.organizationId ?? null,
      assessmentId: input.assessmentId ?? null,
      controlId: input.controlId ?? null,
      evidenceId: input.evidenceId ?? null,
      auditFindingId: input.auditFindingId ?? null,
      createdAt: input.createdAt ?? new Date(),
    },
  });
}

export function formatAuditActionLabel(action: string) {
  return action.replace(/_/g, " ");
}

