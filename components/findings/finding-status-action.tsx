"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { updateAuditFindingStatus } from "@/app/actions/findings";
import { Button } from "@/components/ui/button";

export function FindingStatusAction({
  findingId,
  currentStatus,
}: {
  findingId: string;
  currentStatus: "OPEN" | "RESOLVED";
}) {
  const [isPending, startTransition] = useTransition();

  const nextStatus = currentStatus === "OPEN" ? "RESOLVED" : "OPEN";
  const label = currentStatus === "OPEN" ? "Resolve" : "Reopen";

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          try {
            await updateAuditFindingStatus({ findingId, status: nextStatus });
            toast.success(currentStatus === "OPEN" ? "Finding resolved" : "Finding reopened");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to update finding");
          }
        })
      }
    >
      {isPending ? "Saving..." : label}
    </Button>
  );
}

