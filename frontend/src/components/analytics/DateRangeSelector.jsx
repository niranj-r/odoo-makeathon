import React from 'react';

/**
 * DateRangeSelector
 * Segmented control for filtering analytics data across standard ERP timeframes.
 *
 * @param {Object} props
 * @param {string} props.selectedRange
 * @param {(range: string) => void} props.onSelectRange
 */
export const DateRangeSelector = ({ selectedRange = 'Year', onSelectRange }) => {
  const ranges = ['Today', 'Week', 'Month', 'Quarter', 'Year', 'Custom'];

  return (
    <div
      role="group"
      aria-label="Date range selector"
      className="inline-flex items-center p-1 bg-slate-100/90 border border-slate-200/80 rounded-lg text-xs font-medium text-slate-600 gap-0.5"
    >
      {ranges.map((range) => {
        const isSelected = selectedRange === range;
        return (
          <button
            key={range}
            type="button"
            onClick={() => onSelectRange && onSelectRange(range)}
            className={`px-3 py-1.5 rounded-md transition-all ${
              isSelected
                ? 'bg-white text-blue-600 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            {range}
          </button>
        );
      })}
    </div>
  );
};

export default DateRangeSelector;

