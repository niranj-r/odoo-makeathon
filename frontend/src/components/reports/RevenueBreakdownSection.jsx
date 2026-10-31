import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { ChartCard } from '../cards/ChartCard';
import { formatCurrency, formatPercentage } from '../../utils/formatters';

/**
 * Custom Tooltip for Product Revenue Bar Chart
 */
const ProductTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-md text-xs">
        <p className="font-semibold text-slate-900 mb-1">{data.product}</p>
        <p className="text-slate-600">
          Revenue:{' '}
          <span className="font-bold text-blue-600">
            {formatCurrency(data.revenue)}
          </span>
        </p>
        <p className="text-slate-400 text-[11px] mt-0.5">
          Share: {formatPercentage(data.percentage)}
        </p>
      </div>
    );
  }
  return null;
};

/**
 * Custom Tooltip for Billing Plan Donut Chart
 */
const PlanTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-md text-xs">
        <p className="font-semibold text-slate-900 mb-1">{data.name}</p>
        <p className="text-slate-600">
          Revenue:{' '}
          <span className="font-bold text-slate-800">
            {formatCurrency(data.value)}
          </span>
        </p>
        <p className="text-slate-500 text-[11px] mt-0.5">
          Distribution: {formatPercentage(data.percentage)}
        </p>
      </div>
    );
  }
  return null;
};

/**
 * RevenueBreakdownSection
 * Section 5: Two-column comparative charts for Product & Plan revenue distribution.
 *
 * @param {Object} props
 * @param {Object} props.breakdown - { byProduct: [], byPlan: [] }
 * @param {boolean} [props.loading=false]
 */
export const RevenueBreakdownSection = ({
  breakdown = { byProduct: [], byPlan: [] },
  loading = false,
}) => {
  const { byProduct = [], byPlan = [] } = breakdown;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Chart 1: Revenue by Product */}
      <ChartCard
        title="Revenue by Product Tier"
        subtitle="Gross revenue generation across BrightLoop product tiers"
        height="h-72"
        loading={loading}
      >
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={byProduct}
              margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#E2E8F0"
                vertical={false}
              />
              <XAxis
                dataKey="product"
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#E2E8F0' }}
                interval={0}
                angle={-10}
                textAnchor="end"
              />
              <YAxis
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#E2E8F0' }}
                tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<ProductTooltip />} />
              <Bar
                dataKey="revenue"
                radius={[6, 6, 0, 0]}
                fill="#2563EB"
              >
                {byProduct.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill || '#2563EB'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* Chart 2: Revenue by Billing Plan Cadence */}
      <ChartCard
        title="Revenue by Billing Cadence"
        subtitle="Annual vs quarterly vs monthly billing cycle distribution"
        height="h-72"
        loading={loading}
      >
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={byPlan}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={88}
                paddingAngle={4}
                dataKey="value"
              >
                {byPlan.map((entry, index) => (
                  <Cell
                    key={`plan-cell-${index}`}
                    fill={entry.color || '#2563EB'}
                  />
                ))}
              </Pie>
              <Tooltip content={<PlanTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                iconSize={8}
                formatter={(val, entry) => (
                  <span className="text-xs text-slate-700 font-medium ml-1">
                    {val} ({entry.payload.percentage}%)
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );
};

export default RevenueBreakdownSection;

