"use client";

import { useState, use } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import type { Invoice, InvoiceStatus } from "@/types";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import { PaymentsSection } from "@/components/invoices/payments-section";
import { ArrowLeft, Pencil, Send, CheckCircle, XCircle, Ban } from "lucide-react";

const STATUS_COLORS: Record<InvoiceStatus, string> = {
  Draft: "bg-gray-100 text-gray-600",
  Submitted: "bg-blue-100 text-blue-700",
  Approved: "bg-green-100 text-green-800",
  Rejected: "bg-red-100 text-red-700",
  Cancelled: "bg-yellow-100 text-yellow-700",
};

function StatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[status]}`}>
      {status}
    </span>
  );
}

function RejectModal({ onConfirm, onCancel, isLoading }: {
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Reject Invoice</h2>
        <p className="text-sm text-gray-500 mb-4">Provide a reason for rejection.</p>
        <textarea
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
          rows={4}
          placeholder="Rejection reason..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => onConfirm(reason)}
            disabled={!reason.trim() || isLoading}
          >
            {isLoading ? "Rejecting..." : "Reject"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(searchParams.get("edit") === "1");
  const [showRejectModal, setShowRejectModal] = useState(false);

  const canCreate = user?.role === "Admin" || user?.role === "FinanceManager" || user?.role === "Employee";
  const canReview = user?.role === "Admin" || user?.role === "FinanceManager";

  const { data: invoice, isLoading, error } = useQuery({
    queryKey: ["invoices", id],
    queryFn: () => api.get<Invoice>(`/invoices/${id}`).then((r) => r.data),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["invoices", id] });
    queryClient.invalidateQueries({ queryKey: ["invoices"] });
  };

  const submitMutation = useMutation({
    mutationFn: () => api.post(`/invoices/${id}/submit`),
    onSuccess: invalidate,
  });

  const approveMutation = useMutation({
    mutationFn: () => api.post(`/invoices/${id}/approve`),
    onSuccess: invalidate,
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => api.post(`/invoices/${id}/reject`, { rejectionReason: reason }),
    onSuccess: () => { setShowRejectModal(false); invalidate(); },
  });

  const cancelMutation = useMutation({
    mutationFn: () => api.post(`/invoices/${id}/cancel`),
    onSuccess: invalidate,
  });

  const formatAmount = (amount: number, currency: string) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  const formatPaymentStatus = (status: string) =>
    status.replace(/([A-Z])/g, " $1").trim();

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-100 rounded w-48" />
          <div className="h-4 bg-gray-100 rounded w-32" />
          <div className="h-64 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="p-8">
        <p className="text-gray-500">Invoice not found.</p>
        <Button variant="outline" onClick={() => router.push("/invoices")} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to Invoices
        </Button>
      </div>
    );
  }

  const isOwner = invoice.createdByUserId === user?.id;
  const canEdit = invoice.status === "Draft" && canCreate;
  const canSubmit = invoice.status === "Draft" && isOwner && canCreate;
  const canApproveReject = invoice.status === "Submitted" && canReview;
  const canCancel = (invoice.status === "Draft" || invoice.status === "Submitted") &&
    (isOwner || canReview);

  const isBusy = submitMutation.isPending || approveMutation.isPending ||
    rejectMutation.isPending || cancelMutation.isPending;

  return (
    <div className="p-8 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/invoices")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Invoices
        </button>

        <div className="flex items-center gap-2">
          {canEdit && (
            <Button variant="outline" onClick={() => setIsEditing(true)} disabled={isBusy}>
              <Pencil className="h-4 w-4 mr-1.5" />
              Edit
            </Button>
          )}
          {canSubmit && (
            <Button onClick={() => submitMutation.mutate()} disabled={isBusy}>
              <Send className="h-4 w-4 mr-1.5" />
              {submitMutation.isPending ? "Submitting..." : "Submit"}
            </Button>
          )}
          {canApproveReject && (
            <>
              <Button
                onClick={() => approveMutation.mutate()}
                disabled={isBusy}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="h-4 w-4 mr-1.5" />
                {approveMutation.isPending ? "Approving..." : "Approve"}
              </Button>
              <Button
                variant="destructive"
                onClick={() => setShowRejectModal(true)}
                disabled={isBusy}
              >
                <XCircle className="h-4 w-4 mr-1.5" />
                Reject
              </Button>
            </>
          )}
          {canCancel && (
            <Button
              variant="outline"
              onClick={() => cancelMutation.mutate()}
              disabled={isBusy}
              className="text-yellow-700 border-yellow-300 hover:bg-yellow-50"
            >
              <Ban className="h-4 w-4 mr-1.5" />
              {cancelMutation.isPending ? "Cancelling..." : "Cancel"}
            </Button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-mono">{invoice.invoiceNumber}</h1>
            <p className="text-sm text-gray-500 mt-1">Created by {invoice.createdByName}</p>
          </div>
          <StatusBadge status={invoice.status as InvoiceStatus} />
        </div>

        <div className="grid grid-cols-2 gap-6 border-t border-gray-100 pt-6">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Vendor</p>
            <p className="mt-1 text-sm font-medium text-gray-900">{invoice.vendorName}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Amount</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">
              {formatAmount(invoice.amount, invoice.currency)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Issue Date</p>
            <p className="mt-1 text-sm text-gray-700">{invoice.issueDate}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Due Date</p>
            <p className="mt-1 text-sm text-gray-700">{invoice.dueDate}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Payment Status</p>
            <p className="mt-1 text-sm text-gray-700">{formatPaymentStatus(invoice.paymentStatus)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Currency</p>
            <p className="mt-1 text-sm text-gray-700">{invoice.currency}</p>
          </div>
          {invoice.description && (
            <div className="col-span-2">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Description</p>
              <p className="mt-1 text-sm text-gray-700">{invoice.description}</p>
            </div>
          )}
        </div>

        {(invoice.reviewedByName || invoice.rejectionReason) && (
          <div className="border-t border-gray-100 pt-6 space-y-3">
            <h2 className="text-sm font-semibold text-gray-700">Review Details</h2>
            <div className="grid grid-cols-2 gap-4">
              {invoice.reviewedByName && (
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Reviewed By</p>
                  <p className="mt-1 text-sm text-gray-700">{invoice.reviewedByName}</p>
                </div>
              )}
              {invoice.reviewedAt && (
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Reviewed At</p>
                  <p className="mt-1 text-sm text-gray-700">{formatDate(invoice.reviewedAt)}</p>
                </div>
              )}
            </div>
            {invoice.rejectionReason && (
              <div className="bg-red-50 rounded-md p-3">
                <p className="text-xs font-medium text-red-400 uppercase tracking-wide mb-1">Rejection Reason</p>
                <p className="text-sm text-red-700">{invoice.rejectionReason}</p>
              </div>
            )}
          </div>
        )}

        {invoice.items.length > 0 && (
          <div className="border-t border-gray-100 pt-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Line Items</h2>
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="text-left pb-2 font-medium text-gray-600">Description</th>
                  <th className="text-right pb-2 font-medium text-gray-600">Qty</th>
                  <th className="text-right pb-2 font-medium text-gray-600">Unit Price</th>
                  <th className="text-right pb-2 font-medium text-gray-600">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoice.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2 text-gray-700">{item.description}</td>
                    <td className="py-2 text-right text-gray-600">{item.quantity}</td>
                    <td className="py-2 text-right text-gray-600">{formatAmount(item.unitPrice, invoice.currency)}</td>
                    <td className="py-2 text-right font-medium text-gray-800">{formatAmount(item.total, invoice.currency)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-gray-200">
                <tr>
                  <td colSpan={3} className="pt-3 text-right font-semibold text-gray-700">Total</td>
                  <td className="pt-3 text-right font-bold text-gray-900">{formatAmount(invoice.amount, invoice.currency)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
        {invoice.status === "Approved" && (
          <PaymentsSection
            invoiceId={invoice.id}
            invoiceAmount={invoice.amount}
            currency={invoice.currency}
            canRecord={canReview}
          />
        )}
      </div>

      {isEditing && (
        <InvoiceForm
          invoice={invoice}
          onClose={() => setIsEditing(false)}
        />
      )}

      {showRejectModal && (
        <RejectModal
          onConfirm={(reason) => rejectMutation.mutate(reason)}
          onCancel={() => setShowRejectModal(false)}
          isLoading={rejectMutation.isPending}
        />
      )}
    </div>
  );
}
