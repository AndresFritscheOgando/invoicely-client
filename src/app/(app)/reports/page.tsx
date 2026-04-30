"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type {
  ReportSummary,
  InvoiceStatus,
  PaymentStatus,
  Vendor,
  PaginatedResult,
} from "@/types";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  Download,
  FileText,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

const INVOICE_STATUSES: InvoiceStatus[] = [
  "Draft",
  "Submitted",
  "Approved",
  "Rejected",
  "Cancelled",
];

const PAYMENT_STATUSES: PaymentStatus[] = [
  "Unpaid",
  "PartiallyPaid",
  "Paid",
  "Overdue",
];

const STATUS_COLORS: Record<InvoiceStatus, string> = {
  Draft: "bg-gray-100 text-gray-600",
  Submitted: "bg-blue-100 text-blue-700",
  Approved: "bg-green-100 text-green-800",
  Rejected: "bg-red-100 text-red-700",
  Cancelled: "bg-yellow-100 text-yellow-700",
};

const PAYMENT_COLORS: Record<PaymentStatus, string> = {
  Unpaid: "bg-gray-100 text-gray-600",
  PartiallyPaid: "bg-blue-100 text-blue-700",
  Paid: "bg-green-100 text-green-800",
  Overdue: "bg-red-100 text-red-700",
};

function MetricCard({
  title,
  value,
  sub,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-5 flex items-start gap-4">
      <div className={`p-3 rounded-full ${color} shrink-0`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {title}
        </p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-sm font-semibold text-gray-900 mb-4">{title}</h2>
      {children}
    </div>
  );
}

export default function ReportsPage() {
  const { user } = useAuth();

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const vendorsQuery = useQuery({
    queryKey: ["vendors-all"],
    queryFn: () =>
      api
        .get<PaginatedResult<Vendor>>("/vendors", { params: { pageSize: 200 } })
        .then((r) => r.data.items),
  });

  const buildParams = () => ({
    ...(dateFrom && { dateFrom }),
    ...(dateTo && { dateTo }),
    ...(status && { status }),
    ...(paymentStatus && { paymentStatus }),
    ...(vendorId && { vendorId }),
  });

  const reportQuery = useQuery({
    queryKey: ["report-summary", dateFrom, dateTo, status, paymentStatus, vendorId],
    queryFn: () =>
      api
        .get<ReportSummary>("/reports/summary", { params: buildParams() })
        .then((r) => r.data),
    enabled: submitted,
  });

  const handleRun = () => {
    if (submitted) {
      reportQuery.refetch();
    } else {
      setSubmitted(true);
    }
  };

  const handleExportCsv = () => {
    const params = new URLSearchParams(buildParams() as Record<string, string>);
    const token = localStorage.getItem("token");
    const base = process.env.NEXT_PUBLIC_API_URL + "/api";
    const url = `${base}/reports/export/csv?${params.toString()}`;

    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.blob())
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `invoices-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
      });
  };

  const report = reportQuery.data;

  const monthlyChartData =
    report?.byMonth.map((m) => ({
      label: m.month,
      amount: m.totalAmount,
    })) ?? [];

  const vendorChartData =
    report?.byVendor.slice(0, 8).map((v) => ({
      label: v.vendorName.length > 14 ? v.vendorName.slice(0, 13) + "…" : v.vendorName,
      amount: v.totalAmount,
    })) ?? [];

  if (!user || (user.role !== "Admin" && user.role !== "FinanceManager")) {
    return (
      <div className="p-8 text-gray-500">
        Access restricted to Admin and Finance Manager.
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Filter and export invoice data
          </p>
        </div>
        {report && (
          <Button onClick={handleExportCsv} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Filters</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              From
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setSubmitted(false); }}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              To
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setSubmitted(false); }}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Invoice Status
            </label>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setSubmitted(false); }}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              {INVOICE_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Payment Status
            </label>
            <select
              value={paymentStatus}
              onChange={(e) => { setPaymentStatus(e.target.value); setSubmitted(false); }}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              {PAYMENT_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Vendor
            </label>
            <select
              value={vendorId}
              onChange={(e) => { setVendorId(e.target.value); setSubmitted(false); }}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              {(vendorsQuery.data ?? []).map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Button onClick={handleRun} disabled={reportQuery.isFetching}>
            {reportQuery.isFetching ? "Running…" : "Run Report"}
          </Button>
          {submitted && (
            <button
              onClick={() => {
                setDateFrom("");
                setDateTo("");
                setStatus("");
                setPaymentStatus("");
                setVendorId("");
                setSubmitted(false);
              }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {reportQuery.isError && (
        <div className="text-sm text-red-600 bg-red-50 rounded-lg p-4">
          Failed to load report. Please try again.
        </div>
      )}

      {report && (
        <>
          {/* Summary metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              title="Total Invoices"
              value={report.totalCount.toString()}
              sub={`$${report.totalAmount.toLocaleString()}`}
              icon={FileText}
              color="bg-blue-500"
            />
            <MetricCard
              title="Paid"
              value={report.paidCount.toString()}
              sub={`$${report.paidAmount.toLocaleString()}`}
              icon={CheckCircle}
              color="bg-green-500"
            />
            <MetricCard
              title="Unpaid / Partial"
              value={report.unpaidCount.toString()}
              sub={`$${report.unpaidAmount.toLocaleString()}`}
              icon={TrendingUp}
              color="bg-yellow-500"
            />
            <MetricCard
              title="Overdue"
              value={report.overdueCount.toString()}
              sub={`$${report.overdueAmount.toLocaleString()}`}
              icon={AlertTriangle}
              color="bg-red-500"
            />
          </div>

          {/* Charts */}
          {(monthlyChartData.length > 0 || vendorChartData.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {monthlyChartData.length > 0 && (
                <ChartCard title="Spend by Month">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={monthlyChartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v) => [`$${Number(v).toLocaleString()}`, "Amount"]} />
                      <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}
              {vendorChartData.length > 0 && (
                <ChartCard title="Spend by Vendor (top 8)">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={vendorChartData} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                      <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                      <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={90} />
                      <Tooltip formatter={(v) => [`$${Number(v).toLocaleString()}`, "Amount"]} />
                      <Bar dataKey="amount" fill="#8b5cf6" radius={[0, 4, 4, 0]} isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}
            </div>
          )}

          {/* Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">
                Invoices ({report.rows.length})
              </h2>
            </div>
            {report.rows.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                No invoices match the selected filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Invoice #</th>
                      <th className="px-4 py-3 text-left font-medium">Vendor</th>
                      <th className="px-4 py-3 text-left font-medium">Created By</th>
                      <th className="px-4 py-3 text-right font-medium">Amount</th>
                      <th className="px-4 py-3 text-left font-medium">Issue Date</th>
                      <th className="px-4 py-3 text-left font-medium">Due Date</th>
                      <th className="px-4 py-3 text-left font-medium">Status</th>
                      <th className="px-4 py-3 text-left font-medium">Payment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {report.rows.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-gray-700">
                          {row.invoiceNumber}
                        </td>
                        <td className="px-4 py-3 text-gray-900">{row.vendorName}</td>
                        <td className="px-4 py-3 text-gray-500">{row.createdByName}</td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">
                          {row.currency} {row.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-gray-500">{row.issueDate}</td>
                        <td className="px-4 py-3 text-gray-500">{row.dueDate}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[row.status]}`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${PAYMENT_COLORS[row.paymentStatus]}`}>
                            {row.paymentStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {!submitted && (
        <div className="text-center text-gray-400 text-sm py-12">
          Set filters above and click <span className="font-medium text-gray-500">Run Report</span> to generate results.
        </div>
      )}
    </div>
  );
}
