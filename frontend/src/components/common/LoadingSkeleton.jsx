import React from 'react';

/**
 * LoadingSkeleton
 * Reusable shimmer skeleton component for cards, stats, charts, and tables.
 *
 * @param {Object} props
 * @param {'stat'|'chart'|'table'|'card'|'text'|'rect'|'circle'} [props.variant='rect']
 * @param {number} [props.count=1]
 * @param {string} [props.height]
 * @param {string} [props.width]
 * @param {string} [props.className]
 */
export const LoadingSkeleton = ({
  variant = 'rect',
  count = 1,
  height,
  width,
  className = '',
}) => {
  const items = Array.from({ length: count }, (_, idx) => idx);

  if (variant === 'stat') {
    return (
      <div className={`space-y-3 p-6 bg-white border border-slate-200 rounded-xl shadow-sm ${className}`}>
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
          <div className="h-8 w-8 bg-slate-200 rounded-lg animate-pulse" />
        </div>
        <div className="h-7 w-32 bg-slate-200 rounded animate-pulse" />
        <div className="h-3 w-40 bg-slate-200 rounded animate-pulse" />
      </div>
    );
  }

  if (variant === 'chart') {
    return (
      <div className={`p-6 bg-white border border-slate-200 rounded-xl shadow-sm ${className}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-2">
            <div className="h-5 w-36 bg-slate-200 rounded animate-pulse" />
            <div className="h-3 w-48 bg-slate-200 rounded animate-pulse" />
          </div>
          <div className="h-8 w-24 bg-slate-200 rounded-lg animate-pulse" />
        </div>
        <div className="h-64 w-full bg-slate-100 rounded-lg flex items-end justify-between p-4 gap-3 animate-pulse">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="w-full bg-slate-200 rounded-t"
              style={{ height: `${25 + (i * 11) % 65}%` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className={`bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden ${className}`}>
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="h-5 w-40 bg-slate-200 rounded animate-pulse" />
          <div className="h-8 w-28 bg-slate-200 rounded-lg animate-pulse" />
        </div>
        <div className="divide-y divide-slate-100 p-6 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between pt-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-slate-200 animate-pulse" />
                <div className="space-y-1.5">
                  <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
                  <div className="h-3 w-20 bg-slate-200 rounded animate-pulse" />
                </div>
              </div>
              <div className="h-4 w-20 bg-slate-200 rounded animate-pulse" />
              <div className="h-6 w-16 bg-slate-200 rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {items.map((i) => (
        <div
          key={i}
          className={`animate-pulse bg-slate-200 ${variant === 'circle' ? 'rounded-full' : 'rounded-md'} ${className}`}
          style={{
            height: height || (variant === 'circle' ? '40px' : '16px'),
            width: width || (variant === 'circle' ? '40px' : '100%'),
          }}
        />
      ))}
    </div>
  );
};

export default LoadingSkeleton;

