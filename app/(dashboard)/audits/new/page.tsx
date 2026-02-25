export const dynamic = "force-dynamic";
export const revalidate = 0;

import { ArrowRight, ClipboardPlus } from "lucide-react";
import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateAuditWorkflowForm } from "@/components/audits/create-audit-workflow-form";
import { PageHero, PageStack } from "@/components/compliance/page-chrome";

export default async function NewAuditWorkflowPage() {
  const [organizations, frameworks, assessmentCount] = await Promise.all([
    prisma.organization.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.framework.findMany({
      include: { controls: { select: { id: true } } },
      orderBy: { key: "asc" },
    }),
    prisma.assessment.count(),
  ]);

  const frameworkOptions = frameworks.map((framework) => ({
    id: framework.id,
    key: framework.key,
    name: framework.name,
    version: framework.version,
    controlCount: framework.controls.length,
  }));

  return (
    <PageStack>
      <PageHero
        badge="Guided audit workflow"
        badgeIcon={ClipboardPlus}
        title="Start A New Compliance Audit"
        description="Add the client and vendor, choose framework scope, generate control responses, and begin the assessment."
        chips={[
          { label: `${frameworkOptions.length} frameworks` },
          { label: `${organizations.length} organizations` },
          { label: `${assessmentCount} assessments`, tone: "info" },
        ]}
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link href="/assessments">View Assessments</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/customer">
                Customer Dashboard
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Framework Library</CardDescription>
            <CardTitle className="text-2xl">{frameworkOptions.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-500">
            Includes HIPAA, NIST CSF, NIST 800-171/172/53, SOC 2, ISO 27001, CIS
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Organizations</CardDescription>
            <CardTitle className="text-2xl">{organizations.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-500">
            Existing orgs are suggested in the wizard; new names are created automatically.
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Assessments</CardDescription>
            <CardTitle className="text-2xl">{assessmentCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-500">
            New audits appear in Customer Dashboard, Vendor Workspace, and Assessments.
          </CardContent>
        </Card>
      </div>

      <CreateAuditWorkflowForm organizations={organizations} frameworks={frameworkOptions} />
    </PageStack>
  );
}
