import React from 'react';
import { LoadingSkeleton } from '../common/LoadingSkeleton';

/**
 * SummaryCard
 * Reusable container wrapper for grouped summary metrics or info sections.
 *
 * @param {Object} props
 * @param {string} props.title
 * @param {string} [props.subtitle]
 * @param {React.ReactNode} [props.badge]
 * @param {React.ReactNode} [props.action]
 * @param {React.ReactNode} [props.footer]
 * @param {React.ReactNode} [props.children]
 * @param {boolean} [props.loading=false]
 * @param {string} [props.className]
 */
export const SummaryCard = ({
  title,
  subtitle,
  badge,
  action,
  footer,
  children,
  loading = false,
  className = '',
}) => {
  if (loading) {
    return <LoadingSkeleton variant="card" className={className} />;
  }

  return (
    <div className={`bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden ${className}`}>
      {(title || subtitle || action || badge) && (
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
      )}

      <div className="p-6">
        {children}
      </div>

      {footer && (
        <div className="px-6 py-3 bg-slate-50/60 border-t border-slate-100 text-xs text-slate-500">
          {footer}
        </div>
      )}
    </div>
  );
};

export default SummaryCard;

