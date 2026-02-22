import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Settings</h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Configure your compliance workspace
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="size-5" />
            General
          </CardTitle>
          <CardDescription>
            No authentication configured. This is a demo app.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
