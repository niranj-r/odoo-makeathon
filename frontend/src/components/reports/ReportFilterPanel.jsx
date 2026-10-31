import React from 'react';
import { Filter, Search, RotateCcw } from 'lucide-react';

/**
 * ReportFilterPanel
 * Section 3: Enterprise multi-parameter filter panel for reports.
 *
 * @param {Object} props
 * @param {Object} props.filters - Current filter values
 * @param {Object} props.filterOptions - Available dropdown lists
 * @param {(field: string, val: string) => void} props.onFilterChange
 * @param {() => void} props.onReset
 */
export const ReportFilterPanel = ({
  filters,
  filterOptions = {},
  onFilterChange,
  onReset,
}) => {
  const {
    dateRanges = [],
    customers = [],
    plans = [],
    subscriptionStatuses = [],
    paymentStatuses = [],
  } = filterOptions;

  const isFiltered =
    filters.dateRange !== 'All Time' ||
    filters.customer !== 'All Customers' ||
    filters.plan !== 'All Plans' ||
    filters.subscriptionStatus !== 'All Statuses' ||
    filters.paymentStatus !== 'All Payments' ||
    (filters.search && filters.search.trim().length > 0);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
      {/* Filter Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Filter size={16} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Report Filters
            </h3>
            <p className="text-xs text-slate-500">
              Refine accounting records and subscription parameters
            </p>
          </div>
          {isFiltered && (
            <span className="ml-2 px-2 py-0.5 text-[11px] font-semibold bg-blue-100 text-blue-700 rounded-full">
              Filtered
            </span>
          )}
        </div>

        {isFiltered && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
          >
            <RotateCcw size={13} />
            Clear Filters
          </button>
        )}
      </div>

      {/* Filter Form Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Search Input */}
        <div className="lg:col-span-2">
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Search
          </label>
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => onFilterChange('search', e.target.value)}
              placeholder="Customer, email, SUB-ID..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Date Range Select */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Date Range
          </label>
          <select
            value={filters.dateRange}
            onChange={(e) => onFilterChange('dateRange', e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
          >
            {dateRanges.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        {/* Customer Select */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Customer
          </label>
          <select
            value={filters.customer}
            onChange={(e) => onFilterChange('customer', e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
          >
            {customers.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        {/* Plan Select */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Plan Tier
          </label>
          <select
            value={filters.plan}
            onChange={(e) => onFilterChange('plan', e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
          >
            {plans.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        {/* Status Select */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Subscription Status
          </label>
          <select
            value={filters.subscriptionStatus}
            onChange={(e) => onFilterChange('subscriptionStatus', e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
          >
            {subscriptionStatuses.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default ReportFilterPanel;

