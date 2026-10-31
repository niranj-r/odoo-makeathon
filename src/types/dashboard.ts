import { MetricTrend, SubscriptionStatus } from "./common";

export interface ExecutiveKpis {
  mrr: {
    current: number;
    trend: MetricTrend;
  };
  arr: {
    current: number;
    trend: MetricTrend;
  };
  netRevenue: {
    current: number;
    target: number;
    trend: MetricTrend;
  };
  activeSubscriptions: {
    total: number;
    trend: MetricTrend;
    breakdown: {
      active: number;
      trialing: number;
      pastDue: number;
      paused: number;
    };
  };
  churnRate: {
    percentage: number; // e.g. 1.8%
    trend: MetricTrend;
  };
  arpu: {
    current: number; // Average Revenue Per User
    trend: MetricTrend;
  };
  ltv: {
    current: number; // Lifetime Value
    trend: MetricTrend;
  };
}

export interface ActivityItem {
  id: string;
  type: "subscription_created" | "payment_received" | "invoice_paid" | "subscription_upgraded" | "subscription_canceled" | "invoice_overdue";
  title: string;
  description: string;
  customerName: string;
  customerEmail: string;
  amount?: number;
  timestamp: string; // ISO string
  status: "success" | "warning" | "info" | "danger";
}

export interface PlanPerformanceSnapshot {
  planId: string;
  name: string;
  subscribersCount: number;
  mrrContribution: number;
  sharePercentage: number;
  growthPercentage: number;
}

export interface StatusDistribution {
  status: SubscriptionStatus;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface AdminDashboardData {
  kpis: ExecutiveKpis;
  revenueSparkline: Array<{ date: string; amount: number }>;
  statusDistribution: StatusDistribution[];
  topPlans: PlanPerformanceSnapshot[];
  recentActivities: ActivityItem[];
}

