import { useState, useEffect, useCallback, useMemo } from 'react';
import { reportsService } from '../services/reportsService';
import { defaultReportFilters, reportFilterOptions } from '../constants/reportFilters';
import { exportToCsv, exportToExcel } from '../utils/exportCsv';
import { formatCurrency, formatDate } from '../utils/formatters';

const REPORT_COLUMNS = [
  { header: 'Customer', accessor: 'customer' },
  { header: 'Email', accessor: 'email' },
  { header: 'Subscription ID', accessor: 'subscription' },
  { header: 'Plan', accessor: 'plan' },
  { header: 'Invoices', accessor: 'invoiceCount' },
  {
    header: 'Revenue ($)',
    accessor: (row) => formatCurrency(row.revenue),
  },
  {
    header: 'Outstanding ($)',
    accessor: (row) => formatCurrency(row.outstanding),
  },
  {
    header: 'Last Payment',
    accessor: (row) => formatDate(row.lastPayment),
  },
  { header: 'Subscription Status', accessor: 'status' },
  { header: 'Payment Status', accessor: 'paymentStatus' },
];

/**
 * useReports Hook
 * Enterprise state management for BrightLoop SaaS reporting workspace.
 * Architecture: Page -> Hook -> Service -> Supabase (with fallback to mock data)
 */
export function useReports() {
  const [summary, setSummary] = useState([]);
  const [analysisData, setAnalysisData] = useState([]);
  const [breakdown, setBreakdown] = useState({ byProduct: [], byPlan: [] });
  const [insights, setInsights] = useState([]);
  const [rawTableData, setRawTableData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Section 2: active metric switcher (Revenue, Invoices, Payments, Subscriptions)
  const [activeMetric, setActiveMetric] = useState('Revenue');

  // Section 3: Filter panel state
  const [filters, setFilters] = useState(defaultReportFilters);

  // Section 4: Table Sorting and Pagination state
  const [sortConfig, setSortConfig] = useState({
    key: 'revenue',
    direction: 'desc',
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  // Load all reports data
  const loadReports = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await reportsService.getAllReportsData();
      setSummary(data.summary);
      setAnalysisData(data.analysisData);
      setBreakdown(data.breakdown);
      setInsights(data.insights);
      setRawTableData(data.tableData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // Section 3: Filter Handlers
  const setFilter = useCallback((field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
    setPage(1); // Reset to page 1 on filter change
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultReportFilters);
    setPage(1);
  }, []);

  // Section 4: Filter Pipeline
  const filteredData = useMemo(() => {
    return rawTableData.filter((row) => {
      // Customer filter
      if (filters.customer !== 'All Customers' && row.customer !== filters.customer) {
        return false;
      }
      // Plan filter
      if (filters.plan !== 'All Plans' && row.plan !== filters.plan) {
        return false;
      }
      // Subscription Status filter
      if (filters.subscriptionStatus !== 'All Statuses' && row.status !== filters.subscriptionStatus) {
        return false;
      }
      // Payment Status filter
      if (filters.paymentStatus !== 'All Payments' && row.paymentStatus !== filters.paymentStatus) {
        return false;
      }
      // Search input filter (matches customer name, email, or subscription ID)
      if (filters.search && filters.search.trim().length > 0) {
        const query = filters.search.toLowerCase().trim();
        const matchesCustomer = row.customer.toLowerCase().includes(query);
        const matchesEmail = row.email.toLowerCase().includes(query);
        const matchesSub = row.subscription.toLowerCase().includes(query);
        if (!matchesCustomer && !matchesEmail && !matchesSub) {
          return false;
        }
      }
      return true;
    });
  }, [rawTableData, filters]);

  // Sorting Pipeline
  const sortedData = useMemo(() => {
    const list = [...filteredData];
    const { key, direction } = sortConfig;

    list.sort((a, b) => {
      let aVal = a[key];
      let bVal = b[key];

      if (key === 'lastPayment') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      if (typeof aVal === 'string') {
        return direction === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return direction === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return list;
  }, [filteredData, sortConfig]);

  // Pagination Pipeline
  const totalRecords = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, page, pageSize]);

  // Sort Handler
  const handleSort = useCallback((columnKey) => {
    setSortConfig((prev) => {
      if (prev.key === columnKey) {
        return {
          key: columnKey,
          direction: prev.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      return {
        key: columnKey,
        direction: 'desc',
      };
    });
  }, []);

  // Top-Right Client-Side Export Handlers
  const handleExportCsv = useCallback(() => {
    const timestamp = new Date().toISOString().split('T')[0];
    exportToCsv(`BrightLoop_Report_${timestamp}`, REPORT_COLUMNS, sortedData);
  }, [sortedData]);

  const handleExportExcel = useCallback(() => {
    const timestamp = new Date().toISOString().split('T')[0];
    exportToExcel(`BrightLoop_Report_${timestamp}`, REPORT_COLUMNS, sortedData);
  }, [sortedData]);

  const handlePrint = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }, []);

  return {
    // Data
    summary,
    analysisData,
    breakdown,
    insights,
    tableData: paginatedData,
    allFilteredRecords: sortedData,
    filterOptions: reportFilterOptions,

    // State
    filters,
    activeMetric,
    sortConfig,
    page,
    pageSize,
    setPageSize,
    totalRecords,
    totalPages,
    isLoading,
    error,

    // Actions
    setFilter,
    resetFilters,
    setActiveMetric,
    handleSort,
    setPage,
    exportCsv: handleExportCsv,
    exportExcel: handleExportExcel,
    printReport: handlePrint,
    refetch: loadReports,
  };
}

export default useReports;
