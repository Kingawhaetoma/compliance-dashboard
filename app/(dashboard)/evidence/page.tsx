import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, ExternalLink } from "lucide-react";

export default async function EvidencePage() {
  const evidence = await prisma.evidence.findMany({
    include: {
      control: { include: { framework: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          Evidence
        </h1>
        <p className="mt-1 text-sm text-slate-600 sm:text-base">
          Evidence artifacts linked to controls
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {evidence.map((e) => (
          <Card
            key={e.id}
            className="overflow-hidden border border-slate-200 shadow-sm transition-shadow hover:shadow-md hover:border-slate-300"
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

      {evidence.length === 0 && (
        <Card className="flex flex-col items-center justify-center border-slate-200 py-16">
          <FileText className="mb-4 size-12 text-slate-300" />
          <CardTitle className="text-slate-600">No evidence yet</CardTitle>
          <CardDescription className="mt-1 text-center">
            Add evidence to controls through assessments
          </CardDescription>
        </Card>
      )}
    </div>
  );
}
