"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcut";
import api from "@/lib/api";
import type { InvoiceSummary, InvoiceStatus, PaginatedResult } from "@/types";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import { Plus, Search, Pencil, Trash2, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/ui/status-badge";

const ALL_STATUSES: InvoiceStatus[] = ["Draft", "Submitted", "Approved", "Rejected", "Cancelled"];

function ConfirmDialog({
  title,
  message,
  onConfirm,
  onCancel,
  isPending,
}: {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm bg-card rounded-xl shadow-xl ring-1 ring-black/5 p-6">
        <h2 className="text-lg font-semibold text-foreground mb-2">{title}</h2>
        <p className="text-sm text-muted-foreground mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel} disabled={isPending}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isPending}>
            {isPending ? "..." : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function InvoicesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const canCreate = user?.role === "Admin" || user?.role === "FinanceManager" || user?.role === "Employee";

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "">("");
  const [page, setPage] = useState(1);

  const [showCreate, setShowCreate] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  useKeyboardShortcut("k", () => searchRef.current?.focus(), { metaOrCtrl: true });

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ["invoices", debouncedSearch, statusFilter, page],
    queryFn: () =>
      api
        .get<PaginatedResult<InvoiceSummary>>("/invoices", {
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
    mutationFn: (id: string) => api.delete(`/invoices/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setDeletingId(null);
      toast.success("Invoice deleted");
    },
    onError: () => toast.error("Failed to delete invoice"),
  });

  const invoices = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  const formatAmount = (amount: number, currency: string) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Invoices</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {data ? `${data.totalCount} invoice${data.totalCount !== 1 ? "s" : ""}` : "Loading..."}
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            New Invoice
          </Button>
        )}
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            ref={searchRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by number, vendor, or description..."
            className="w-full pl-9 pr-16 py-2 text-sm border border-input bg-background rounded-md text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-0.5 text-xs text-muted-foreground/50 font-mono pointer-events-none">
            <span>⌘</span><span>K</span>
          </kbd>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as InvoiceStatus | ""); setPage(1); }}
          className="px-3 py-2 text-sm border border-input bg-background rounded-md text-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50"
        >
          <option value="">All Statuses</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b border-border sticky top-0 z-10">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Invoice #</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Vendor</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Amount</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Issue Date</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Due Date</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-muted rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Search className="h-10 w-10 text-muted-foreground/30" />
                    <p className="font-medium text-foreground">No invoices found</p>
                    <p className="text-sm text-muted-foreground">
                      {search || statusFilter ? "Try adjusting your search or filters" : "Create your first invoice to get started"}
                    </p>
                    {canCreate && !search && !statusFilter && (
                      <button
                        onClick={() => setShowCreate(true)}
                        className="mt-2 text-sm text-primary font-medium hover:underline"
                      >
                        New Invoice
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              invoices.map((invoice) => {
                const isOverdue = invoice.status === "Approved" && new Date(invoice.dueDate) < new Date();
                return (
                  <tr
                    key={invoice.id}
                    className="hover:bg-muted/30 cursor-pointer"
                    onClick={() => router.push(`/invoices/${invoice.id}`)}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-foreground">{invoice.invoiceNumber}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{invoice.vendorName}</td>
                    <td className="px-4 py-3 text-foreground font-medium">
                      {formatAmount(invoice.amount, invoice.currency)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{invoice.issueDate}</td>
                    <td className={`px-4 py-3 ${isOverdue ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                      {invoice.dueDate}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={invoice.status as InvoiceStatus} />
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => router.push(`/invoices/${invoice.id}`)}
                          title="View invoice"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        {invoice.status === "Draft" && canCreate && (
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => router.push(`/invoices/${invoice.id}?edit=1`)}
                            title="Edit invoice"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {invoice.status === "Draft" && canCreate && (
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => setDeletingId(invoice.id)}
                            title="Delete invoice"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
            <p className="text-sm text-muted-foreground">
              Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, data?.totalCount ?? 0)} of {data?.totalCount ?? 0} invoices
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                <ChevronLeft className="h-4 w-4" />
                Prev
              </Button>
              <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {showCreate && (
        <InvoiceForm onClose={() => setShowCreate(false)} />
      )}

      {deletingId && (
        <ConfirmDialog
          title="Delete Invoice"
          message="Delete this invoice? Only Draft invoices can be deleted. This cannot be undone."
          onConfirm={() => deleteMutation.mutate(deletingId)}
          onCancel={() => setDeletingId(null)}
          isPending={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
