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
import { formatCurrency } from '../../utils/formatters';

const CustomSpendingTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 shadow-md text-xs">
        <p className="font-semibold text-slate-900 dark:text-slate-100 mb-1">{label}</p>
        <p className="text-slate-600 dark:text-slate-400">
          Amount:{' '}
          <span className="font-bold text-blue-600 dark:text-blue-400">
            {formatCurrency(data.spending)}
          </span>
        </p>
        <p className="text-slate-400 dark:text-slate-500 text-[11px] mt-0.5">
          Plan: {data.plan}
        </p>
      </div>
    );
  }
  return null;
};

/**
 * CustomerSpendingChart
 * Visualizes customer monthly recurring billing spend over time.
 */
export const CustomerSpendingChart = ({ data = [] }) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm transition-colors duration-200">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Monthly Spending Overview
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Historical invoice settlements and recurring SaaS billing charges
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900">
          Year-to-Date
        </span>
      </div>

      <div className="w-full h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" className="dark:opacity-10" vertical={false} />
            <XAxis
              dataKey="month"
              stroke="#94A3B8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#E2E8F0', className: 'dark:opacity-20' }}
            />
            <YAxis
              stroke="#94A3B8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#E2E8F0', className: 'dark:opacity-20' }}
              tickFormatter={(val) => `$${val}`}
            />
            <Tooltip content={<CustomSpendingTooltip />} />
            <Area
              type="monotone"
              dataKey="spending"
              stroke="#2563EB"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#spendGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CustomerSpendingChart;
