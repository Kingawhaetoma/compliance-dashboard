"use client";

import { Menu, Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSidebar } from "./app-shell";

export function Header({ title }: { title?: string }) {
  const { toggleSidebar } = useSidebar();

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
        <h1 className="truncate text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
          {title ?? "GRC Dashboard"}
        </h1>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search..."
            className="h-9 w-36 rounded-lg border-slate-200 pl-9 text-sm lg:w-48"
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
