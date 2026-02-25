import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { normalizeRisk } from "@/lib/compliance-dashboard";

type Tone = "slate" | "emerald" | "amber" | "rose" | "sky";

const toneClasses: Record<Tone, string> = {
  slate: "border-slate-200 bg-white",
  emerald: "border-emerald-200 bg-emerald-50/60",
  amber: "border-amber-200 bg-amber-50/60",
  rose: "border-rose-200 bg-rose-50/60",
  sky: "border-sky-200 bg-sky-50/60",
};

const toneIconClasses: Record<Tone, string> = {
  slate: "bg-slate-100 text-slate-600",
  emerald: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  rose: "bg-rose-100 text-rose-700",
  sky: "bg-sky-100 text-sky-700",
};

export function formatStatusLabel(status: string) {
  return status.replace(/_/g, " ");
}

export { normalizeRisk } from "@/lib/compliance-dashboard";

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const styles: Record<string, string> = {
    IMPLEMENTED: "border-emerald-200 bg-emerald-100 text-emerald-800",
    PARTIALLY_IMPLEMENTED: "border-amber-200 bg-amber-100 text-amber-800",
    NOT_IMPLEMENTED: "border-rose-200 bg-rose-100 text-rose-800",
    NOT_APPLICABLE: "border-slate-200 bg-slate-100 text-slate-700",
    REVIEW_REQUIRED: "border-sky-200 bg-sky-100 text-sky-800",
    IN_PROGRESS: "border-sky-200 bg-sky-100 text-sky-800",
    UNDER_REVIEW: "border-sky-200 bg-sky-100 text-sky-800",
    COMPLETE: "border-emerald-200 bg-emerald-100 text-emerald-800",
    NOT_STARTED: "border-slate-200 bg-slate-100 text-slate-700",
    DRAFT: "border-slate-200 bg-slate-100 text-slate-700",
    SUBMITTED: "border-indigo-200 bg-indigo-100 text-indigo-800",
    COLLECTED: "border-slate-200 bg-slate-100 text-slate-700",
    PENDING_REVIEW: "border-sky-200 bg-sky-100 text-sky-800",
    APPROVED: "border-emerald-200 bg-emerald-100 text-emerald-800",
    REJECTED: "border-rose-200 bg-rose-100 text-rose-800",
    NEEDS_INFO: "border-amber-200 bg-amber-100 text-amber-800",
    OPEN: "border-amber-200 bg-amber-100 text-amber-800",
    RESOLVED: "border-emerald-200 bg-emerald-100 text-emerald-800",
    DONE: "border-emerald-200 bg-emerald-100 text-emerald-800",
    BLOCKED: "border-rose-200 bg-rose-100 text-rose-800",
    OVERDUE: "border-rose-200 bg-rose-100 text-rose-800",
  };

  return (
    <Badge
      variant="outline"
      className={cn("font-medium", styles[status] ?? styles.NOT_STARTED, className)}
    >
      {formatStatusLabel(status)}
    </Badge>
  );
}

export function RiskBadge({
  risk,
  className,
}: {
  risk: string | null | undefined;
  className?: string;
}) {
  const normalized = normalizeRisk(risk);
  if (!normalized) {
    return <span className={cn("text-sm text-slate-400", className)}>—</span>;
  }

  const styles: Record<string, string> = {
    Critical: "bg-rose-100 text-rose-800",
    High: "bg-rose-100 text-rose-700",
    Medium: "bg-amber-100 text-amber-700",
    Low: "bg-emerald-100 text-emerald-700",
  };

  return (
    <Badge
      variant="secondary"
      className={cn("font-medium", styles[normalized] ?? "bg-slate-100 text-slate-700", className)}
    >
      {normalized}
    </Badge>
  );
}

export function MetricCard({
  label,
  value,
  helper,
  icon: Icon,
  tone = "slate",
}: {
  label: string;
  value: string | number;
  helper?: string;
  icon?: LucideIcon;
  tone?: Tone;
}) {
  return (
    <Card className={cn("gap-0 border shadow-sm", toneClasses[tone])}>
      <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
        <div>
          <CardDescription className="text-xs font-medium uppercase tracking-[0.08em] text-slate-500">
            {label}
          </CardDescription>
        </div>
        {Icon ? (
          <div className={cn("flex size-9 items-center justify-center rounded-lg", toneIconClasses[tone])}>
            <Icon className="size-4" />
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="text-2xl font-semibold tracking-tight text-slate-900">
          {value}
        </div>
        {helper ? <p className="text-xs text-slate-500">{helper}</p> : null}
      </CardContent>
    </Card>
  );
}

function clampPercent(value: number) {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

export function RingMetricCard({
  title,
  value,
  subtitle,
  percent,
  color = "#0f766e",
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  percent: number;
  color?: string;
}) {
  const pct = clampPercent(percent);

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-slate-900">{title}</CardTitle>
        {subtitle ? (
          <CardDescription className="text-xs text-slate-500">{subtitle}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-2xl font-semibold tabular-nums text-slate-900">{value}</div>
          <div className="text-sm text-slate-500">{pct.toFixed(0)}% complete</div>
        </div>
        <div
          aria-hidden="true"
          className="grid size-24 place-items-center rounded-full"
          style={{
            background: `conic-gradient(${color} ${pct}%, #e2e8f0 ${pct}% 100%)`,
          }}
        >
          <div className="grid size-[70px] place-items-center rounded-full bg-white text-sm font-semibold text-slate-700 shadow-inner">
            {pct.toFixed(0)}%
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SectionCard({
  title,
  description,
  right,
  children,
}: {
  title: string;
  description?: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className="overflow-hidden border-slate-200 shadow-sm">
      <CardHeader className="border-b border-slate-200 bg-slate-50/70 py-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-base text-slate-900 sm:text-lg">{title}</CardTitle>
            {description ? (
              <CardDescription className="mt-1 text-sm text-slate-500">
                {description}
              </CardDescription>
            ) : null}
          </div>
          {right}
        </div>
      </CardHeader>
      <CardContent className="px-0">{children}</CardContent>
    </Card>
  );
}

export function InlineProgress({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Progress value={value} className="h-2.5 flex-1 bg-slate-200 [&_[data-slot=progress-indicator]]:bg-slate-900" />
      <span className="min-w-10 text-right text-xs font-medium tabular-nums text-slate-600">
        {clampPercent(value).toFixed(0)}%
      </span>
    </div>
  );
}

export type DomainProgressItem = {
  domain: string;
  totalControls: number;
  answeredControls: number;
  implementedControls: number;
  partialControls: number;
  missingControls: number;
  evidenceCoveragePercent: number;
  highRiskCount: number;
  topGaps: Array<{
    id: string;
    code: string;
    title: string;
    status: string;
    risk: string | null;
  }>;
};

export function DomainProgressAccordion({
  domains,
}: {
  domains: DomainProgressItem[];
}) {
  if (domains.length === 0) {
    return (
      <div className="px-6 py-8 text-sm text-slate-500">
        No domain-level control data yet.
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-200">
      {domains.map((item, index) => {
        const completion =
          item.totalControls > 0 ? (item.answeredControls / item.totalControls) * 100 : 0;
        const implementation =
          item.totalControls > 0 ? (item.implementedControls / item.totalControls) * 100 : 0;

        return (
          <details key={item.domain} className="group" open={index < 3}>
            <summary className="cursor-pointer list-none px-4 py-4 sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-2">
                  <ChevronRight className="size-4 shrink-0 text-slate-400 transition-transform group-open:rotate-90" />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">{item.domain}</p>
                    <p className="text-xs text-slate-500">
                      {item.answeredControls} / {item.totalControls} controls answered
                    </p>
                  </div>
                </div>
                <div className="grid gap-2 sm:min-w-[280px]">
                  <InlineProgress value={completion} />
                  <div className="flex items-center justify-end gap-2 text-xs">
                    <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                      {item.implementedControls} implemented
                    </Badge>
                    <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                      {item.missingControls} open
                    </Badge>
                  </div>
                </div>
              </div>
            </summary>
            <div className="grid gap-4 border-t border-slate-100 bg-slate-50/40 px-4 py-4 sm:grid-cols-3 sm:px-6">
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Implementation Coverage
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {implementation.toFixed(0)}%
                </p>
                <p className="text-xs text-slate-500">
                  Includes fully implemented controls only
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Evidence Coverage</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {clampPercent(item.evidenceCoveragePercent).toFixed(0)}%
                </p>
                <p className="text-xs text-slate-500">
                  Controls with at least one linked evidence item
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">High Risk Gaps</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{item.highRiskCount}</p>
                <p className="text-xs text-slate-500">Open controls marked High/Critical</p>
              </div>
              <div className="sm:col-span-3">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                  Top Gaps
                </p>
                {item.topGaps.length > 0 ? (
                  <div className="grid gap-2">
                    {item.topGaps.map((gap) => (
                      <div
                        key={gap.id}
                        className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">
                            <span className="font-mono">{gap.code}</span> {gap.title}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={gap.status} />
                          <RiskBadge risk={gap.risk} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No open gaps in this domain.</p>
                )}
              </div>
            </div>
          </details>
        );
      })}
    </div>
  );
}
