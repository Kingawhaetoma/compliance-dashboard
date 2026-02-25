-- CreateEnum
CREATE TYPE "EngagementStatus" AS ENUM ('ACTIVE', 'PAUSED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ResponseReviewStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'NEEDS_INFO');

-- CreateEnum
CREATE TYPE "EvidenceReviewStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'NEEDS_INFO');

-- CreateEnum
CREATE TYPE "POAMStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'BLOCKED', 'DONE');

-- CreateEnum
CREATE TYPE "POAMSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- AlterTable
ALTER TABLE "Assessment" ADD COLUMN     "engagementId" TEXT;

-- CreateTable
CREATE TABLE "Engagement" (
    "id" TEXT NOT NULL,
    "customerOrgId" TEXT NOT NULL,
    "vendorOrgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "EngagementStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Engagement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ControlResponse" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "controlId" TEXT NOT NULL,
    "status" "ControlStatus" NOT NULL DEFAULT 'NOT_IMPLEMENTED',
    "reviewStatus" "ResponseReviewStatus" NOT NULL DEFAULT 'DRAFT',
    "risk" TEXT,
    "owner" TEXT,
    "vendorNotes" TEXT,
    "reviewerNotes" TEXT,
    "dueDate" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ControlResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvidenceSubmission" (
    "id" TEXT NOT NULL,
    "controlResponseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT,
    "description" TEXT,
    "submittedBy" TEXT,
    "reviewStatus" "EvidenceReviewStatus" NOT NULL DEFAULT 'SUBMITTED',
    "reviewerComment" TEXT,
    "reviewedBy" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvidenceSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "POAMItem" (
    "id" TEXT NOT NULL,
    "controlResponseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "POAMStatus" NOT NULL DEFAULT 'OPEN',
    "severity" "POAMSeverity" NOT NULL DEFAULT 'MEDIUM',
    "owner" TEXT,
    "dueDate" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "POAMItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Engagement_customerOrgId_idx" ON "Engagement"("customerOrgId");

-- CreateIndex
CREATE INDEX "Engagement_vendorOrgId_idx" ON "Engagement"("vendorOrgId");

-- CreateIndex
CREATE UNIQUE INDEX "Engagement_customerOrgId_vendorOrgId_name_key" ON "Engagement"("customerOrgId", "vendorOrgId", "name");

-- CreateIndex
CREATE INDEX "ControlResponse_assessmentId_idx" ON "ControlResponse"("assessmentId");

-- CreateIndex
CREATE INDEX "ControlResponse_controlId_idx" ON "ControlResponse"("controlId");

-- CreateIndex
CREATE UNIQUE INDEX "ControlResponse_assessmentId_controlId_key" ON "ControlResponse"("assessmentId", "controlId");

-- CreateIndex
CREATE INDEX "EvidenceSubmission_controlResponseId_idx" ON "EvidenceSubmission"("controlResponseId");

-- CreateIndex
CREATE INDEX "EvidenceSubmission_reviewStatus_idx" ON "EvidenceSubmission"("reviewStatus");

-- CreateIndex
CREATE INDEX "POAMItem_controlResponseId_idx" ON "POAMItem"("controlResponseId");

-- CreateIndex
CREATE INDEX "POAMItem_status_idx" ON "POAMItem"("status");

-- CreateIndex
CREATE INDEX "POAMItem_severity_idx" ON "POAMItem"("severity");

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "Engagement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Engagement" ADD CONSTRAINT "Engagement_customerOrgId_fkey" FOREIGN KEY ("customerOrgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Engagement" ADD CONSTRAINT "Engagement_vendorOrgId_fkey" FOREIGN KEY ("vendorOrgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ControlResponse" ADD CONSTRAINT "ControlResponse_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ControlResponse" ADD CONSTRAINT "ControlResponse_controlId_fkey" FOREIGN KEY ("controlId") REFERENCES "Control"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceSubmission" ADD CONSTRAINT "EvidenceSubmission_controlResponseId_fkey" FOREIGN KEY ("controlResponseId") REFERENCES "ControlResponse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "POAMItem" ADD CONSTRAINT "POAMItem_controlResponseId_fkey" FOREIGN KEY ("controlResponseId") REFERENCES "ControlResponse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
