import { Activity } from "lucide-react";

import { formatDate } from "@/lib/compliance-dashboard";
import { formatAuditActionLabel } from "@/lib/audit-activity";
import { SectionCard } from "@/components/compliance/dashboard-ui";
import { Badge } from "@/components/ui/badge";

type ActivityItem = {
  id: string;
  action: string;
  message: string;
  actor: string | null;
  createdAt: Date;
  controlCode: string | null;
  evidenceTitle: string | null;
  findingTitle: string | null;
};

export function RecentAuditActivity({
  items,
}: {
  items: ActivityItem[];
}) {
  return (
    <SectionCard
      title="Recent Audit Activity"
      description="Latest audit actions recorded for the active demo organization"
      right={
        <Badge variant="outline" className="gap-1">
          <Activity className="size-3.5" />
          {items.length} events
        </Badge>
      }
    >
      {items.length === 0 ? (
        <div className="px-6 py-8 text-sm text-slate-500">
          No audit activity has been recorded yet.
        </div>
      ) : (
        <div className="divide-y divide-slate-200">
          {items.map((item) => (
            <div key={item.id} className="px-6 py-4">
                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="text-[11px]">
                      {formatAuditActionLabel(item.action)}
                    </Badge>
                    <span className="text-xs text-slate-500">{formatDate(item.createdAt)}</span>
                {item.actor ? (
                  <span className="text-xs text-slate-500">· {item.actor}</span>
                ) : null}
              </div>
              <p className="mt-2 text-sm text-slate-700">{item.message}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {item.controlCode ? (
                  <Badge variant="secondary" className="text-[11px]">
                    Control {item.controlCode}
                  </Badge>
                ) : null}
                {item.findingTitle ? (
                  <Badge variant="outline" className="text-[11px]">
                    Finding: {item.findingTitle}
                  </Badge>
                ) : null}
                {item.evidenceTitle ? (
                  <Badge variant="outline" className="text-[11px]">
                    Evidence: {item.evidenceTitle}
                  </Badge>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
