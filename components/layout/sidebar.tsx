"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardCheck,
  Shield,
  Gauge,
  FileCheck,
  X,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useSidebar } from "./app-shell";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/frameworks", label: "Frameworks", icon: Shield },
  { href: "/controls", label: "Controls", icon: Gauge },
  { href: "/assessments", label: "Assessments", icon: ClipboardCheck },
  { href: "/evidence", label: "Evidence", icon: FileCheck },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen, sidebarCollapsed, toggleSidebarCollapsed } =
    useSidebar();

  const handleNavClick = () => {
    setSidebarOpen(false);
  };

  const NavLink = ({
    href,
    label,
    icon: Icon,
    isActive,
  }: {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    isActive: boolean;
  }) => {
    const content = (
      <Link
        href={href}
        onClick={handleNavClick}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
          isActive
            ? "bg-slate-100 text-slate-900"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
          sidebarCollapsed && "justify-center px-2"
        )}
      >
        <Icon className="size-[18px] shrink-0" />
        {!sidebarCollapsed && <span>{label}</span>}
      </Link>
    );

    if (sidebarCollapsed) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>{content}</TooltipTrigger>
            <TooltipContent side="right" className="font-medium">
              {label}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    return content;
  };

  return (
    <>
      {/* Mobile backdrop */}
      <div
        aria-hidden="true"
        className={cn(
          "fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-full flex-col border-r border-sidebar-border bg-white shadow-lg transition-all duration-300 ease-in-out lg:relative lg:shadow-sm",
          "w-60",
          sidebarCollapsed && "lg:w-[72px]",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div
          className={cn(
            "flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border px-3 transition-all duration-300",
            sidebarCollapsed && "justify-center px-0"
          )}
        >
          <div className="flex min-w-0 flex-1 items-center gap-2.5 lg:min-w-0">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Shield className="size-5" />
            </div>
            {!sidebarCollapsed && (
              <span className="truncate text-base font-semibold tracking-tight text-slate-900">
                GRC Platform
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 lg:hidden text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="size-5" />
          </Button>
        </div>
        <nav className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-0.5 overflow-y-auto p-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={Icon}
                  isActive={isActive}
                />
              );
            })}
          </div>
          <div className="hidden shrink-0 border-t border-sidebar-border p-2 lg:block">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "w-full justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                      sidebarCollapsed && "px-0"
                    )}
                    onClick={toggleSidebarCollapsed}
                    aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                  >
                    {sidebarCollapsed ? (
                      <PanelLeft className="size-4" />
                    ) : (
                      <>
                        <PanelLeftClose className="mr-2 size-4" />
                        Collapse
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  {sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </nav>
      </aside>
    </>
  );
}
