import { prisma } from "@/lib/prisma";
import { KPICards } from "@/components/dashboard/kpi-cards";
import {
  FrameworkProgressTable,
  type FrameworkProgress,
} from "@/components/dashboard/framework-progress-table";

export default async function DashboardPage() {
  const [orgCount, frameworkCount, controlCount, findings, frameworks] =
    await Promise.all([
      prisma.organization.count(),
      prisma.framework.count(),
      prisma.control.count(),
      prisma.finding.findMany({
        select: { status: true, controlId: true },
      }),
      prisma.framework.findMany({
        include: { controls: { select: { id: true } } },
      }),
    ]);

  const totalFindings = findings.length;
  const implementedFindings = findings.filter(
    (f) => f.status === "IMPLEMENTED"
  ).length;
  const implementedPercent =
    totalFindings > 0 ? (implementedFindings / totalFindings) * 100 : 0;

  const implementedByControl = new Set(
    findings.filter((f) => f.status === "IMPLEMENTED").map((f) => f.controlId)
  );

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

  const kpiData = {
    orgs: orgCount,
    frameworks: frameworkCount,
    controls: controlCount,
    implementedPercent,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your compliance posture
        </p>
      </div>
      <KPICards data={kpiData} />
      <FrameworkProgressTable frameworks={frameworkProgress} />
    </div>
  );
}
