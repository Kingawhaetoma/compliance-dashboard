import { prisma } from "@/lib/prisma";
import { KPICards } from "@/components/dashboard/kpi-cards";
import {
  DashboardControlsTable,
  type ControlRow,
} from "@/components/dashboard/controls-table";
import {
  FrameworkProgressTable,
  type FrameworkProgress,
} from "@/components/dashboard/framework-progress-table";

export default async function DashboardPage() {
  const [controls, findings, frameworks] = await Promise.all([
    prisma.control.findMany({
      include: {
        framework: true,
        findings: { select: { status: true, risk: true } },
      },
    }),
    prisma.finding.findMany({
      select: { status: true, controlId: true },
    }),
    prisma.framework.findMany({
      include: { controls: { select: { id: true } } },
    }),
  ]);

  const implementedByControl = new Set(
    findings.filter((f) => f.status === "IMPLEMENTED").map((f) => f.controlId)
  );

  const totalControls = controls.length;
  const implementedControls = implementedByControl.size;
  const missingControls = totalControls - implementedControls;
  const compliancePercentage =
    totalControls > 0 ? (implementedControls / totalControls) * 100 : 0;

  const kpiData = {
    totalControls,
    implementedControls,
    missingControls,
    compliancePercentage,
  };

  const controlRows: ControlRow[] = controls.map((c) => {
    const controlFindings = findings.filter((f) => f.controlId === c.id);
    const status = controlFindings.some((f) => f.status === "IMPLEMENTED")
      ? "IMPLEMENTED"
      : controlFindings.some((f) => f.status === "PARTIALLY_IMPLEMENTED")
        ? "PARTIALLY_IMPLEMENTED"
        : controlFindings.some((f) => f.status === "NOT_APPLICABLE")
          ? "NOT_APPLICABLE"
          : "NOT_IMPLEMENTED";
    const risk = controlFindings.reduce<string | null>((acc, f) => {
      if (!f.risk) return acc;
      const r = f.risk;
      if (r.toLowerCase() === "high") return "High";
      if (r.toLowerCase() === "medium" && acc !== "High") return "Medium";
      if (r.toLowerCase() === "low" && !acc) return "Low";
      return acc ?? r;
    }, null);
    return {
      id: c.id,
      code: c.code,
      title: c.title,
      framework: c.framework.name,
      status,
      risk,
    };
  });

  const frameworkProgress: FrameworkProgress[] = frameworks.map((f) => {
    const total = f.controls.length;
    const implemented = f.controls.filter((c) =>
      implementedByControl.has(c.id)
    ).length;
    const percent = total > 0 ? (implemented / total) * 100 : 0;
    return {
      id: f.id,
      key: f.key,
      name: f.name,
      version: f.version,
      totalControls: total,
      implementedCount: implemented,
      percent,
    };
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          GRC Dashboard
        </h1>
        <p className="mt-1 text-slate-600">
          Governance, Risk & Compliance overview
        </p>
      </div>

      <KPICards data={kpiData} />

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">
          Framework Progress
        </h2>
        <FrameworkProgressTable frameworks={frameworkProgress} />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">
          Controls Overview
        </h2>
        <DashboardControlsTable controls={controlRows} />
      </div>
    </div>
  );
}
