import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { LoadingSkeleton } from '../common/LoadingSkeleton';

/**
 * StatCard
 * Reusable metric card wrapper for SaaS KPI indicators with full dark mode support.
 *
 * @param {Object} props
 * @param {string} props.title
 * @param {string|number} [props.value]
 * @param {string|number} [props.change]
 * @param {'positive'|'negative'|'neutral'} [props.changeType='neutral']
 * @param {string} [props.changePeriod]
 * @param {React.ComponentType} [props.icon]
 * @param {string} [props.subtitle]
 * @param {React.ReactNode} [props.badge]
 * @param {boolean} [props.loading=false]
 * @param {string} [props.className]
 */
export const StatCard = ({
  title,
  value,
  change,
  changeType = 'neutral',
  changePeriod,
  icon: Icon,
  subtitle,
  badge,
  loading = false,
  className = '',
}) => {
  if (loading) {
    return <LoadingSkeleton variant="stat" className={className} />;
  }

  const isPositive = changeType === 'positive';
  const isNegative = changeType === 'negative';

  return (
    <div
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors select-none ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-600 dark:text-slate-400 truncate">
          {title}
        </span>
        <div className="flex items-center gap-2">
          {badge}
          {Icon && (
            <div className="w-9 h-9 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400">
              <Icon size={18} className="stroke-[1.75]" />
            </div>
          )}
        </div>
      </div>

      <div className="mt-3">
        <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          {value ?? '—'}
        </div>

        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {subtitle}
          </p>
        )}

        {(change || changePeriod) && (
          <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
            {change && (
              <span
                className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
                  isPositive
                    ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800'
                    : isNegative
                    ? 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800'
                    : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {isPositive ? (
                  <ArrowUpRight size={13} className="stroke-[2.5]" />
                ) : isNegative ? (
                  <ArrowDownRight size={13} className="stroke-[2.5]" />
                ) : (
                  <Minus size={13} className="stroke-[2.5]" />
                )}
                {change}
              </span>
            )}

            {changePeriod && (
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                {changePeriod}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
