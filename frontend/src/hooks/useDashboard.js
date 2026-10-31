import { useState, useEffect, useCallback, useRef } from 'react';
import { dashboardService } from '../services/dashboardService';

/**
 * useDashboard Hook
 * Exposes Member 4 Admin Dashboard metrics, Recharts series, invoices, and activity feed.
 * Features: Live Supabase Realtime channel subscription + date filtering + background auto-refresh.
 * Architecture: Component -> Hook -> Service -> Supabase
 */
export function useDashboard(initialDateFilter = 'Last 30 Days') {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [dateFilter, setDateFilter] = useState(initialDateFilter);
  const [error, setError] = useState(null);

  const isMountedRef = useRef(true);

  const fetchDashboardData = useCallback(async (isSilent = false) => {
    if (!isSilent) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setError(null);

    try {
      const result = await dashboardService.getAdminDashboardData(dateFilter);
      if (isMountedRef.current) {
        setData(result);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [dateFilter]);

  // Initial fetch and on date filter change
  useEffect(() => {
    isMountedRef.current = true;
    fetchDashboardData(false);

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchDashboardData]);

  // Real-time channel subscription to Supabase postgres_changes
  useEffect(() => {
    const unsubscribe = dashboardService.subscribeToRealtime((table, payload) => {
      // Trigger a smooth background refresh when DB data changes
      fetchDashboardData(true);
    });

    setIsRealtimeConnected(true);

    return () => {
      if (unsubscribe) unsubscribe();
      setIsRealtimeConnected(false);
    };
  }, [fetchDashboardData]);

  return {
    kpis: data?.kpis || [],
    revenueChart: data?.revenueChart || [],
    subscriptionStatus: data?.subscriptionStatus || [],
    recentInvoices: data?.recentInvoices || [],
    recentActivity: data?.recentActivity || [],
    dateFilter,
    setDateFilter,
    isLoading,
    isRefreshing,
    isRealtimeConnected,
    error,
    refetch: () => fetchDashboardData(false),
  };
}

export default useDashboard;
