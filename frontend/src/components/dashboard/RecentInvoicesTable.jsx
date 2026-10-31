import React from 'react';
import { Eye, Download, FileText } from 'lucide-react';
import { LoadingSkeleton } from '../common/LoadingSkeleton';

/**
 * Status Badge for Invoices
 * Enterprise color system: Paid = Green, Pending = Amber, Overdue = Red
 */
const InvoiceStatusBadge = ({ status }) => {
  switch (status?.toLowerCase()) {
    case 'paid':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          Paid
        </span>
      );
    case 'pending':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          Pending
        </span>
      );
    case 'overdue':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          Overdue
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          {status}
        </span>
      );
  }
};

/**
 * RecentInvoicesTable
 * Enterprise table component displaying recent billing events and statuses.
 *
 * @param {Object} props
 * @param {Array} props.invoices
 * @param {boolean} [props.loading=false]
 */
export const RecentInvoicesTable = ({ invoices = [], loading = false }) => {
  if (loading) {
    return <LoadingSkeleton variant="table" />;
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
      {/* Table Header Row */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-base font-semibold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText size={18} className="text-blue-600" />
            <span>Recent Invoices</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Latest customer billing transactions and settlements
          </p>
        </div>

        <span className="text-xs text-slate-500 font-medium">
          Showing last <strong>{invoices.length}</strong> invoices
        </span>
      </div>

      {/* Table Data */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-6">Invoice ID</th>
              <th className="py-3 px-6">Customer</th>
              <th className="py-3 px-6">Plan</th>
              <th className="py-3 px-6">Amount</th>
              <th className="py-3 px-6">Status</th>
              <th className="py-3 px-6">Due Date</th>
              <th className="py-3 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {invoices.map((inv) => (
              <tr
                key={inv.id}
                className="hover:bg-slate-50/60 transition-colors group"
              >
                {/* Invoice ID */}
                <td className="py-3.5 px-6 font-mono text-xs font-semibold text-blue-600">
                  {inv.id}
                </td>

                {/* Customer */}
                <td className="py-3.5 px-6">
                  <div className="font-medium text-slate-900 leading-tight">
                    {inv.customer}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {inv.customerEmail}
                  </div>
                </td>

                {/* Plan */}
                <td className="py-3.5 px-6 text-slate-600 text-xs font-medium">
                  {inv.plan}
                </td>

                {/* Amount */}
                <td className="py-3.5 px-6 font-semibold text-slate-900">
                  {inv.amount}
                </td>

                {/* Status Badge */}
                <td className="py-3.5 px-6">
                  <InvoiceStatusBadge status={inv.status} />
                </td>

                {/* Due Date */}
                <td className="py-3.5 px-6 text-xs text-slate-500">
                  {inv.dueDate}
                </td>

                {/* Actions */}
                <td className="py-3.5 px-6 text-right">
                  <div className="inline-flex items-center gap-1">
                    <button
                      type="button"
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="View invoice details"
                      aria-label="View invoice"
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      type="button"
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                      title="Download PDF"
                      aria-label="Download invoice PDF"
                    >
                      <Download size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentInvoicesTable;

