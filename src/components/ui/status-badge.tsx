import { cn } from "@/lib/utils";
import type { InvoiceStatus, VendorStatus, PaymentStatus } from "@/types";

type AnyStatus = InvoiceStatus | VendorStatus | PaymentStatus;

const STATUS_CLASSES: Record<string, string> = {
  // Invoice statuses
  Draft: "bg-status-draft text-status-draft-fg",
  Submitted: "bg-status-submitted text-status-submitted-fg",
  Approved: "bg-status-approved text-status-approved-fg",
  Rejected: "bg-status-rejected text-status-rejected-fg",
  Cancelled: "bg-status-cancelled text-status-cancelled-fg",
  // Vendor statuses
  Active: "bg-status-approved text-status-approved-fg",
  Inactive: "bg-status-draft text-status-draft-fg",
  Blocked: "bg-status-rejected text-status-rejected-fg",
  // Payment statuses
  Unpaid: "bg-status-draft text-status-draft-fg",
  PartiallyPaid: "bg-status-submitted text-status-submitted-fg",
  Paid: "bg-status-approved text-status-approved-fg",
  Overdue: "bg-status-rejected text-status-rejected-fg",
};

const STATUS_LABELS: Record<string, string> = {
  PartiallyPaid: "Partially Paid",
};

export function StatusBadge({
  status,
  className,
}: {
  status: AnyStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        STATUS_CLASSES[status] ?? "bg-muted text-muted-foreground",
        className
      )}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
