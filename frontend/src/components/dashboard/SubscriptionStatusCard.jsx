import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import { ShieldCheck, PieChart as PieIcon } from 'lucide-react';
import { LoadingSkeleton } from '../common/LoadingSkeleton';

/**
 * Custom Tooltip for Subscription Status Pie
 */
const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 shadow-md text-xs select-none">
        <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-100">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: data.color }}
          />
          {data.name}
        </div>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          {Number(data.value).toLocaleString()} accounts ({data.percentage})
        </p>
      </div>
    );
  }
  return null;
};

/**
 * SubscriptionStatusCard
 * Task 7: Donut chart visualizing account status distribution across active plans.
 * Equipped with center metric, status indicators, and legend breakdown.
 */
export const SubscriptionStatusCard = ({ data = [], loading = false }) => {
  if (loading) {
    return <LoadingSkeleton variant="chart" />;
  }

  const totalSubscriptions = data.reduce((acc, curr) => acc + (curr.value || 0), 0);
  const activeSubs = data.find((d) => d.name === 'Active')?.value || Math.round(totalSubscriptions * 0.78);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between select-none transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-2">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-1.5">
            <PieIcon size={16} className="text-blue-600 dark:text-blue-400 stroke-[2.2]" />
            <span>Subscription Health</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Lifecycle stages & churn buffer
          </p>
        </div>

        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg">
          {totalSubscriptions.toLocaleString()} Total
        </span>
      </div>

      {/* Donut Chart Canvas */}
      <div className="w-full h-52 relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  className="hover:opacity-85 transition-opacity"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomPieTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center Total Count Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
            {activeSubs.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
            Active Tiers
          </span>
        </div>
      </div>

      {/* Status Breakdown Legend */}
      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
        {data.map((item) => (
          <div
            key={item.name}
            className="flex items-center justify-between p-2 rounded-lg bg-slate-50/70 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60"
          >
            <div className="flex items-center gap-1.5 truncate">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-slate-600 dark:text-slate-300 text-[11px] truncate">
                {item.name}
              </span>
            </div>
            <span className="font-bold text-slate-900 dark:text-slate-100 text-[11px]">
              {item.percentage}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubscriptionStatusCard;
