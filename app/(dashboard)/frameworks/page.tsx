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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Frameworks</h1>
        <p className="text-muted-foreground">
          Compliance frameworks and control mappings
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {frameworks.map((f) => (
          <Card key={f.id}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <CardTitle className="text-base">{f.name}</CardTitle>
              <Shield className="size-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-2">
                {f.key} {f.version ? `· ${f.version}` : ""}
              </CardDescription>
              <Badge variant="secondary">{f.controls.length} controls</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
