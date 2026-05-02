"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "@/lib/api";
import type { Payment, PaymentMethod } from "@/types";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, X } from "lucide-react";
import { toast } from "sonner";

const PAYMENT_METHODS: PaymentMethod[] = ["BankTransfer", "CreditCard", "Cash", "Check", "Other"];

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  BankTransfer: "Bank Transfer",
  CreditCard: "Credit Card",
  Cash: "Cash",
  Check: "Check",
  Other: "Other",
};

const schema = z.object({
  amount: z.number().positive("Amount must be greater than 0"),
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  referenceNumber: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  invoiceId: string;
  invoiceAmount: number;
  currency: string;
  canRecord: boolean;
}

export function PaymentsSection({ invoiceId, invoiceAmount, currency, canRecord }: Props) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["payments", invoiceId],
    queryFn: () => api.get<Payment[]>(`/invoices/${invoiceId}/payments`).then((r) => r.data),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["payments", invoiceId] });
    queryClient.invalidateQueries({ queryKey: ["invoices", invoiceId] });
    queryClient.invalidateQueries({ queryKey: ["invoices"] });
  };

  const recordMutation = useMutation({
    mutationFn: (data: FormValues) => api.post(`/invoices/${invoiceId}/payments`, data),
    onSuccess: () => { invalidate(); setShowForm(false); reset(); toast.success("Payment recorded"); },
    onError: () => toast.error("Failed to record payment"),
  });

  const deleteMutation = useMutation({
    mutationFn: (paymentId: string) => api.delete(`/invoices/${invoiceId}/payments/${paymentId}`),
    onSuccess: () => { invalidate(); toast.success("Payment removed"); },
    onError: () => toast.error("Failed to remove payment"),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      paymentDate: new Date().toISOString().slice(0, 10),
      paymentMethod: "BankTransfer",
    },
  });

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = invoiceAmount - totalPaid;

  const fmt = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);

  const formatDate = (iso: string) =>
    new Date(iso + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  return (
    <div className="border-t border-border pt-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Payments</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Paid: {fmt(totalPaid)} · Remaining: {fmt(Math.max(0, remaining))}
          </p>
        </div>
        {canRecord && remaining > 0 && !showForm && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Record Payment
          </Button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit((d) => recordMutation.mutate(d))}
          className="bg-muted/50 rounded-lg p-4 mb-4 space-y-3 border border-border"
        >
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-medium text-foreground">New Payment</p>
            <button type="button" onClick={() => { setShowForm(false); reset(); }}>
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Amount</label>
              <input
                type="number"
                step="0.01"
                max={remaining}
                placeholder="0.00"
                {...register("amount", { valueAsNumber: true })}
                className="w-full border border-input bg-background rounded-md px-3 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50"
              />
              {errors.amount && <p className="text-xs text-destructive mt-0.5">{errors.amount.message}</p>}
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Payment Date</label>
              <input
                type="date"
                {...register("paymentDate")}
                className="w-full border border-input bg-background rounded-md px-3 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50"
              />
              {errors.paymentDate && <p className="text-xs text-destructive mt-0.5">{errors.paymentDate.message}</p>}
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Method</label>
              <select
                {...register("paymentMethod")}
                className="w-full border border-input bg-background rounded-md px-3 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>{PAYMENT_METHOD_LABELS[m]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Reference # (optional)</label>
              <input
                type="text"
                placeholder="e.g. TXN-123"
                {...register("referenceNumber")}
                className="w-full border border-input bg-background rounded-md px-3 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50"
              />
            </div>
          </div>

          {recordMutation.isError && (
            <p className="text-xs text-destructive">Failed to record payment. Please try again.</p>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => { setShowForm(false); reset(); }}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={recordMutation.isPending}>
              {recordMutation.isPending ? "Saving..." : "Save Payment"}
            </Button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => <div key={i} className="h-10 bg-muted rounded animate-pulse" />)}
        </div>
      ) : payments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
      ) : (
        <div className="space-y-2">
          {payments.map((p) => (
            <div key={p.id} className="flex items-center justify-between py-2.5 px-3 bg-muted/50 rounded-md border border-border/50">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground">{fmt(p.amount)}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(p.paymentDate)}</p>
                </div>
                <div>
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {PAYMENT_METHOD_LABELS[p.paymentMethod as PaymentMethod] ?? p.paymentMethod}
                  </span>
                </div>
                {p.referenceNumber && (
                  <p className="text-xs text-muted-foreground font-mono">{p.referenceNumber}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <p className="text-xs text-muted-foreground">{p.createdByName}</p>
                {canRecord && (
                  <button
                    onClick={() => deleteMutation.mutate(p.id)}
                    disabled={deleteMutation.isPending}
                    className="text-muted-foreground/40 hover:text-destructive transition-colors"
                    title="Delete payment"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
