import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info', title = null, duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, message, type, title, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const success = useCallback((message, title = 'Success') => addToast(message, 'success', title), [addToast]);
  const error = useCallback((message, title = 'Error') => addToast(message, 'error', title), [addToast]);
  const warning = useCallback((message, title = 'Warning') => addToast(message, 'warning', title), [addToast]);
  const info = useCallback((message, title = 'Notice') => addToast(message, 'info', title), [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, success, error, warning, info }}>
      {children}
      
      {/* Toast Notification Stack */}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          const isWarning = toast.type === 'warning';

          const Icon = isSuccess
            ? CheckCircle2
            : isError
            ? AlertCircle
            : isWarning
            ? AlertTriangle
            : Info;

          const borderColor = isSuccess
            ? 'border-emerald-200 dark:border-emerald-800/60'
            : isError
            ? 'border-rose-200 dark:border-rose-800/60'
            : isWarning
            ? 'border-amber-200 dark:border-amber-800/60'
            : 'border-blue-200 dark:border-blue-800/60';

          const iconColor = isSuccess
            ? 'text-emerald-600 dark:text-emerald-400'
            : isError
            ? 'text-rose-600 dark:text-rose-400'
            : isWarning
            ? 'text-amber-600 dark:text-amber-400'
            : 'text-blue-600 dark:text-blue-400';

          return (
            <div
              key={toast.id}
              role="alert"
              className={`pointer-events-auto bg-white dark:bg-slate-900 border ${borderColor} rounded-xl shadow-lg p-3.5 flex items-start gap-3 transition-all transform translate-y-0 duration-200 select-none`}
            >
              <div className="shrink-0 mt-0.5">
                <Icon size={18} className={iconColor} />
              </div>

              <div className="flex-1 min-w-0">
                {toast.title && (
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-tight mb-0.5">
                    {toast.title}
                  </h4>
                )}
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed break-words">
                  {toast.message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded transition-colors"
                aria-label="Close notification"
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      addToast: () => {},
      removeToast: () => {},
      success: () => {},
      error: () => {},
      warning: () => {},
      info: () => {},
    };
  }
  return context;
};

export default ToastProvider;
