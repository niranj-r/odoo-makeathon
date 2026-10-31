import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { TrendingUp, MousePointerClick } from 'lucide-react';
import { LoadingSkeleton } from '../common/LoadingSkeleton';

/**
 * Custom Tooltip for Revenue Trend Line Chart
 */
const CustomTrendTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 shadow-md text-xs space-y-1 select-none">
        <p className="font-bold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-1 mb-1.5 flex items-center justify-between gap-2">
          <span>{label} 2026 Trajectory</span>
          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-normal">Click to drill down</span>
        </p>
        {payload.map((entry, idx) => (
          <div key={idx} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              {entry.name}:
            </span>
            <span className="font-bold text-slate-900 dark:text-slate-100">
              ${Number(entry.value).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

/**
 * RevenueTrendSection
 * Full-width responsive Line Chart for Monthly, Recurring, and Expected Revenue.
 * Upgraded with clickable drill-down interaction.
 *
 * @param {Object} props
 * @param {Array} props.data
 * @param {boolean} [props.loading=false]
 * @param {(type: string, data: any) => void} [props.onDrillDown]
 */
export const RevenueTrendSection = ({
  data = [],
  loading = false,
  onDrillDown,
}) => {
  if (loading) {
    return <LoadingSkeleton variant="chart" className="h-96" />;
  }

  const latest = data[data.length - 1] || {};

  const handleChartClick = (event) => {
    if (event && event.activePayload && event.activePayload.length && onDrillDown) {
      onDrillDown('revenue', event.activePayload[0].payload);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs select-none transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-slate-100 dark:border-slate-800 mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
              <TrendingUp size={18} className="text-blue-600 dark:text-blue-400 stroke-[2.2]" />
              <span>Revenue Trajectory & Forecasting</span>
            </h3>
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800 px-2 py-0.5 rounded-full">
              +14.2% YoY
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
            <span>Historical cash collection vs. contracted MRR and projected runway</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded">
              <MousePointerClick size={11} />
              Interactive
            </span>
          </p>
        </div>

        {/* Quick Highlights */}
        <div className="flex items-center gap-4 text-xs">
          <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 px-3 py-1.5 rounded-lg">
            <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-semibold">Current MRR</span>
            <span className="text-slate-900 dark:text-slate-100 font-bold text-sm">
              ${Number(latest.recurringRevenue || 0).toLocaleString()}
            </span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 px-3 py-1.5 rounded-lg">
            <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-semibold">Expected Run Rate</span>
            <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">
              ${Number(latest.expectedRevenue || 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="w-full h-80 cursor-pointer">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            onClick={handleChartClick}
            margin={{ top: 15, right: 15, left: -10, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#F1F5F9"
              vertical={false}
              className="dark:stroke-slate-800"
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
              axisLine={false}
              tickFormatter={(val) => `$${Math.round(val / 1000)}k`}
            />
            <Tooltip content={<CustomTrendTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ paddingBottom: '16px', fontSize: '12px' }}
            />
            <Line
              type="monotone"
              dataKey="monthlyRevenue"
              name="Monthly Revenue"
              stroke="#2563EB"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#2563EB', strokeWidth: 1 }}
              activeDot={{ r: 6, strokeWidth: 0, cursor: 'pointer' }}
            />
            <Line
              type="monotone"
              dataKey="recurringRevenue"
              name="Recurring Revenue (MRR)"
              stroke="#1E40AF"
              strokeWidth={2}
              dot={{ r: 3, fill: '#1E40AF', strokeWidth: 1 }}
              activeDot={{ r: 5, strokeWidth: 0, cursor: 'pointer' }}
            />
            <Line
              type="monotone"
              dataKey="expectedRevenue"
              name="Expected Revenue"
              stroke="#60A5FA"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
              activeDot={{ r: 4, cursor: 'pointer' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RevenueTrendSection;
