"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { DashboardStats } from "@/types";
import { FileText, Clock, AlertTriangle, CheckCircle, DollarSign } from "lucide-react";

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

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => api.get<DashboardStats>("/dashboard/stats").then((r) => r.data),
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-28 bg-gray-200 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

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
    </div>
  );
}
