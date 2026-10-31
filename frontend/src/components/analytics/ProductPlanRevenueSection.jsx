import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Package, Calendar, MousePointerClick } from 'lucide-react';
import { LoadingSkeleton } from '../common/LoadingSkeleton';

/**
 * Custom Tooltip for Product Revenue Bar Chart
 */
const CustomProductTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 shadow-md text-xs select-none">
        <p className="font-semibold text-slate-800 dark:text-slate-100">{item.product} Tier</p>
        <p className="text-blue-600 dark:text-blue-400 font-bold mt-1">
          Revenue: ${Number(item.revenue).toLocaleString()}
        </p>
        <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
          {item.subscriptions} active subscriptions ({item.growth})
        </p>
        <p className="text-[10px] text-blue-500 font-medium mt-1">Click to drill down</p>
      </div>
    );
  }
  return null;
};

/**
 * Custom Tooltip for Plan Cadence Donut Chart
 */
const CustomPlanTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 shadow-md text-xs select-none">
        <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-100">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          {item.name} Cadence
        </div>
        <p className="text-blue-600 dark:text-blue-400 font-bold mt-1">
          ${Number(item.value).toLocaleString()} ({item.percentage})
        </p>
        <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
          {item.subscribers} customer accounts
        </p>
        <p className="text-[10px] text-blue-500 font-medium mt-1">Click to drill down</p>
      </div>
    );
  }
  return null;
};

/**
 * ProductPlanRevenueSection
 * Two-column analytical breakdown:
 * Left: Bar chart of revenue by product tier (clickable).
 * Right: Donut chart of revenue by billing plan cadence (clickable).
 *
 * @param {Object} props
 * @param {Array} props.productData
 * @param {Array} props.planData
 * @param {boolean} [props.loading=false]
 * @param {(type: string, data: any) => void} [props.onDrillDown]
 */
export const ProductPlanRevenueSection = ({
  productData = [],
  planData = [],
  loading = false,
  onDrillDown,
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LoadingSkeleton variant="chart" />
        <LoadingSkeleton variant="chart" />
      </div>
    );
  }

  const totalPlanRevenue = planData.reduce((acc, curr) => acc + (curr.value || 0), 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 select-none transition-colors duration-200">
      {/* Left Column: Revenue by Product */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
              <Package size={17} className="text-blue-600 dark:text-blue-400 stroke-[2.2]" />
              <span>Revenue by Product Tier</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
              <span>Performance by subscription tier</span>
              <span className="inline-flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded">
                <MousePointerClick size={10} />
                Click bar to inspect
              </span>
            </p>
          </div>

          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg">
            {productData.length} Tiers
          </span>
        </div>

        {/* Bar Chart Canvas */}
        <div className="w-full h-64 cursor-pointer">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={productData}
              onClick={(e) => {
                if (e && e.activePayload && e.activePayload.length && onDrillDown) {
                  onDrillDown('product', e.activePayload[0].payload);
                }
              }}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#F1F5F9"
                vertical={false}
                className="dark:stroke-slate-800"
              />
              <XAxis
                dataKey="product"
                stroke="#94A3B8"
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: '#E2E8F0' }}
              />
              <YAxis
                stroke="#94A3B8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `$${Math.round(val / 1000)}k`}
              />
              <Tooltip
                content={<CustomProductTooltip />}
                cursor={{ fill: '#F8FAFC' }}
              />
              <Bar
                dataKey="revenue"
                name="Revenue"
                fill="#2563EB"
                radius={[4, 4, 0, 0]}
                maxBarSize={44}
              >
                {productData.map((entry, index) => (
                  <Cell
                    key={`prod-cell-${index}`}
                    fill={entry.color || '#2563EB'}
                    className="hover:opacity-85 transition-opacity"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Product Quick List */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {productData.map((item) => (
            <div
              key={item.product}
              onClick={() => onDrillDown && onDrillDown('product', item)}
              className="p-2 rounded-lg bg-slate-50/70 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 cursor-pointer hover:border-blue-400 transition-colors"
            >
              <span className="text-[11px] text-slate-400 dark:text-slate-500 block font-medium truncate">{item.product}</span>
              <span className="font-bold text-slate-900 dark:text-slate-100 block mt-0.5">
                ${(item.revenue / 1000).toFixed(1)}k
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold">{item.growth}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column: Revenue by Plan (Cadence) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-2">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
              <Calendar size={17} className="text-blue-600 dark:text-blue-400 stroke-[2.2]" />
              <span>Revenue by Plan Cadence</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
              <span>Billing intervals (Yearly, Monthly, etc.)</span>
              <span className="inline-flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded">
                <MousePointerClick size={10} />
                Click slice to inspect
              </span>
            </p>
          </div>

          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg">
            ${(totalPlanRevenue / 1000).toFixed(1)}k Total
          </span>
        </div>

        {/* Donut Chart Canvas */}
        <div className="w-full h-64 flex items-center justify-center cursor-pointer">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={planData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={95}
                paddingAngle={3}
                dataKey="value"
                onClick={(entry) => {
                  if (onDrillDown) {
                    onDrillDown('product', { product: `${entry.name} Cadence`, revenue: entry.value, subscriptions: entry.subscribers });
                  }
                }}
              >
                {planData.map((entry, index) => (
                  <Cell
                    key={`plan-cell-${index}`}
                    fill={entry.color}
                    className="hover:opacity-85 transition-opacity"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomPlanTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Plan Cadence Legend Grid */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {planData.map((item) => (
            <div
              key={item.name}
              onClick={() => onDrillDown && onDrillDown('product', { product: `${item.name} Cadence`, revenue: item.value, subscriptions: item.subscribers })}
              className="p-2 rounded-lg bg-slate-50/70 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 cursor-pointer hover:border-blue-400 transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate">
                  {item.name}
                </span>
              </div>
              <span className="font-bold text-slate-900 dark:text-slate-100 block mt-1">
                {item.percentage}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                {item.subscribers} accounts
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductPlanRevenueSection;
