import {
  Activity,
  Building2,
  CalendarRange,
  BriefcaseMedical,
  ShieldCheck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type DemoOrganizationHeaderProps = {
  organizationName: string;
  description: string;
  industry: string;
  complianceScope: string[];
  auditStatus: string;
  auditProgressPercent: number;
  auditPeriodLabel: string;
  actions?: React.ReactNode;
  avatarInitials?: string;
};

function LabelValue({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card/70 p-3">
      <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </div>
      <div className="text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}

export function DemoOrganizationHeader({
  organizationName,
  description,
  industry,
  complianceScope,
  auditStatus,
  auditProgressPercent,
  auditPeriodLabel,
  actions,
  avatarInitials = "KH",
}: DemoOrganizationHeaderProps) {
  return (
    <Card className="overflow-hidden border-border bg-card shadow-sm">
      <div className="h-1 w-full bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500" />
      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="grid size-16 shrink-0 place-items-center rounded-2xl border border-border bg-gradient-to-br from-sky-100 to-cyan-100 text-lg font-bold text-sky-700 shadow-sm dark:from-sky-500/10 dark:to-cyan-500/10 dark:text-sky-300">
                {avatarInitials}
              </div>
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className="border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-400/30 dark:bg-sky-500/10 dark:text-sky-300"
                  >
                    <Building2 className="size-3.5" />
                    Demo Organization
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-300"
                  >
                    {auditStatus}
                  </Badge>
                </div>
                <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  {organizationName}
                </h1>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
                  {description}
                </p>
                {actions ? <div className="mt-3 flex flex-wrap gap-2">{actions}</div> : null}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              <LabelValue
                icon={BriefcaseMedical}
                label="Industry"
                value={industry}
              />
              <LabelValue
                icon={CalendarRange}
                label="Audit Period"
                value={auditPeriodLabel}
              />
              <LabelValue
                icon={ShieldCheck}
                label="Audit Status"
                value={
                  <span className="inline-flex items-center gap-2">
                    <span className="size-2 rounded-full bg-amber-500" aria-hidden="true" />
                    {auditStatus}
                  </span>
                }
              />
            </div>

            <div className="mt-4 rounded-2xl border border-border bg-muted/20 p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                <ShieldCheck className="size-3.5" />
                Compliance Scope
              </div>
              <div className="flex flex-wrap gap-2">
                {complianceScope.map((item) => (
                  <Badge
                    key={item}
                    variant="secondary"
                    className="border border-border/60 bg-background/70 text-foreground"
                  >
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="w-full shrink-0 rounded-2xl border border-border bg-muted/10 p-4 xl:w-[340px]">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              <Activity className="size-3.5" />
              Audit Progress
            </div>
            <div className="mb-2 flex items-end justify-between gap-4">
              <div>
                <p className="text-3xl font-bold tracking-tight text-foreground">
                  {Math.round(auditProgressPercent)}%
                </p>
                <p className="text-xs text-muted-foreground">
                  Annual audit program completion
                </p>
              </div>
              <Badge
                variant="outline"
                className="border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-300"
              >
                In Progress
              </Badge>
            </div>
            <Progress
              value={auditProgressPercent}
              className="h-2.5 bg-muted [&_[data-slot=progress-indicator]]:bg-gradient-to-r [&_[data-slot=progress-indicator]]:from-sky-500 [&_[data-slot=progress-indicator]]:to-emerald-500"
            />
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div className="rounded-lg border border-border bg-background/70 px-3 py-2">
                <div className="font-semibold uppercase tracking-[0.08em]">Phase</div>
                <div className="mt-1 text-foreground">Control Validation</div>
              </div>
              <div className="rounded-lg border border-border bg-background/70 px-3 py-2">
                <div className="font-semibold uppercase tracking-[0.08em]">Next Milestone</div>
                <div className="mt-1 text-foreground">Evidence Review</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
