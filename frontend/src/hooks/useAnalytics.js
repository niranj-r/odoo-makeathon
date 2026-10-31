import { useState, useEffect, useCallback } from 'react';
import { analyticsService } from '../services/analyticsService';

/**
 * useAnalytics Hook
 * Manages SaaS business intelligence data fetching, date range filtering, and loading state.
 * Architecture: Component -> Hook -> Service -> Mock Data
 *
 * @param {string} [initialDateRange='Year']
 */
export function useAnalytics(initialDateRange = 'Year') {
  const [data, setData] = useState(null);
  const [dateRange, setDateRange] = useState(initialDateRange);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await analyticsService.getAnalyticsDashboardData(dateRange);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    dateRange,
    setDateRange,
    revenueTrend: data?.revenueTrend || [],
    productRevenue: data?.productRevenue || [],
    planRevenue: data?.planRevenue || [],
    subscriptionMetrics: data?.subscriptionMetrics || [],
    businessInsights: data?.businessInsights || null,
    topCustomers: data?.topCustomers || [],
    isLoading,
    error,
    refetch: fetchAnalytics,
    // Backward compatibility aliases
    data,
    preset: dateRange,
    setPreset: setDateRange,
  };
}

export default useAnalytics;
