import { useState, useEffect, useCallback } from 'react';
import { analyticsService } from '../services/analyticsService';

/**
 * Hook for consuming SaaS Financial Analytics and MRR Cohort data
 */
export function useAnalytics(initialPreset = '12m') {
  const [data, setData] = useState(null);
  const [preset, setPreset] = useState(initialPreset);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await analyticsService.getAllAnalytics();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  }, [preset]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    data,
    preset,
    setPreset,
    isLoading,
    error,
    refetch: fetchAnalytics,
  };
}

export default useAnalytics;

