"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Vendor, VendorStatus, PaginatedResult } from "@/types";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { VendorForm } from "@/components/vendors/vendor-form";
import { Plus, Search, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";

const STATUS_COLORS: Record<VendorStatus, string> = {
  Active: "bg-green-100 text-green-800",
  Inactive: "bg-gray-100 text-gray-600",
  Blocked: "bg-red-100 text-red-700",
};

const ALL_STATUSES: VendorStatus[] = ["Active", "Inactive", "Blocked"];

function StatusBadge({ status }: { status: VendorStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[status]}`}>
      {status}
    </span>
  );
}

function ConfirmDialog({
  title,
  message,
  confirmLabel,
  confirmVariant,
  onConfirm,
  onCancel,
  isPending,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  confirmVariant?: "destructive" | "default";
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">{title}</h2>
        <p className="text-sm text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
          <Button variant={confirmVariant ?? "default"} onClick={onConfirm} disabled={isPending}>
            {isPending ? "..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function VendorsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const isAdmin = user?.role === "Admin";
  const canManage = user?.role === "Admin" || user?.role === "FinanceManager";

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<VendorStatus | "">("");
  const [page, setPage] = useState(1);

  const [showCreate, setShowCreate] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [deletingVendor, setDeletingVendor] = useState<Vendor | null>(null);
  const [statusChanging, setStatusChanging] = useState<{ vendor: Vendor; newStatus: VendorStatus } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ["vendors", debouncedSearch, statusFilter, page],
    queryFn: () =>
      api
        .get<PaginatedResult<Vendor>>("/vendors", {
          params: {
            search: debouncedSearch || undefined,
            status: statusFilter || undefined,
            page,
            pageSize: 20,
          },
        })
        .then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/vendors/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      setDeletingVendor(null);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/vendors/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      setStatusChanging(null);
    },
  });

  const vendors = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
          <p className="text-sm text-gray-500 mt-1">
            {data ? `${data.totalCount} vendor${data.totalCount !== 1 ? "s" : ""}` : "Loading..."}
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add Vendor
          </Button>
        )}
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as VendorStatus | ""); setPage(1); }}
          className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
        >
          <option value="">All Statuses</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Phone</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Invoices</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : vendors.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                  No vendors found
                </td>
              </tr>
            ) : (
              vendors.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{vendor.name}</td>
                  <td className="px-4 py-3 text-gray-600">{vendor.email}</td>
                  <td className="px-4 py-3 text-gray-600">{vendor.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{vendor.invoiceCount}</td>
                  <td className="px-4 py-3">
                    {isAdmin ? (
                      <div className="relative group inline-block">
                        <button
                          className="flex items-center gap-1 hover:opacity-80"
                          title="Click to change status"
                        >
                          <StatusBadge status={vendor.status} />
                          <span className="text-gray-300 text-xs opacity-0 group-hover:opacity-100 transition-opacity">▾</span>
                        </button>
                        <div className="absolute left-0 top-full mt-1 z-10 hidden group-hover:block bg-white border border-gray-200 rounded-md shadow-lg py-1 min-w-[120px]">
                          {ALL_STATUSES.filter((s) => s !== vendor.status).map((s) => (
                            <button
                              key={s}
                              onClick={() => setStatusChanging({ vendor, newStatus: s })}
                              className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50"
                            >
                              <StatusBadge status={s} />
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <StatusBadge status={vendor.status} />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {canManage && (
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => setEditingVendor(vendor)}
                          title="Edit vendor"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {isAdmin && (
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => setDeletingVendor(vendor)}
                          title="Delete vendor"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {(showCreate || editingVendor) && (
        <VendorForm
          vendor={editingVendor ?? undefined}
          onClose={() => {
            setShowCreate(false);
            setEditingVendor(null);
          }}
        />
      )}

      {deletingVendor && (
        <ConfirmDialog
          title="Delete Vendor"
          message={`Delete "${deletingVendor.name}"? This cannot be undone. Vendors with invoices cannot be deleted.`}
          confirmLabel="Delete"
          confirmVariant="destructive"
          onConfirm={() => deleteMutation.mutate(deletingVendor.id)}
          onCancel={() => setDeletingVendor(null)}
          isPending={deleteMutation.isPending}
        />
      )}

      {statusChanging && (
        <ConfirmDialog
          title="Change Status"
          message={`Change "${statusChanging.vendor.name}" status to ${statusChanging.newStatus}?`}
          confirmLabel={`Set ${statusChanging.newStatus}`}
          onConfirm={() =>
            statusMutation.mutate({
              id: statusChanging.vendor.id,
              status: statusChanging.newStatus,
            })
          }
          onCancel={() => setStatusChanging(null)}
          isPending={statusMutation.isPending}
        />
      )}
    </div>
  );
}
