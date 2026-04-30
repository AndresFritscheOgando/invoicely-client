export type UserRole = "Admin" | "FinanceManager" | "Employee" | "Viewer";

export type InvoiceStatus = "Draft" | "Submitted" | "Approved" | "Rejected" | "Cancelled";

export type PaymentStatus = "Unpaid" | "PartiallyPaid" | "Paid" | "Overdue";

export type VendorStatus = "Active" | "Inactive" | "Blocked";

export type PaymentMethod = "BankTransfer" | "CreditCard" | "Cash" | "Check" | "Other";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface ActivityUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Vendor {
  id: string;
  name: string;
  email: string;
  phone?: string;
  taxId?: string;
  address?: string;
  status: VendorStatus;
  invoiceCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceSummary {
  id: string;
  invoiceNumber: string;
  vendorId: string;
  vendorName: string;
  createdByName: string;
  amount: number;
  currency: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  paymentStatus: PaymentStatus;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  vendorId: string;
  vendorName: string;
  createdByUserId: string;
  createdByName: string;
  amount: number;
  currency: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  paymentStatus: PaymentStatus;
  description?: string;
  fileUrl?: string;
  items: InvoiceItem[];
  createdAt: string;
  updatedAt: string;
  reviewedByUserId?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  referenceNumber?: string;
  createdByName: string;
  createdAt: string;
}

export interface InvoiceComment {
  id: string;
  invoiceId: string;
  user: ActivityUser;
  content: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  user: ActivityUser;
  entityType: string;
  entityId: string;
  action: string;
  oldValue?: string;
  newValue?: string;
  createdAt: string;
}

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface StatusBreakdown {
  status: string;
  count: number;
}

export interface MonthlySpend {
  month: string;
  amount: number;
}

export interface TopVendor {
  vendorName: string;
  totalAmount: number;
  invoiceCount: number;
}

export interface ReportRow {
  id: string;
  invoiceNumber: string;
  vendorName: string;
  createdByName: string;
  amount: number;
  currency: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
}

export interface VendorBreakdown {
  vendorName: string;
  count: number;
  totalAmount: number;
}

export interface MonthlyBreakdown {
  month: string;
  count: number;
  totalAmount: number;
}

export interface ReportSummary {
  totalCount: number;
  totalAmount: number;
  paidCount: number;
  paidAmount: number;
  unpaidCount: number;
  unpaidAmount: number;
  overdueCount: number;
  overdueAmount: number;
  rows: ReportRow[];
  byVendor: VendorBreakdown[];
  byMonth: MonthlyBreakdown[];
}

export interface DashboardStats {
  totalInvoices: number;
  pendingApproval: number;
  overdueInvoices: number;
  paidThisMonth: number;
  totalOutstanding: number;
  statusBreakdown: StatusBreakdown[];
  monthlySpend: MonthlySpend[];
  topVendors: TopVendor[];
}
