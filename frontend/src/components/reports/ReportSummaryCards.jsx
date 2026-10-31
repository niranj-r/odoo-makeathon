import React from 'react';
import {
  DollarSign,
  TrendingUp,
  AlertCircle,
  FileText,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { StatCard } from '../cards/StatCard';

const ICON_MAP = {
  'total-revenue': DollarSign,
  'recurring-revenue': TrendingUp,
  'outstanding-amount': AlertCircle,
  'invoices-generated': FileText,
  'collection-rate': CheckCircle2,
  'active-customers': Users,
};

/**
 * ReportSummaryCards
 * Section 1: Executive 6-KPI metrics grid for enterprise reporting.
 *
 * @param {Object} props
 * @param {Array} props.summary - List of 6 summary KPI items
 * @param {boolean} [props.loading=false]
 */
export const ReportSummaryCards = ({ summary = [], loading = false }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {summary.map((item) => {
        const Icon = ICON_MAP[item.id] || TrendingUp;
        return (
          <StatCard
            key={item.id}
            title={item.title}
            value={item.value}
            change={item.change}
            changeType={item.changeType}
            changePeriod={item.changePeriod}
            subtitle={item.subtitle}
            icon={Icon}
            loading={loading}
            className="h-full"
          />
        );
      })}
    </div>
  );
};

export default ReportSummaryCards;

