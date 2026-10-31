import React from 'react';

export const BentoCard = ({
  title,
  description,
  action,
  children,
  className = '',
  style = {},
}) => {
  return (
    <div
      className={`bento-card ${className}`}
      style={{
        background: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid var(--border-light, #E2E8F0)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        ...style,
      }}
    >
      {(title || description || action) && (
        <div
          style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--border-light, #E2E8F0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            {title && (
              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary-navy, #0F172A)', margin: 0 }}>
                {title}
              </h3>
            )}
            {description && (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748B)', margin: '0.2rem 0 0 0' }}>
                {description}
              </p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div style={{ padding: '1.25rem', flex: 1 }}>{children}</div>
    </div>
  );
};

export default BentoCard;

