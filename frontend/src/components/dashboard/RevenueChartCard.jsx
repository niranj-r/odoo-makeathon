import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { TrendingUp, BarChart3, LineChart as LineIcon, Layers } from 'lucide-react';
import { LoadingSkeleton } from '../common/LoadingSkeleton';

/**
 * Custom Enterprise Tooltip for Revenue Chart
 */
const CustomRevenueTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 shadow-md text-xs space-y-1 select-none">
        <p className="font-bold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-1 mb-1.5">
          {label} 2026 Trajectory
        </p>
        {payload.map((entry, idx) => (
          <div key={idx} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-400">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              {entry.name || 'Revenue'}:
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
 * RevenueChartCard
 * Task 7: Multi-mode Revenue Visualization (Bar, Area, and Line) using Recharts.
 * Equipped with Trend Indicators, Legends, and Professional Tooltips.
 */
export const RevenueChartCard = ({ data = [], loading = false }) => {
  const [chartType, setChartType] = useState('area'); // 'area' | 'bar' | 'line'

  if (loading) {
    return <LoadingSkeleton variant="chart" />;
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between select-none transition-colors duration-200">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-1.5">
              <TrendingUp size={17} className="text-blue-600 dark:text-blue-400 stroke-[2.2]" />
              <span>Recurring Revenue Trajectory</span>
            </h3>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              +14.2% YoY
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Cash collected vs contracted annual run rate
          </p>
        </div>

        {/* Chart View Switcher (Area / Bar / Line) */}
        <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold gap-1">
          <button
            type="button"
            onClick={() => setChartType('area')}
            className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
              chartType === 'area'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            title="Area Run Rate"
          >
            <Layers size={12} />
            <span>Area</span>
          </button>
          <button
            type="button"
            onClick={() => setChartType('bar')}
            className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
              chartType === 'bar'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            title="Bar Cash Flow"
          >
            <BarChart3 size={12} />
            <span>Bar</span>
          </button>
          <button
            type="button"
            onClick={() => setChartType('line')}
            className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
              chartType === 'line'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            title="Line Trajectory"
          >
            <LineIcon size={12} />
            <span>Line</span>
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="w-full h-72">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} className="dark:stroke-slate-800" />
              <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={{ stroke: '#E2E8F0' }} />
              <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${Math.round(val / 1000)}k`} />
              <Tooltip content={<CustomRevenueTooltip />} />
              <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }} />
              <Area type="monotone" dataKey="revenue" name="Total Revenue" stroke="#2563EB" strokeWidth={2.5} fillOpacity={1} fill="url(#revenueGrad)" />
              <Line type="monotone" dataKey="recurring" name="Contracted MRR" stroke="#1E40AF" strokeWidth={2} dot={false} strokeDasharray="4 4" />
            </AreaChart>
          ) : chartType === 'bar' ? (
            <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} className="dark:stroke-slate-800" />
              <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={{ stroke: '#E2E8F0' }} />
              <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${Math.round(val / 1000)}k`} />
              <Tooltip content={<CustomRevenueTooltip />} cursor={{ fill: '#F8FAFC' }} />
              <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }} />
              <Bar dataKey="revenue" name="Collected Cash" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={36} />
              <Bar dataKey="expected" name="Projected" fill="#93C5FD" radius={[4, 4, 0, 0]} maxBarSize={36} />
            </BarChart>
          ) : (
            <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} className="dark:stroke-slate-800" />
              <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={{ stroke: '#E2E8F0' }} />
              <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${Math.round(val / 1000)}k`} />
              <Tooltip content={<CustomRevenueTooltip />} />
              <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }} />
              <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="expected" name="Expected" stroke="#60A5FA" strokeWidth={2} strokeDasharray="4 4" dot={false} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Summary Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>Average Monthly Run Rate: <strong className="text-slate-800 dark:text-slate-200">$118,520</strong></span>
        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">+14.2% Growth Velocity</span>
      </div>
    </div>
  );
};

export default RevenueChartCard;
