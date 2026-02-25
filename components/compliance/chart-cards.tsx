"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Bar,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type BreakdownDatum = {
  label: string;
  value: number;
  color: string;
};

type BarDatum = {
  label: string;
  value: number;
  color?: string;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function chartValueLabel(value: unknown) {
  if (typeof value !== "number") return String(value ?? "");
  return formatNumber(value);
}

function EmptyChartState({ label }: { label: string }) {
  return (
    <div className="grid h-[220px] place-items-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 text-sm text-slate-500">
      {label}
    </div>
  );
}

export function DonutBreakdownCard({
  title,
  description,
  data,
  centerLabel = "Total",
}: {
  title: string;
  description?: string;
  data: BreakdownDatum[];
  centerLabel?: string;
}) {
  const safeData = data.filter((item) => item.value > 0);
  const total = safeData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-slate-900">{title}</CardTitle>
        {description ? (
          <CardDescription className="text-xs text-slate-500">{description}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-center">
        {safeData.length === 0 ? (
          <div className="lg:col-span-2">
            <EmptyChartState label="No chart data available yet." />
          </div>
        ) : (
          <>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={safeData}
                    dataKey="value"
                    nameKey="label"
                    innerRadius={58}
                    outerRadius={82}
                    stroke="#ffffff"
                    strokeWidth={3}
                    paddingAngle={2}
                  >
                    {safeData.map((entry) => (
                      <Cell key={entry.label} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value) => chartValueLabel(value)}
                    contentStyle={{
                      borderRadius: 10,
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="-mt-[132px] pointer-events-none text-center">
                <div className="text-xs uppercase tracking-[0.08em] text-slate-500">
                  {centerLabel}
                </div>
                <div className="text-2xl font-semibold tracking-tight text-slate-900">
                  {formatNumber(total)}
                </div>
              </div>
            </div>
            <div className="grid gap-2">
              {safeData.map((item) => {
                const percent = total > 0 ? (item.value / total) * 100 : 0;
                return (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="truncate text-sm text-slate-700">{item.label}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold tabular-nums text-slate-900">
                        {formatNumber(item.value)}
                      </div>
                      <div className="text-[11px] text-slate-500">{percent.toFixed(0)}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function HorizontalBarChartCard({
  title,
  description,
  data,
  maxItems = 6,
  valueSuffix,
}: {
  title: string;
  description?: string;
  data: BarDatum[];
  maxItems?: number;
  valueSuffix?: string;
}) {
  const safeData = [...data]
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, maxItems);

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-slate-900">{title}</CardTitle>
        {description ? (
          <CardDescription className="text-xs text-slate-500">{description}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent>
        {safeData.length === 0 ? (
          <EmptyChartState label="No chart data available yet." />
        ) : (
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={safeData}
                layout="vertical"
                margin={{ top: 4, right: 10, bottom: 4, left: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis
                  type="number"
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={110}
                  tick={{ fill: "#334155", fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value: string) =>
                    value.length > 18 ? `${value.slice(0, 18)}…` : value
                  }
                />
                <RechartsTooltip
                  formatter={(value) =>
                    typeof value === "number"
                      ? `${formatNumber(value)}${valueSuffix ?? ""}`
                      : String(value ?? "")
                  }
                  cursor={{ fill: "rgba(148, 163, 184, 0.08)" }}
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
                  }}
                />
                <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                  {safeData.map((entry) => (
                    <Cell key={entry.label} fill={entry.color ?? "#0f172a"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
