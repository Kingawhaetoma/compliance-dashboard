"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, ClipboardPlus, Rocket, ShieldCheck } from "lucide-react";

import { createAuditWorkflow } from "@/app/actions/audit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type OrganizationOption = {
  id: string;
  name: string;
};

type FrameworkOption = {
  id: string;
  key: string;
  name: string;
  version: string | null;
  controlCount: number;
};

function dateInputValue(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function addDaysDateInput(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return dateInputValue(date);
}

export function CreateAuditWorkflowForm({
  organizations,
  frameworks,
}: {
  organizations: OrganizationOption[];
  frameworks: FrameworkOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [customerOrgName, setCustomerOrgName] = useState("");
  const [vendorOrgName, setVendorOrgName] = useState("");
  const [engagementName, setEngagementName] = useState("");
  const [assessmentName, setAssessmentName] = useState("");
  const [startDate, setStartDate] = useState(dateInputValue());
  const [dueDate, setDueDate] = useState(addDaysDateInput(30));
  const [selectedFrameworkIds, setSelectedFrameworkIds] = useState<string[]>([]);

  const selectedFrameworks = useMemo(
    () => frameworks.filter((framework) => selectedFrameworkIds.includes(framework.id)),
    [frameworks, selectedFrameworkIds]
  );

  const estimatedControls = useMemo(
    () => selectedFrameworks.reduce((sum, framework) => sum + framework.controlCount, 0),
    [selectedFrameworks]
  );

  function toggleFramework(frameworkId: string) {
    setSelectedFrameworkIds((prev) =>
      prev.includes(frameworkId)
        ? prev.filter((id) => id !== frameworkId)
        : [...prev, frameworkId]
    );
  }

  function handleUseExample() {
    setCustomerOrgName("Ball State University");
    setVendorOrgName("MediTech Group 3");
    setEngagementName("Ball State Vendor Risk Program");
    setAssessmentName("MediTech HIPAA + NIST 800-171 Audit");

    const preferredFrameworks = frameworks
      .filter((framework) => ["HIPAA", "NIST800171"].includes(framework.key))
      .map((framework) => framework.id);
    setSelectedFrameworkIds(preferredFrameworks);
    setStartDate(dateInputValue());
    setDueDate(addDaysDateInput(45));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!customerOrgName.trim() || !vendorOrgName.trim()) {
      toast.error("Customer and vendor organization names are required");
      return;
    }
    if (selectedFrameworkIds.length === 0) {
      toast.error("Select at least one framework");
      return;
    }

    startTransition(async () => {
      try {
        const result = await createAuditWorkflow({
          customerOrgName,
          vendorOrgName,
          engagementName: engagementName || null,
          assessmentName: assessmentName || null,
          frameworkIds: selectedFrameworkIds,
          startDate,
          dueDate: dueDate || null,
        });

        toast.success(
          `Audit created: ${result.generatedControlCount} controls generated across ${result.frameworks.length} framework(s)`
        );

        router.push(`/assessments/${result.assessmentId}?created=1&from=wizard`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to create audit");
      }
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg text-slate-900">New Audit Wizard</CardTitle>
              <CardDescription>
                Create a client/vendor audit engagement, choose frameworks, and auto-generate the audit scope.
              </CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={handleUseExample}>
              Use Example
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="grid size-6 place-items-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                  1
                </span>
                <h3 className="font-semibold text-slate-900">Who is involved?</h3>
              </div>
              <p className="text-sm text-slate-500">
                Enter the customer (auditor/procurement team) and the vendor (organization being assessed).
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="customerOrgName">Customer Organization</Label>
                  <Input
                    id="customerOrgName"
                    list="org-suggestions"
                    placeholder="e.g. Ball State University"
                    value={customerOrgName}
                    onChange={(event) => setCustomerOrgName(event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vendorOrgName">Vendor Organization</Label>
                  <Input
                    id="vendorOrgName"
                    list="org-suggestions"
                    placeholder="e.g. MediTech Group 3"
                    value={vendorOrgName}
                    onChange={(event) => setVendorOrgName(event.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="engagementName">Engagement Name (optional)</Label>
                  <Input
                    id="engagementName"
                    placeholder="e.g. Vendor Risk Program 2026"
                    value={engagementName}
                    onChange={(event) => setEngagementName(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assessmentName">Assessment Name (optional)</Label>
                  <Input
                    id="assessmentName"
                    placeholder="Auto-generated if blank"
                    value={assessmentName}
                    onChange={(event) => setAssessmentName(event.target.value)}
                  />
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="grid size-6 place-items-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                  2
                </span>
                <h3 className="font-semibold text-slate-900">Choose frameworks</h3>
              </div>
              <p className="text-sm text-slate-500">
                Select one or more compliance frameworks. The wizard will generate all matching controls into the audit scope.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {frameworks.map((framework) => {
                  const selected = selectedFrameworkIds.includes(framework.id);
                  return (
                    <label
                      key={framework.id}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors",
                        selected
                          ? "border-slate-900 bg-slate-50"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      )}
                    >
                      <input
                        type="checkbox"
                        className="mt-1 size-4 accent-slate-900"
                        checked={selected}
                        onChange={() => toggleFramework(framework.id)}
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900">{framework.name}</p>
                        <p className="text-xs text-slate-500">
                          {framework.key}
                          {framework.version ? ` · ${framework.version}` : ""} · {framework.controlCount} controls
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="grid size-6 place-items-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                  3
                </span>
                <h3 className="font-semibold text-slate-900">Set timeline</h3>
              </div>
              <p className="text-sm text-slate-500">
                Set the audit start date and due date. New control responses and findings will inherit the due date.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date (optional)</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(event) => setDueDate(event.target.value)}
                  />
                </div>
              </div>
            </section>

            <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">Scope preview</p>
                <p className="text-sm text-slate-500">
                  {selectedFrameworks.length} framework{selectedFrameworks.length === 1 ? "" : "s"} selected · approximately{" "}
                  {estimatedControls} control response{estimatedControls === 1 ? "" : "s"} will be generated
                </p>
              </div>
              <Button type="submit" disabled={isPending}>
                <ClipboardPlus className="size-4" />
                {isPending ? "Creating Audit..." : "Create Audit & Generate Scope"}
              </Button>
            </div>
          </form>
          <datalist id="org-suggestions">
            {organizations.map((org) => (
              <option key={org.id} value={org.name} />
            ))}
          </datalist>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-slate-900">How The Workflow Works</CardTitle>
            <CardDescription>
              This is the intended operating flow for customer-ready audits.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex gap-3">
              <Rocket className="mt-0.5 size-4 shrink-0 text-slate-500" />
              <div>
                <p className="font-medium text-slate-900">Start audit</p>
                <p className="text-slate-500">
                  Create customer + vendor engagement, choose framework(s), and generate the audit scope.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-slate-500" />
              <div>
                <p className="font-medium text-slate-900">Vendor completes controls</p>
                <p className="text-slate-500">
                  Use the Vendor Workspace to update control status, attach evidence, and track requests.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-slate-500" />
              <div>
                <p className="font-medium text-slate-900">Customer reviews & exports</p>
                <p className="text-slate-500">
                  Review queue and POA&M items in Customer Dashboard, then export assessment reports.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-slate-900">What gets created</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-600">
            <p>`Organization` records for customer and vendor (created if missing)</p>
            <p>`Engagement` linking the customer and vendor</p>
            <p>`Assessment` tied to the vendor and engagement</p>
            <p>`ControlResponse` rows for selected framework controls</p>
            <p>`Finding` rows (legacy compatibility for current assessment pages)</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

