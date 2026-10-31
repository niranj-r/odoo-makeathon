export interface MonthlyRevenueReportRow {
  id: string;
  period: string; // e.g. "Oct 2024"
  grossRevenue: number;
  discounts: number;
  taxesCollected: number;
  refunds: number;
  netRevenue: number;
  invoiceCount: number;
  paymentCount: number;
}

export interface TaxReportRow {
  id: string;
  jurisdiction: string; // e.g. "California (State & Local)", "EU VAT", "UK VAT", "India GST"
  taxCode: string;
  ratePercentage: number;
  taxableSales: number;
  exemptSales: number;
  taxCollected: number;
  invoicesCount: number;
}

export interface InvoiceAgingRow {
  id: string;
  customerId: string;
  customerName: string;
  invoiceNumber: string;
  dueDate: string;
  currentAmount: number; // not overdue yet
  days1To30: number;
  days31To60: number;
  days61To90: number;
  days90Plus: number;
  totalOutstanding: number;
  status: "current" | "overdue";
}

export interface PlanPerformanceRow {
  planId: string;
  planName: string;
  billingInterval: "daily" | "weekly" | "monthly" | "yearly";
  price: number;
  activeSubscriptions: number;
  newSubscriptionsMonth: number;
  churnedSubscriptionsMonth: number;
  mrr: number;
  churnRate: number; // percentage
  avgTenureMonths: number;
}

export interface ChurnReasonRow {
  reason: string;
  category: "pricing" | "product_fit" | "competitor" | "closure" | "other";
  occurrences: number;
  percentageOfTotal: number;
  lostMrr: number;
}

export type ReportCategory =
  | "monthly-revenue"
  | "tax-summary"
  | "invoice-aging"
  | "plan-performance"
  | "churn-reasons";

export interface ReportFilter {
  category: ReportCategory;
  searchQuery?: string;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
}

