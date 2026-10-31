import React from 'react';
import { Building2, ShieldCheck, ChevronRight, MousePointerClick } from 'lucide-react';
import { LoadingSkeleton } from '../common/LoadingSkeleton';

/**
 * TopCustomersTable
 * Enterprise ranking table of high-value subscriber accounts with drilldown click support.
 *
 * @param {Object} props
 * @param {Array} props.customers
 * @param {boolean} [props.loading=false]
 * @param {(type: string, customer: any) => void} [props.onDrillDown]
 */
export const TopCustomersTable = ({
  customers = [],
  loading = false,
  onDrillDown,
}) => {
  if (loading) {
    return <LoadingSkeleton variant="table" />;
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden select-none transition-colors duration-200">
      {/* Table Header Row */}
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <Building2 size={18} className="text-blue-600 dark:text-blue-400 stroke-[2.2]" />
            <span>Top Performing Accounts</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
            <span>Key accounts contributing the highest lifetime subscription revenue</span>
            <span className="inline-flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded">
              <MousePointerClick size={10} />
              Click row to view invoices
            </span>
          </p>
        </div>

        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Ranked by Contracted ARR
        </span>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-6">Customer</th>
              <th className="py-3 px-6">Revenue</th>
              <th className="py-3 px-6">Subscriptions</th>
              <th className="py-3 px-6">Last Payment</th>
              <th className="py-3 px-6">Status</th>
              <th className="py-3 px-6 text-right">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
            {customers.map((c, index) => (
              <tr
                key={c.id}
                onClick={() => onDrillDown && onDrillDown('customer', c)}
                className="hover:bg-blue-50/40 dark:hover:bg-blue-950/20 cursor-pointer transition-colors group"
              >
                {/* Customer with rank avatar & domain */}
                <td className="py-3.5 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {c.customer}
                      </div>
                      <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-mono">
                        {c.domain}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Contracted Revenue */}
                <td className="py-3.5 px-6 font-bold text-slate-900 dark:text-slate-100">
                  {c.revenue}
                </td>

                {/* Subscriptions */}
                <td className="py-3.5 px-6">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60">
                    <ShieldCheck size={13} className="text-blue-600 dark:text-blue-400" />
                    <span>{c.subscriptions} Active Licenses</span>
                  </span>
                </td>

                {/* Last Payment */}
                <td className="py-3.5 px-6 text-xs text-slate-500 dark:text-slate-400">
                  {c.lastPayment}
                </td>

                {/* Status Badge */}
                <td className="py-3.5 px-6">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                    {c.status}
                  </span>
                </td>

                {/* Inspect Action Arrow */}
                <td className="py-3.5 px-6 text-right">
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Invoices</span>
                    <ChevronRight size={13} />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TopCustomersTable;
