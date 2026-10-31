import React from 'react';

export const LoadingSpinner = ({ size = 'normal', color = 'light', message = '' }) => {
  const spinnerClasses = [
    'spinner',
    size === 'large' ? 'spinner-lg' : '',
    color === 'dark' ? 'spinner-dark' : ''
  ].filter(Boolean).join(' ');

  if (size === 'fullscreen') {
    return (
      <div className="loading-container">
        <div className="spinner spinner-lg spinner-dark"></div>
        {message && <p style={{ fontWeight: 600, color: 'var(--primary-navy)' }}>{message}</p>}
      </div>
    );
  }

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
      <div className={spinnerClasses}></div>
      {message && <span>{message}</span>}
    </div>
  );
};

export default LoadingSpinner;

