import React from 'react';
import { BarChart3 } from 'lucide-react';
import { LoadingSkeleton } from '../common/LoadingSkeleton';

/**
 * ChartCard
 * Reusable card wrapper prepared for data visualization charts.
 * Displays a clean chart placeholder/empty state when no chart child is supplied.
 *
 * @param {Object} props
 * @param {string} props.title
 * @param {string} [props.subtitle]
 * @param {React.ReactNode} [props.badge]
 * @param {React.ReactNode} [props.action]
 * @param {React.ReactNode} [props.footer]
 * @param {string} [props.height='h-72']
 * @param {boolean} [props.loading=false]
 * @param {string} [props.emptyTitle='Chart ready for visualization']
 * @param {string} [props.emptyDescription='Metrics will display here once analytics data is connected.']
 * @param {React.ReactNode} [props.children]
 * @param {string} [props.className]
 */
export const ChartCard = ({
  title,
  subtitle,
  badge,
  action,
  footer,
  height = 'h-72',
  loading = false,
  emptyTitle = 'Chart ready for visualization',
  emptyDescription = 'Metrics will display here once analytics data is connected.',
  children,
  className = '',
}) => {
  if (loading) {
    return <LoadingSkeleton variant="chart" className={className} />;
  }

  return (
    <div
      className={`bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col justify-between overflow-hidden ${className}`}
    >
      {/* Card Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-slate-900 tracking-tight">
              {title}
            </h3>
            {badge}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
        {action && <div className="flex items-center gap-2">{action}</div>}
      </div>

      {/* Chart Canvas Area */}
      <div className={`p-6 flex-1 flex flex-col justify-center ${height}`}>
        {children ? (
          children
        ) : (
          <div className="w-full h-full border border-dashed border-slate-200 rounded-lg bg-slate-50/50 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-10 h-10 rounded-lg bg-white border border-slate-200/80 shadow-xs flex items-center justify-center text-slate-400 mb-2.5">
              <BarChart3 size={20} className="stroke-[1.75]" />
            </div>
            <p className="text-sm font-medium text-slate-700">
              {emptyTitle}
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              {emptyDescription}
            </p>
          </div>
        )}
      </div>

      {/* Optional Card Footer */}
      {footer && (
        <div className="px-6 py-3 bg-slate-50/60 border-t border-slate-100 text-xs text-slate-500">
          {footer}
        </div>
      )}
    </div>
  );
};

export default ChartCard;

