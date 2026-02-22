import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";

export default async function FrameworksPage() {
  const frameworks = await prisma.framework.findMany({
    include: { controls: { select: { id: true } } },
    orderBy: { key: "asc" },
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          Frameworks
        </h1>
        <p className="mt-1 text-sm text-slate-600 sm:text-base">
          Compliance frameworks and control mappings
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {frameworks.map((f) => (
          <Card
            key={f.id}
            className="overflow-hidden border border-slate-200 shadow-sm transition-all hover:shadow-md hover:border-slate-300"
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
    </div>
  );
}
