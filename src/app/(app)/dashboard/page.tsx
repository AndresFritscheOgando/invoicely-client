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

const STATUS_COLORS: Record<string, string> = {
  Draft: "#94a3b8",
  Submitted: "#eab308",
  Approved: "#22c55e",
  Rejected: "#ef4444",
  Cancelled: "#6b7280",
};

function MetricCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6 flex items-center gap-4">
      <div className={`p-3 rounded-full ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-4">{title}</h2>
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
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-28 bg-gray-200 rounded-lg" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="h-64 bg-gray-200 rounded-lg lg:col-span-2" />
            <div className="h-64 bg-gray-200 rounded-lg" />
          </div>
          <div className="h-48 bg-gray-200 rounded-lg" />
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
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of your invoice activity</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <MetricCard
          title="Total Invoices"
          value={stats?.totalInvoices ?? 0}
          icon={FileText}
          color="bg-blue-500"
        />
        <MetricCard
          title="Pending Approval"
          value={stats?.pendingApproval ?? 0}
          icon={Clock}
          color="bg-yellow-500"
        />
        <MetricCard
          title="Overdue"
          value={stats?.overdueInvoices ?? 0}
          icon={AlertTriangle}
          color="bg-red-500"
        />
        <MetricCard
          title="Paid This Month"
          value={stats?.paidThisMonth ?? 0}
          icon={CheckCircle}
          color="bg-green-500"
        />
        <MetricCard
          title="Outstanding"
          value={`$${(stats?.totalOutstanding ?? 0).toLocaleString()}`}
          icon={DollarSign}
          color="bg-purple-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard title="Monthly Spend (Last 6 Months)">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => [`$${Number(v).toLocaleString()}`, "Amount"]} />
              <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Invoice Status Breakdown">
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-[220px] text-gray-400 text-sm">
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
                  cy="50%"
                  outerRadius={80}
                  isAnimationActive={false}
                  label={({ name, percent }) =>
                    `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {pieData.map((entry) => (
                    <Cell
                      key={entry.status}
                      fill={STATUS_COLORS[entry.status] ?? "#94a3b8"}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [Number(v), "Invoices"]} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <ChartCard title="Top Vendors by Invoice Amount">
        {(stats?.topVendors ?? []).length === 0 ? (
          <div className="flex items-center justify-center h-24 text-gray-400 text-sm">
            No vendor data yet
          </div>
        ) : (
          <div className="space-y-3">
            {stats!.topVendors.map((v, i) => {
              const max = stats!.topVendors[0].totalAmount;
              const pct = max > 0 ? (v.totalAmount / max) * 100 : 0;
              return (
                <div key={v.vendorName} className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-500 w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900 truncate">{v.vendorName}</span>
                      <span className="text-sm text-gray-500 ml-2 shrink-0">
                        ${v.totalAmount.toLocaleString()} · {v.invoiceCount} inv
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
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
