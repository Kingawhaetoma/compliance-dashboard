import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { DEFAULT_DEMO_PROFILE, isDemoProfileId } from "../lib/demo-profiles";
import { resetAndSeedDemoWorkspace } from "../lib/demo-seed";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

type FrameworkSeed = {
  key: string;
  name: string;
  version?: string;
};

type ControlSeed = {
  code: string;
  title: string;
  domain: string;
  description: string;
};

const frameworkSeeds: FrameworkSeed[] = [
  { key: "HIPAA", name: "HIPAA Security Rule", version: "45 CFR 164" },
  { key: "NIST", name: "NIST Cybersecurity Framework", version: "2.0" },
  { key: "NIST800171", name: "NIST SP 800-171", version: "Rev. 3" },
  { key: "NIST800172", name: "NIST SP 800-172", version: "Enhanced Security" },
  { key: "NIST80053", name: "NIST SP 800-53", version: "Rev. 5" },
  { key: "SOC2", name: "SOC 2", version: "Trust Services Criteria" },
  { key: "ISO27001", name: "ISO/IEC 27001", version: "2022" },
  { key: "CIS", name: "CIS Controls", version: "v8" },
];

const controlCatalog: Record<string, ControlSeed[]> = {
  HIPAA: [
    {
      code: "164.308(a)(1)(ii)(A)",
      title: "Risk Analysis",
      domain: "Administrative Safeguards",
      description: "Conduct an accurate and thorough assessment of potential risks to ePHI.",
    },
    {
      code: "164.308(a)(5)(ii)(C)",
      title: "Log-in Monitoring",
      domain: "Administrative Safeguards",
      description: "Implement procedures for monitoring log-in attempts and reporting discrepancies.",
    },
    {
      code: "164.310(d)(1)",
      title: "Device and Media Controls",
      domain: "Physical Safeguards",
      description: "Policies and procedures for disposal, reuse, and accountability of media.",
    },
    {
      code: "164.312(a)(1)",
      title: "Access Control",
      domain: "Technical Safeguards",
      description: "Implement technical policies and procedures for electronic information systems.",
    },
    {
      code: "164.312(b)",
      title: "Audit Controls",
      domain: "Technical Safeguards",
      description: "Implement hardware, software, and procedural mechanisms to record system activity.",
    },
    {
      code: "164.316(b)(1)",
      title: "Documentation Retention",
      domain: "Policies & Procedures",
      description: "Maintain required documentation for six years from creation or effective date.",
    },
  ],
  NIST: [
    {
      code: "GV.RM-01",
      title: "Risk Management Strategy",
      domain: "Govern",
      description: "A risk management strategy is established and communicated.",
    },
    {
      code: "ID.AM-01",
      title: "Asset Inventory",
      domain: "Identify",
      description: "Physical devices and systems within the organization are inventoried.",
    },
    {
      code: "PR.AA-01",
      title: "Identity and Access Management",
      domain: "Protect",
      description: "Identities and credentials are issued, managed, verified, revoked, and audited.",
    },
    {
      code: "DE.CM-01",
      title: "Continuous Monitoring",
      domain: "Detect",
      description: "Networks and environments are monitored to identify anomalous activity.",
    },
    {
      code: "RS.RP-01",
      title: "Response Plan Execution",
      domain: "Respond",
      description: "Response plans are executed during or after an incident.",
    },
    {
      code: "RC.CO-01",
      title: "Recovery Communications",
      domain: "Recover",
      description: "Recovery activities and progress are communicated to internal and external stakeholders.",
    },
  ],
  NIST800171: [
    {
      code: "3.1.1",
      title: "Limit System Access to Authorized Users",
      domain: "Access Control",
      description: "Limit system access to authorized users, processes, and devices.",
    },
    {
      code: "3.1.2",
      title: "Limit Functions by User Role",
      domain: "Access Control",
      description: "Limit system access to the types of transactions and functions authorized users can execute.",
    },
    {
      code: "3.5.3",
      title: "Use Multifactor Authentication",
      domain: "Identification & Authentication",
      description: "Use multifactor authentication for local and network access to privileged accounts.",
    },
    {
      code: "3.8.3",
      title: "Sanitize Media Before Disposal",
      domain: "Media Protection",
      description: "Sanitize or destroy media before disposal or release for reuse.",
    },
    {
      code: "3.13.8",
      title: "Implement Transmission Confidentiality",
      domain: "System & Communications Protection",
      description: "Implement cryptographic mechanisms to prevent unauthorized disclosure during transmission.",
    },
    {
      code: "3.14.6",
      title: "Monitor for Security Alerts",
      domain: "System & Information Integrity",
      description: "Monitor system security alerts and advisories and act in response.",
    },
  ],
  NIST800172: [
    {
      code: "3.1.12E",
      title: "Dynamic Access Control Enforcement",
      domain: "Enhanced Access Control",
      description: "Employ adaptive access enforcement based on threat intelligence and context.",
    },
    {
      code: "3.6.1E",
      title: "Enhanced Incident Detection Analytics",
      domain: "Enhanced Incident Response",
      description: "Use advanced analytics to detect indicators of compromise in near real time.",
    },
    {
      code: "3.8.1E",
      title: "Enhanced Media Tracking",
      domain: "Enhanced Media Protection",
      description: "Employ automated tracking and chain-of-custody for sensitive media.",
    },
    {
      code: "3.13.1E",
      title: "Protect Critical Communications Paths",
      domain: "Enhanced Communications Protection",
      description: "Protect designated critical communications paths using resilient safeguards.",
    },
    {
      code: "3.13.2E",
      title: "Segment High-Value Assets",
      domain: "Enhanced Communications Protection",
      description: "Implement isolation and segmentation for high-value assets and enclaves.",
    },
    {
      code: "3.14.1E",
      title: "Threat Hunting and Advanced Monitoring",
      domain: "Enhanced System Integrity",
      description: "Employ threat hunting and advanced detection coverage for prioritized assets.",
    },
  ],
  NIST80053: [
    {
      code: "AC-2",
      title: "Account Management",
      domain: "Access Control",
      description: "Manage information system accounts, including creation, monitoring, and disabling.",
    },
    {
      code: "AC-17",
      title: "Remote Access",
      domain: "Access Control",
      description: "Establish and manage usage restrictions and configuration requirements for remote access.",
    },
    {
      code: "AU-6",
      title: "Audit Review, Analysis, and Reporting",
      domain: "Audit and Accountability",
      description: "Review and analyze audit records for indications of inappropriate activity.",
    },
    {
      code: "CM-6",
      title: "Configuration Settings",
      domain: "Configuration Management",
      description: "Establish, document, and enforce configuration settings for information technology products.",
    },
    {
      code: "IR-4",
      title: "Incident Handling",
      domain: "Incident Response",
      description: "Implement incident handling capability with preparation, detection, containment, and recovery.",
    },
    {
      code: "RA-5",
      title: "Vulnerability Monitoring and Scanning",
      domain: "Risk Assessment",
      description: "Scan for vulnerabilities and remediate them in accordance with risk.",
    },
  ],
  SOC2: [
    {
      code: "CC1.1",
      title: "Integrity and Ethical Values",
      domain: "Control Environment",
      description: "Demonstrate commitment to integrity and ethical values.",
    },
    {
      code: "CC2.1",
      title: "Board Oversight",
      domain: "Communication & Information",
      description: "Board of directors demonstrates independence and oversight.",
    },
    {
      code: "CC6.1",
      title: "Logical Access Controls",
      domain: "Logical and Physical Access Controls",
      description: "Implement logical access security software and infrastructure controls.",
    },
    {
      code: "CC7.2",
      title: "System Monitoring",
      domain: "System Operations",
      description: "Monitor system components and detect anomalies.",
    },
    {
      code: "CC8.1",
      title: "Change Management",
      domain: "Change Management",
      description: "Authorize, design, develop, and implement changes to infrastructure and applications.",
    },
    {
      code: "A1.2",
      title: "Availability Commitments",
      domain: "Availability",
      description: "Monitor and maintain system availability commitments and requirements.",
    },
  ],
  ISO27001: [
    {
      code: "A.5.1",
      title: "Policies for Information Security",
      domain: "Organizational Controls",
      description: "Define and approve information security policies.",
    },
    {
      code: "A.5.15",
      title: "Access Control",
      domain: "Organizational Controls",
      description: "Rules to control physical and logical access should be established and implemented.",
    },
    {
      code: "A.5.23",
      title: "Information Security for Cloud Services",
      domain: "Organizational Controls",
      description: "Processes for acquisition, use, management, and exit from cloud services.",
    },
    {
      code: "A.8.15",
      title: "Logging",
      domain: "Technological Controls",
      description: "Produce, store, protect, and analyze logs.",
    },
    {
      code: "A.8.16",
      title: "Monitoring Activities",
      domain: "Technological Controls",
      description: "Monitor networks, systems, and applications for anomalies.",
    },
    {
      code: "A.8.28",
      title: "Secure Coding",
      domain: "Technological Controls",
      description: "Apply secure coding principles to software development.",
    },
  ],
  CIS: [
    {
      code: "1.1",
      title: "Establish and Maintain Detailed Enterprise Asset Inventory",
      domain: "Inventory and Control of Enterprise Assets",
      description: "Maintain an accurate and detailed inventory of all enterprise assets.",
    },
    {
      code: "4.1",
      title: "Establish and Maintain a Secure Configuration Process",
      domain: "Secure Configuration of Enterprise Assets and Software",
      description: "Create and manage secure configuration baselines.",
    },
    {
      code: "5.1",
      title: "Establish and Maintain an Inventory of Accounts",
      domain: "Account Management",
      description: "Maintain inventory of all accounts and their business owners.",
    },
    {
      code: "8.2",
      title: "Collect Audit Logs",
      domain: "Audit Log Management",
      description: "Collect and centralize audit logs from critical systems.",
    },
    {
      code: "13.1",
      title: "Centralize Security Event Alerting",
      domain: "Network Monitoring and Defense",
      description: "Centralize alerting for security events and suspicious activity.",
    },
    {
      code: "17.3",
      title: "Test and Update Incident Response Process",
      domain: "Incident Response Management",
      description: "Test and improve incident response plans and supporting workflows.",
    },
  ],
};

const organizationsToSeed = [
  "Demo Org",
  "MediTech Group 3",
  "Apex Cloud Vendor",
  "Northstar Manufacturing",
  "Rivergate Health Partners",
  "Ball State University",
  "Summit Procurement Group",
  "Atlas Defense Programs",
  "Mercury Health Network",
];

const assessmentPlans = [
  {
    customerOrgName: "Ball State University",
    vendorOrgName: "MediTech Group 3",
    engagementName: "Ball State Vendor Risk Program",
    name: "HIPAA Readiness Assessment 2026",
    frameworkKeys: ["HIPAA"],
    status: "IN_PROGRESS" as const,
    startOffsetDays: -21,
    endOffsetDays: 30,
  },
  {
    customerOrgName: "Ball State University",
    vendorOrgName: "MediTech Group 3",
    engagementName: "Ball State Vendor Risk Program",
    name: "NIST 800-171 Supplier Audit 2026",
    frameworkKeys: ["NIST800171"],
    status: "IN_PROGRESS" as const,
    startOffsetDays: -14,
    endOffsetDays: 45,
  },
  {
    customerOrgName: "Summit Procurement Group",
    vendorOrgName: "Apex Cloud Vendor",
    engagementName: "Third-Party Security Assurance 2026",
    name: "SOC 2 Customer Questionnaire",
    frameworkKeys: ["SOC2"],
    status: "IN_PROGRESS" as const,
    startOffsetDays: -10,
    endOffsetDays: 35,
  },
  {
    customerOrgName: "Summit Procurement Group",
    vendorOrgName: "Apex Cloud Vendor",
    engagementName: "Third-Party Security Assurance 2026",
    name: "NIST 800-53 Security Baseline",
    frameworkKeys: ["NIST80053"],
    status: "IN_PROGRESS" as const,
    startOffsetDays: -18,
    endOffsetDays: 50,
  },
  {
    customerOrgName: "Atlas Defense Programs",
    vendorOrgName: "Northstar Manufacturing",
    engagementName: "Defense Supplier CUI Oversight",
    name: "NIST 800-172 Enhanced Security Pilot",
    frameworkKeys: ["NIST800172"],
    status: "IN_PROGRESS" as const,
    startOffsetDays: -7,
    endOffsetDays: 60,
  },
  {
    customerOrgName: "Mercury Health Network",
    vendorOrgName: "Rivergate Health Partners",
    engagementName: "Healthcare Vendor Compliance Review",
    name: "NIST CSF + HIPAA Hybrid Gap Review",
    frameworkKeys: ["NIST", "HIPAA"],
    status: "IN_PROGRESS" as const,
    startOffsetDays: -28,
    endOffsetDays: 20,
  },
  {
    customerOrgName: "Demo Org",
    vendorOrgName: "Demo Org",
    engagementName: "Internal Program Oversight",
    name: "NIST CSF Baseline",
    frameworkKeys: ["NIST"],
    status: "COMPLETE" as const,
    startOffsetDays: -60,
    endOffsetDays: -5,
  },
];

const owners = [
  "IT",
  "Security",
  "Compliance",
  "Platform",
  "Engineering",
  "GRC",
];

function addDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

function seededStatus(index: number, assessmentStatus: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETE") {
  if (assessmentStatus === "NOT_STARTED") return "NOT_IMPLEMENTED";
  if (assessmentStatus === "COMPLETE") {
    const pattern = [
      "IMPLEMENTED",
      "IMPLEMENTED",
      "IMPLEMENTED",
      "PARTIALLY_IMPLEMENTED",
      "NOT_APPLICABLE",
      "IMPLEMENTED",
    ] as const;
    return pattern[index % pattern.length];
  }

  const pattern = [
    "PARTIALLY_IMPLEMENTED",
    "IMPLEMENTED",
    "NOT_IMPLEMENTED",
    "IMPLEMENTED",
    "PARTIALLY_IMPLEMENTED",
    "NOT_IMPLEMENTED",
    "NOT_APPLICABLE",
    "IMPLEMENTED",
  ] as const;
  return pattern[index % pattern.length];
}

function seededRisk(index: number, status: string) {
  if (status === "IMPLEMENTED" || status === "NOT_APPLICABLE") {
    return index % 3 === 0 ? "Low" : null;
  }
  const pattern = ["High", "Medium", "Medium", "Low"] as const;
  return pattern[index % pattern.length];
}

function shouldAttachEvidence(index: number, status: string) {
  if (status === "IMPLEMENTED") return true;
  if (status === "PARTIALLY_IMPLEMENTED") return index % 2 === 0;
  if (status === "NOT_APPLICABLE") return index % 3 === 0;
  return false;
}

function seededResponseReviewStatus(
  index: number,
  controlStatus: string,
  hasEvidence: boolean,
  assessmentStatus: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETE"
) {
  if (assessmentStatus === "NOT_STARTED") return "DRAFT";
  if (assessmentStatus === "COMPLETE") {
    if (controlStatus === "NOT_IMPLEMENTED") return "NEEDS_INFO";
    return "APPROVED";
  }

  if (!hasEvidence && (controlStatus === "IMPLEMENTED" || controlStatus === "PARTIALLY_IMPLEMENTED")) {
    return "NEEDS_INFO";
  }
  if (controlStatus === "NOT_IMPLEMENTED") return index % 2 === 0 ? "DRAFT" : "SUBMITTED";
  if (controlStatus === "PARTIALLY_IMPLEMENTED") {
    const pattern = ["SUBMITTED", "UNDER_REVIEW", "NEEDS_INFO"] as const;
    return pattern[index % pattern.length];
  }
  if (controlStatus === "NOT_APPLICABLE") return "APPROVED";
  const pattern = ["UNDER_REVIEW", "APPROVED", "SUBMITTED"] as const;
  return pattern[index % pattern.length];
}

function seededEvidenceReviewStatus(index: number, responseReviewStatus: string) {
  if (responseReviewStatus === "APPROVED") return "APPROVED";
  if (responseReviewStatus === "REJECTED") return "REJECTED";
  if (responseReviewStatus === "NEEDS_INFO") return "NEEDS_INFO";
  if (responseReviewStatus === "UNDER_REVIEW") return "UNDER_REVIEW";
  const pattern = ["SUBMITTED", "UNDER_REVIEW", "APPROVED"] as const;
  return pattern[index % pattern.length];
}

function seededPoamStatus(index: number, controlStatus: string, reviewStatus: string) {
  if (controlStatus === "IMPLEMENTED" && reviewStatus === "APPROVED") return "DONE";
  if (controlStatus === "NOT_APPLICABLE") return "DONE";
  if (reviewStatus === "NEEDS_INFO") return "OPEN";
  const pattern = ["OPEN", "IN_PROGRESS", "BLOCKED"] as const;
  return pattern[index % pattern.length];
}

function seededPoamSeverity(risk: string | null) {
  if (!risk) return "LOW";
  const normalized = risk.toLowerCase();
  if (normalized.startsWith("crit")) return "CRITICAL";
  if (normalized.startsWith("high")) return "HIGH";
  if (normalized.startsWith("med")) return "MEDIUM";
  return "LOW";
}

function engagementKey(customerOrgName: string, vendorOrgName: string, engagementName: string) {
  return `${customerOrgName}::${vendorOrgName}::${engagementName}`;
}

async function upsertFrameworks() {
  for (const framework of frameworkSeeds) {
    await prisma.framework.upsert({
      where: { key: framework.key },
      update: { name: framework.name, version: framework.version },
      create: framework,
    });
  }
}

async function ensureControls(frameworkIdByKey: Map<string, string>) {
  for (const [frameworkKey, controls] of Object.entries(controlCatalog)) {
    const frameworkId = frameworkIdByKey.get(frameworkKey);
    if (!frameworkId) continue;

    for (const control of controls) {
      const existing = await prisma.control.findFirst({
        where: {
          frameworkId,
          code: control.code,
        },
      });

      if (existing) {
        await prisma.control.update({
          where: { id: existing.id },
          data: {
            title: control.title,
            domain: control.domain,
            description: control.description,
          },
        });
      } else {
        await prisma.control.create({
          data: {
            frameworkId,
            code: control.code,
            title: control.title,
            domain: control.domain,
            description: control.description,
          },
        });
      }
    }
  }
}

async function seedOrganizations() {
  const organizations = new Map<string, { id: string; name: string }>();
  for (const name of organizationsToSeed) {
    const org = await prisma.organization.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    organizations.set(name, org);
  }
  return organizations;
}

async function seedEngagements(
  organizations: Map<string, { id: string; name: string }>
) {
  const engagements = new Map<
    string,
    { id: string; customerOrgId: string; vendorOrgId: string; name: string }
  >();

  const uniqueEngagements = new Map<
    string,
    { customerOrgName: string; vendorOrgName: string; engagementName: string }
  >();

  for (const plan of assessmentPlans) {
    const key = engagementKey(plan.customerOrgName, plan.vendorOrgName, plan.engagementName);
    if (!uniqueEngagements.has(key)) {
      uniqueEngagements.set(key, {
        customerOrgName: plan.customerOrgName,
        vendorOrgName: plan.vendorOrgName,
        engagementName: plan.engagementName,
      });
    }
  }

  for (const [key, value] of uniqueEngagements) {
    const customerOrg = organizations.get(value.customerOrgName);
    const vendorOrg = organizations.get(value.vendorOrgName);
    if (!customerOrg || !vendorOrg) continue;

    const existing = await prisma.engagement.findFirst({
      where: {
        customerOrgId: customerOrg.id,
        vendorOrgId: vendorOrg.id,
        name: value.engagementName,
      },
    });

    const engagement = existing
      ? await prisma.engagement.update({
          where: { id: existing.id },
          data: {
            status: "ACTIVE",
            startDate: addDays(-30),
            dueDate: addDays(60),
          },
        })
      : await prisma.engagement.create({
          data: {
            customerOrgId: customerOrg.id,
            vendorOrgId: vendorOrg.id,
            name: value.engagementName,
            status: "ACTIVE",
            startDate: addDays(-30),
            dueDate: addDays(60),
          },
        });

    engagements.set(key, engagement);
  }

  return engagements;
}

async function seedAssessmentsAndFindings(
  organizations: Map<string, { id: string; name: string }>,
  frameworkIdByKey: Map<string, string>,
  engagements: Map<string, { id: string; customerOrgId: string; vendorOrgId: string; name: string }>
) {
  const controlsByFrameworkKey = new Map<string, Array<{
    id: string;
    code: string;
    title: string;
    frameworkId: string;
  }>>();

  for (const frameworkKey of Object.keys(controlCatalog)) {
    const frameworkId = frameworkIdByKey.get(frameworkKey);
    if (!frameworkId) continue;
    const controls = await prisma.control.findMany({
      where: { frameworkId },
      select: { id: true, code: true, title: true, frameworkId: true },
      orderBy: { code: "asc" },
    });
    controlsByFrameworkKey.set(frameworkKey, controls);
  }

  for (const plan of assessmentPlans) {
    const vendorOrg = organizations.get(plan.vendorOrgName);
    const customerOrg = organizations.get(plan.customerOrgName);
    const engagement = engagements.get(
      engagementKey(plan.customerOrgName, plan.vendorOrgName, plan.engagementName)
    );
    if (!vendorOrg || !customerOrg || !engagement) continue;

    const existingAssessment = await prisma.assessment.findFirst({
      where: {
        organizationId: vendorOrg.id,
        name: plan.name,
      },
    });

    const assessment = existingAssessment
      ? await prisma.assessment.update({
          where: { id: existingAssessment.id },
          data: {
            organizationId: vendorOrg.id,
            engagementId: engagement.id,
            status: plan.status,
            startDate: addDays(plan.startOffsetDays),
            endDate: addDays(plan.endOffsetDays),
          },
        })
        : await prisma.assessment.create({
          data: {
            organizationId: vendorOrg.id,
            engagementId: engagement.id,
            name: plan.name,
            status: plan.status,
            startDate: addDays(plan.startOffsetDays),
            endDate: addDays(plan.endOffsetDays),
          },
        });

    const scopedControls = plan.frameworkKeys.flatMap(
      (frameworkKey) => controlsByFrameworkKey.get(frameworkKey) ?? []
    );

    for (const [index, control] of scopedControls.entries()) {
      const status = seededStatus(index, plan.status);
      const risk = seededRisk(index + plan.name.length, status);
      const hasEvidence = shouldAttachEvidence(index, status);
      const reviewStatus = seededResponseReviewStatus(index, status, hasEvidence, plan.status);
      const dueDate =
        status === "IMPLEMENTED" || status === "NOT_APPLICABLE"
          ? null
          : addDays((index % 8) * 5 - 7);
      const owner = owners[(index + plan.vendorOrgName.length) % owners.length];
      const sharedNotes =
        status === "IMPLEMENTED"
          ? "Control implemented and operating with supporting evidence."
          : status === "NOT_APPLICABLE"
            ? "Control marked not applicable for current assessment scope."
            : "Remediation task tracked in POA&M queue; evidence or validation still required.";

      const existingFinding = await prisma.finding.findFirst({
        where: {
          assessmentId: assessment.id,
          controlId: control.id,
        },
      });

      const finding = existingFinding
        ? await prisma.finding.update({
            where: { id: existingFinding.id },
            data: {
              status,
              risk,
              owner,
              dueDate,
              notes: sharedNotes,
            },
          })
        : await prisma.finding.create({
            data: {
              assessmentId: assessment.id,
              controlId: control.id,
              status,
              risk,
              owner,
              dueDate,
              notes: sharedNotes,
            },
          });

      const response = await prisma.controlResponse.upsert({
        where: {
          assessmentId_controlId: {
            assessmentId: assessment.id,
            controlId: control.id,
          },
        },
        update: {
          status,
          reviewStatus,
          risk,
          owner,
          vendorNotes:
            reviewStatus === "DRAFT"
              ? "Draft response in progress; vendor documentation is being collected."
              : `Vendor response prepared for ${control.code}.`,
          reviewerNotes:
            reviewStatus === "NEEDS_INFO"
              ? "Please provide stronger evidence and a current policy/procedure artifact."
              : reviewStatus === "REJECTED"
                ? "Submission does not satisfy control intent; remediation evidence required."
                : reviewStatus === "APPROVED"
                  ? "Reviewed and accepted by customer auditor."
                  : reviewStatus === "UNDER_REVIEW"
                    ? "Queued for reviewer validation."
                    : null,
          dueDate,
          submittedAt: reviewStatus === "DRAFT" ? null : addDays(plan.startOffsetDays + 2 + (index % 6)),
          reviewedAt:
            reviewStatus === "APPROVED" || reviewStatus === "REJECTED" || reviewStatus === "NEEDS_INFO"
              ? addDays(plan.startOffsetDays + 5 + (index % 8))
              : null,
        },
        create: {
          assessmentId: assessment.id,
          controlId: control.id,
          status,
          reviewStatus,
          risk,
          owner,
          vendorNotes:
            reviewStatus === "DRAFT"
              ? "Draft response in progress; vendor documentation is being collected."
              : `Vendor response prepared for ${control.code}.`,
          reviewerNotes:
            reviewStatus === "NEEDS_INFO"
              ? "Please provide stronger evidence and a current policy/procedure artifact."
              : reviewStatus === "REJECTED"
                ? "Submission does not satisfy control intent; remediation evidence required."
                : reviewStatus === "APPROVED"
                  ? "Reviewed and accepted by customer auditor."
                  : reviewStatus === "UNDER_REVIEW"
                    ? "Queued for reviewer validation."
                    : null,
          dueDate,
          submittedAt: reviewStatus === "DRAFT" ? null : addDays(plan.startOffsetDays + 2 + (index % 6)),
          reviewedAt:
            reviewStatus === "APPROVED" || reviewStatus === "REJECTED" || reviewStatus === "NEEDS_INFO"
              ? addDays(plan.startOffsetDays + 5 + (index % 8))
              : null,
        },
      });

      if (hasEvidence) {
        const evidenceTitle = `${control.code} - ${plan.vendorOrgName} Evidence`;
        const existingEvidence = await prisma.evidence.findFirst({
          where: {
            controlId: control.id,
            title: evidenceTitle,
          },
        });

        const evidence = existingEvidence
          ? await prisma.evidence.update({
              where: { id: existingEvidence.id },
              data: {
                url: `https://example.com/evidence/${plan.vendorOrgName
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")}/${control.code.replace(/[^a-zA-Z0-9]+/g, "-")}`,
              },
            })
          : await prisma.evidence.create({
              data: {
                controlId: control.id,
                title: evidenceTitle,
                url: `https://example.com/evidence/${plan.vendorOrgName
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")}/${control.code.replace(/[^a-zA-Z0-9]+/g, "-")}`,
              },
            });

        await prisma.evidenceLink.upsert({
          where: {
            findingId_evidenceId: {
              findingId: finding.id,
              evidenceId: evidence.id,
            },
          },
          update: {},
          create: {
            findingId: finding.id,
            evidenceId: evidence.id,
          },
        });

        const submissionTitle = `${control.code} - ${plan.vendorOrgName} Submission`;
        const existingSubmission = await prisma.evidenceSubmission.findFirst({
          where: {
            controlResponseId: response.id,
            title: submissionTitle,
          },
        });

        const evidenceReviewStatus = seededEvidenceReviewStatus(index, reviewStatus);

        await (existingSubmission
          ? prisma.evidenceSubmission.update({
              where: { id: existingSubmission.id },
              data: {
                title: submissionTitle,
                url: `https://example.com/submissions/${plan.vendorOrgName
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")}/${control.code.replace(/[^a-zA-Z0-9]+/g, "-")}`,
                description: `Submitted evidence for ${control.code} under ${plan.name}.`,
                submittedBy: `${plan.vendorOrgName} Compliance Team`,
                reviewStatus: evidenceReviewStatus,
                reviewerComment:
                  evidenceReviewStatus === "NEEDS_INFO"
                    ? "Upload a signed policy or system screenshot with timestamp."
                    : evidenceReviewStatus === "REJECTED"
                      ? "Evidence is outdated and does not map to the requested control."
                      : evidenceReviewStatus === "APPROVED"
                        ? "Evidence accepted and mapped to control requirement."
                        : null,
                reviewedBy:
                  evidenceReviewStatus === "APPROVED" ||
                  evidenceReviewStatus === "REJECTED" ||
                  evidenceReviewStatus === "NEEDS_INFO"
                    ? `${plan.customerOrgName} Reviewer`
                    : null,
                submittedAt: addDays(plan.startOffsetDays + 1 + (index % 5)),
                reviewedAt:
                  evidenceReviewStatus === "APPROVED" ||
                  evidenceReviewStatus === "REJECTED" ||
                  evidenceReviewStatus === "NEEDS_INFO"
                    ? addDays(plan.startOffsetDays + 4 + (index % 7))
                    : null,
              },
            })
          : prisma.evidenceSubmission.create({
              data: {
                controlResponseId: response.id,
                title: submissionTitle,
                url: `https://example.com/submissions/${plan.vendorOrgName
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")}/${control.code.replace(/[^a-zA-Z0-9]+/g, "-")}`,
                description: `Submitted evidence for ${control.code} under ${plan.name}.`,
                submittedBy: `${plan.vendorOrgName} Compliance Team`,
                reviewStatus: evidenceReviewStatus,
                reviewerComment:
                  evidenceReviewStatus === "NEEDS_INFO"
                    ? "Upload a signed policy or system screenshot with timestamp."
                    : evidenceReviewStatus === "REJECTED"
                      ? "Evidence is outdated and does not map to the requested control."
                      : evidenceReviewStatus === "APPROVED"
                        ? "Evidence accepted and mapped to control requirement."
                        : null,
                reviewedBy:
                  evidenceReviewStatus === "APPROVED" ||
                  evidenceReviewStatus === "REJECTED" ||
                  evidenceReviewStatus === "NEEDS_INFO"
                    ? `${plan.customerOrgName} Reviewer`
                    : null,
                submittedAt: addDays(plan.startOffsetDays + 1 + (index % 5)),
                reviewedAt:
                  evidenceReviewStatus === "APPROVED" ||
                  evidenceReviewStatus === "REJECTED" ||
                  evidenceReviewStatus === "NEEDS_INFO"
                    ? addDays(plan.startOffsetDays + 4 + (index % 7))
                    : null,
              },
            }));
      }

      const needsPoam =
        status !== "IMPLEMENTED" &&
        status !== "NOT_APPLICABLE" &&
        (risk !== null || reviewStatus === "NEEDS_INFO" || reviewStatus === "REJECTED");

      if (needsPoam) {
        const poamTitle = `${control.code} remediation`;
        const existingPoam = await prisma.pOAMItem.findFirst({
          where: {
            controlResponseId: response.id,
            title: poamTitle,
          },
        });

        const poamStatus = seededPoamStatus(index, status, reviewStatus);
        const poamSeverity = seededPoamSeverity(risk);

        await (existingPoam
          ? prisma.pOAMItem.update({
              where: { id: existingPoam.id },
              data: {
                title: poamTitle,
                description: `Remediation plan for ${control.code} (${control.title}) in ${plan.name}.`,
                status: poamStatus,
                severity: poamSeverity,
                owner,
                dueDate,
                closedAt: poamStatus === "DONE" ? addDays(-1) : null,
              },
            })
          : prisma.pOAMItem.create({
              data: {
                controlResponseId: response.id,
                title: poamTitle,
                description: `Remediation plan for ${control.code} (${control.title}) in ${plan.name}.`,
                status: poamStatus,
                severity: poamSeverity,
                owner,
                dueDate,
                closedAt: poamStatus === "DONE" ? addDays(-1) : null,
              },
            }));
      }
    }
  }
}

async function main() {
  await upsertFrameworks();

  const frameworks = await prisma.framework.findMany({
    select: { id: true, key: true },
  });
  const frameworkIdByKey = new Map(frameworks.map((framework) => [framework.key, framework.id]));

  await ensureControls(frameworkIdByKey);
  const requestedProfile = process.env.DEMO_PROFILE;
  const activeProfileId = isDemoProfileId(requestedProfile)
    ? requestedProfile
    : DEFAULT_DEMO_PROFILE;
  const demoSeedResult = await resetAndSeedDemoWorkspace(prisma, activeProfileId);

  const frameworkCount = await prisma.framework.count();
  const controlCount = await prisma.control.count();
  const engagementCount = await prisma.engagement.count();
  const assessmentCount = await prisma.assessment.count();
  const findingCount = await prisma.finding.count();
  const controlResponseCount = await prisma.controlResponse.count();
  const evidenceSubmissionCount = await prisma.evidenceSubmission.count();
  const poamCount = await prisma.pOAMItem.count();
  const auditFindingCount = await prisma.auditFinding.count();
  const auditActivityCount = await prisma.auditActivityLog.count();

  console.log(
    `Seeded ${frameworkCount} frameworks, ${controlCount} controls, ${engagementCount} engagements, ${assessmentCount} assessments, ${findingCount} legacy findings, ${auditFindingCount} audit findings, ${controlResponseCount} control responses, ${evidenceSubmissionCount} evidence submissions, ${poamCount} POA&M items, and ${auditActivityCount} activity logs for ${demoSeedResult.profile.organizationName}`
  );
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
