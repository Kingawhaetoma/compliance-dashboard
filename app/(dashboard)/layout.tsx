import { AppShell } from "@/components/layout/app-shell";
import { DemoEnvironmentBanner } from "@/components/demo/demo-environment-banner";
import { DEMO_PROFILE_COOKIE, getDemoProfile } from "@/lib/demo-profiles";
import { cookies } from "next/headers";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const activeProfile = getDemoProfile(cookieStore.get(DEMO_PROFILE_COOKIE)?.value);

  return (
    <AppShell>
      <div className="space-y-6 sm:space-y-8">
        <DemoEnvironmentBanner
          activeProfileId={activeProfile.id}
          activeOrganizationName={activeProfile.organizationName}
        />
        {children}
      </div>
    </AppShell>
  );
}
