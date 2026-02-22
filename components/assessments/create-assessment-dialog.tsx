"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { createAssessment } from "@/app/actions/assessment";

interface CreateAssessmentDialogProps {
  organizations: { id: string; name: string }[];
  trigger?: React.ReactNode;
}

export function CreateAssessmentDialog({
  organizations,
  trigger,
}: CreateAssessmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !organizationId) {
      toast.error("Please fill in all fields");
      return;
    }
    setIsLoading(true);
    try {
      const { id } = await createAssessment({ name: name.trim(), organizationId });
      toast.success("Assessment created successfully");
      setOpen(false);
      setName("");
      setOrganizationId("");
      router.push(`/assessments/${id}`);
    } catch {
      toast.error("Failed to create assessment");
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
            Create Assessment
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Assessment</DialogTitle>
            <DialogDescription>
              Start a new compliance assessment for your organization.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Assessment Name</Label>
              <Input
                id="name"
                placeholder="e.g. SOC 2 Q1 2025"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organization">Organization</Label>
              <Select
                value={organizationId}
                onValueChange={setOrganizationId}
                required
              >
                <SelectTrigger id="organization">
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
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
              {isLoading ? "Creating…" : "Create Assessment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
