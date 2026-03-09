"use client";

import { useState, createContext, useContext, useEffect } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

type SidebarContextType = {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebarCollapsed: () => void;
};

const SidebarContext = createContext<SidebarContextType | null>(null);

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within AppShell");
  return ctx;
}

const SIDEBAR_COLLAPSED_KEY = "grc-sidebar-collapsed";

export function AppShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Hydrate collapsed state from localStorage after mount to avoid hydration mismatch
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (stored === null) return;

    const frame = window.requestAnimationFrame(() => {
      setSidebarCollapsed(stored === "true");
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  const toggleSidebarCollapsed = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      }
      return next;
    });
  };

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (sidebarOpen && typeof window !== "undefined") {
      const isMobile = window.innerWidth < 1024;
      if (isMobile) {
        document.body.style.overflow = "hidden";
      }
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  return (
    <SidebarContext.Provider
      value={{
        sidebarOpen,
        setSidebarOpen,
        toggleSidebar: () => setSidebarOpen((prev) => !prev),
        sidebarCollapsed,
        setSidebarCollapsed,
        toggleSidebarCollapsed,
      }}
    >
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Header title={title} />
          <main className="flex-1 overflow-auto bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.06),transparent_40%),radial-gradient(circle_at_top_left,rgba(16,185,129,0.05),transparent_40%),#f8fafc] p-4 sm:p-6 lg:p-8">
            <div className="mx-auto w-full max-w-[1600px]">{children}</div>
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}
