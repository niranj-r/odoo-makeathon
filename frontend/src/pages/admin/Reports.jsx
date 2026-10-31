import React from 'react';
import {
  FileText,
  FileSpreadsheet,
  Printer,
  Calendar,
} from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { GlobalDateFilter } from '../../components/common/GlobalDateFilter';
import { ExportModal } from '../../components/common/ExportModal';
import { useToast } from '../../components/common/Toast';
import {
  ReportSummaryCards,
  RevenueAnalysisSection,
  ReportFilterPanel,
  ReportTableSection,
  RevenueBreakdownSection,
  ReportInsightsSection,
} from '../../components/reports';
import { useReports } from '../../hooks/useReports';

/**
 * AdminReports Page
 * Member 4 Enterprise SaaS Reporting Workspace.
 * Composes executive financial summaries, interactive multi-dimensional analysis,
 * audit-grade customer subscription ledgers, and client-side exports.
 */
export const AdminReports = () => {
  const {
    summary,
    analysisData,
    breakdown,
    insights,
    tableData,
    filterOptions,
    filters,
    activeMetric,
    sortConfig,
    page,
    pageSize,
    setPageSize,
    totalRecords,
    totalPages,
    isLoading,
    setFilter,
    resetFilters,
    setActiveMetric,
    handleSort,
    setPage,
    exportCsv,
    exportExcel,
    printReport,
  } = useReports();

  const [exportModalOpen, setExportModalOpen] = React.useState(false);
  const { success, info } = useToast();

  const handleExportSelect = (format) => {
    if (format === 'csv') {
      exportCsv();
      success('CSV report generated and downloaded', 'Export Complete');
    } else if (format === 'excel') {
      exportExcel();
      success('Excel workbook (.xlsx) generated and downloaded', 'Export Complete');
    } else {
      info('Opening print preview for PDF report', 'Print Report');
      printReport();
    }
  };

  // Top-Right Action Controls (Date Filter, Export Modal, Print Report)
  const headerActions = (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Reusable Global Date Filter */}
      <GlobalDateFilter
        value={filters.dateRange || 'This Year'}
        onChange={(f) => setFilter('dateRange', f.label || f.range)}
      />

      {/* Export Report Modal Trigger */}
      <button
        type="button"
        onClick={() => setExportModalOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
        title="Open multi-format export dialog"
      >
        <FileSpreadsheet size={13} className="text-emerald-600 dark:text-emerald-400" />
        <span>Export Reports...</span>
      </button>

      {/* Print Report Button */}
      <button
        type="button"
        onClick={printReport}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
        title="Print this report workspace"
      >
        <Printer size={13} className="text-slate-600 dark:text-slate-400" />
        <span>Print</span>
      </button>
    </div>
  );

  return (
    <div className="space-y-6 pb-12 select-none transition-colors duration-200">
      {/* Page Header */}
      <PageHeader
        title="Reports"
        subtitle="Generate, analyze and export enterprise subscription financial reports."
        action={headerActions}
      />

      {/* SECTION 1: Report Summary Cards */}
      <section aria-label="Executive Financial Summary">
        <ReportSummaryCards summary={summary} loading={isLoading} />
      </section>

      {/* SECTION 2: Multi-Dimensional Revenue Analysis */}
      <section aria-label="Interactive Analysis Canvas">
        <RevenueAnalysisSection
          analysisData={analysisData}
          activeMetric={activeMetric}
          onMetricChange={setActiveMetric}
          loading={isLoading}
        />
      </section>

      {/* SECTION 3: Multi-Parameter Filter Panel */}
      <section aria-label="Audit Ledger Filters">
        <ReportFilterPanel
          filters={filters}
          options={filterOptions}
          onFilterChange={setFilter}
          onReset={resetFilters}
          loading={isLoading}
        />
      </section>

      {/* SECTION 4: Comprehensive Ledger Table */}
      <section aria-label="Subscription Ledger Table">
        <ReportTableSection
          data={tableData}
          sortConfig={sortConfig}
          onSort={handleSort}
          page={page}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          totalRecords={totalRecords}
          totalPages={totalPages}
          onPageChange={setPage}
          onResetFilters={resetFilters}
          loading={isLoading}
        />
      </section>

      {/* SECTION 5: Distribution Breakdown */}
      <section aria-label="Revenue Breakdown and Distributions">
        <RevenueBreakdownSection
          breakdown={breakdown}
          loading={isLoading}
        />
      </section>

      {/* SECTION 6: Key Financial Insights */}
      <section aria-label="Strategic Financial Observations">
        <ReportInsightsSection
          insights={insights}
          loading={isLoading}
        />
      </section>

      {/* Export Modal Dialog */}
      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        onExport={handleExportSelect}
        title="Export Reports & Ledgers"
      />
    </div>
  );
};

export default AdminReports;
