import { reportsService } from './reportsService';

export const reportService = {
  ...reportsService,
  async getFinancialReport(filters) {
    const data = await reportsService.getAllReportsData(filters);
    return data.tableData;
  },
  async getProductPerformance() {
    const data = await reportsService.getAllReportsData();
    return data.breakdown.byProduct;
  },
  async getPlanPerformance() {
    const data = await reportsService.getAllReportsData();
    return data.breakdown.byPlan;
  },
  async getTaxReport() {
    return [];
  },
  async getInvoiceAging() {
    return [];
  },
  async getReportsBundle(filters) {
    return reportsService.getAllReportsData(filters);
  },
};

export default reportService;
