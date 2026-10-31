import { mockDashboardData } from '../mockData/dashboard';
import { mockAsyncResponse } from './api';

/**
 * Dashboard Service
 * Abstracted data layer for BrightLoop Admin and Executive dashboards.
 * Architecture: Component -> Hook -> Service -> Mock Data (later Supabase)
 */
export const dashboardService = {
  /**
   * Fetch all dashboard KPI metrics and top-level summary
   */
  async getMetrics() {
    return mockAsyncResponse(mockDashboardData.kpis);
  },

  /**
   * Fetch 30-day revenue sparkline and historical trajectory
   */
  async getRevenueSparkline() {
    return mockAsyncResponse(mockDashboardData.revenueSparkline);
  },

  /**
   * Fetch current subscription status distribution
   */
  async getStatusDistribution() {
    return mockAsyncResponse(mockDashboardData.statusDistribution);
  },

  /**
   * Fetch top performing subscription plans
   */
  async getTopPlans() {
    return mockAsyncResponse(mockDashboardData.topPlans);
  },

  /**
   * Fetch recent billing and customer activities
   */
  async getRecentActivity() {
    return mockAsyncResponse(mockDashboardData.recentActivity);
  },

  /**
   * Fetch comprehensive dashboard bundle
   */
  async getDashboardData() {
    return mockAsyncResponse(mockDashboardData);
  },
};

export default dashboardService;

