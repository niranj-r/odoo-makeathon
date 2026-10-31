import React, { useState } from 'react';
import { Download, ChevronDown, FileText, FileSpreadsheet, Printer, Sliders } from 'lucide-react';
import { ExportModal } from './ExportModal';

/**
 * ExportDropdown / Export Button
 * Task 6: Replaces the current export button. Clicking opens the Export Modal
 * where users select PDF, Excel (.xlsx), or CSV, or quickly triggers instant download.
 *
 * @param {Object} props
 * @param {(format: 'pdf'|'excel'|'csv', options?: any) => void} props.onExport
 * @param {string} [props.label='Export']
 * @param {string} [props.className]
 */
export const ExportDropdown = ({ onExport, label = 'Export', className = '' }) => {
  const [modalOpen, setModalOpen] = useState(false);

  const handleExportFormat = (format, options) => {
    onExport?.(format, options);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold shadow-2xs transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${className}`}
        title="Open export options dialog"
      >
        <Download size={13} className="text-blue-600 dark:text-blue-400 stroke-[2.2]" />
        <span>{label}</span>
      </button>

      <ExportModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onExport={handleExportFormat}
      />
    </>
  );
};

export default ExportDropdown;
