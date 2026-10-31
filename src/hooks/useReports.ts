"use client";

import { useQuery } from "@tanstack/react-query";
import { reportsService } from "@/services/reportsService";
import {
  MonthlyRevenueReportRow,
  TaxReportRow,
  InvoiceAgingRow,
  PlanPerformanceRow,
  ChurnReasonRow,
} from "@/types/reports";

export function useMonthlyRevenueReports(search?: string) {
  return useQuery<MonthlyRevenueReportRow[], Error>({
    queryKey: ["reports", "monthly-revenue", search],
    queryFn: () => reportsService.getMonthlyRevenueReports(search),
  });
}

export function useTaxReports(search?: string) {
  return useQuery<TaxReportRow[], Error>({
    queryKey: ["reports", "tax-summary", search],
    queryFn: () => reportsService.getTaxReports(search),
  });
}

export function useInvoiceAgingReports(search?: string) {
  return useQuery<InvoiceAgingRow[], Error>({
    queryKey: ["reports", "invoice-aging", search],
    queryFn: () => reportsService.getInvoiceAgingReports(search),
  });
}

export function usePlanPerformanceReports(search?: string) {
  return useQuery<PlanPerformanceRow[], Error>({
    queryKey: ["reports", "plan-performance", search],
    queryFn: () => reportsService.getPlanPerformanceReports(search),
  });
}

export function useChurnReasonsReports() {
  return useQuery<ChurnReasonRow[], Error>({
    queryKey: ["reports", "churn-reasons"],
    queryFn: () => reportsService.getChurnReasonsReports(),
  });
}

