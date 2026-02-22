"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Plus } from "lucide-react";
import { createEvidence } from "@/app/actions/evidence";

interface AddEvidenceDialogProps {
  controls: { id: string; code: string; title: string; frameworkName: string }[];
  trigger?: React.ReactNode;
}

export function AddEvidenceDialog({
  controls,
  trigger,
}: AddEvidenceDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [controlId, setControlId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !controlId) {
      toast.error("Please fill in title and select a control");
      return;
    }
    setIsLoading(true);
    try {
      await createEvidence({
        title: title.trim(),
        url: url.trim() || null,
        controlId,
      });
      toast.success("Evidence added successfully");
      setOpen(false);
      setTitle("");
      setUrl("");
      setControlId("");
    } catch {
      toast.error("Failed to add evidence");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus className="mr-2 size-4" />
            Add Evidence
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Evidence</DialogTitle>
            <DialogDescription>
              Attach evidence to a control to support compliance.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="e.g. Policy Document v2.1"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">URL (optional)</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="control">Control</Label>
              <Select value={controlId} onValueChange={setControlId} required>
                <SelectTrigger id="control">
                  <SelectValue placeholder="Select control" />
                </SelectTrigger>
                <SelectContent>
                  {controls.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.code} — {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Adding…" : "Add Evidence"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
