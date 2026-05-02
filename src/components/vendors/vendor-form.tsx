"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Vendor } from "@/types";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().min(1, "Name required").max(200),
  email: z.string().email("Invalid email").max(200),
  phone: z.string().max(50).optional().or(z.literal("")),
  taxId: z.string().max(100).optional().or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
});

type VendorFormData = z.infer<typeof schema>;

interface VendorFormProps {
  vendor?: Vendor;
  onClose: () => void;
}

export function VendorForm({ vendor, onClose }: VendorFormProps) {
  const queryClient = useQueryClient();
  const isEdit = !!vendor;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VendorFormData>({
    resolver: zodResolver(schema),
    defaultValues: vendor
      ? {
          name: vendor.name,
          email: vendor.email,
          phone: vendor.phone ?? "",
          taxId: vendor.taxId ?? "",
          address: vendor.address ?? "",
        }
      : {},
  });

  const mutation = useMutation({
    mutationFn: (data: VendorFormData) => {
      const payload = {
        ...data,
        phone: data.phone || null,
        taxId: data.taxId || null,
        address: data.address || null,
      };
      return isEdit
        ? api.put<Vendor>(`/vendors/${vendor!.id}`, payload).then((r) => r.data)
        : api.post<Vendor>("/vendors", payload).then((r) => r.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      toast.success(isEdit ? "Vendor updated" : "Vendor added");
      onClose();
    },
    onError: () => toast.error("Failed to save vendor"),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg bg-card rounded-xl shadow-xl ring-1 ring-black/5 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground">
            {isEdit ? "Edit Vendor" : "Add Vendor"}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Name <span className="text-destructive">*</span>
            </label>
            <input
              {...register("name")}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50"
              placeholder="Acme Corp"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Email <span className="text-destructive">*</span>
            </label>
            <input
              {...register("email")}
              type="email"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50"
              placeholder="billing@vendor.com"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Phone</label>
              <input
                {...register("phone")}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50"
                placeholder="+1 555 000 0000"
              />
              {errors.phone && (
                <p className="mt-1 text-xs text-destructive">{errors.phone.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Tax ID</label>
              <input
                {...register("taxId")}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50"
                placeholder="12-3456789"
              />
              {errors.taxId && (
                <p className="mt-1 text-xs text-destructive">{errors.taxId.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Address</label>
            <textarea
              {...register("address")}
              rows={2}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 resize-none"
              placeholder="123 Main St, City, State 12345"
            />
            {errors.address && (
              <p className="mt-1 text-xs text-destructive">{errors.address.message}</p>
            )}
          </div>

          {mutation.error && (
            <p className="text-sm text-destructive">
              {(mutation.error as { response?: { data?: { error?: string } } })
                ?.response?.data?.error ?? "Something went wrong."}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : isEdit ? "Save Changes" : "Add Vendor"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
