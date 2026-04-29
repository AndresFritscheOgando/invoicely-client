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
  vendor: Vendor;
  createdByUserId: string;
  createdBy: User;
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
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  createdBy: User;
  createdAt: string;
}

export interface InvoiceComment {
  id: string;
  invoiceId: string;
  user: User;
  content: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  user: User;
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

export interface DashboardStats {
  totalInvoices: number;
  pendingApproval: number;
  overdueInvoices: number;
  paidThisMonth: number;
  totalOutstanding: number;
}
