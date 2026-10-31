import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  FileText,
  RefreshCw,
  UserPlus,
  ArrowUpCircle,
  Clock,
  Filter,
} from 'lucide-react';
import { LoadingSkeleton } from '../common/LoadingSkeleton';

const activityIconMap = {
  CreditCard,
  FileText,
  RefreshCw,
  UserPlus,
  ArrowUpCircle,
};

/**
 * RecentActivityTimeline
 * Enterprise timeline feed with real-time sorting and filtering across lifecycle events:
 * - customer created
 * - subscription upgraded
 * - invoice generated
 * - payment received
 * - renewal completed
 *
 * @param {Object} props
 * @param {Array} props.activities
 * @param {boolean} [props.loading=false]
 */
export const RecentActivityTimeline = ({ activities = [], loading = false }) => {
  const [filterType, setFilterType] = useState('all');

  // Auto-sort activities chronologically (newest first)
  const sortedActivities = useMemo(() => {
    if (!activities || !Array.isArray(activities)) return [];
    return [...activities].sort((a, b) => {
      const timeA = a.rawTime ? new Date(a.rawTime).getTime() : 0;
      const timeB = b.rawTime ? new Date(b.rawTime).getTime() : 0;
      return timeB - timeA;
    });
  }, [activities]);

  // Filtered by selected category chip
  const filteredActivities = useMemo(() => {
    if (filterType === 'all') return sortedActivities;
    return sortedActivities.filter((act) => {
      const type = (act.type || act.eventType || '').toLowerCase();
      if (filterType === 'payments') return type.includes('payment');
      if (filterType === 'subscriptions') return type.includes('subscription') || type.includes('renewal');
      if (filterType === 'invoices') return type.includes('invoice');
      if (filterType === 'customers') return type.includes('customer');
      return true;
    });
  }, [sortedActivities, filterType]);

  if (loading) {
    return <LoadingSkeleton variant="table" />;
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs p-6 select-none transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5 gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <Clock size={17} className="text-blue-600 dark:text-blue-400 stroke-[2.2]" />
            <span>Recent Activity Feed</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time feed of billing cycles, subscription upgrades, and new accounts
          </p>
        </div>

        {/* Live Status Pill with pulsing green beacon */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Sync
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 mb-5 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'all', label: 'All Events' },
          { id: 'payments', label: 'Payments' },
          { id: 'subscriptions', label: 'Subscriptions' },
          { id: 'invoices', label: 'Invoices' },
          { id: 'customers', label: 'Customers' },
        ].map((tab) => {
          const isActive = filterType === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterType(tab.id)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors whitespace-nowrap ${isActive
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/80 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'
                }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Timeline Items */}
      {filteredActivities.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
          No activity logs matching this category.
        </div>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
          {filteredActivities.map((act) => {
            const Icon = activityIconMap[act.icon] || FileText;
            const isSuccess = act.statusVariant === 'success';
            const isDanger = act.statusVariant === 'danger';
            const isPrimary = act.statusVariant === 'primary';

            return (
              <div key={act.id} className="relative flex items-start gap-3.5 group">
                {/* Timeline Bullet Icon */}
                <div
                  className={`absolute -left-6 mt-0.5 w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center shrink-0 shadow-xs ${isSuccess
                    ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/20'
                    : isDanger
                      ? 'bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 ring-2 ring-rose-500/20'
                      : isPrimary
                        ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 ring-2 ring-slate-400/20'
                    }`}
                >
                  <Icon size={12} className="stroke-[2.5]" />
                </div>

                {/* Event Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {act.title}
                      </h4>
                      {act.badgeText && (
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {act.badgeText}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 shrink-0 font-medium">
                      {act.timestamp}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {act.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecentActivityTimeline;
