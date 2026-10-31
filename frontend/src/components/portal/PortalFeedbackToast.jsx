import React from 'react';
import { CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

/**
 * PortalFeedbackToast
 * Reusable feedback banner for portal operations (renewals, cancellations, profile updates).
 */
export const PortalFeedbackToast = ({ feedback, onClose }) => {
  if (!feedback) return null;

  const isSuccess = feedback.type === 'success';
  const isError = feedback.type === 'error';

  return (
    <div
      className={`flex items-center justify-between p-4 rounded-xl border shadow-sm transition-all animate-fadeIn ${
        isSuccess
          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
          : isError
          ? 'bg-rose-50 border-rose-200 text-rose-900'
          : 'bg-blue-50 border-blue-200 text-blue-900'
      }`}
    >
      <div className="flex items-center gap-3">
        {isSuccess ? (
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
        ) : isError ? (
          <AlertTriangle size={18} className="text-rose-600 shrink-0" />
        ) : (
          <Info size={18} className="text-blue-600 shrink-0" />
        )}
        <span className="text-xs sm:text-sm font-medium">
          {feedback.message}
        </span>
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md hover:bg-black/5 transition-colors text-slate-500"
          title="Dismiss notification"
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
};

export default PortalFeedbackToast;

