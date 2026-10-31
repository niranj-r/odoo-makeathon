import { mockAnalyticsData } from '../mockData/analytics';
import { mockAsyncResponse } from './api';

/**
 * Analytics Service
 * Abstracted data layer for SaaS financial and cohort analytics.
 * Architecture: Component -> Hook -> Service -> Mock Data (later Supabase)
 */
export const analyticsService = {
  /**
   * Fetch high-level analytics overview & growth metrics
   * @param {string} [preset='12m']
   */
  async getOverview(preset = '12m') {
    return mockAsyncResponse({
      preset,
      ...mockAnalyticsData.summary,
    });
  },

  /**
   * Fetch Monthly Recurring Revenue (MRR) expansion, contraction, churn breakdowns
   */
  async getMrrMovements() {
    return mockAsyncResponse(mockAnalyticsData.mrrMovements);
  },

  /**
   * Fetch revenue breakdown categorized by pricing tier
   */
  async getRevenueByPlan() {
    return mockAsyncResponse(mockAnalyticsData.revenueByPlan);
  },

  /**
   * Fetch customer and revenue churn rate trends
   */
  async getChurnTrends() {
    return mockAsyncResponse(mockAnalyticsData.churnTrends);
  },

  /**
   * Fetch cohort retention analysis
   */
  async getRetentionCohorts() {
    return mockAsyncResponse(mockAnalyticsData.retentionCohorts);
  },

  /**
   * Fetch complete analytics bundle
   */
  async getAllAnalytics() {
    return mockAsyncResponse(mockAnalyticsData);
  },
};

export default analyticsService;

