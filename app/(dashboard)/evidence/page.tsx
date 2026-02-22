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
import { FileText, ExternalLink } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { AddEvidenceDialog } from "@/components/evidence/add-evidence-dialog";

export default async function EvidencePage() {
  const [evidence, controls] = await Promise.all([
    prisma.evidence.findMany({
      include: {
        control: { include: { framework: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.control.findMany({
      include: { framework: true },
      orderBy: { code: "asc" },
    }),
  ]);

  const controlOptions = controls.map((c) => ({
    id: c.id,
    code: c.code,
    title: c.title,
    frameworkName: c.framework.name,
  }));

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Evidence
          </h1>
          <p className="mt-1 text-sm text-slate-600 sm:text-base">
            Evidence artifacts linked to controls
          </p>
        </div>
        {controlOptions.length > 0 && evidence.length > 0 && (
          <AddEvidenceDialog
            controls={controlOptions}
            trigger={
              <Button size="sm" className="shrink-0">
                Add Evidence
              </Button>
            }
          />
        )}
      </div>

      {evidence.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No evidence yet"
          description="Add evidence to controls to support your compliance assessments."
          action={
            controlOptions.length > 0 ? (
              <AddEvidenceDialog
                controls={controlOptions}
                trigger={<Button size="sm">Add Evidence</Button>}
              />
            ) : undefined
          }
          secondaryAction={{ label: "View Controls", href: "/controls" }}
        />
      ) : (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {evidence.map((e) => (
          <Card
            key={e.id}
            className="overflow-hidden border border-slate-200 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md"
          >
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="flex size-10 items-center justify-center rounded-lg bg-slate-100">
                <FileText className="size-5 text-slate-600" />
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-base">{e.title}</CardTitle>
              <CardDescription className="mt-1 flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {e.control.framework.name}
                </Badge>
                <span className="text-slate-500">{e.control.code}</span>
              </CardDescription>
              {e.url && (
                <a
                  href={e.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  View evidence
                  <ExternalLink className="size-4" />
                </a>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      )}
    </div>
  );
}
