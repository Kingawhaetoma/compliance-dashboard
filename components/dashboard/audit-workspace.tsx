import Link from "next/link";
import { ArrowUpRight, ClipboardCheck, FileCheck2, FileEdit } from "lucide-react";

import { RiskBadge, StatusBadge } from "@/components/compliance/dashboard-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/compliance-dashboard";

type RecentEvidenceItem = {
  id: string;
  title: string;
  organizationName: string;
  controlCode: string;
  frameworkKey: string;
  reviewStatus?: string | null;
  updatedAt: Date;
  sourceLabel: string;
};

type RecentAssessmentItem = {
  id: string;
  name: string;
  organizationName: string;
  customerName?: string | null;
  status: string;
  updatedAt: Date;
  progressPercent: number;
};

type RecentControlUpdateItem = {
  id: string;
  controlCode: string;
  controlTitle: string;
  frameworkKey: string;
  organizationName: string;
  status: string;
  risk?: string | null;
  updatedAt: Date;
  reviewStatus?: string | null;
};

function EmptyListState({ label }: { label: string }) {
  return <p className="px-5 py-6 text-sm text-muted-foreground">{label}</p>;
}

function WorkspaceColumn({
  title,
  description,
  icon: Icon,
  actionHref,
  actionLabel,
  children,
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  actionHref: string;
  actionLabel: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base text-foreground">
              <Icon className="size-4 text-muted-foreground" />
              {title}
            </CardTitle>
            <CardDescription className="mt-1 text-xs text-muted-foreground">
              {description}
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild className="h-8 px-2 text-xs">
            <Link href={actionHref}>
              {actionLabel}
              <ArrowUpRight className="size-3.5" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-0 pb-0">{children}</CardContent>
    </Card>
  );
}

export function AuditWorkspace({
  recentEvidence,
  recentAssessments,
  recentControlUpdates,
}: {
  recentEvidence: RecentEvidenceItem[];
  recentAssessments: RecentAssessmentItem[];
  recentControlUpdates: RecentControlUpdateItem[];
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Audit Workspace
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Recent activity across evidence collection, assessments, and control updates.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <WorkspaceColumn
          title="Recent Evidence"
          description="Latest submitted or linked evidence items"
          icon={FileCheck2}
          actionHref="/evidence"
          actionLabel="Evidence"
        >
          {recentEvidence.length === 0 ? (
            <EmptyListState label="No recent evidence items found." />
          ) : (
            <div className="divide-y divide-border">
              {recentEvidence.map((item) => (
                <div key={item.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {item.title}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.organizationName} · {item.frameworkKey} · {item.controlCode}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[11px]">
                      {item.sourceLabel}
                    </Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {item.reviewStatus ? <StatusBadge status={item.reviewStatus} /> : null}
                    <span className="text-xs text-muted-foreground">
                      Updated {formatDate(item.updatedAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </WorkspaceColumn>

        <WorkspaceColumn
          title="Recent Assessments"
          description="Recently updated audit assessments and review progress"
          icon={ClipboardCheck}
          actionHref="/assessments"
          actionLabel="Assessments"
        >
          {recentAssessments.length === 0 ? (
            <EmptyListState label="No recent assessments found." />
          ) : (
            <div className="divide-y divide-border">
              {recentAssessments.map((item) => (
                <div key={item.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.organizationName}
                        {item.customerName ? ` · Customer: ${item.customerName}` : ""}
                      </p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500"
                        style={{ width: `${Math.max(0, Math.min(100, item.progressPercent))}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium tabular-nums text-muted-foreground">
                      {Math.round(item.progressPercent)}%
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Updated {formatDate(item.updatedAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </WorkspaceColumn>

        <WorkspaceColumn
          title="Recent Control Updates"
          description="Most recent control response and remediation status changes"
          icon={FileEdit}
          actionHref="/controls"
          actionLabel="Controls"
        >
          {recentControlUpdates.length === 0 ? (
            <EmptyListState label="No recent control updates found." />
          ) : (
            <div className="divide-y divide-border">
              {recentControlUpdates.map((item) => (
                <div key={item.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        <span className="font-mono text-xs">{item.controlCode}</span>{" "}
                        {item.controlTitle}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.organizationName} · {item.frameworkKey}
                      </p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <RiskBadge risk={item.risk} />
                    {item.reviewStatus ? <StatusBadge status={item.reviewStatus} /> : null}
                    <span className="text-xs text-muted-foreground">
                      Updated {formatDate(item.updatedAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </WorkspaceColumn>
      </div>
    </section>
  );
}

