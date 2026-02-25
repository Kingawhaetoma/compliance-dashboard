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
import { Textarea } from "@/components/ui/textarea";
import { Plus, Upload, Link2 } from "lucide-react";
import { createEvidenceAttachment } from "@/app/actions/evidence";

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
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [sourceType, setSourceType] = useState<"URL" | "FILE">("URL");
  const [status, setStatus] = useState<
    "COLLECTED" | "PENDING_REVIEW" | "APPROVED" | "REJECTED"
  >("COLLECTED");
  const [controlId, setControlId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !controlId) {
      toast.error("Please fill in title and select a control");
      return;
    }
    if (sourceType === "URL" && !url.trim()) {
      toast.error("Enter a URL or switch to file upload");
      return;
    }
    if (sourceType === "FILE" && !file) {
      toast.error("Choose a PDF, PNG, or JPG file");
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.set("title", title.trim());
      formData.set("description", description.trim());
      formData.set("controlId", controlId);
      formData.set("sourceType", sourceType);
      formData.set("status", status);
      if (sourceType === "URL") {
        formData.set("url", url.trim());
      } else if (file) {
        formData.set("file", file);
      }

      const result = await createEvidenceAttachment(formData);
      toast.success("Evidence added successfully");
      if (result.sourceType === "FILE") {
        toast.message("File metadata stored and uploaded to demo local storage");
      }
      setOpen(false);
      setTitle("");
      setDescription("");
      setUrl("");
      setControlId("");
      setSourceType("URL");
      setStatus("COLLECTED");
      setFile(null);
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
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Short note describing what this evidence demonstrates"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sourceType">Evidence Type</Label>
              <Select
                value={sourceType}
                onValueChange={(value) => setSourceType(value as "URL" | "FILE")}
              >
                <SelectTrigger id="sourceType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="URL">
                    <span className="inline-flex items-center gap-2">
                      <Link2 className="size-4" />
                      URL Link
                    </span>
                  </SelectItem>
                  <SelectItem value="FILE">
                    <span className="inline-flex items-center gap-2">
                      <Upload className="size-4" />
                      File Upload
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {sourceType === "URL" ? (
              <div className="space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="file">Upload File (PDF/PNG/JPG)</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                <p className="text-xs text-muted-foreground">
                  Max file size: 10MB. Stored in local demo uploads for this environment.
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="evidenceStatus">Status</Label>
              <Select
                value={status}
                onValueChange={(value) =>
                  setStatus(
                    value as "COLLECTED" | "PENDING_REVIEW" | "APPROVED" | "REJECTED"
                  )
                }
              >
                <SelectTrigger id="evidenceStatus">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COLLECTED">Collected</SelectItem>
                  <SelectItem value="PENDING_REVIEW">Pending Review</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
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
