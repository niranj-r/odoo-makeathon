import { SubscriptionStatus } from "./common";

export type BillingInterval = "daily" | "weekly" | "monthly" | "yearly";

export interface SubscriptionLineItem {
  id: string;
  productName: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discountAmount: number;
  lineTotal: number;
}

export interface CustomerSubscription {
  id: string;
  subscriptionNumber: string; // e.g. "SUB-2024-0012"
  customerId: string;
  customerName: string;
  planId: string;
  planName: string;
  status: SubscriptionStatus;
  billingInterval: BillingInterval;
  startDate: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  pausedAt?: string;
  canceledAt?: string;
  unitPrice: number;
  quantity: number;
  discountTotal: number;
  taxTotal: number;
  subtotal: number;
  totalAmount: number;
  currency: string;
  items: SubscriptionLineItem[];
  autoRenew: boolean;
}

export interface ChangePlanPayload {
  subscriptionId: string;
  newPlanId: string;
  immediate: boolean;
}

export interface CancelSubscriptionPayload {
  subscriptionId: string;
  reason: string;
  comments?: string;
  immediate: boolean;
}

export interface PauseSubscriptionPayload {
  subscriptionId: string;
  resumeDate?: string;
}

