"use client";

import { Menu, Bell, Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSidebar } from "./app-shell";

function getWorkspaceLabel(pathname: string) {
  if (pathname.startsWith("/customer")) return "Customer Audits";
  if (pathname.startsWith("/vendor")) return "Vendor Workspace";
  if (pathname.startsWith("/audits")) return "Audit Setup";
  if (pathname.startsWith("/assessments")) return "Assessments";
  if (pathname.startsWith("/frameworks")) return "Framework Library";
  if (pathname.startsWith("/controls")) return "Control Library";
  if (pathname.startsWith("/evidence")) return "Evidence Center";
  if (pathname.startsWith("/security")) return "Security";
  if (pathname.startsWith("/settings")) return "Settings";
  return "Dashboard";
}

export function Header({ title }: { title?: string }) {
  const { toggleSidebar } = useSidebar();
  const pathname = usePathname();
  const workspaceLabel = title ?? getWorkspaceLabel(pathname);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 lg:hidden text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          onClick={toggleSidebar}
          aria-label="Open sidebar"
        >
          <Menu className="size-5" />
        </Button>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
            Compliance OS
          </p>
          <p className="truncate text-sm font-semibold tracking-tight text-slate-900 sm:text-base">
            {workspaceLabel}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search..."
            className="h-9 w-40 rounded-lg border-slate-200 bg-slate-50 pl-9 text-sm lg:w-56"
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        >
          <Bell className="size-5" />
          <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-emerald-500" />
        </Button>
      </div>
    </header>
  );
}
