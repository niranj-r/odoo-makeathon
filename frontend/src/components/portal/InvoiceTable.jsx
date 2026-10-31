import React, { useState, useMemo } from 'react';
import { Eye, FileText, Search, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { ExportDropdown } from '../common/ExportDropdown';
import { EmptyState } from '../common/EmptyState';

const STATUS_BADGES = {
  Paid: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800',
  Pending: 'text-amber-700 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800',
  Overdue: 'text-rose-700 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800',
  Cancelled: 'text-slate-600 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
};

/**
 * InvoiceTable
 * Enterprise interactive table with multi-filter bar, sorting, rows-per-page, export dropdown, and empty states.
 */
export const InvoiceTable = ({
  invoices = [],
  onViewInvoice,
  onDownloadInvoice,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All');
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);

  // Filtered & Sorted
  const filteredData = useMemo(() => {
    let list = [...invoices];

    // Status filter
    if (statusFilter !== 'All') {
      list = list.filter((i) => i.status.toLowerCase() === statusFilter.toLowerCase());
    }

    // Search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(
        (i) =>
          i.invoiceNumber.toLowerCase().includes(q) ||
          i.subscriptionPlan.toLowerCase().includes(q) ||
          String(i.amount).includes(q)
      );
    }

    // Sorting
    list.sort((a, b) => {
      let aVal = a[sortField === 'amount' ? 'amount' : 'issueDate'];
      let bVal = b[sortField === 'amount' ? 'amount' : 'issueDate'];

      if (sortField === 'amount') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return sortDirection === 'asc'
        ? new Date(aVal) - new Date(bVal)
        : new Date(bVal) - new Date(aVal);
    });

    return list;
  }, [invoices, statusFilter, searchTerm, sortField, sortDirection]);

  // Paginated Slice
  const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, currentPage, rowsPerPage]);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden select-none transition-colors duration-200">
      {/* Table Control Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search invoice #, plan, or amount..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Overdue">Overdue</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
          </select>
        </div>
      </div>

      {/* Table Canvas */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <th className="px-6 py-3">Invoice #</th>
              <th className="px-6 py-3">Plan Package</th>
              <th
                className="px-6 py-3 cursor-pointer hover:text-slate-800 dark:hover:text-slate-200"
                onClick={() => toggleSort('date')}
              >
                <div className="flex items-center gap-1">
                  <span>Issue Date</span>
                  <ArrowUpDown size={11} />
                </div>
              </th>
              <th className="px-6 py-3">Due Date</th>
              <th
                className="px-6 py-3 text-right cursor-pointer hover:text-slate-800 dark:hover:text-slate-200"
                onClick={() => toggleSort('amount')}
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Amount</span>
                  <ArrowUpDown size={11} />
                </div>
              </th>
              <th className="px-6 py-3 text-center">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {paginatedData.length > 0 ? (
              paginatedData.map((inv) => (
                <tr
                  key={inv.id}
                  className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="px-6 py-3.5 font-mono font-bold text-blue-600 dark:text-blue-400">
                    {inv.invoiceNumber}
                  </td>
                  <td className="px-6 py-3.5 font-medium text-slate-800 dark:text-slate-200">
                    {inv.subscriptionPlan}
                  </td>
                  <td className="px-6 py-3.5 text-slate-600 dark:text-slate-300">
                    {formatDate(inv.issueDate)}
                  </td>
                  <td className="px-6 py-3.5 text-slate-600 dark:text-slate-300">
                    {formatDate(inv.dueDate)}
                  </td>
                  <td className="px-6 py-3.5 text-right font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrency(inv.amount)}
                  </td>
                  <td className="px-6 py-3.5 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-full border ${
                        STATUS_BADGES[inv.status] ||
                        'text-slate-600 bg-slate-100 border-slate-200'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <div className="inline-flex items-center gap-1.5 justify-end">
                      <button
                        type="button"
                        onClick={() => onViewInvoice?.(inv)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-blue-600 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 border border-slate-200 dark:border-slate-700 rounded-md transition-colors"
                        title="View invoice summary"
                      >
                        <Eye size={12} />
                        View
                      </button>

                      <ExportDropdown
                        label="Download"
                        onExport={(fmt) => onDownloadInvoice?.(inv, fmt)}
                      />
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                  <EmptyState preset="invoices" />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-6 py-3 bg-slate-50/75 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div>
          Showing page <span className="font-semibold text-slate-800 dark:text-slate-200">{currentPage}</span> of{' '}
          <span className="font-semibold text-slate-800 dark:text-slate-200">{totalPages}</span> ({filteredData.length} records)
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="p-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="p-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceTable;
