"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DatabaseZap, RefreshCcw, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { resetDemoData, switchDemoOrganizationProfile } from "@/app/actions/demo";
import type { DemoProfileId } from "@/lib/demo-profiles";
import { demoProfileOptions } from "@/lib/demo-profiles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function DemoEnvironmentBanner({
  activeProfileId,
  activeOrganizationName,
}: {
  activeProfileId: DemoProfileId;
  activeOrganizationName: string;
}) {
  const router = useRouter();
  const [selectedProfileId, setSelectedProfileId] = useState<DemoProfileId>(activeProfileId);
  const [isPending, startTransition] = useTransition();

  function handleSwitch() {
    if (selectedProfileId === activeProfileId) {
      toast.message("Demo organization already active");
      return;
    }

    startTransition(async () => {
      try {
        const result = await switchDemoOrganizationProfile(selectedProfileId);
        toast.success(result.message);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to switch demo organization");
      }
    });
  }

  function handleReset() {
    if (typeof window !== "undefined") {
      const confirmed = window.confirm(
        "Reset demo data for the active demo organization? This will clear and reseed sample data."
      );
      if (!confirmed) return;
    }

    startTransition(async () => {
      try {
        const result = await resetDemoData(selectedProfileId);
        toast.success(result.message);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to reset demo data");
      }
    });
  }

  return (
    <Card className="border-amber-300/70 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 shadow-sm dark:border-amber-400/20 dark:from-amber-500/10 dark:via-orange-500/5 dark:to-amber-500/10">
      <CardContent className="flex flex-col gap-4 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="border-amber-300 bg-white/90 text-amber-900 dark:border-amber-400/30 dark:bg-transparent dark:text-amber-200"
              >
                <ShieldAlert className="size-3.5" />
                Demo Mode
              </Badge>
              <Badge
                variant="outline"
                className="border-amber-300/70 bg-white/90 text-amber-900 dark:border-amber-400/20 dark:bg-transparent dark:text-amber-200"
              >
                Sample Data Only
              </Badge>
            </div>
            <p className="text-sm font-semibold text-amber-950 dark:text-amber-100">
              This is a Demo Compliance Environment
            </p>
            <p className="mt-1 text-xs leading-5 text-amber-900/80 dark:text-amber-200/85">
              No real customer data is stored here. All organizations, evidence, assessments, and control updates are seeded sample/demo data for product demonstrations.
            </p>
            <p className="mt-2 text-xs text-amber-900/75 dark:text-amber-200/75">
              Active demo organization: <span className="font-semibold">{activeOrganizationName}</span>
            </p>
          </div>

          <div className="w-full rounded-xl border border-amber-300/60 bg-white/80 p-3 shadow-sm dark:border-amber-400/20 dark:bg-background/40 lg:w-auto">
            <div className="grid gap-3 sm:grid-cols-[minmax(280px,1fr)_auto_auto] sm:items-end">
              <label className="grid gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-amber-900/80 dark:text-amber-200/80">
                  Demo Organization Switcher
                </span>
                <select
                  value={selectedProfileId}
                  onChange={(event) => setSelectedProfileId(event.target.value as DemoProfileId)}
                  disabled={isPending}
                  className="h-10 rounded-lg border border-amber-300 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none ring-0 transition focus:border-amber-400 focus:ring-2 focus:ring-amber-300/40 disabled:cursor-not-allowed disabled:opacity-70 dark:border-amber-400/20 dark:bg-background dark:text-foreground"
                  aria-label="Select demo organization"
                >
                  {demoProfileOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={handleSwitch}
                className="border-amber-300 bg-white text-amber-900 hover:bg-amber-50 hover:text-amber-950 dark:border-amber-400/20 dark:bg-background/60 dark:text-amber-200"
              >
                <DatabaseZap className="size-4" />
                {isPending ? "Switching..." : "Switch Dataset"}
              </Button>

              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={handleReset}
                className="border-amber-300 bg-white text-amber-900 hover:bg-amber-50 hover:text-amber-950 dark:border-amber-400/20 dark:bg-background/60 dark:text-amber-200"
              >
                <RefreshCcw className="size-4" />
                {isPending ? "Resetting..." : "Reset Demo Data"}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

