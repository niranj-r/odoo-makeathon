export type DateRangePreset = "7d" | "30d" | "90d" | "12m" | "ytd" | "all";

export interface DateRange {
  startDate: string; // ISO format: YYYY-MM-DD
  endDate: string;
  preset?: DateRangePreset;
}

export type TrendDirection = "up" | "down" | "neutral";

export interface MetricTrend {
  value: number; // percentage, e.g. 12.5%
  direction: TrendDirection;
  label: string; // e.g., "vs last month"
}

export type SubscriptionStatus =
  | "draft"
  | "quotation"
  | "confirmed"
  | "active"
  | "paused"
  | "closed"
  | "canceled";

export type InvoiceStatus =
  | "draft"
  | "confirmed"
  | "paid"
  | "overdue"
  | "canceled";

export type PaymentStatus =
  | "succeeded"
  | "pending"
  | "failed"
  | "refunded";

export interface PaginationParams {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface CsvColumn<T> {
  header: string;
  accessorKey: keyof T | ((row: T) => string | number | boolean | null | undefined);
}

