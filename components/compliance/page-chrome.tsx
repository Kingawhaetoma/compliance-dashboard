import type { LucideIcon } from "lucide-react";
import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

type HeroTone = "neutral" | "info" | "success" | "warning" | "danger";

type HeroChip = {
  label: string;
  tone?: HeroTone;
};

const chipToneClasses: Record<HeroTone, string> = {
  neutral: "bg-slate-100 text-slate-700",
  info: "bg-sky-100 text-sky-700",
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-rose-100 text-rose-700",
};

export function PageStack({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("space-y-6 sm:space-y-8", className)}>{children}</div>;
}

export function PageHero({
  title,
  description,
  actions,
  badge,
  badgeIcon: BadgeIcon = Sparkles,
  chips,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  badge?: string;
  badgeIcon?: LucideIcon;
  chips?: HeroChip[];
  className?: string;
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6",
        "before:pointer-events-none before:absolute before:-right-16 before:-top-16 before:h-40 before:w-40 before:rounded-full before:bg-sky-100/40 before:blur-2xl",
        "after:pointer-events-none after:absolute after:-bottom-20 after:left-0 after:h-40 after:w-40 after:rounded-full after:bg-emerald-100/30 after:blur-2xl",
        className
      )}
    >
      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          {badge ? (
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
              <BadgeIcon className="size-3.5 text-slate-500" />
              <span className="truncate">{badge}</span>
            </div>
          ) : null}
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-1 text-sm text-slate-600 sm:text-base">{description}</p>
          ) : null}
          {chips?.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {chips.map((chip) => (
                <span
                  key={chip.label}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium",
                    chipToneClasses[chip.tone ?? "neutral"]
                  )}
                >
                  {chip.label}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        {actions ? (
          <div className="relative flex flex-wrap gap-2 lg:shrink-0">{actions}</div>
        ) : null}
      </div>
    </section>
  );
}

export function PageCallout({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: HeroTone;
  className?: string;
}) {
  const toneClasses: Record<HeroTone, string> = {
    neutral: "border-slate-200 bg-slate-50/70 text-slate-600",
    info: "border-sky-200 bg-sky-50/70 text-sky-900",
    success: "border-emerald-200 bg-emerald-50/70 text-emerald-900",
    warning: "border-amber-200 bg-amber-50/70 text-amber-900",
    danger: "border-rose-200 bg-rose-50/70 text-rose-900",
  };

  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3 text-sm sm:p-5",
        toneClasses[tone],
        className
      )}
    >
      {children}
    </div>
  );
}
