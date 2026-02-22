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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Assessments</h1>
        <p className="text-muted-foreground">
          View and manage your compliance assessments
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {assessments.map((a) => {
          const total = a.findings.length;
          const implemented = a.findings.filter(
            (f) => f.status === "IMPLEMENTED"
          ).length;
          const percent = total > 0 ? Math.round((implemented / total) * 100) : 0;
          return (
            <Card key={a.id} className="transition-colors hover:border-primary/30">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <CardTitle className="text-base">{a.name}</CardTitle>
                <Badge variant={statusVariant[a.status] ?? "secondary"}>
                  {a.status.replace("_", " ")}
                </Badge>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-3">
                  {a.organization.name}
                </CardDescription>
                <div className="mb-4 text-sm text-muted-foreground">
                  {implemented} / {total} controls implemented ({percent}%)
                </div>
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link href={`/assessments/${a.id}`} className="flex items-center gap-1">
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
        <Card className="flex flex-col items-center justify-center py-12">
          <ClipboardCheck className="mb-4 size-12 text-muted-foreground" />
          <CardTitle>No assessments yet</CardTitle>
          <CardDescription className="mt-1">
            Run your seed to create demo data
          </CardDescription>
        </Card>
      )}
    </div>
  );
}
