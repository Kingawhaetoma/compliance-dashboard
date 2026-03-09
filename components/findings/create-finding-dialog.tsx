"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { createAuditFinding } from "@/app/actions/findings";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type ControlOption = {
  id: string;
  code: string;
  title: string;
  frameworkKey: string;
};

export function CreateFindingDialog({
  controls,
  trigger,
}: {
  controls: ControlOption[];
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [controlId, setControlId] = useState("");
  const [severity, setSeverity] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [owner, setOwner] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [details, setDetails] = useState("");
  const [isPending, startTransition] = useTransition();

  function resetForm() {
    setTitle("");
    setControlId("");
    setSeverity("MEDIUM");
    setOwner("");
    setRecommendation("");
    setDetails("");
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) {
      toast.error("Finding title is required");
      return;
    }
    if (!recommendation.trim()) {
      toast.error("Recommendation is required");
      return;
    }

    startTransition(async () => {
      try {
        await createAuditFinding({
          title: title.trim(),
          controlId: controlId || null,
          severity,
          owner: owner.trim() || null,
          recommendation: recommendation.trim(),
          details: details.trim() || null,
        });
        toast.success("Finding created");
        setOpen(false);
        resetForm();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to create finding");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus className="size-4" />
            Create Finding
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Finding</DialogTitle>
            <DialogDescription>
              Create a demo audit finding linked to a control for the active King’s demo organization.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="finding-title">Finding Title</Label>
              <Input
                id="finding-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Incomplete access review evidence"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="finding-control">Linked Control (optional)</Label>
                <Select value={controlId} onValueChange={setControlId}>
                  <SelectTrigger id="finding-control">
                    <SelectValue placeholder="Select control" />
                  </SelectTrigger>
                  <SelectContent>
                    {controls.map((control) => (
                      <SelectItem key={control.id} value={control.id}>
                        {control.frameworkKey} · {control.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="finding-severity">Severity</Label>
                <Select
                  value={severity}
                  onValueChange={(value) => setSeverity(value as "LOW" | "MEDIUM" | "HIGH")}
                >
                  <SelectTrigger id="finding-severity">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="finding-owner">Owner (optional)</Label>
              <Input
                id="finding-owner"
                value={owner}
                onChange={(event) => setOwner(event.target.value)}
                placeholder="e.g. Security Operations"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="finding-recommendation">Recommendation</Label>
              <Textarea
                id="finding-recommendation"
                rows={3}
                value={recommendation}
                onChange={(event) => setRecommendation(event.target.value)}
                placeholder="Describe the remediation steps required to resolve this finding."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="finding-details">Details (optional)</Label>
              <Textarea
                id="finding-details"
                rows={3}
                value={details}
                onChange={(event) => setDetails(event.target.value)}
                placeholder="Additional context for auditors/reviewers (demo data)."
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create Finding"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

