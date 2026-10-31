import React from 'react';
import {
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Inbox,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { EmptyState } from '../common/EmptyState';

const STATUS_BADGES = {
  Active: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800',
  'Past Due': 'text-amber-700 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800',
  Trialing: 'text-blue-700 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800',
  Cancelled: 'text-rose-700 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800',
};

/**
 * ReportTableSection
 * Section 4: Enterprise subscription reports data table with sticky header, sorting, rows-per-page, & pagination.
 *
 * @param {Object} props
 * @param {Array} props.data - Paginated table records
 * @param {Object} props.sortConfig - { key, direction }
 * @param {(key: string) => void} props.onSort
 * @param {number} props.page
 * @param {number} props.pageSize
 * @param {(size: number) => void} [props.onPageSizeChange]
 * @param {number} props.totalRecords
 * @param {number} props.totalPages
 * @param {(page: number) => void} props.onPageChange
 * @param {() => void} [props.onResetFilters]
 * @param {boolean} [props.loading=false]
 */
export const ReportTableSection = ({
  data = [],
  sortConfig = { key: 'revenue', direction: 'desc' },
  onSort,
  page = 1,
  pageSize = 8,
  onPageSizeChange,
  totalRecords = 0,
  totalPages = 1,
  onPageChange,
  onResetFilters,
  loading = false,
}) => {
  const columns = [
    { key: 'customer', label: 'Customer', sortable: true, align: 'left' },
    { key: 'subscription', label: 'Subscription', sortable: true, align: 'left' },
    { key: 'plan', label: 'Plan', sortable: true, align: 'left' },
    { key: 'invoiceCount', label: 'Invoices', sortable: true, align: 'center' },
    { key: 'revenue', label: 'Revenue', sortable: true, align: 'right' },
    { key: 'outstanding', label: 'Outstanding', sortable: true, align: 'right' },
    { key: 'lastPayment', label: 'Last Payment', sortable: true, align: 'right' },
    { key: 'status', label: 'Status', sortable: true, align: 'center' },
  ];

  const renderSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown size={13} className="text-slate-400 opacity-60" />;
    }
    return sortConfig.direction === 'asc' ? (
      <ChevronUp size={14} className="text-blue-600 dark:text-blue-400" />
    ) : (
      <ChevronDown size={14} className="text-blue-600 dark:text-blue-400" />
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden select-none transition-colors duration-200">
      {/* Table Header Bar with Rows Per Page */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Subscription & Revenue Ledger
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Audit-grade itemized transaction breakdown ({totalRecords} total matching records)
          </p>
        </div>

        {/* Rows Per Page Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
            className="px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value={5}>5 per page</option>
            <option value={8}>8 per page</option>
            <option value={15}>15 per page</option>
            <option value={25}>25 per page</option>
          </select>
        </div>
      </div>

      {/* Table Canvas */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`py-3.5 px-4 font-semibold ${
                    col.align === 'right'
                      ? 'text-right'
                      : col.align === 'center'
                      ? 'text-center'
                      : 'text-left'
                  } ${col.sortable ? 'cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-700/50 transition-colors' : ''}`}
                  onClick={() => col.sortable && onSort?.(col.key)}
                >
                  <div
                    className={`inline-flex items-center gap-1.5 ${
                      col.align === 'right'
                        ? 'justify-end w-full'
                        : col.align === 'center'
                        ? 'justify-center w-full'
                        : ''
                    }`}
                  >
                    <span>{col.label}</span>
                    {col.sortable && renderSortIcon(col.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.length > 0 ? (
              data.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors"
                >
                  {/* Customer */}
                  <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{row.customer}</span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">{row.email}</span>
                    </div>
                  </td>

                  {/* Subscription ID */}
                  <td className="py-3 px-4 font-mono font-medium text-blue-600 dark:text-blue-400">
                    {row.subscription}
                  </td>

                  {/* Plan */}
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                    {row.plan}
                  </td>

                  {/* Invoice Count */}
                  <td className="py-3 px-4 text-center text-slate-600 dark:text-slate-400">
                    {row.invoiceCount}
                  </td>

                  {/* Revenue */}
                  <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrency(row.revenue)}
                  </td>

                  {/* Outstanding */}
                  <td className="py-3 px-4 text-right font-medium">
                    {row.outstanding > 0 ? (
                      <span className="text-amber-600 font-bold">
                        {formatCurrency(row.outstanding)}
                      </span>
                    ) : (
                      <span className="text-slate-400">$0.00</span>
                    )}
                  </td>

                  {/* Last Payment */}
                  <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-400">
                    {formatDate(row.lastPayment)}
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-full border ${
                        STATUS_BADGES[row.status] ||
                        'text-slate-600 bg-slate-100 border-slate-200'
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="py-8 px-4 text-center">
                  <EmptyState
                    preset="search"
                    title="No report entries match your filters"
                    description="Try loosening your search terms or clearing customer and status filters to display subscription ledgers."
                    actionLabel="Reset All Filters"
                    onAction={onResetFilters}
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-6 py-3.5 bg-slate-50/75 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3 text-xs text-slate-600 dark:text-slate-400">
        <div>
          Showing page <span className="font-semibold text-slate-900 dark:text-slate-100">{page}</span> of{' '}
          <span className="font-semibold text-slate-900 dark:text-slate-100">{totalPages}</span> ({totalRecords} records)
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange?.(page - 1)}
            className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Previous page"
          >
            <ChevronLeft size={15} />
          </button>

          {/* Page numbers */}
          {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange?.(p)}
              className={`w-7 h-7 rounded-md text-xs font-medium transition-colors ${
                page === p
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {p}
            </button>
          ))}

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange?.(page + 1)}
            className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Next page"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportTableSection;
