import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { formatCurrency } from '../../utils/formatters';

const CustomDonutTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 shadow-md text-xs">
        <p className="font-semibold text-slate-900 dark:text-slate-100">{data.name}</p>
        <p className="text-slate-600 dark:text-slate-400">
          Invoices: <span className="font-bold text-slate-800 dark:text-slate-200">{data.value}</span>
        </p>
        <p className="text-slate-600 dark:text-slate-400">
          Total: <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(data.amount)}</span>
        </p>
      </div>
    );
  }
  return null;
};

/**
 * CustomerInvoiceStatusChart
 * Visualizes customer settlement status (Paid vs Pending vs Overdue).
 */
export const CustomerInvoiceStatusChart = ({ data = [] }) => {
  const chartData = data.length > 0 ? data : [{ name: 'All Settled', value: 1, color: '#10B981', amount: 0 }];
  const isSettled = data.length === 0 || !data.some(d => d.name === 'Pending' || d.name === 'Overdue');

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm transition-colors duration-200">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Invoice Standing Ratio
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Settled invoices vs pending receivables
          </p>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isSettled ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'}`}>
          {isSettled ? '100% Settled' : 'Action Required'}
        </span>
      </div>

      <div className="w-full h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={75}
              paddingAngle={4}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomDonutTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              iconSize={8}
              formatter={(value) => (
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CustomerInvoiceStatusChart;
