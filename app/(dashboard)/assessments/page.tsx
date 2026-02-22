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
import { ChevronRight, ClipboardCheck } from "lucide-react";

const statusVariant = {
  NOT_STARTED: "secondary",
  IN_PROGRESS: "default",
  COMPLETE: "outline",
} as const;

export default async function AssessmentsPage() {
  const assessments = await prisma.assessment.findMany({
    include: {
      organization: true,
      findings: { select: { status: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Assessments
        </h1>
        <p className="mt-1 text-slate-600">
          View and manage your compliance assessments
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {assessments.map((a) => {
          const total = a.findings.length;
          const implemented = a.findings.filter(
            (f) => f.status === "IMPLEMENTED"
          ).length;
          const percent = total > 0 ? Math.round((implemented / total) * 100) : 0;
          return (
            <Card
              key={a.id}
              className="overflow-hidden border border-slate-200 shadow-sm transition-all hover:shadow-md hover:border-slate-300"
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
        <Card className="flex flex-col items-center justify-center border-slate-200 py-16">
          <ClipboardCheck className="mb-4 size-12 text-slate-300" />
          <CardTitle className="text-slate-600">No assessments yet</CardTitle>
          <CardDescription className="mt-1 text-center text-slate-500">
            Run your seed to create demo data
          </CardDescription>
        </Card>
      )}
    </div>
  );
}
