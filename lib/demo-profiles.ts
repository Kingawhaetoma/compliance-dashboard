export const DEMO_PROFILE_COOKIE = "grc-demo-profile";

export const demoProfileIds = [
  "kings-healthcare",
  "kings-fintech",
  "kings-retail",
] as const;

export type DemoProfileId = (typeof demoProfileIds)[number];

export type DemoProfile = {
  id: DemoProfileId;
  organizationName: string;
  description: string;
  industry: string;
  complianceScopeLabels: string[];
  frameworkKeys: string[];
  auditStatus: "In Progress";
  auditProgressPercent: number;
  auditPeriodLabel: string;
  avatarInitials: string;
  customerOrgName: string;
  engagementName: string;
  programTagline: string;
};

export const demoProfiles: Record<DemoProfileId, DemoProfile> = {
  "kings-healthcare": {
    id: "kings-healthcare",
    organizationName: "King's Healthcare, Inc. (Demo Organization)",
    description:
      "HIPAA-regulated healthcare provider undergoing annual security compliance audit",
    industry: "Healthcare",
    complianceScopeLabels: [
      "HIPAA Security Rule",
      "NIST CSF",
      "SOC 2",
      "ISO 27001",
    ],
    frameworkKeys: ["HIPAA", "NIST", "SOC2", "ISO27001"],
    auditStatus: "In Progress",
    auditProgressPercent: 52,
    auditPeriodLabel: "Jan 2026 – Dec 2026",
    avatarInitials: "KH",
    customerOrgName: "King's Compliance Advisory (Demo)",
    engagementName: "King's Healthcare Annual Security Audit Program",
    programTagline: "Healthcare security and privacy assurance program",
  },
  "kings-fintech": {
    id: "kings-fintech",
    organizationName: "King's FinTech, Inc. (Demo Organization)",
    description:
      "FinTech platform provider preparing for enterprise security due diligence and annual assurance reviews",
    industry: "Financial Technology",
    complianceScopeLabels: ["SOC 2", "ISO 27001", "NIST CSF", "CIS Controls"],
    frameworkKeys: ["SOC2", "ISO27001", "NIST", "CIS"],
    auditStatus: "In Progress",
    auditProgressPercent: 48,
    auditPeriodLabel: "Jan 2026 – Dec 2026",
    avatarInitials: "KF",
    customerOrgName: "King's Compliance Advisory (Demo)",
    engagementName: "King's FinTech Trust & Security Program",
    programTagline: "Trust services and platform control readiness program",
  },
  "kings-retail": {
    id: "kings-retail",
    organizationName: "King's Retail, Inc. (Demo Organization)",
    description:
      "Multi-location retail company running a cybersecurity readiness program across corporate and store operations",
    industry: "Retail",
    complianceScopeLabels: ["NIST CSF", "CIS Controls", "SOC 2", "ISO 27001"],
    frameworkKeys: ["NIST", "CIS", "SOC2", "ISO27001"],
    auditStatus: "In Progress",
    auditProgressPercent: 57,
    auditPeriodLabel: "Jan 2026 – Dec 2026",
    avatarInitials: "KR",
    customerOrgName: "King's Compliance Advisory (Demo)",
    engagementName: "King's Retail Cyber Readiness Program",
    programTagline: "Retail operations cyber resilience and assurance program",
  },
};

export const DEFAULT_DEMO_PROFILE: DemoProfileId = "kings-healthcare";

export const demoProfileOptions = demoProfileIds.map((id) => ({
  id,
  label: demoProfiles[id].organizationName,
}));

export function isDemoProfileId(value: string | null | undefined): value is DemoProfileId {
  return demoProfileIds.includes(value as DemoProfileId);
}

export function getDemoProfile(value: string | null | undefined) {
  if (isDemoProfileId(value)) return demoProfiles[value];
  return demoProfiles[DEFAULT_DEMO_PROFILE];
}

