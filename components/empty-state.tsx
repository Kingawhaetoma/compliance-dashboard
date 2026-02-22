import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  secondaryAction?: {
    label: string;
    href: string;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <Card
      className={`flex flex-col items-center justify-center border-slate-200 py-16 text-center ${className ?? ""}`}
    >
      <CardHeader>
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-slate-100">
          <Icon className="size-8 text-slate-400" />
        </div>
        <CardTitle className="text-lg font-semibold text-slate-700">
          {title}
        </CardTitle>
        <CardDescription className="mx-auto mt-1 max-w-sm text-slate-500">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-3 sm:flex-row">
        {action}
        {secondaryAction && (
          <Button variant="outline" size="sm" asChild>
            <a href={secondaryAction.href}>{secondaryAction.label}</a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
