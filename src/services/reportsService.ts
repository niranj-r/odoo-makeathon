import {
  MonthlyRevenueReportRow,
  TaxReportRow,
  InvoiceAgingRow,
  PlanPerformanceRow,
  ChurnReasonRow,
} from "@/types/reports";
import {
  MOCK_MONTHLY_REVENUE_REPORTS,
  MOCK_TAX_REPORTS,
  MOCK_INVOICE_AGING_REPORTS,
  MOCK_PLAN_PERFORMANCE_REPORTS,
  MOCK_CHURN_REASONS_REPORTS,
} from "@/mockData/reportsMock";

class ReportsService {
  async getMonthlyRevenueReports(search?: string): Promise<MonthlyRevenueReportRow[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (!search) {
          resolve(MOCK_MONTHLY_REVENUE_REPORTS);
          return;
        }
        const filtered = MOCK_MONTHLY_REVENUE_REPORTS.filter((row) =>
          row.period.toLowerCase().includes(search.toLowerCase())
        );
        resolve(filtered);
      }, 150);
    });
  }

  async getTaxReports(search?: string): Promise<TaxReportRow[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (!search) {
          resolve(MOCK_TAX_REPORTS);
          return;
        }
        const filtered = MOCK_TAX_REPORTS.filter((row) =>
          row.jurisdiction.toLowerCase().includes(search.toLowerCase()) ||
          row.taxCode.toLowerCase().includes(search.toLowerCase())
        );
        resolve(filtered);
      }, 150);
    });
  }

  async getInvoiceAgingReports(search?: string): Promise<InvoiceAgingRow[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (!search) {
          resolve(MOCK_INVOICE_AGING_REPORTS);
          return;
        }
        const filtered = MOCK_INVOICE_AGING_REPORTS.filter((row) =>
          row.customerName.toLowerCase().includes(search.toLowerCase()) ||
          row.invoiceNumber.toLowerCase().includes(search.toLowerCase())
        );
        resolve(filtered);
      }, 150);
    });
  }

  async getPlanPerformanceReports(search?: string): Promise<PlanPerformanceRow[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (!search) {
          resolve(MOCK_PLAN_PERFORMANCE_REPORTS);
          return;
        }
        const filtered = MOCK_PLAN_PERFORMANCE_REPORTS.filter((row) =>
          row.planName.toLowerCase().includes(search.toLowerCase())
        );
        resolve(filtered);
      }, 150);
    });
  }

  async getChurnReasonsReports(): Promise<ChurnReasonRow[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(MOCK_CHURN_REASONS_REPORTS);
      }, 150);
    });
  }
}

export const reportsService = new ReportsService();

