import { DateRangePreset } from "./common";

export interface MrrMovementPoint {
  date: string;
  formattedDate: string;
  newMrr: number;
  expansionMrr: number;
  contractionMrr: number;
  churnedMrr: number;
  netMrr: number;
  cumulativeMrr: number;
}

export interface RevenueByPlanPoint {
  planName: string;
  revenue: number;
  subscriberCount: number;
  percentage: number;
  color: string;
}

export interface ChurnTrendPoint {
  date: string;
  customerChurnRate: number; // percentage
  revenueChurnRate: number; // percentage
  churnedCustomersCount: number;
}

export interface RetentionCohortRow {
  cohortMonth: string; // e.g. "2024-01"
  initialCustomers: number;
  retentionRates: number[]; // e.g. [100, 96, 92, 89, 87, 85, 84] (percentages month by month)
}

export interface ArpuLtvPoint {
  date: string;
  arpu: number;
  ltv: number;
}

export interface AnalyticsSummary {
  totalRevenuePeriod: number;
  netGrowthRate: number;
  avgChurnRate: number;
  avgLtv: number;
  avgArpu: number;
  quickRatio: number; // (New + Expansion) / (Churn + Contraction)
}

export interface AnalyticsData {
  preset: DateRangePreset;
  summary: AnalyticsSummary;
  mrrMovements: MrrMovementPoint[];
  revenueByPlan: RevenueByPlanPoint[];
  churnTrends: ChurnTrendPoint[];
  retentionCohorts: RetentionCohortRow[];
  arpuLtvTrends: ArpuLtvPoint[];
}

