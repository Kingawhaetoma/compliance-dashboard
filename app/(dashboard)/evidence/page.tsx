import Link from "next/link";
import { cookies } from "next/headers";
import {
  ExternalLink,
  FileCheck2,
  FileImage,
  FileText,
  Link2,
  Shield,
  Upload,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { DEMO_PROFILE_COOKIE, getDemoProfile } from "@/lib/demo-profiles";
import { MetricCard, SectionCard, StatusBadge } from "@/components/compliance/dashboard-ui";
import { PageCallout, PageHero, PageStack } from "@/components/compliance/page-chrome";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { AddEvidenceDialog } from "@/components/evidence/add-evidence-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/compliance-dashboard";

function formatBytes(value: number | null | undefined) {
  if (!value || value <= 0) return "—";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIconForMime(mimeType: string | null | undefined, sourceType: string) {
  if (sourceType === "URL") return Link2;
  if (mimeType?.startsWith("image/")) return FileImage;
  return FileText;
}

type SearchParams = {
  framework?: string;
  status?: string;
};

export default async function EvidencePage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const frameworkFilter = params.framework?.trim() || "all";
  const statusFilter = params.status?.trim() || "all";

  const cookieStore = await cookies();
  const activeProfile = getDemoProfile(cookieStore.get(DEMO_PROFILE_COOKIE)?.value);

  const [frameworks, controls] = await Promise.all([
    prisma.framework.findMany({
      select: { id: true, key: true, name: true },
      orderBy: { key: "asc" },
    }),
    prisma.control.findMany({
      include: { framework: true },
      orderBy: { code: "asc" },
    }),
  ]);

  const evidenceRows = await prisma.evidence.findMany({
    where: {
      ...(frameworkFilter !== "all"
        ? {
            control: {
              framework: {
                key: frameworkFilter,
              },
            },
          }
        : {}),
    },
    include: {
      control: { include: { framework: true } },
    },
    // `updatedAt` exists in newer demo schema revisions, but older generated clients only know `createdAt`.
    // Keep the query compatible and sort in JS using an `updatedAt` fallback when available.
    orderBy: { createdAt: "desc" },
  });

  const evidence = evidenceRows
    .filter((item) => {
      if (statusFilter === "all") return true;
      const rowStatus = item.status ?? "COLLECTED";
      return rowStatus === statusFilter;
    })
    .sort((a, b) => {
      const aTime = (a.updatedAt ?? a.createdAt).getTime();
      const bTime = (b.updatedAt ?? b.createdAt).getTime();
      return bTime - aTime;
    });

  const controlOptions = controls.map((c) => ({
    id: c.id,
    code: c.code,
    title: c.title,
    frameworkName: c.framework.name,
  }));

  const allEvidence = await prisma.evidence.findMany({
    include: { control: true },
  });

  const controlsWithEvidence = new Set(allEvidence.map((item) => item.controlId)).size;
  const linkedUrlCount = allEvidence.filter((item) => (item.sourceType ?? "URL") === "URL").length;
  const fileUploadCount = allEvidence.filter((item) => (item.sourceType ?? "URL") === "FILE").length;

  const statusCounts = {
    collected: allEvidence.filter((item) => (item.status ?? "COLLECTED") === "COLLECTED").length,
    pendingReview: allEvidence.filter((item) => (item.status ?? "COLLECTED") === "PENDING_REVIEW").length,
    approved: allEvidence.filter((item) => (item.status ?? "COLLECTED") === "APPROVED").length,
    rejected: allEvidence.filter((item) => (item.status ?? "COLLECTED") === "REJECTED").length,
  };

  const hasAnyEvidence = allEvidence.length > 0;
  const hasFilteredResults = evidence.length > 0;

  return (
    <PageStack>
      <PageHero
        badge="Evidence module"
        badgeIcon={FileCheck2}
        title="Evidence"
        description="Attach demo evidence artifacts to controls using file uploads or URL links. Filter by framework and evidence status to review coverage quickly."
        chips={[
          { label: `${allEvidence.length} evidence items`, tone: "info" },
          { label: `${controlsWithEvidence} controls covered` },
          { label: activeProfile.organizationName },
        ]}
        actions={
          controlOptions.length > 0 ? (
            <AddEvidenceDialog
              controls={controlOptions}
              trigger={
                <Button size="sm" className="shrink-0">
                  <Upload className="size-4" />
                  Add Evidence
                </Button>
              }
            />
          ) : undefined
        }
      />

      {hasAnyEvidence ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Evidence Items"
            value={allEvidence.length}
            helper="Sample/demo evidence records stored in the evidence module"
            icon={FileText}
            tone="slate"
          />
          <MetricCard
            label="Controls Covered"
            value={controlsWithEvidence}
            helper={`${controls.length} controls available`}
            icon={Shield}
            tone="emerald"
          />
          <MetricCard
            label="URL Links"
            value={linkedUrlCount}
            helper={`${fileUploadCount} local demo file uploads`}
            icon={Link2}
            tone="sky"
          />
          <MetricCard
            label="Pending Review"
            value={statusCounts.pendingReview}
            helper={`${statusCounts.approved} approved · ${statusCounts.rejected} rejected`}
            icon={FileCheck2}
            tone={statusCounts.pendingReview > 0 ? "amber" : "emerald"}
          />
        </div>
      ) : null}

      <SectionCard
        title="Evidence Library"
        description="All data shown is sample/demo evidence for the selected King’s demo organization."
        right={
          <form className="flex flex-wrap items-end gap-2" method="get">
            <label className="grid gap-1 text-xs text-slate-600">
              <span className="font-medium">Framework</span>
              <select
                name="framework"
                defaultValue={frameworkFilter}
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm"
              >
                <option value="all">All Frameworks</option>
                {frameworks.map((framework) => (
                  <option key={framework.id} value={framework.key}>
                    {framework.key}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-xs text-slate-600">
              <span className="font-medium">Status</span>
              <select
                name="status"
                defaultValue={statusFilter}
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm"
              >
                <option value="all">All Statuses</option>
                <option value="COLLECTED">Collected</option>
                <option value="PENDING_REVIEW">Pending Review</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </label>
            <Button type="submit" size="sm" variant="outline">
              Apply
            </Button>
            {(frameworkFilter !== "all" || statusFilter !== "all") && (
              <Button type="button" size="sm" variant="ghost" asChild>
                <Link href="/evidence">Clear</Link>
              </Button>
            )}
          </form>
        }
      >
        {!hasAnyEvidence ? (
          <div className="p-6">
            <EmptyState
              icon={FileText}
              title="No evidence yet"
              description={`Add sample evidence for ${activeProfile.organizationName} to demonstrate audit workflows.`}
              action={
                controlOptions.length > 0 ? (
                  <AddEvidenceDialog controls={controlOptions} trigger={<Button size="sm">Add Evidence</Button>} />
                ) : undefined
              }
              secondaryAction={{ label: "View Controls", href: "/controls" }}
            />
          </div>
        ) : !hasFilteredResults ? (
          <div className="p-6">
            <EmptyState
              icon={FileCheck2}
              title="No evidence matches your filters"
              description="Try a different framework or status filter to see seeded demo evidence."
              secondaryAction={{ label: "Clear filters", href: "/evidence" }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Evidence</TableHead>
                  <TableHead>Control</TableHead>
                  <TableHead>Framework</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Open</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {evidence.map((item) => {
                  const sourceType = item.sourceType ?? "URL";
                  const status = item.status ?? "COLLECTED";
                  const Icon = fileIconForMime(item.mimeType, sourceType);
                  return (
                    <TableRow key={item.id} className="align-top">
                      <TableCell className="min-w-[260px]">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600">
                            <Icon className="size-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-900">{item.title}</p>
                            {item.description ? (
                              <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                                {item.description}
                              </p>
                            ) : null}
                            {sourceType === "FILE" ? (
                              <p className="mt-1 text-xs text-slate-500">
                                {item.fileName ?? "Uploaded file"} · {formatBytes(item.fileSizeBytes)}
                              </p>
                            ) : (
                              <p className="mt-1 truncate text-xs text-slate-500">{item.url ?? "—"}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/controls/${item.controlId}`}
                          className="inline-flex flex-col text-left hover:underline"
                        >
                          <span className="font-mono text-xs text-slate-700">{item.control.code}</span>
                          <span className="max-w-[260px] truncate text-sm text-slate-600">
                            {item.control.title}
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{item.control.framework.key}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {sourceType === "FILE" ? "File Upload" : "URL Link"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={status} />
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {formatDate(item.updatedAt ?? item.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.url ? (
                          <Button size="sm" variant="ghost" asChild>
                            <a href={item.url} target="_blank" rel="noopener noreferrer">
                              Open
                              <ExternalLink className="size-3.5" />
                            </a>
                          </Button>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>

      <PageCallout tone="warning">
        Demo mode only: evidence records on this page are sample data for{" "}
        <strong>{activeProfile.organizationName}</strong>. No real customer documents are stored in this environment.
      </PageCallout>
    </PageStack>
  );
}
