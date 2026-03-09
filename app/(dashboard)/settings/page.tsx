import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageCallout, PageHero, PageStack } from "@/components/compliance/page-chrome";
import { Settings, Users } from "lucide-react";

export default function SettingsPage() {
  return (
    <PageStack>
      <PageHero
        badge="Workspace configuration"
        badgeIcon={Settings}
        title="Settings"
        description="Configure your compliance workspace and platform behavior."
        chips={[
          { label: "Demo mode", tone: "warning" },
          { label: "Auth not configured" },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Settings className="size-5" />
              General
            </CardTitle>
            <CardDescription>
              No authentication configured. This is a demo app.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            Branding, notification preferences, and tenant-scoped settings should live here.
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Users className="size-5" />
              Access & Roles
            </CardTitle>
            <CardDescription>
              Customer/vendor role management will be added after auth + RBAC implementation.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            Planned roles: Customer Admin, Auditor/Reviewer, Vendor Admin, Contributor, Read-only.
          </CardContent>
        </Card>
      </div>

      <PageCallout tone="info">
        Next product-ready milestone for this page: add SSO/auth, memberships, role assignments,
        and audit logging configuration.
      </PageCallout>
    </PageStack>
  );
}
