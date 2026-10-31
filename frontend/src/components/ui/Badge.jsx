import React from 'react';

export const Badge = ({
  children,
  variant = 'default',
  className = '',
  style = {},
}) => {
  const variantStyles = {
    default: { backgroundColor: '#F1F5F9', color: '#334155', border: '1px solid #CBD5E1' },
    admin: { backgroundColor: '#FEE2E2', color: '#991B1B', border: '1px solid #FECACA' },
    staff: { backgroundColor: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' },
    customer: { backgroundColor: '#DBEAFE', color: '#1E40AF', border: '1px solid #BFDBFE' },
    success: { backgroundColor: '#DCFCE7', color: '#166534', border: '1px solid #BBF7D0' },
    warning: { backgroundColor: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' },
    danger: { backgroundColor: '#FEE2E2', color: '#991B1B', border: '1px solid #FECACA' },
  };

  return (
    <span
      className={`badge ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding: '0.2rem 0.55rem',
        borderRadius: '9999px',
        fontSize: '0.72rem',
        fontWeight: 600,
        letterSpacing: '0.02em',
        ...(variantStyles[variant] || variantStyles.default),
        ...style,
      }}
    >
      {children}
    </span>
  );
};

export default Badge;

