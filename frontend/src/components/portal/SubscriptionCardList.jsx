import React, { useState, useMemo } from 'react';
import {
  Calendar,
  CreditCard,
  Users,
  Eye,
  RefreshCw,
  PauseCircle,
  XCircle,
  ShieldCheck,
  Search,
  Filter,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { EmptyState } from '../common/EmptyState';

const STATUS_BADGES = {
  Active: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800',
  Paused: 'text-amber-700 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800',
  Cancelled: 'text-rose-700 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800',
};

/**
 * SubscriptionCardList
 * Upgraded with working Search, Status, and Billing Cycle filters.
 */
export const SubscriptionCardList = ({
  subscriptions = [],
  onView,
  onRenew,
  onPause,
  onCancel,
  showFilters = true,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [intervalFilter, setIntervalFilter] = useState('All');

  const filteredSubscriptions = useMemo(() => {
    let list = [...subscriptions];

    if (statusFilter !== 'All') {
      list = list.filter((s) => s.status.toLowerCase() === statusFilter.toLowerCase());
    }

    if (intervalFilter !== 'All') {
      list = list.filter((s) => s.interval.toLowerCase() === intervalFilter.toLowerCase());
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.plan.toLowerCase().includes(q) ||
          s.subscriptionNumber.toLowerCase().includes(q)
      );
    }

    return list;
  }, [subscriptions, statusFilter, intervalFilter, searchTerm]);

  return (
    <div className="space-y-4 select-none">
      {/* Search & Multi-Filter Bar */}
      {showFilters && (
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs flex flex-wrap items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search plan or subscription ID..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Filter size={13} />
              <span>Status:</span>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Paused">Paused</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            <select
              value={intervalFilter}
              onChange={(e) => setIntervalFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="All">All Cycles</option>
              <option value="Monthly">Monthly</option>
              <option value="Yearly">Yearly (Annual)</option>
            </select>

            <span className="text-[11px] text-slate-400">
              {filteredSubscriptions.length} plans
            </span>
          </div>
        </div>
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filteredSubscriptions.length > 0 ? (
          filteredSubscriptions.map((sub) => {
            const isPaused = sub.status === 'Paused';
            const isCancelled = sub.status === 'Cancelled';

            return (
              <div
                key={sub.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex flex-col justify-between"
              >
                <div>
                  {/* Header: Plan & Status */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                          {sub.plan}
                        </h3>
                        <span
                          className={`px-2 py-0.5 text-[11px] font-semibold rounded-full border ${
                            STATUS_BADGES[sub.status] ||
                            'text-slate-600 bg-slate-100 border-slate-200'
                          }`}
                        >
                          {sub.status}
                        </span>
                      </div>
                      <span className="font-mono text-xs text-slate-500 dark:text-slate-400 mt-1 inline-block">
                        {sub.subscriptionNumber}
                      </span>
                    </div>

                    <div className="text-right">
                      <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(sub.monthlyEquivalent)}
                        <span className="text-xs font-normal text-slate-500">
                          /mo
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {formatCurrency(sub.amount)} billed {sub.interval}
                      </span>
                    </div>
                  </div>

                  {/* Specs & Dates Grid */}
                  <div className="grid grid-cols-2 gap-3 py-3.5 my-3 border-y border-slate-100 dark:border-slate-800 text-xs">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <Calendar size={14} className="text-slate-400 shrink-0" />
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-medium">
                          Next Renewal
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {formatDate(sub.nextBillingDate)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <Users size={14} className="text-slate-400 shrink-0" />
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-medium">
                          Seats Allocated
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {sub.seats} Seats Active
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <CreditCard size={14} className="text-slate-400 shrink-0" />
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-medium">
                          Payment Method
                        </span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {sub.paymentMethod}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-medium">
                          Auto-Renew
                        </span>
                        <span className="font-semibold text-emerald-600">
                          {sub.autoRenew ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Features list */}
                  <div className="space-y-1 mb-5">
                    {sub.features?.slice(0, 3).map((f, idx) => (
                      <div
                        key={idx}
                        className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => onView?.(sub)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 border border-blue-200 dark:border-blue-800 rounded-lg transition-colors"
                  >
                    <Eye size={13} />
                    View Details
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onRenew?.(sub.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-slate-900 bg-white dark:bg-slate-800 hover:bg-slate-50 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors"
                      title="Renew subscription term"
                    >
                      <RefreshCw size={12} className="text-blue-600" />
                      Renew
                    </button>

                    {!isCancelled && (
                      <button
                        type="button"
                        onClick={() => onPause?.(sub.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-slate-900 bg-white dark:bg-slate-800 hover:bg-slate-50 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors"
                        title={isPaused ? 'Resume subscription' : 'Pause recurring renewals'}
                      >
                        <PauseCircle size={12} className="text-amber-600" />
                        {isPaused ? 'Resume' : 'Pause'}
                      </button>
                    )}

                    {!isCancelled && (
                      <button
                        type="button"
                        onClick={() => onCancel?.(sub.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 bg-white dark:bg-slate-800 hover:bg-rose-50 border border-slate-200 dark:border-slate-700 hover:border-rose-200 rounded-lg transition-colors"
                        title="Cancel subscription"
                      >
                        <XCircle size={12} />
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-2 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <EmptyState preset="subscriptions" />
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionCardList;
