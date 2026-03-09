"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type FrameworkChartDatum = {
  key: string;
  name: string;
  percent: number;
  implementedCount: number;
  totalControls: number;
};

type TrendDatum = {
  month: string;
  label: string;
  compliance: number;
  target?: number;
};

type ComplianceOverviewChartsProps = {
  compliancePercentage: number;
  totalControls: number;
  implementedControls: number;
  missingControls: number;
  frameworks: FrameworkChartDatum[];
  trend: TrendDatum[];
};

type TooltipPayload = {
  name?: string;
  value?: number;
  payload?: Record<string, unknown>;
};

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function ChartShell({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("border-border bg-card shadow-sm", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-foreground">{title}</CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function EmptyChartState({ label }: { label: string }) {
  return (
    <div className="grid h-[240px] place-items-center rounded-xl border border-dashed border-border bg-muted/30 text-sm text-muted-foreground">
      {label}
    </div>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
  valueFormatter,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string | number;
  valueFormatter?: (item: TooltipPayload) => { label: string; value: string; meta?: string };
}) {
  if (!active || !payload?.length) return null;

  const item = payload[0] as TooltipPayload;
  const formatted = valueFormatter
    ? valueFormatter(item)
    : {
        label: String(item.name ?? label ?? ""),
        value:
          typeof item.value === "number"
            ? new Intl.NumberFormat("en-US").format(item.value)
            : String(item.value ?? ""),
      };

  return (
    <div className="min-w-[180px] rounded-xl border border-border bg-popover p-3 text-sm text-popover-foreground shadow-lg">
      <div className="font-medium">{formatted.label}</div>
      <div className="mt-1 text-base font-semibold tabular-nums">{formatted.value}</div>
      {formatted.meta ? (
        <div className="mt-1 text-xs text-muted-foreground">{formatted.meta}</div>
      ) : null}
    </div>
  );
}

export function ComplianceOverviewCharts({
  compliancePercentage,
  totalControls,
  implementedControls,
  missingControls,
  frameworks,
  trend,
}: ComplianceOverviewChartsProps) {
  const compliancePct = clampPercent(compliancePercentage);

  const pieData = [
    { name: "Implemented", value: implementedControls, color: "var(--chart-2)" },
    { name: "Missing", value: Math.max(0, missingControls), color: "var(--chart-5)" },
  ].filter((item) => item.value > 0);

  const frameworkBarData = [...frameworks]
    .sort((a, b) => b.percent - a.percent || a.key.localeCompare(b.key))
    .slice(0, 8)
    .map((framework) => ({
      framework: framework.key,
      percent: Math.round(framework.percent),
      implementedCount: framework.implementedCount,
      totalControls: framework.totalControls,
    }));

  return (
    <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
      <ChartShell
        title="Control Implementation Pie Chart"
        description="Implemented vs missing controls across the current compliance library."
        className="xl:col-span-4"
      >
        {totalControls === 0 ? (
          <EmptyChartState label="Add controls to render implementation breakdown." />
        ) : (
          <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-center">
            <div className="relative h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={58}
                    outerRadius={84}
                    paddingAngle={2}
                    stroke="var(--background)"
                    strokeWidth={3}
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={
                      <ChartTooltip
                        valueFormatter={(item) => ({
                          label: String(item.name ?? "Controls"),
                          value: new Intl.NumberFormat("en-US").format(
                            typeof item.value === "number" ? item.value : 0
                          ),
                          meta: `${totalControls} total controls`,
                        })}
                      />
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 grid place-items-center">
                <div className="text-center">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                    Compliance
                  </div>
                  <div className="text-2xl font-bold tracking-tight text-foreground">
                    {compliancePct.toFixed(0)}%
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              {pieData.map((item) => {
                const pct = totalControls > 0 ? (item.value / totalControls) * 100 : 0;
                return (
                  <div
                    key={item.name}
                    className="rounded-xl border border-border bg-card px-3 py-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="size-2.5 rounded-full"
                          style={{ backgroundColor: item.color }}
                          aria-hidden="true"
                        />
                        <span className="text-sm font-medium text-foreground">
                          {item.name}
                        </span>
                      </div>
                      <span className="text-sm font-semibold tabular-nums text-foreground">
                        {item.value}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{pct.toFixed(0)}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </ChartShell>

      <ChartShell
        title="Framework Compliance Bar Chart"
        description="Top framework implementation coverage across the demo compliance program."
        className="xl:col-span-8"
      >
        {frameworkBarData.length === 0 ? (
          <EmptyChartState label="Add frameworks to compare compliance coverage." />
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={frameworkBarData}
                layout="vertical"
                margin={{ top: 8, right: 18, bottom: 8, left: 8 }}
              >
                <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="framework"
                  width={90}
                  tick={{ fill: "var(--foreground)", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "rgba(148, 163, 184, 0.10)" }}
                  content={
                    <ChartTooltip
                      valueFormatter={(item) => {
                        const payload = (item.payload ?? {}) as {
                          framework?: string;
                          percent?: number;
                          implementedCount?: number;
                          totalControls?: number;
                        };
                        return {
                          label: String(payload.framework ?? "Framework"),
                          value: `${Math.round(payload.percent ?? 0)}%`,
                          meta: `${payload.implementedCount ?? 0} / ${payload.totalControls ?? 0} controls implemented`,
                        };
                      }}
                    />
                  }
                />
                <Bar dataKey="percent" fill="var(--chart-1)" radius={[0, 8, 8, 0]} maxBarSize={22}>
                  {frameworkBarData.map((entry) => (
                    <Cell
                      key={entry.framework}
                      fill={entry.percent >= 80 ? "var(--chart-2)" : entry.percent >= 50 ? "var(--chart-1)" : "var(--chart-5)"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartShell>

      <ChartShell
        title="Compliance Trend Line Chart"
        description="Illustrative monthly compliance score trend for the 2026 demo audit period."
        className="xl:col-span-12"
      >
        {trend.length === 0 ? (
          <EmptyChartState label="No trend data available." />
        ) : (
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 8, right: 14, left: 0, bottom: 8 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={
                    <ChartTooltip
                      valueFormatter={(item) => {
                        const payload = (item.payload ?? {}) as {
                          month?: string;
                          compliance?: number;
                          target?: number;
                        };
                        const key = String(item.name ?? "");
                        const rawValue =
                          key === "Target" ? payload.target ?? item.value ?? 0 : payload.compliance ?? item.value ?? 0;
                        return {
                          label: payload.month ?? "Month",
                          value: `${Math.round(typeof rawValue === "number" ? rawValue : 0)}%`,
                          meta: key ? `${key} score` : undefined,
                        };
                      }}
                    />
                  }
                />
                <Legend
                  wrapperStyle={{ fontSize: "12px" }}
                  formatter={(value) => <span className="text-muted-foreground">{value}</span>}
                />
                <Line
                  type="monotone"
                  dataKey="target"
                  name="Target"
                  stroke="var(--chart-4)"
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray="6 6"
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="compliance"
                  name="Compliance"
                  stroke="var(--chart-1)"
                  strokeWidth={3}
                  dot={{ r: 3, fill: "var(--chart-1)", stroke: "var(--background)" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartShell>
    </section>
  );
}
