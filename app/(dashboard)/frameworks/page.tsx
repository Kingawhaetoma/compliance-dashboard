import { prisma } from "@/lib/prisma";
import { HorizontalBarChartCard } from "@/components/compliance/chart-cards";
import { MetricCard, SectionCard } from "@/components/compliance/dashboard-ui";
import { PageCallout, PageHero, PageStack } from "@/components/compliance/page-chrome";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpenText, Layers, Shield } from "lucide-react";

export default async function FrameworksPage() {
  const frameworks = await prisma.framework.findMany({
    include: { controls: { select: { id: true } } },
    orderBy: { key: "asc" },
  });

  const totalControls = frameworks.reduce((sum, framework) => sum + framework.controls.length, 0);
  const avgControls =
    frameworks.length > 0 ? Math.round(totalControls / frameworks.length) : 0;
  const chartData = frameworks.map((framework) => ({
    label: framework.key,
    value: framework.controls.length,
    color: framework.controls.length >= 10 ? "#0ea5e9" : "#94a3b8",
  }));

  return (
    <PageStack>
      <PageHero
        badge="Framework library"
        badgeIcon={Shield}
        title="Frameworks"
        description="Compliance frameworks and control mappings used to generate audit scope."
        chips={[
          { label: `${frameworks.length} frameworks` },
          { label: `${totalControls} total controls`, tone: "info" },
          { label: `${avgControls} avg controls / framework` },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <MetricCard
          label="Frameworks"
          value={frameworks.length}
          helper="Available compliance standards in the library"
          icon={BookOpenText}
          tone="sky"
        />
        <MetricCard
          label="Total Controls"
          value={totalControls}
          helper="Controls available to seed audit scope"
          icon={Layers}
          tone="slate"
        />
        <MetricCard
          label="Avg Controls"
          value={avgControls}
          helper="Average number of controls per framework"
          icon={Shield}
          tone="emerald"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_1fr]">
        <SectionCard
          title="Framework Catalog"
          description="Browse supported frameworks and their current control coverage."
        >
          <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
            {frameworks.map((f) => (
              <Card
                key={f.id}
                className="overflow-hidden border border-slate-200 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md"
              >
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <CardTitle className="text-base text-slate-900">{f.name}</CardTitle>
                  <Shield className="size-5 text-slate-400" />
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-2 text-slate-600">
                    {f.key} {f.version ? `· ${f.version}` : ""}
                  </CardDescription>
                  <Badge
                    variant="outline"
                    className="border-slate-200 bg-slate-50 text-slate-700"
                  >
                    {f.controls.length} controls
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </SectionCard>

        <HorizontalBarChartCard
          title="Control Coverage by Framework"
          description="Frameworks with the largest control sets currently available."
          data={chartData}
        />
      </div>

      <PageCallout>
        Use the New Audit Wizard to select one or more frameworks and auto-generate
        `ControlResponse` rows for a client/vendor assessment scope.
      </PageCallout>
    </PageStack>
  );
}
