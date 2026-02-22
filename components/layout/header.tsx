"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header({ title }: { title?: string }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-6">
      <h1 className="text-lg font-semibold text-foreground">
        {title ?? "Compliance"}
      </h1>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-5" />
          <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-amber-500" />
        </Button>
      </div>
    </header>
  );
}
