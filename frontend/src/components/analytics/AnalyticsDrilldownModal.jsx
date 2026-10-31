import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronRight,
  TrendingUp,
  Package,
  User,
  FileText,
  DollarSign,
  Download,
  Calendar,
  CheckCircle2,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react';
import { useToast } from '../common/Toast';

/**
 * AnalyticsDrilldownModal
 * Interactive Enterprise BI Drill-Down Modal.
 * Supports seamless traversal:
 * Revenue Trajectory -> Product Tier -> Customer Account -> Invoice Detail.
 */
export const AnalyticsDrilldownModal = ({
  isOpen = false,
  onClose,
  initialData = null,
}) => {
  const { success } = useToast();

  // Drilldown hierarchy state: stack of view steps [{ level: 'revenue'|'product'|'customer'|'invoice', data }]
  const [history, setHistory] = useState([]);

  // Initialize history whenever modal opens with new selection
  useEffect(() => {
    if (isOpen && initialData) {
      setHistory([{ level: initialData.level || 'revenue', data: initialData }]);
    } else {
      setHistory([]);
    }
  }, [isOpen, initialData]);

  if (!isOpen || history.length === 0) return null;

  const currentStep = history[history.length - 1];
  const { level, data } = currentStep;

  const pushStep = (nextLevel, nextData) => {
    setHistory((prev) => [...prev, { level: nextLevel, data: nextData }]);
  };

  const popStep = () => {
    if (history.length > 1) {
      setHistory((prev) => prev.slice(0, prev.length - 1));
    } else {
      onClose();
    }
  };

  const jumpToStep = (index) => {
    setHistory((prev) => prev.slice(0, index + 1));
  };

  const handleExportSlice = () => {
    success(`Exported ${data.title || level} drill-down report to CSV`, 'Export Success');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 select-none animate-in fade-in duration-150"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 transition-all duration-200">
        {/* Modal Top Bar with Breadcrumbs & Close */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          {/* Breadcrumb Trail */}
          <nav aria-label="Drilldown Path" className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 overflow-x-auto">
            {history.map((step, idx) => {
              const isLast = idx === history.length - 1;
              const label =
                step.data.product ||
                step.data.customer ||
                step.data.invoiceNumber ||
                step.data.month ||
                step.data.title ||
                step.level;

              return (
                <React.Fragment key={idx}>
                  {idx > 0 && <ChevronRight size={13} className="text-slate-400 shrink-0" />}
                  <button
                    type="button"
                    onClick={() => jumpToStep(idx)}
                    className={`font-medium capitalize hover:underline shrink-0 ${
                      isLast
                        ? 'text-blue-600 dark:text-blue-400 font-bold'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {label}
                  </button>
                </React.Fragment>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportSlice}
              className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 shadow-2xs"
            >
              <Download size={12} />
              <span>Export</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Back button if deeper than level 0 */}
          {history.length > 1 && (
            <button
              type="button"
              onClick={popStep}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              <ArrowLeft size={13} />
              <span>Back to parent level</span>
            </button>
          )}

          {/* VIEW: Level 1 - Revenue Trajectory / Month */}
          {level === 'revenue' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <TrendingUp size={20} className="text-blue-600" />
                    <span>{data.month || 'Selected Period'} Revenue Analysis</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Itemized product tiers and contribution breakdown for {data.month || 'this cycle'}
                  </p>
                </div>
                <span className="text-sm font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-3 py-1 rounded-full">
                  ${Number(data.monthlyRevenue || data.revenue || 42800).toLocaleString()} Collected
                </span>
              </div>

              {/* Product Tiers in this Revenue Month */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                  Click a Product Tier to Drill Down
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { product: 'Enterprise Suite', revenue: 26800, subs: 18, growth: '+18.4%' },
                    { product: 'Professional Tier', revenue: 11400, subs: 32, growth: '+12.1%' },
                    { product: 'Starter Plan', revenue: 4600, subs: 54, growth: '+6.5%' },
                  ].map((tier, i) => (
                    <div
                      key={i}
                      onClick={() => pushStep('product', tier)}
                      className="cursor-pointer p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl hover:border-blue-500 hover:shadow-sm transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                          {tier.product}
                        </span>
                        <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                      <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-2">
                        ${tier.revenue.toLocaleString()}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        <span>{tier.subs} subscribers</span>
                        <span className="text-emerald-600 font-semibold">{tier.growth}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* VIEW: Level 2 - Product Tier Breakdown */}
          {level === 'product' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Package size={20} className="text-blue-600" />
                    <span>{data.product} Drill-Down</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Customer subscription accounts enrolled under this tier
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Total Package MRR</span>
                  <span className="text-base font-bold text-blue-600 dark:text-blue-400">
                    ${Number(data.revenue || 26800).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Customers subscribing to this product */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Select a Customer Account
                </h4>
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="p-3 font-semibold">Customer Account</th>
                        <th className="p-3 font-semibold">Tier Plan</th>
                        <th className="p-3 font-semibold">Revenue Contribution</th>
                        <th className="p-3 font-semibold">Status</th>
                        <th className="p-3 font-semibold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {[
                        { customer: 'Acme Technologies Inc.', domain: 'acme.com', tier: data.product, revenue: '$4,280.00', status: 'Active' },
                        { customer: 'Globex Corporation', domain: 'globex.io', tier: data.product, revenue: '$3,480.00', status: 'Active' },
                        { customer: 'Soylent Corp', domain: 'soylent.com', tier: data.product, revenue: '$2,850.00', status: 'Active' },
                        { customer: 'Hooli Systems', domain: 'hooli.com', tier: data.product, revenue: '$2,400.00', status: 'Past Due' },
                      ].map((cust, idx) => (
                        <tr
                          key={idx}
                          onClick={() => pushStep('customer', cust)}
                          className="hover:bg-blue-50/50 dark:hover:bg-blue-950/30 cursor-pointer transition-colors"
                        >
                          <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">
                            {cust.customer}
                            <span className="block text-[11px] text-slate-400 font-normal">{cust.domain}</span>
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-300">{cust.tier}</td>
                          <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{cust.revenue}</td>
                          <td className="p-3">
                            <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full ${
                              cust.status === 'Active'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400'
                            }`}>
                              {cust.status}
                            </span>
                          </td>
                          <td className="p-3 text-right text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                            Drill Down &rarr;
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: Level 3 - Customer Account Invoices & Details */}
          {level === 'customer' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <User size={20} className="text-blue-600" />
                    <span>{data.customer} Invoices</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Account ID: CUST-{data.customer?.substring(0, 4).toUpperCase()} &bull; Primary Tier: {data.tier || 'Enterprise'}
                  </p>
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {data.revenue} Total Lifetime
                </span>
              </div>

              {/* Invoices belonging to this customer */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Customer Invoice Ledger (Click to inspect invoice)
                </h4>
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="p-3 font-semibold">Invoice Number</th>
                        <th className="p-3 font-semibold">Billing Period</th>
                        <th className="p-3 font-semibold">Amount</th>
                        <th className="p-3 font-semibold">Payment Status</th>
                        <th className="p-3 font-semibold text-right">Inspect</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {[
                        { invoiceNumber: 'INV-2026-0819', period: 'Oct 01 - Oct 31, 2026', amount: '$3,480.00', status: 'Paid', date: 'Oct 28, 2026', customer: data.customer },
                        { invoiceNumber: 'INV-2026-0715', period: 'Sep 01 - Sep 30, 2026', amount: '$3,480.00', status: 'Paid', date: 'Sep 28, 2026', customer: data.customer },
                        { invoiceNumber: 'INV-2026-0612', period: 'Aug 01 - Aug 31, 2026', amount: '$3,480.00', status: 'Paid', date: 'Aug 28, 2026', customer: data.customer },
                      ].map((inv, idx) => (
                        <tr
                          key={idx}
                          onClick={() => pushStep('invoice', inv)}
                          className="hover:bg-blue-50/50 dark:hover:bg-blue-950/30 cursor-pointer transition-colors"
                        >
                          <td className="p-3 font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                            <FileText size={13} />
                            {inv.invoiceNumber}
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-300">{inv.period}</td>
                          <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{inv.amount}</td>
                          <td className="p-3">
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
                              <CheckCircle2 size={11} />
                              {inv.status}
                            </span>
                          </td>
                          <td className="p-3 text-right text-slate-500 font-semibold hover:text-blue-600">
                            View Receipt &rarr;
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: Level 4 - Final Itemized Invoice Detail */}
          {level === 'invoice' && (
            <div className="space-y-5 bg-slate-50/60 dark:bg-slate-800/40 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Official Tax Invoice
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {data.invoiceNumber}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Issued to {data.customer} &bull; Date: {data.date || 'Oct 28, 2026'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-400">
                    Status: {data.status || 'Paid'}
                  </span>
                  <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-2">
                    {data.amount}
                  </div>
                </div>
              </div>

              {/* Line items table */}
              <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400">
                      <th className="pb-2 font-medium text-left">Description</th>
                      <th className="pb-2 font-medium text-center">Qty</th>
                      <th className="pb-2 font-medium text-right">Unit Price</th>
                      <th className="pb-2 font-medium text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    <tr>
                      <td className="py-2.5 font-medium text-slate-800 dark:text-slate-200">
                        Enterprise SaaS License (Tier 1) - Monthly
                      </td>
                      <td className="py-2.5 text-center text-slate-600 dark:text-slate-400">1</td>
                      <td className="py-2.5 text-right text-slate-600 dark:text-slate-400">$3,000.00</td>
                      <td className="py-2.5 text-right font-bold text-slate-900 dark:text-slate-100">$3,000.00</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-medium text-slate-800 dark:text-slate-200">
                        Additional User Seats (x16 Pack)
                      </td>
                      <td className="py-2.5 text-center text-slate-600 dark:text-slate-400">16</td>
                      <td className="py-2.5 text-right text-slate-600 dark:text-slate-400">$30.00</td>
                      <td className="py-2.5 text-right font-bold text-slate-900 dark:text-slate-100">$480.00</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-slate-200 dark:border-slate-700 font-bold">
                      <td colSpan={3} className="pt-3 text-right text-slate-600 dark:text-slate-400">
                        Total Amount Paid:
                      </td>
                      <td className="pt-3 text-right text-blue-600 dark:text-blue-400 text-sm">
                        {data.amount}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
                <span>Payment method: ACH Transfer (settled)</span>
                <button
                  type="button"
                  onClick={() => success(`Receipt ${data.invoiceNumber} downloaded`, 'Download Complete')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  <Download size={13} />
                  <span>Download PDF Receipt</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDrilldownModal;

