import { FlaskConical, ShieldAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export function DemoModeBanner() {
  return (
    <Card className="border-amber-300/70 bg-gradient-to-r from-amber-50 to-orange-50 shadow-sm dark:border-amber-400/20 dark:from-amber-500/10 dark:to-orange-500/10">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300">
            <FlaskConical className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-amber-950 dark:text-amber-100">
              This is a Demo Compliance Environment
            </p>
            <p className="truncate text-xs text-amber-800/80 dark:text-amber-200/80">
              Sample data is provided for product demonstration and workflow walkthroughs.
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="w-fit border-amber-300 bg-white/80 text-amber-900 dark:border-amber-400/30 dark:bg-transparent dark:text-amber-200"
        >
          <ShieldAlert className="size-3.5" />
          Demo Mode
        </Badge>
      </CardContent>
    </Card>
  );
}

