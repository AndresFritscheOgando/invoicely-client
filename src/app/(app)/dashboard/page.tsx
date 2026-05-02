"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { DashboardStats } from "@/types";
import { FileText, Clock, AlertTriangle, CheckCircle, DollarSign } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const PIE_COLORS: Record<string, string> = {
  Draft: "var(--color-chart-5)",
  Submitted: "var(--color-chart-2)",
  Approved: "var(--color-chart-3)",
  Rejected: "var(--color-chart-5)",
  Cancelled: "var(--color-muted-foreground)",
};

const METRIC_STYLES = [
  { icon: FileText, bg: "bg-blue-50", iconColor: "text-blue-600", accent: "border-t-blue-400" },
  { icon: Clock, bg: "bg-amber-50", iconColor: "text-amber-600", accent: "border-t-amber-400" },
  { icon: AlertTriangle, bg: "bg-red-50", iconColor: "text-red-600", accent: "border-t-red-400" },
  { icon: CheckCircle, bg: "bg-emerald-50", iconColor: "text-emerald-600", accent: "border-t-emerald-400" },
  { icon: DollarSign, bg: "bg-purple-50", iconColor: "text-purple-600", accent: "border-t-purple-400" },
];

function MetricCard({
  title,
  value,
  bg,
  iconColor,
  accent,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  bg: string;
  iconColor: string;
  accent: string;
  icon: React.ElementType;
}) {
  return (
    <div className={`bg-card rounded-xl border border-border border-t-2 ${accent} p-5 flex items-center gap-4`}>
      <div className={`p-3 rounded-xl ${bg} shrink-0`}>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground">{title}</p>
        <p className="text-3xl font-bold text-foreground leading-none mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <h2 className="text-sm font-semibold text-foreground mb-4">{title}</h2>
      {children}
    </div>
  );
}

function formatMonth(ym: string) {
  const [year, month] = ym.split("-");
  return new Date(Number(year), Number(month) - 1).toLocaleString("default", {
    month: "short",
    year: "2-digit",
  });
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => api.get<DashboardStats>("/dashboard/stats").then((r) => r.data),
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-28 bg-muted rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="h-64 bg-muted rounded-xl lg:col-span-2" />
            <div className="h-64 bg-muted rounded-xl" />
          </div>
          <div className="h-48 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  const pieData = (stats?.statusBreakdown ?? []).filter((s) => s.count > 0);
  const monthlyData = (stats?.monthlySpend ?? []).map((m) => ({
    ...m,
    label: formatMonth(m.month),
  }));

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Overview of your invoice activity</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {[
          { title: "Total Invoices", value: stats?.totalInvoices ?? 0 },
          { title: "Pending Approval", value: stats?.pendingApproval ?? 0 },
          { title: "Overdue", value: stats?.overdueInvoices ?? 0 },
          { title: "Paid This Month", value: stats?.paidThisMonth ?? 0 },
          { title: "Outstanding", value: `$${(stats?.totalOutstanding ?? 0).toLocaleString()}` },
        ].map((metric, i) => (
          <MetricCard
            key={metric.title}
            title={metric.title}
            value={metric.value}
            icon={METRIC_STYLES[i].icon}
            bg={METRIC_STYLES[i].bg}
            iconColor={METRIC_STYLES[i].iconColor}
            accent={METRIC_STYLES[i].accent}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard title="Monthly Spend (Last 6 Months)">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => [`$${Number(v).toLocaleString()}`, "Amount"]} />
              <Bar dataKey="amount" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Invoice Status Breakdown">
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">
              No invoices yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="45%"
                  outerRadius={70}
                >
                  {pieData.map((entry) => (
                    <Cell
                      key={entry.status}
                      fill={PIE_COLORS[entry.status] ?? "var(--color-muted-foreground)"}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [Number(v), "Invoices"]} />
                <Legend iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <ChartCard title="Top Vendors by Invoice Amount">
        {(stats?.topVendors ?? []).length === 0 ? (
          <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
            No vendor data yet
          </div>
        ) : (
          <div className="space-y-3">
            {stats!.topVendors.map((v, i) => {
              const max = stats!.topVendors[0].totalAmount;
              const pct = max > 0 ? (v.totalAmount / max) * 100 : 0;
              const opacity = [100, 85, 70, 55, 40][i] ?? 40;
              return (
                <div key={v.vendorName} className="flex items-center gap-4">
                  <span className="text-sm font-medium text-muted-foreground w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-foreground truncate">{v.vendorName}</span>
                      <span className="text-sm text-muted-foreground ml-2 shrink-0">
                        ${v.totalAmount.toLocaleString()} · {v.invoiceCount} inv
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${pct}%`, opacity: opacity / 100 }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ChartCard>
    </div>
  );
}
