export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, ClipboardCheck, Plus } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { CreateAssessmentDialog } from "@/components/assessments/create-assessment-dialog";

const statusVariant = {
  NOT_STARTED: "secondary",
  IN_PROGRESS: "default",
  COMPLETE: "outline",
} as const;

export default async function AssessmentsPage() {
  const [assessments, organizations] = await Promise.all([
    prisma.assessment.findMany({
      include: {
        organization: true,
        findings: { select: { status: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.organization.findMany({ select: { id: true, name: true } }),
  ]);

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Assessments
          </h1>
          <p className="mt-1 text-sm text-slate-600 sm:text-base">
            View and manage your compliance assessments
          </p>
        </div>
        {organizations.length > 0 && assessments.length > 0 && (
          <CreateAssessmentDialog
            organizations={organizations}
            trigger={
              <Button size="sm" className="shrink-0">
                <Plus className="mr-2 size-4" />
                Create Assessment
              </Button>
            }
          />
        )}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {assessments.map((a) => {
          const total = a.findings.length;
          const implemented = a.findings.filter(
            (f) => f.status === "IMPLEMENTED"
          ).length;
          const percent = total > 0 ? Math.round((implemented / total) * 100) : 0;
          return (
            <Card
              key={a.id}
              className="overflow-hidden border border-slate-200 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md"
            >
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <CardTitle className="text-base text-slate-900">{a.name}</CardTitle>
                <Badge
                  variant="outline"
                  className={
                    a.status === "COMPLETE"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : a.status === "IN_PROGRESS"
                        ? "border-blue-200 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-slate-50 text-slate-600"
                  }
                >
                  {a.status.replace("_", " ")}
                </Badge>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-3 text-slate-600">
                  {a.organization.name}
                </CardDescription>
                <div className="mb-4 text-sm text-slate-500">
                  {implemented} / {total} controls implemented ({percent}%)
                </div>
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link
                    href={`/assessments/${a.id}`}
                    className="flex items-center gap-1"
                  >
                    View controls
                    <ChevronRight className="size-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {assessments.length === 0 && (
        <EmptyState
          icon={ClipboardCheck}
          title="No assessments yet"
          description="Create your first assessment to start tracking compliance controls and evidence."
          action={
            organizations.length > 0 ? (
              <CreateAssessmentDialog
                organizations={organizations}
                trigger={<Button size="sm">Create Assessment</Button>}
              />
            ) : undefined
          }
        />
      )}
    </div>
  );
}
