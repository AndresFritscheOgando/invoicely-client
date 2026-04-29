"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Invoice, Vendor, PaginatedResult } from "@/types";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

const itemSchema = z.object({
  description: z.string().min(1, "Required").max(500),
  quantity: z.number().positive("Must be > 0"),
  unitPrice: z.number().positive("Must be > 0"),
});

const schema = z.object({
  vendorId: z.string().min(1, "Vendor required"),
  issueDate: z.string().min(1, "Issue date required"),
  dueDate: z.string().min(1, "Due date required"),
  currency: z.string().min(1).max(10),
  description: z.string().max(1000).optional().or(z.literal("")),
  items: z.array(itemSchema).min(1, "At least one item required"),
});

type FormData = z.infer<typeof schema>;

interface InvoiceFormProps {
  invoice?: Invoice;
  onClose: () => void;
}

export function InvoiceForm({ invoice, onClose }: InvoiceFormProps) {
  const queryClient = useQueryClient();
  const isEdit = !!invoice;

  const { data: vendorsData } = useQuery({
    queryKey: ["vendors-all"],
    queryFn: () =>
      api.get<PaginatedResult<Vendor>>("/vendors", { params: { status: "Active", pageSize: 100 } }).then((r) => r.data),
  });

  const vendors = vendorsData?.items ?? [];

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: invoice
      ? {
          vendorId: invoice.vendorId,
          issueDate: invoice.issueDate,
          dueDate: invoice.dueDate,
          currency: invoice.currency,
          description: invoice.description ?? "",
          items: invoice.items.map((i) => ({
            description: i.description,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
        }
      : {
          currency: "USD",
          items: [{ description: "", quantity: 1, unitPrice: 0 }],
        },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const watchedItems = watch("items");

  const total = watchedItems?.reduce((sum, item) => {
    const q = Number(item.quantity) || 0;
    const p = Number(item.unitPrice) || 0;
    return sum + q * p;
  }, 0) ?? 0;

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload = {
        ...data,
        description: data.description || null,
      };
      return isEdit
        ? api.put<Invoice>(`/invoices/${invoice!.id}`, payload).then((r) => r.data)
        : api.post<Invoice>("/invoices", payload).then((r) => r.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? `Edit Invoice ${invoice.invoiceNumber}` : "New Invoice"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="flex flex-col flex-1 overflow-hidden">
          <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vendor <span className="text-red-500">*</span>
                </label>
                <select
                  {...register("vendorId")}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                >
                  <option value="">Select a vendor...</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
                {errors.vendorId && (
                  <p className="mt-1 text-xs text-red-600">{errors.vendorId.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Issue Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  {...register("issueDate")}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {errors.issueDate && (
                  <p className="mt-1 text-xs text-red-600">{errors.issueDate.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  {...register("dueDate")}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {errors.dueDate && (
                  <p className="mt-1 text-xs text-red-600">{errors.dueDate.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <select
                  {...register("currency")}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="CAD">CAD</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  {...register("description")}
                  rows={2}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                  placeholder="Optional notes..."
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Line Items <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => append({ description: "", quantity: 1, unitPrice: 0 })}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                >
                  <Plus className="h-3 w-3" />
                  Add Item
                </button>
              </div>

              <div className="border border-gray-200 rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium text-gray-600 w-full">Description</th>
                      <th className="text-right px-3 py-2 font-medium text-gray-600 whitespace-nowrap w-20">Qty</th>
                      <th className="text-right px-3 py-2 font-medium text-gray-600 whitespace-nowrap w-28">Unit Price</th>
                      <th className="text-right px-3 py-2 font-medium text-gray-600 whitespace-nowrap w-24">Total</th>
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {fields.map((field, index) => {
                      const q = Number(watchedItems?.[index]?.quantity) || 0;
                      const p = Number(watchedItems?.[index]?.unitPrice) || 0;
                      const lineTotal = q * p;
                      return (
                        <tr key={field.id}>
                          <td className="px-2 py-1.5">
                            <input
                              {...register(`items.${index}.description`)}
                              className="w-full rounded border border-gray-200 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="Item description"
                            />
                            {errors.items?.[index]?.description && (
                              <p className="text-xs text-red-600">{errors.items[index]?.description?.message}</p>
                            )}
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              type="number"
                              step="0.01"
                              {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                              className="w-full rounded border border-gray-200 px-2 py-1 text-sm text-right focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              type="number"
                              step="0.01"
                              {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                              className="w-full rounded border border-gray-200 px-2 py-1 text-sm text-right focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-3 py-1.5 text-right text-gray-700 whitespace-nowrap">
                            {lineTotal.toFixed(2)}
                          </td>
                          <td className="px-1 py-1.5 text-center">
                            {fields.length > 1 && (
                              <button
                                type="button"
                                onClick={() => remove(index)}
                                className="text-gray-300 hover:text-red-500"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="border-t border-gray-200 bg-gray-50">
                    <tr>
                      <td colSpan={3} className="px-3 py-2 text-right text-sm font-medium text-gray-700">
                        Total
                      </td>
                      <td className="px-3 py-2 text-right text-sm font-semibold text-gray-900">
                        {total.toFixed(2)}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
              {errors.items?.root && (
                <p className="mt-1 text-xs text-red-600">{errors.items.root.message}</p>
              )}
            </div>

            {mutation.error && (
              <p className="text-sm text-red-600">
                {(mutation.error as { response?: { data?: { error?: string } } })
                  ?.response?.data?.error ?? "Something went wrong."}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Invoice"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
