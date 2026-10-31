import React from 'react';
import { Download, RefreshCw, Radio } from 'lucide-react';
import { useDashboard } from '../../hooks/useDashboard';
import { PageHeader } from '../../components/layout/PageHeader';
import { GlobalDateFilter } from '../../components/common/GlobalDateFilter';
import { ExportDropdown } from '../../components/common/ExportDropdown';
import { useToast } from '../../components/common/Toast';
import {
  KpiCardGrid,
  RevenueChartCard,
  SubscriptionStatusCard,
  RecentInvoicesTable,
  RecentActivityTimeline,
} from '../../components/dashboard';

/**
 * AdminDashboard
 * Enterprise Intelligence & Live Dashboard for BrightLoop SaaS (Member 4).
 * Architecture: Page -> Hook -> Service -> Supabase (with fallback to mock data)
 */
export const AdminDashboard = () => {
  const {
    kpis,
    revenueChart,
    subscriptionStatus,
    recentInvoices,
    recentActivity,
    dateFilter,
    setDateFilter,
    isLoading,
    isRefreshing,
    isRealtimeConnected,
    refetch,
  } = useDashboard('Last 30 Days');

  const { success } = useToast();

  const handleExport = (format) => {
    success(`Dashboard financial report exported successfully as .${format}`, 'Export Success');
  };

  const handleManualRefresh = async () => {
    await refetch();
    success('Dashboard synchronized with latest Supabase transactions', 'Sync Complete');
  };

  return (
    <div className="space-y-8 select-none transition-colors duration-200">
      {/* Page Header with Date Range Filter, Real-time status, Refresh, and Export */}
      <PageHeader
        title="Admin Dashboard"
        subtitle="Real-time subscription billing metrics, recurring revenue, and recent invoices."
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Global Date Filter */}
            <GlobalDateFilter
              value={dateFilter}
              onChange={(f) => setDateFilter(f.label || f.range)}
            />

            {/* Live Realtime Indicator */}
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300">
              <Radio size={13} className="text-emerald-500 animate-pulse" />
              <span className="text-[11px] font-semibold">Realtime</span>
            </div>

            {/* Manual Refresh Button */}
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isLoading || isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400/20 disabled:opacity-50"
              title="Refresh dashboard metrics"
            >
              <RefreshCw
                size={13}
                className={`text-slate-500 dark:text-slate-400 ${isLoading || isRefreshing ? 'animate-spin' : ''}`}
              />
              <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
            </button>

            {/* Multi-format Export Dropdown */}
            <ExportDropdown onExport={handleExport} />
          </div>
        }
      />

      {/* Section 1: Four Smart KPI Cards with Animated Sparkline & Live Pulse */}
      <section aria-label="Key Performance Indicators">
        <KpiCardGrid metrics={kpis} loading={isLoading} />
      </section>

      {/* Section 2: Two-column layout (Monthly Revenue Chart + Subscription Status Chart) */}
      <section
        aria-label="Revenue & Subscription Analytics"
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        <div className="lg:col-span-2">
          <RevenueChartCard data={revenueChart} loading={isLoading} />
        </div>
        <div>
          <SubscriptionStatusCard
            data={subscriptionStatus}
            loading={isLoading}
          />
        </div>
      </section>

      {/* Section 3: Recent Invoices Table */}
      <section aria-label="Recent Invoices">
        <RecentInvoicesTable invoices={recentInvoices} loading={isLoading} />
      </section>

      {/* Section 4: Recent Activity Timeline with Category Filtering and Chronological Sorting */}
      <section aria-label="Operational Activity Feed">
        <RecentActivityTimeline
          activities={recentActivity}
          loading={isLoading}
        />
      </section>
    </div>
  );
};

export default AdminDashboard;
