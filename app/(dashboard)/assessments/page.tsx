export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { MetricCard, StatusBadge } from "@/components/compliance/dashboard-ui";
import { PageCallout, PageHero, PageStack } from "@/components/compliance/page-chrome";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Building2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Plus,
} from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { CreateAssessmentDialog } from "@/components/assessments/create-assessment-dialog";

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

  const completeCount = assessments.filter((assessment) => assessment.status === "COMPLETE").length;
  const inProgressCount = assessments.filter(
    (assessment) => assessment.status === "IN_PROGRESS"
  ).length;
  const draftCount = assessments.filter((assessment) => assessment.status === "DRAFT").length;

  return (
    <PageStack>
      <PageHero
        badge="Assessment management"
        badgeIcon={ClipboardCheck}
        title="Assessments"
        description="View and manage compliance assessments created from the wizard or legacy flows."
        chips={[
          { label: `${assessments.length} total assessments`, tone: "info" },
          { label: `${organizations.length} organizations` },
          { label: `${inProgressCount} in progress`, tone: "warning" },
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" asChild className="shrink-0">
              <Link href="/audits/new">
                <Plus className="mr-2 size-4" />
                Start New Audit
              </Link>
            </Button>
            {organizations.length > 0 && assessments.length > 0 && (
              <CreateAssessmentDialog
                organizations={organizations}
                trigger={
                  <Button size="sm" variant="outline" className="shrink-0">
                    Quick Create (Legacy)
                  </Button>
                }
              />
            )}
          </div>
        }
      />

      {assessments.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Assessments"
            value={assessments.length}
            helper="All audit records in the workspace"
            icon={ClipboardCheck}
            tone="slate"
          />
          <MetricCard
            label="In Progress"
            value={inProgressCount}
            helper={`${draftCount} draft`}
            icon={Clock3}
            tone="amber"
          />
          <MetricCard
            label="Complete"
            value={completeCount}
            helper="Finished assessment workflows"
            icon={ClipboardCheck}
            tone="emerald"
          />
          <MetricCard
            label="Organizations"
            value={organizations.length}
            helper="Customers/vendors available for assignment"
            icon={Building2}
            tone="sky"
          />
        </div>
      ) : null}

      <PageCallout tone="info">
        Recommended workflow: use <Link href="/audits/new" className="font-semibold underline underline-offset-2">New Audit Wizard</Link> to choose customer, vendor, framework(s), and auto-generate the audit control scope. The legacy quick-create flow only creates an empty assessment shell.
      </PageCallout>
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
                <StatusBadge status={a.status} />
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
            <Button size="sm" asChild>
              <Link href="/audits/new">Start New Audit</Link>
            </Button>
          }
        />
      )}
    </PageStack>
  );
}
