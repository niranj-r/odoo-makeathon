import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export const MetricCard = ({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  badgeText,
  className = '',
}) => {
  return (
    <div className={`metric-card ${className}`} style={{
      background: '#FFFFFF',
      borderRadius: '12px',
      border: '1px solid var(--border-light, #E2E8F0)',
      padding: '1.25rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted, #64748B)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {title}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {badgeText && (
            <span style={{ background: '#F1F5F9', color: '#475569', fontSize: '0.65rem', fontWeight: 600, padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
              {badgeText}
            </span>
          )}
          {Icon && (
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
              <Icon size={16} />
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-navy, #0F172A)' }}>
          {value}
        </div>
        {trend && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            fontSize: '0.75rem',
            fontWeight: 600,
            borderRadius: '4px',
            padding: '0.15rem 0.4rem',
            backgroundColor: trend.direction === 'up' ? '#ECFDF5' : trend.direction === 'down' ? '#FFF1F2' : '#F1F5F9',
            color: trend.direction === 'up' ? '#047857' : trend.direction === 'down' ? '#BE123C' : '#475569'
          }}>
            {trend.direction === 'up' && <TrendingUp size={12} />}
            {trend.direction === 'down' && <TrendingDown size={12} />}
            {trend.direction === 'neutral' && <Minus size={12} />}
            <span>{trend.value}%</span>
          </div>
        )}
      </div>

      {(subtitle || trend?.label) && (
        <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted, #64748B)', margin: '0.5rem 0 0 0' }}>
          {trend?.label ? trend.label : subtitle}
        </p>
      )}
    </div>
  );
};

export default MetricCard;

