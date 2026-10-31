import React from 'react';
import {
  UserPlus,
  RefreshCw,
  UserX,
  PauseCircle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { LoadingSkeleton } from '../common/LoadingSkeleton';

const iconMap = {
  UserPlus,
  RefreshCw,
  UserX,
  PauseCircle,
  TrendingUp,
};

/**
 * SubscriptionAnalyticsGrid
 * 5-column responsive KPI card grid tracking subscription acquisition, renewals, churn, and pauses.
 *
 * @param {Object} props
 * @param {Array} props.metrics
 * @param {boolean} [props.loading=false]
 */
export const SubscriptionAnalyticsGrid = ({ metrics = [], loading = false }) => {
  if (loading || metrics.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <LoadingSkeleton key={i} variant="stat" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">
          Subscription Lifecycle & Movement
        </h3>
        <span className="text-xs text-slate-400 font-medium">
          Net movement across reporting window
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {metrics.map((metric) => {
          const Icon = iconMap[metric.iconName] || TrendingUp;
          const isPositive = metric.changeType === 'positive';
          const isNeutral = metric.changeType === 'neutral';

          return (
            <div
              key={metric.id}
              className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-slate-300 transition-colors flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 truncate">
                  {metric.title}
                </span>
                <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <Icon size={15} className="stroke-[2]" />
                </div>
              </div>

              <div className="mt-3">
                <div className="text-xl font-bold text-slate-900 tracking-tight">
                  {metric.value}
                </div>

                <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                  <span
                    className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
                      isPositive
                        ? 'text-emerald-700 bg-emerald-50 border border-emerald-200/60'
                        : isNeutral
                        ? 'text-slate-600 bg-slate-100 border border-slate-200'
                        : 'text-rose-700 bg-rose-50 border border-rose-200/60'
                    }`}
                  >
                    {isPositive ? (
                      <ArrowUpRight size={12} className="stroke-[2.5]" />
                    ) : (
                      <ArrowDownRight size={12} className="stroke-[2.5]" />
                    )}
                    {metric.change}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium truncate">
                    {metric.changePeriod}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SubscriptionAnalyticsGrid;

