import { InvoiceStatus } from "./common";

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. "INV-2024-0089"
  subscriptionId?: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  billingAddress: string;
  status: InvoiceStatus;
  issueDate: string; // YYYY-MM-DD
  dueDate: string;
  paidAt?: string;
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  currency: string;
  paymentTerms: string; // e.g. "Net 15", "Due on receipt"
  items: InvoiceLineItem[];
  notes?: string;
  downloadUrl?: string;
}

export interface InvoiceFilterParams {
  status?: InvoiceStatus | "all";
  search?: string;
  startDate?: string;
  endDate?: string;
}

