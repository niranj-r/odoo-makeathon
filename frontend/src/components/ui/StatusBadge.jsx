import React from 'react';

export const StatusBadge = ({ status = 'active', showDot = true }) => {
  const normalized = String(status).toLowerCase();

  const configMap = {
    active: { label: 'Active', bg: '#ECFDF5', text: '#065F46', dot: '#10B981', border: '#A7F3D0' },
    paid: { label: 'Paid', bg: '#ECFDF5', text: '#065F46', dot: '#10B981', border: '#A7F3D0' },
    succeeded: { label: 'Succeeded', bg: '#ECFDF5', text: '#065F46', dot: '#10B981', border: '#A7F3D0' },
    confirmed: { label: 'Confirmed', bg: '#EFF6FF', text: '#1E40AF', dot: '#3B82F6', border: '#BFDBFE' },
    draft: { label: 'Draft', bg: '#F8FAFC', text: '#475569', dot: '#94A3B8', border: '#E2E8F0' },
    pending: { label: 'Pending', bg: '#FFFBEB', text: '#92400E', dot: '#F59E0B', border: '#FDE68A' },
    trialing: { label: 'Trialing', bg: '#EFF6FF', text: '#1E40AF', dot: '#3B82F6', border: '#BFDBFE' },
    paused: { label: 'Paused', bg: '#FFFBEB', text: '#92400E', dot: '#F59E0B', border: '#FDE68A' },
    past_due: { label: 'Past Due', bg: '#FFFBEB', text: '#92400E', dot: '#F59E0B', border: '#FDE68A' },
    overdue: { label: 'Overdue', bg: '#FEF2F2', text: '#991B1B', dot: '#EF4444', border: '#FECACA' },
    failed: { label: 'Failed', bg: '#FEF2F2', text: '#991B1B', dot: '#EF4444', border: '#FECACA' },
    canceled: { label: 'Canceled', bg: '#F1F5F9', text: '#475569', dot: '#94A3B8', border: '#CBD5E1' },
    closed: { label: 'Closed', bg: '#F1F5F9', text: '#475569', dot: '#94A3B8', border: '#CBD5E1' },
  };

  const conf = configMap[normalized] || {
    label: status,
    bg: '#F1F5F9',
    text: '#475569',
    dot: '#94A3B8',
    border: '#CBD5E1',
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        padding: '0.15rem 0.55rem',
        borderRadius: '9999px',
        fontSize: '0.72rem',
        fontWeight: 600,
        backgroundColor: conf.bg,
        color: conf.text,
        border: `1px solid ${conf.border}`,
      }}
    >
      {showDot && (
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: conf.dot,
          }}
        />
      )}
      {conf.label}
    </span>
  );
};

export default StatusBadge;

