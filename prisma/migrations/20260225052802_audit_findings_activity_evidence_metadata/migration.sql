-- CreateEnum
CREATE TYPE "EvidenceSourceType" AS ENUM ('URL', 'FILE');

-- CreateEnum
CREATE TYPE "EvidenceStatus" AS ENUM ('COLLECTED', 'PENDING_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AuditFindingSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "AuditFindingStatus" AS ENUM ('OPEN', 'RESOLVED');

-- CreateEnum
CREATE TYPE "AuditActivityAction" AS ENUM ('CONTROL_STATUS_CHANGED', 'CONTROL_OWNER_ASSIGNED', 'EVIDENCE_ADDED', 'ASSESSMENT_COMPLETED', 'FINDING_CREATED', 'FINDING_RESOLVED');

-- AlterTable
ALTER TABLE "Evidence" ADD COLUMN     "description" TEXT,
ADD COLUMN     "fileName" TEXT,
ADD COLUMN     "fileSizeBytes" INTEGER,
ADD COLUMN     "mimeType" TEXT,
ADD COLUMN     "sourceType" "EvidenceSourceType" NOT NULL DEFAULT 'URL',
ADD COLUMN     "status" "EvidenceStatus" NOT NULL DEFAULT 'COLLECTED',
ADD COLUMN     "storagePath" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "uploadedBy" TEXT;

-- CreateTable
CREATE TABLE "AuditFinding" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "assessmentId" TEXT,
    "controlId" TEXT,
    "title" TEXT NOT NULL,
    "severity" "AuditFindingSeverity" NOT NULL DEFAULT 'MEDIUM',
    "status" "AuditFindingStatus" NOT NULL DEFAULT 'OPEN',
    "recommendation" TEXT NOT NULL,
    "details" TEXT,
    "owner" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditFinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditActivityLog" (
    "id" TEXT NOT NULL,
    "action" "AuditActivityAction" NOT NULL,
    "message" TEXT NOT NULL,
    "actor" TEXT,
    "metadata" JSONB,
    "organizationId" TEXT,
    "assessmentId" TEXT,
    "controlId" TEXT,
    "evidenceId" TEXT,
    "auditFindingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditFinding_organizationId_idx" ON "AuditFinding"("organizationId");

-- CreateIndex
CREATE INDEX "AuditFinding_assessmentId_idx" ON "AuditFinding"("assessmentId");

-- CreateIndex
CREATE INDEX "AuditFinding_controlId_idx" ON "AuditFinding"("controlId");

-- CreateIndex
CREATE INDEX "AuditFinding_status_idx" ON "AuditFinding"("status");

-- CreateIndex
CREATE INDEX "AuditFinding_severity_idx" ON "AuditFinding"("severity");

-- CreateIndex
CREATE INDEX "AuditActivityLog_action_idx" ON "AuditActivityLog"("action");

-- CreateIndex
CREATE INDEX "AuditActivityLog_createdAt_idx" ON "AuditActivityLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditActivityLog_organizationId_idx" ON "AuditActivityLog"("organizationId");

-- CreateIndex
CREATE INDEX "AuditActivityLog_assessmentId_idx" ON "AuditActivityLog"("assessmentId");

-- CreateIndex
CREATE INDEX "AuditActivityLog_controlId_idx" ON "AuditActivityLog"("controlId");

-- CreateIndex
CREATE INDEX "AuditActivityLog_evidenceId_idx" ON "AuditActivityLog"("evidenceId");

-- CreateIndex
CREATE INDEX "AuditActivityLog_auditFindingId_idx" ON "AuditActivityLog"("auditFindingId");

-- CreateIndex
CREATE INDEX "Evidence_controlId_idx" ON "Evidence"("controlId");

-- CreateIndex
CREATE INDEX "Evidence_status_idx" ON "Evidence"("status");

-- CreateIndex
CREATE INDEX "Evidence_sourceType_idx" ON "Evidence"("sourceType");

-- AddForeignKey
ALTER TABLE "AuditFinding" ADD CONSTRAINT "AuditFinding_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditFinding" ADD CONSTRAINT "AuditFinding_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditFinding" ADD CONSTRAINT "AuditFinding_controlId_fkey" FOREIGN KEY ("controlId") REFERENCES "Control"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditActivityLog" ADD CONSTRAINT "AuditActivityLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditActivityLog" ADD CONSTRAINT "AuditActivityLog_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditActivityLog" ADD CONSTRAINT "AuditActivityLog_controlId_fkey" FOREIGN KEY ("controlId") REFERENCES "Control"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditActivityLog" ADD CONSTRAINT "AuditActivityLog_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "Evidence"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditActivityLog" ADD CONSTRAINT "AuditActivityLog_auditFindingId_fkey" FOREIGN KEY ("auditFindingId") REFERENCES "AuditFinding"("id") ON DELETE SET NULL ON UPDATE CASCADE;
