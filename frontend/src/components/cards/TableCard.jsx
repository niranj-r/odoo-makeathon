import React from 'react';
import { Inbox } from 'lucide-react';
import { LoadingSkeleton } from '../common/LoadingSkeleton';

/**
 * TableCard
 * Reusable card wrapper prepared for data tables, lists, and records.
 * Displays a clean table placeholder / empty state when no table rows are supplied.
 *
 * @param {Object} props
 * @param {string} props.title
 * @param {string} [props.subtitle]
 * @param {React.ReactNode} [props.badge]
 * @param {React.ReactNode} [props.action]
 * @param {React.ReactNode} [props.footer]
 * @param {boolean} [props.loading=false]
 * @param {string[]} [props.columns]
 * @param {string} [props.emptyTitle='No records found']
 * @param {string} [props.emptyDescription='New subscription transactions and billing events will appear here.']
 * @param {React.ReactNode} [props.children]
 * @param {string} [props.className]
 */
export const TableCard = ({
  title,
  subtitle,
  badge,
  action,
  footer,
  loading = false,
  columns = ['Customer', 'Plan', 'Billing Interval', 'Status', 'Amount', 'Date'],
  emptyTitle = 'No records found',
  emptyDescription = 'New subscription transactions and billing events will appear here.',
  children,
  className = '',
}) => {
  if (loading) {
    return <LoadingSkeleton variant="table" className={className} />;
  }

  return (
    <div
      className={`bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden ${className}`}
    >
      {/* Table Card Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4 flex-wrap">
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

      {/* Table Body / Empty Slot */}
      {children ? (
        <div className="overflow-x-auto">{children}</div>
      ) : (
        <div>
          {/* Header row */}
          {columns && columns.length > 0 && (
            <div className="bg-slate-50/75 border-b border-slate-100 px-6 py-3 flex items-center justify-between text-xs font-medium text-slate-500 uppercase tracking-wider">
              {columns.map((col, idx) => (
                <span
                  key={idx}
                  className={idx === 0 ? 'text-left flex-1' : 'text-right flex-1 hidden sm:block'}
                >
                  {col}
                </span>
              ))}
            </div>
          )}

          {/* Empty Table Body */}
          <div className="py-14 px-6 text-center flex flex-col items-center justify-center">
            <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3 border border-slate-200/80">
              <Inbox size={20} className="stroke-[1.75]" />
            </div>
            <h4 className="text-sm font-semibold text-slate-900">
              {emptyTitle}
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              {emptyDescription}
            </p>
          </div>
        </div>
      )}

      {/* Optional Table Footer / Pagination */}
      {footer && (
        <div className="px-6 py-3.5 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          {footer}
        </div>
      )}
    </div>
  );
};

export default TableCard;

