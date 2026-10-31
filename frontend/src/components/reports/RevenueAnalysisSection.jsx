import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ChartCard } from '../cards/ChartCard';
import { formatCurrency, formatNumber } from '../../utils/formatters';

const METRIC_CONFIG = {
  Revenue: {
    dataKey: 'revenue',
    label: 'Total Revenue',
    formatter: (val) => formatCurrency(val),
    color: '#2563EB',
    unit: '$',
  },
  Invoices: {
    dataKey: 'invoices',
    label: 'Invoices Generated',
    formatter: (val) => `${formatNumber(val)} invoices`,
    color: '#0D9488',
    unit: '',
  },
  Payments: {
    dataKey: 'payments',
    label: 'Payments Collected',
    formatter: (val) => formatCurrency(val),
    color: '#059669',
    unit: '$',
  },
  Subscriptions: {
    dataKey: 'subscriptions',
    label: 'Active Subscriptions',
    formatter: (val) => `${formatNumber(val)} active`,
    color: '#7C3AED',
    unit: '',
  },
};

/**
 * Custom Tooltip for Revenue Analysis
 */
const CustomChartTooltip = ({ active, payload, label, activeMetric }) => {
  if (active && payload && payload.length) {
    const config = METRIC_CONFIG[activeMetric] || METRIC_CONFIG.Revenue;
    const value = payload[0].value;

    return (
      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-md text-xs">
        <p className="font-semibold text-slate-900 mb-1">{label}</p>
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: config.color }}
          />
          <span className="text-slate-500">{config.label}:</span>
          <span className="font-bold text-slate-800">
            {config.formatter(value)}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

/**
 * RevenueAnalysisSection
 * Section 2: Large responsive Recharts area chart with interactive metric toggle.
 *
 * @param {Object} props
 * @param {Array} props.data - Analysis time-series records
 * @param {string} props.activeMetric - Currently selected metric tab
 * @param {(metric: string) => void} props.onMetricChange - Metric switcher callback
 * @param {boolean} [props.loading=false]
 */
export const RevenueAnalysisSection = ({
  data = [],
  activeMetric = 'Revenue',
  onMetricChange,
  loading = false,
}) => {
  const metrics = ['Revenue', 'Invoices', 'Payments', 'Subscriptions'];
  const currentConfig = METRIC_CONFIG[activeMetric] || METRIC_CONFIG.Revenue;

  const metricSwitcher = (
    <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200/80">
      {metrics.map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onMetricChange?.(m)}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
            activeMetric === m
              ? 'bg-white text-blue-700 shadow-xs font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          {m}
        </button>
      ))}
    </div>
  );

  return (
    <ChartCard
      title="Revenue & Performance Analysis"
      subtitle="Multi-dimensional monthly financial trend and operational metrics"
      action={metricSwitcher}
      height="h-80"
      loading={loading}
      className="w-full"
    >
      <div className="w-full h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient
                id={`gradient-${activeMetric}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor={currentConfig.color}
                  stopOpacity={0.25}
                />
                <stop
                  offset="95%"
                  stopColor={currentConfig.color}
                  stopOpacity={0.0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#E2E8F0"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              stroke="#94A3B8"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: '#E2E8F0' }}
            />
            <YAxis
              stroke="#94A3B8"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: '#E2E8F0' }}
              tickFormatter={(val) => {
                if (currentConfig.unit === '$') {
                  return `$${(val / 1000).toFixed(0)}k`;
                }
                return val;
              }}
            />
            <Tooltip
              content={<CustomChartTooltip activeMetric={activeMetric} />}
            />
            <Area
              type="monotone"
              dataKey={currentConfig.dataKey}
              stroke={currentConfig.color}
              strokeWidth={2.5}
              fillOpacity={1}
              fill={`url(#gradient-${activeMetric})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
};

export default RevenueAnalysisSection;

