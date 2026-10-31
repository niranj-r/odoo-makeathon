import { mockReportsData } from '../mockData/reports';
import { mockAsyncResponse } from './api';

/**
 * Report Service
 * Abstracted data layer for accounting, compliance, and custom SaaS reports.
 * Architecture: Component -> Hook -> Service -> Mock Data (later Supabase)
 */
export const reportService = {
  /**
   * Fetch top-level reporting summary
   */
  async getSummary() {
    return mockAsyncResponse(mockReportsData.summary);
  },

  /**
   * Fetch monthly gross, net revenue, discounts and tax report
   */
  async getMonthlyRevenueReport() {
    return mockAsyncResponse(mockReportsData.monthlyRevenue);
  },

  /**
   * Fetch accounts receivable invoice aging breakdown
   */
  async getInvoiceAging() {
    return mockAsyncResponse(mockReportsData.invoiceAging);
  },

  /**
   * Fetch tax liability by jurisdiction
   */
  async getTaxSummary() {
    return mockAsyncResponse(mockReportsData.taxSummary);
  },

  /**
   * Fetch churn reason breakdown and distribution
   */
  async getChurnReasons() {
    return mockAsyncResponse(mockReportsData.churnReasons);
  },

  /**
   * Fetch list of available downloadable report exports
   */
  async getAvailableExports() {
    return mockAsyncResponse(mockReportsData.availableExports);
  },

  /**
   * Fetch complete reports data
   */
  async getAllReports() {
    return mockAsyncResponse(mockReportsData);
  },
};

export default reportService;

