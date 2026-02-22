import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ControlsTable } from "@/components/assessments/controls-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function AssessmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const assessment = await prisma.assessment.findUnique({
    where: { id },
    include: {
      organization: true,
      findings: {
        include: {
          control: { include: { framework: true } },
        },
      },
    },
  });

  if (!assessment) notFound();

  const rows = assessment.findings.map((f) => ({
    findingId: f.id,
    controlCode: f.control.code,
    controlTitle: f.control.title,
    domain: f.control.domain,
    status: f.status,
    risk: f.risk,
    owner: f.owner,
    notes: f.notes,
    frameworkName: f.control.framework.name,
  }));

  const implementedCount = assessment.findings.filter(
    (f) => f.status === "IMPLEMENTED"
  ).length;
  const totalCount = assessment.findings.length;
  const progressPercent =
    totalCount > 0 ? Math.round((implementedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/assessments">
            <ArrowLeft className="size-5 text-slate-600" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {assessment.name}
          </h1>
          <div className="mt-1 flex items-center gap-3 text-sm text-slate-600">
            <span>{assessment.organization.name}</span>
            <Badge
              variant="outline"
              className={
                assessment.status === "COMPLETE"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : assessment.status === "IN_PROGRESS"
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-slate-50 text-slate-600"
              }
            >
              {assessment.status.replace("_", " ")}
            </Badge>
            <span>
              {implementedCount} / {totalCount} controls ({progressPercent}%)
            </span>
          </div>
        </div>
      </div>
      <ControlsTable rows={rows} assessmentId={assessment.id} />
    </div>
  );
}
