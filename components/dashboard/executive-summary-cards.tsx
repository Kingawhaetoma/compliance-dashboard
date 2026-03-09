import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  FileCheck2,
  Percent,
  ShieldCheck,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type ExecutiveSummaryCardsProps = {
  overallComplianceScorePercent: number;
  totalControls: number;
  implementedControls: number;
  missingControls: number;
  highRiskControls: number;
  evidenceCollectedPercent: number;
};

type SummaryCardConfig = {
  label: string;
  value: number | string;
  helper: string;
  icon: LucideIcon;
  tone: "sky" | "emerald" | "amber" | "rose" | "slate";
  progress?: number;
};

const toneStyles = {
  slate: {
    card: "border-border bg-card",
    icon: "bg-muted text-muted-foreground",
  },
  sky: {
    card: "border-sky-200/70 bg-sky-50/60 dark:border-sky-400/20 dark:bg-sky-500/10",
    icon: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  },
  emerald: {
    card:
      "border-emerald-200/70 bg-emerald-50/60 dark:border-emerald-400/20 dark:bg-emerald-500/10",
    icon: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  },
  amber: {
    card: "border-amber-200/70 bg-amber-50/60 dark:border-amber-400/20 dark:bg-amber-500/10",
    icon: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  },
  rose: {
    card: "border-rose-200/70 bg-rose-50/60 dark:border-rose-400/20 dark:bg-rose-500/10",
    icon: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  },
} as const;

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

export function ExecutiveSummaryCards({
  overallComplianceScorePercent,
  totalControls,
  implementedControls,
  missingControls,
  highRiskControls,
  evidenceCollectedPercent,
}: ExecutiveSummaryCardsProps) {
  const cards: SummaryCardConfig[] = [
    {
      label: "Overall Compliance Score",
      value: `${Math.round(overallComplianceScorePercent)}%`,
      helper: "Composite readiness score across control status, risk, and evidence",
      icon: Percent,
      tone:
        overallComplianceScorePercent >= 80
          ? "emerald"
          : overallComplianceScorePercent >= 60
            ? "sky"
            : "amber",
      progress: overallComplianceScorePercent,
    },
    {
      label: "Total Controls",
      value: totalControls,
      helper: "Controls currently in the demo compliance program library",
      icon: ClipboardList,
      tone: "slate",
    },
    {
      label: "Implemented Controls",
      value: implementedControls,
      helper: "Controls marked fully implemented",
      icon: CheckCircle2,
      tone: "emerald",
      progress: totalControls > 0 ? (implementedControls / totalControls) * 100 : 0,
    },
    {
      label: "Missing Controls",
      value: missingControls,
      helper: "Controls still requiring implementation work",
      icon: ShieldCheck,
      tone: missingControls > 0 ? "amber" : "emerald",
      progress: totalControls > 0 ? (missingControls / totalControls) * 100 : 0,
    },
    {
      label: "High Risk Controls",
      value: highRiskControls,
      helper: "High/Critical controls with open implementation gaps",
      icon: AlertTriangle,
      tone: highRiskControls > 0 ? "rose" : "emerald",
    },
    {
      label: "Evidence Collected",
      value: `${Math.round(evidenceCollectedPercent)}%`,
      helper: "Controls with at least one evidence item or submission",
      icon: FileCheck2,
      tone:
        evidenceCollectedPercent >= 75 ? "emerald" : evidenceCollectedPercent >= 50 ? "sky" : "amber",
      progress: evidenceCollectedPercent,
    },
  ];

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {cards.map((card) => {
        const Icon = card.icon;
        const tone = toneStyles[card.tone];
        return (
          <Card key={card.label} className={cn("gap-0 shadow-sm", tone.card)}>
            <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  {card.label}
                </p>
                <CardTitle className="mt-1 truncate text-2xl font-bold tracking-tight text-foreground">
                  {card.value}
                </CardTitle>
              </div>
              <div className={cn("grid size-9 shrink-0 place-items-center rounded-lg", tone.icon)}>
                <Icon className="size-4" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="min-h-8 text-xs leading-4 text-muted-foreground">{card.helper}</p>
              {typeof card.progress === "number" ? (
                <div className="space-y-1">
                  <Progress
                    value={clampPercent(card.progress)}
                    className="h-1.5 bg-background/70 [&_[data-slot=progress-indicator]]:bg-foreground"
                  />
                  <div className="text-[11px] font-medium tabular-nums text-muted-foreground">
                    {clampPercent(card.progress).toFixed(0)}%
                  </div>
                </div>
              ) : (
                <div className="h-[18px]" aria-hidden="true" />
              )}
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}

