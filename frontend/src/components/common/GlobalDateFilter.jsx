import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, Check, ArrowRight } from 'lucide-react';

export const DATE_PRESETS = [
  { id: 'today', label: 'Today', days: 1 },
  { id: 'last_7_days', label: 'Last 7 Days', days: 7 },
  { id: 'last_30_days', label: 'Last 30 Days', days: 30 },
  { id: 'this_quarter', label: 'This Quarter', days: 90 },
  { id: 'this_year', label: 'This Year', days: 365 },
  { id: 'custom', label: 'Custom Range', days: null },
];

/**
 * GlobalDateFilter
 * Reusable enterprise date range picker for BrightLoop ERP.
 * Supports standard enterprise presets (Today, 7D, 30D, Quarter, Year) + Custom Date Range.
 *
 * @param {Object} props
 * @param {string} [props.value='Last 30 Days']
 * @param {(filter: { range: string, startDate?: string, endDate?: string, label: string }) => void} props.onChange
 */
export const GlobalDateFilter = ({
  value = 'Last 30 Days',
  onChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [customEnd, setCustomEnd] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [isCustomMode, setIsCustomMode] = useState(false);
  const dropdownRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
        setIsCustomMode(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectPreset = (preset) => {
    if (preset.id === 'custom') {
      setIsCustomMode(true);
      return;
    }

    setIsCustomMode(false);
    setIsOpen(false);

    const endDate = new Date().toISOString().split('T')[0];
    const startDateObj = new Date();
    startDateObj.setDate(startDateObj.getDate() - preset.days);
    const startDate = startDateObj.toISOString().split('T')[0];

    if (onChange) {
      onChange({
        range: preset.label,
        startDate,
        endDate,
        label: preset.label,
      });
    }
  };

  const handleApplyCustom = (e) => {
    e.preventDefault();
    if (!customStart || !customEnd) return;

    setIsOpen(false);
    setIsCustomMode(false);

    if (onChange) {
      onChange({
        range: 'Custom Range',
        startDate: customStart,
        endDate: customEnd,
        label: `${customStart} - ${customEnd}`,
      });
    }
  };

  return (
    <div className={`relative inline-block text-left select-none ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800/60 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
      >
        <Calendar size={13} className="text-slate-500 dark:text-slate-400 stroke-[2.2]" />
        <span className="font-semibold text-slate-800 dark:text-slate-100">{value}</span>
        <ChevronDown size={13} className="text-slate-400 dark:text-slate-500" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-60 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 p-2 text-xs animate-in fade-in zoom-in-95 duration-100">
          {!isCustomMode ? (
            <div className="space-y-0.5">
              <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Select Time Horizon
              </div>
              {DATE_PRESETS.map((preset) => {
                const isSelected = value === preset.label;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 font-semibold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{preset.label}</span>
                    {isSelected && <Check size={13} className="stroke-[2.5]" />}
                  </button>
                );
              })}
            </div>
          ) : (
            <form onSubmit={handleApplyCustom} className="p-1 space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  Custom Range
                </span>
                <button
                  type="button"
                  onClick={() => setIsCustomMode(false)}
                  className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Back to presets
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="pt-1 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCustomMode(false)}
                  className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-xs transition-colors flex items-center gap-1 shadow-xs"
                >
                  <span>Apply</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalDateFilter;

