"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { updateDemoControlWorkspaceState } from "@/app/actions/control-detail";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ControlDetailActionsProps = {
  controlId: string;
  defaultStatus: "NOT_IMPLEMENTED" | "PARTIALLY_IMPLEMENTED" | "IMPLEMENTED";
  defaultOwner: string | null;
};

export function ControlDetailActions({
  controlId,
  defaultStatus,
  defaultOwner,
}: ControlDetailActionsProps) {
  const [status, setStatus] = useState<
    "NOT_IMPLEMENTED" | "PARTIALLY_IMPLEMENTED" | "IMPLEMENTED"
  >(defaultStatus);
  const [owner, setOwner] = useState(defaultOwner ?? "");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      try {
        await updateDemoControlWorkspaceState({
          controlId,
          status,
          owner: owner.trim() || null,
        });
        toast.success("Control workspace state updated");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to update control");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-[1fr_220px_auto] sm:items-end">
      <label className="grid gap-1.5">
        <Label htmlFor="control-owner">Assigned Owner</Label>
        <Input
          id="control-owner"
          value={owner}
          onChange={(event) => setOwner(event.target.value)}
          placeholder="e.g. Security Operations"
          disabled={isPending}
        />
      </label>

      <label className="grid gap-1.5">
        <Label htmlFor="control-status">Status</Label>
        <Select
          value={status}
          onValueChange={(value) =>
            setStatus(value as "NOT_IMPLEMENTED" | "PARTIALLY_IMPLEMENTED" | "IMPLEMENTED")
          }
          disabled={isPending}
        >
          <SelectTrigger id="control-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="NOT_IMPLEMENTED">Not Started</SelectItem>
            <SelectItem value="PARTIALLY_IMPLEMENTED">Partial</SelectItem>
            <SelectItem value="IMPLEMENTED">Implemented</SelectItem>
          </SelectContent>
        </Select>
      </label>

      <Button type="submit" size="sm" disabled={isPending} className="sm:mb-0.5">
        {isPending ? "Saving..." : "Update Control"}
      </Button>
    </form>
  );
}

