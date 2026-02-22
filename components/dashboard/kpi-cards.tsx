import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Building2, Shield, ClipboardList, Percent } from "lucide-react";

const iconMap = {
  orgs: Building2,
  frameworks: Shield,
  controls: ClipboardList,
  implemented: Percent,
};

export type KPIData = {
  orgs: number;
  frameworks: number;
  controls: number;
  implementedPercent: number;
};

export function KPICards({ data }: { data: KPIData }) {
  const cards = [
    { key: "orgs", label: "Organizations", value: data.orgs, icon: iconMap.orgs },
    {
      key: "frameworks",
      label: "Frameworks",
      value: data.frameworks,
      icon: iconMap.frameworks,
    },
    {
      key: "controls",
      label: "Controls",
      value: data.controls,
      icon: iconMap.controls,
    },
    {
      key: "implemented",
      label: "% Implemented",
      value: `${data.implementedPercent.toFixed(1)}%`,
      icon: iconMap.implemented,
      highlight: data.implementedPercent >= 75,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card
            key={card.key}
            className={
              card.highlight
                ? "border-emerald-500/30 bg-emerald-500/5"
                : undefined
            }
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.label}
              </CardTitle>
              <Icon
                className={`size-5 text-muted-foreground ${
                  card.highlight ? "text-emerald-600" : ""
                }`}
              />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  card.highlight ? "text-emerald-600" : ""
                }`}
              >
                {card.value}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
