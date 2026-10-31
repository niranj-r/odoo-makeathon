import { PaymentStatus } from "./common";

export type PaymentMethodType = "card" | "bank_transfer" | "ach" | "paypal";

export interface PaymentMethodDetails {
  id: string;
  type: PaymentMethodType;
  brand?: string; // "Visa", "Mastercard", "Amex"
  last4?: string;
  expMonth?: number;
  expYear?: number;
  bankName?: string;
  accountLast4?: string;
  isDefault: boolean;
}

export interface PaymentTransaction {
  id: string;
  transactionNumber: string; // e.g. "TXN-9843-021"
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: PaymentMethodDetails;
  paidAt: string;
  failureReason?: string;
  receiptNumber?: string;
}

export interface PaymentFilterParams {
  status?: PaymentStatus | "all";
  search?: string;
  startDate?: string;
  endDate?: string;
}

