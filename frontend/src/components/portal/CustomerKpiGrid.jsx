import React from 'react';
import { Layers, Award, CreditCard, Calendar } from 'lucide-react';
import { StatCard } from '../cards/StatCard';

const KPI_ICONS = {
  kpi_active_subs: Layers,
  kpi_current_plan: Award,
  kpi_outstanding: CreditCard,
  kpi_next_billing: Calendar,
};

/**
 * CustomerKpiGrid
 * Section 1: 4 Executive KPI Cards for Customer Portal.
 *
 * @param {Object} props
 * @param {Array} props.kpis
 * @param {boolean} [props.loading=false]
 */
export const CustomerKpiGrid = ({ kpis = [], loading = false }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => {
        const Icon = KPI_ICONS[kpi.id] || Layers;
        return (
          <StatCard
            key={kpi.id}
            title={kpi.title}
            value={kpi.value}
            subtitle={kpi.subtitle}
            change={kpi.change}
            changeType={kpi.changeType || 'neutral'}
            icon={Icon}
            loading={loading}
          />
        );
      })}
    </div>
  );
};

export default CustomerKpiGrid;

