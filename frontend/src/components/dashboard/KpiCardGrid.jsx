import React from 'react';
import { Users, DollarSign, AlertCircle, Building2 } from 'lucide-react';
import { SmartKpiCard } from '../cards/SmartKpiCard';
import { LoadingSkeleton } from '../common/LoadingSkeleton';

const iconMap = {
  Users,
  DollarSign,
  AlertCircle,
  Building2,
};

/**
 * KpiCardGrid
 * Renders the 4 primary enterprise SaaS KPI metrics with values, trends, and sparklines.
 * Upgraded to use SmartKpiCard with real-time value highlights and SVG gradient sparklines.
 *
 * @param {Object} props
 * @param {Array} props.metrics
 * @param {boolean} [props.loading=false]
 */
export const KpiCardGrid = ({ metrics = [], loading = false }) => {
  if (loading || !metrics || metrics.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <LoadingSkeleton key={i} variant="stat" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {metrics.map((metric) => {
        const IconComponent = iconMap[metric.iconName] || Users;

        return (
          <SmartKpiCard
            key={metric.id}
            id={metric.id}
            title={metric.title}
            value={metric.value}
            change={metric.change}
            changeType={metric.changeType}
            changePeriod={metric.changePeriod}
            icon={IconComponent}
            sparklineData={metric.sparklineData}
          />
        );
      })}
    </div>
  );
};

export default KpiCardGrid;
