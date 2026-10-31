import { useState, useEffect, useCallback } from 'react';
import { reportService } from '../services/reportService';

/**
 * Hook for consuming SaaS Accounting & Aging Reports
 */
export function useReports() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await reportService.getAllReports();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchReports,
  };
}

export default useReports;

