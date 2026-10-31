import React from 'react';

export const ChartContainer = ({
  title,
  subtitle,
  children,
  action,
  className = '',
  height = '280px',
}) => {
  return (
    <div
      className={`chart-container ${className}`}
      style={{
        background: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid var(--border-light, #E2E8F0)',
        padding: '1.25rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      {(title || subtitle || action) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            {title && (
              <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary-navy, #0F172A)' }}>
                {title}
              </h4>
            )}
            {subtitle && (
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted, #64748B)' }}>
                {subtitle}
              </p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div style={{ height, width: '100%', position: 'relative' }}>
        {children}
      </div>
    </div>
  );
};

export default ChartContainer;

