import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Gauge, CheckCircle2, XCircle, Percent } from "lucide-react";

const iconMap = {
  total: Gauge,
  implemented: CheckCircle2,
  missing: XCircle,
  compliance: Percent,
};

export type KPIData = {
  totalControls: number;
  implementedControls: number;
  missingControls: number;
  compliancePercentage: number;
};

export function KPICards({ data }: { data: KPIData }) {
  const cards = [
    {
      key: "total",
      label: "Total Controls",
      value: data.totalControls,
      icon: iconMap.total,
      className: "",
    },
    {
      key: "implemented",
      label: "Implemented Controls",
      value: data.implementedControls,
      icon: iconMap.implemented,
      className: "border-emerald-200 bg-emerald-50/50",
    },
    {
      key: "missing",
      label: "Missing Controls",
      value: data.missingControls,
      icon: iconMap.missing,
      className: "border-amber-200 bg-amber-50/50",
    },
    {
      key: "compliance",
      label: "Compliance Percentage",
      value: `${data.compliancePercentage.toFixed(1)}%`,
      icon: iconMap.compliance,
      className:
        data.compliancePercentage >= 80
          ? "border-emerald-300 bg-emerald-50"
          : data.compliancePercentage >= 50
            ? "border-amber-200 bg-amber-50/30"
            : "border-slate-200",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const isCompliance = card.key === "compliance";
        const isGood = isCompliance && data.compliancePercentage >= 80;
        const isWarning = isCompliance && data.compliancePercentage >= 50 && data.compliancePercentage < 80;
        return (
          <Card
            key={card.key}
            className={`overflow-hidden border shadow-sm transition-all duration-200 hover:shadow-md ${card.className}`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                {card.label}
              </CardTitle>
              <Icon
                className={`size-5 ${
                  isGood
                    ? "text-emerald-600"
                    : isWarning
                      ? "text-amber-600"
                      : "text-slate-400"
                }`}
              />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold tracking-tight ${
                  isGood
                    ? "text-emerald-700"
                    : isWarning
                      ? "text-amber-700"
                      : "text-slate-900"
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
