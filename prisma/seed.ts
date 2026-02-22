import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const org = await prisma.organization.upsert({
    where: { name: "Demo Org" },
    update: {},
    create: { name: "Demo Org" },
  });

  const frameworks = [
    { key: "HIPAA", name: "HIPAA Security Rule", version: "45 CFR 164" },
    { key: "NIST", name: "NIST CSF", version: "2.0" },
    { key: "SOC2", name: "SOC 2", version: "TSC" },
    { key: "ISO27001", name: "ISO/IEC 27001", version: "2022" },
    { key: "CIS", name: "CIS Controls", version: "v8" },
  ];

  for (const f of frameworks) {
    await prisma.framework.upsert({
      where: { key: f.key },
      update: { name: f.name, version: f.version },
      create: f,
    });
  }

  const hipaa = await prisma.framework.findUnique({ where: { key: "HIPAA" } });
  if (hipaa) {
    const c1 = await prisma.control.create({
      data: {
        frameworkId: hipaa.id,
        code: "164.310(d)(1)",
        title: "Device and Media Controls",
        domain: "Physical Safeguards",
        description: "Policies/procedures for disposal, re-use, accountability, and data backup/storage.",
      },
    });

    const assessment = await prisma.assessment.create({
      data: {
        organizationId: org.id,
        name: "MediTech Demo Assessment",
        status: "IN_PROGRESS",
        startDate: new Date(),
      },
    });

    const finding = await prisma.finding.create({
      data: {
        assessmentId: assessment.id,
        controlId: c1.id,
        status: "PARTIALLY_IMPLEMENTED",
        risk: "Medium",
        owner: "IT",
        notes: "Asset disposal process exists but not documented; no evidence of media sanitization logs.",
      },
    });

    const ev = await prisma.evidence.create({
      data: {
        controlId: c1.id,
        title: "Asset Disposal Policy (Draft)",
        url: "https://example.com/policy",
      },
    });

    await prisma.evidenceLink.create({
      data: { findingId: finding.id, evidenceId: ev.id },
    });
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });