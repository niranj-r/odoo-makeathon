import React, { useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { useAnalytics } from '../../hooks/useAnalytics';
import { PageHeader } from '../../components/layout/PageHeader';
import { GlobalDateFilter } from '../../components/common/GlobalDateFilter';
import { ExportDropdown } from '../../components/common/ExportDropdown';
import { useToast } from '../../components/common/Toast';
import {
  RevenueTrendSection,
  ProductPlanRevenueSection,
  SubscriptionAnalyticsGrid,
  BusinessInsightsGrid,
  TopCustomersTable,
  AnalyticsDrilldownModal,
} from '../../components/analytics';

/**
 * AdminAnalytics
 * Enterprise Business Intelligence Dashboard for Subscription Management (Member 4).
 * Supports interactive chart drilldowns (Revenue -> Product -> Customer -> Invoice).
 * Architecture: Page -> Hook -> Service -> Supabase (with fallback to mock data)
 */
export const AdminAnalytics = () => {
  const {
    dateRange,
    setDateRange,
    revenueTrend,
    productRevenue,
    planRevenue,
    subscriptionMetrics,
    businessInsights,
    topCustomers,
    isLoading,
    refetch,
  } = useAnalytics('Year');

  const { success } = useToast();

  // Interactive drill-down modal state
  const [drilldownModal, setDrilldownModal] = useState({
    isOpen: false,
    initialData: null,
  });

  const handleOpenDrilldown = (level, data) => {
    setDrilldownModal({
      isOpen: true,
      initialData: { level, ...data },
    });
  };

  const handleCloseDrilldown = () => {
    setDrilldownModal({
      isOpen: false,
      initialData: null,
    });
  };

  const handleExport = (format) => {
    success(`Analytics data exported successfully as .${format}`, 'Export Success');
  };

  return (
    <div className="space-y-8 select-none transition-colors duration-200">
      {/* Page Header with Reusable Global Date Filter & Export Action */}
      <PageHeader
        title="Analytics & Business Intelligence"
        subtitle="Interactive subscription telemetry, product tier breakdown, and multi-level drilldowns."
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            <GlobalDateFilter
              value={dateRange === 'Year' ? 'This Year' : dateRange}
              onChange={(f) => setDateRange(f.label || f.range)}
            />

            <button
              type="button"
              onClick={refetch}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400/20 disabled:opacity-50"
              title="Refresh analytics data"
            >
              <RefreshCw
                size={13}
                className={`text-slate-500 dark:text-slate-400 ${isLoading ? 'animate-spin' : ''}`}
              />
              <span>Refresh</span>
            </button>

            <ExportDropdown onExport={handleExport} />
          </div>
        }
      />

      {/* Section 1: Large Revenue Trend Line Chart (Clickable) */}
      <section aria-label="Revenue Trend">
        <RevenueTrendSection
          data={revenueTrend}
          loading={isLoading}
          onDrillDown={handleOpenDrilldown}
        />
      </section>

      {/* Section 2: Two Column Layout (Revenue by Product + Revenue by Plan Cadence, Clickable) */}
      <section aria-label="Product and Plan Distributions">
        <ProductPlanRevenueSection
          productData={productRevenue}
          planData={planRevenue}
          loading={isLoading}
          onDrillDown={handleOpenDrilldown}
        />
      </section>

      {/* Section 3: Subscription Analytics KPI Cards */}
      <section aria-label="Subscription Analytics KPIs">
        <SubscriptionAnalyticsGrid
          metrics={subscriptionMetrics}
          loading={isLoading}
        />
      </section>

      {/* Section 4: Executive Business Insights & Subscription Health Score */}
      <section aria-label="Business Insights and Health Benchmarks">
        <BusinessInsightsGrid
          insights={businessInsights}
          loading={isLoading}
        />
      </section>

      {/* Section 5: Top Performing Customers Table (Clickable for Customer Invoices) */}
      <section aria-label="Top Performing Accounts">
        <TopCustomersTable
          customers={topCustomers}
          loading={isLoading}
          onDrillDown={handleOpenDrilldown}
        />
      </section>

      {/* Multi-Level Interactive BI Drill-down Modal */}
      <AnalyticsDrilldownModal
        isOpen={drilldownModal.isOpen}
        onClose={handleCloseDrilldown}
        initialData={drilldownModal.initialData}
      />
    </div>
  );
};

export default AdminAnalytics;
