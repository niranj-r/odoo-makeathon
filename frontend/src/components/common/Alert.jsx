import React from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

export const Alert = ({ type = 'error', message, children, onClose }) => {
  if (!message && !children) return null;

  const icons = {
    error: AlertCircle,
    success: CheckCircle,
    warning: AlertTriangle,
    info: Info
  };

  const IconComponent = icons[type] || AlertCircle;

  return (
    <div className={`alert alert-${type}`} role="alert">
      <IconComponent size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
      <div style={{ flex: 1 }}>{message || children}</div>
      {onClose && (
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.7 }}
        >
          &times;
        </button>
      )}
    </div>
  );
};

export default Alert;

