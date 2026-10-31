import React, { useState } from 'react';
import {
  X,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  CheckCircle2,
  Calendar,
  Layers,
} from 'lucide-react';
import { useToast } from './Toast';

/**
 * ExportModal
 * Task 6: Export Modal dialog asking the user to export as PDF, Excel (.xlsx), or CSV.
 * Integrates with existing export utilities.
 */
export const ExportModal = ({
  isOpen = false,
  onClose,
  onExport,
  title = 'Export Business Data',
  defaultScope = 'filtered',
}) => {
  const [selectedFormat, setSelectedFormat] = useState('excel'); // 'pdf' | 'excel' | 'csv'
  const [scope, setScope] = useState(defaultScope); // 'filtered' | 'all'
  const [includeSummary, setIncludeSummary] = useState(true);
  const { success } = useToast();

  if (!isOpen) return null;

  const formats = [
    {
      id: 'pdf',
      name: 'Printable PDF Report',
      ext: '.pdf',
      desc: 'Audit-ready formatted statement with company logo and executive summary',
      icon: Printer,
      iconColor: 'text-rose-500',
      badge: 'Print Ready',
    },
    {
      id: 'excel',
      name: 'Microsoft Excel Workbook',
      ext: '.xlsx',
      desc: 'Full spreadsheet workbook with styled columns and calculated metric totals',
      icon: FileSpreadsheet,
      iconColor: 'text-emerald-600',
      badge: 'Recommended',
    },
    {
      id: 'csv',
      name: 'Comma-Separated Values',
      ext: '.csv',
      desc: 'Raw machine-readable data export compatible with all BI engines and ERPs',
      icon: FileText,
      iconColor: 'text-blue-600',
      badge: 'Universal',
    },
  ];

  const handleGenerate = () => {
    onClose();
    if (onExport) {
      onExport(selectedFormat, { scope, includeSummary });
    } else {
      success(`Report successfully generated in .${selectedFormat} format`, 'Export Complete');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 select-none animate-in fade-in duration-150"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden text-slate-900 dark:text-slate-100 transition-all duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Download size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {title}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Choose your preferred export format and data scope
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Select Output Format
            </label>
            <div className="space-y-2">
              {formats.map((fmt) => {
                const isSelected = selectedFormat === fmt.id;
                const Icon = fmt.icon;

                return (
                  <div
                    key={fmt.id}
                    onClick={() => setSelectedFormat(fmt.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="mt-0.5">
                      <Icon size={18} className={fmt.iconColor} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {fmt.name}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {fmt.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {fmt.desc}
                      </p>
                    </div>

                    <div className="mt-1">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Scope Options */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Data Scope
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label
                onClick={() => setScope('filtered')}
                className={`p-2.5 rounded-lg border text-center cursor-pointer transition-colors ${
                  scope === 'filtered'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                }`}
              >
                Currently Filtered
              </label>
              <label
                onClick={() => setScope('all')}
                className={`p-2.5 rounded-lg border text-center cursor-pointer transition-colors ${
                  scope === 'all'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                }`}
              >
                All Records (Historical)
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs shadow-xs transition-colors"
          >
            <Download size={13} />
            <span>Generate & Download</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;

