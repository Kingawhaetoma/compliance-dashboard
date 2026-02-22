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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { createControl } from "@/app/actions/control";

interface AddControlDialogProps {
  frameworks: { id: string; name: string; key: string }[];
  trigger?: React.ReactNode;
}

export function AddControlDialog({
  frameworks,
  trigger,
}: AddControlDialogProps) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [domain, setDomain] = useState("");
  const [frameworkId, setFrameworkId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || !title.trim() || !frameworkId) {
      toast.error("Please fill in code, title, and select a framework");
      return;
    }
    setIsLoading(true);
    try {
      await createControl({
        code: code.trim(),
        title: title.trim(),
        description: description.trim() || null,
        domain: domain.trim() || null,
        frameworkId,
      });
      toast.success("Control added successfully");
      setOpen(false);
      setCode("");
      setTitle("");
      setDescription("");
      setDomain("");
      setFrameworkId("");
    } catch {
      toast.error("Failed to add control");
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
            Add Control
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Control</DialogTitle>
            <DialogDescription>
              Add a new control to your framework.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="framework">Framework</Label>
              <Select
                value={frameworkId}
                onValueChange={setFrameworkId}
                required
              >
                <SelectTrigger id="framework">
                  <SelectValue placeholder="Select framework" />
                </SelectTrigger>
                <SelectContent>
                  {frameworks.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name} ({f.key})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Control Code</Label>
              <Input
                id="code"
                placeholder="e.g. 164.310(d)(1)"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="e.g. Device and Media Controls"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="domain">Domain (optional)</Label>
              <Input
                id="domain"
                placeholder="e.g. Physical Safeguards"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Control description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
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
              {isLoading ? "Adding…" : "Add Control"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
