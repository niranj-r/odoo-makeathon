import React from 'react';
import {
  X,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  FileText,
  CreditCard,
  RefreshCw,
  PauseCircle,
  XCircle,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';

/**
 * SubscriptionDetailModal
 * Section 3: In-depth lifecycle timeline, quota utilization, and billing statements for a subscription.
 */
export const SubscriptionDetailModal = ({
  subscription,
  isOpen,
  onClose,
  onRenew,
  onPause,
  onCancel,
}) => {
  if (!isOpen || !subscription) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-slate-900">
                {subscription.plan}
              </h2>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {subscription.status}
              </span>
            </div>
            <p className="font-mono text-xs text-slate-500 mt-0.5">
              {subscription.subscriptionNumber} &bull; Started {formatDate(subscription.startDate)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Section: Plan & Renewal Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <div>
              <span className="text-slate-400 block font-medium uppercase text-[10px]">
                Billing Amount
              </span>
              <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                {formatCurrency(subscription.amount)} / {subscription.interval}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium uppercase text-[10px]">
                Renewal Date
              </span>
              <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                {formatDate(subscription.renewalDate)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium uppercase text-[10px]">
                Auto-Renew
              </span>
              <span className="text-sm font-bold text-emerald-600 mt-0.5 block">
                {subscription.autoRenew ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium uppercase text-[10px]">
                Payment Method
              </span>
              <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                {subscription.paymentMethod?.brand} •••• {subscription.paymentMethod?.last4}
              </span>
            </div>
          </div>

          {/* Section: Products Included */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Layers size={14} className="text-blue-600" />
              Products Included in Subscription
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {subscription.productsIncluded?.map((prod) => (
                <div
                  key={prod.id}
                  className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-semibold text-slate-900 block">
                      {prod.name}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {prod.type}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-medium rounded text-[11px]">
                    {prod.quantity} {prod.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Subscription Timeline */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Clock size={14} className="text-blue-600" />
              Subscription Lifecycle Timeline
            </h4>
            <div className="relative pl-6 space-y-4 border-l-2 border-slate-200 ml-2">
              {subscription.timeline?.map((step, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-[31px] top-0 w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white shadow-xs" />
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      {step.event}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      &bull; {step.date}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Billing History */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <FileText size={14} className="text-blue-600" />
              Linked Billing History
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <tr>
                    <th className="px-4 py-2.5">Invoice</th>
                    <th className="px-4 py-2.5">Date</th>
                    <th className="px-4 py-2.5 text-right">Amount</th>
                    <th className="px-4 py-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subscription.billingHistory?.map((hist, i) => (
                    <tr key={i} className="hover:bg-slate-50/60">
                      <td className="px-4 py-2.5 font-mono text-slate-700">
                        {hist.invoiceNumber}
                      </td>
                      <td className="px-4 py-2.5 text-slate-600">
                        {formatDate(hist.date)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-slate-900">
                        {formatCurrency(hist.amount)}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {hist.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/75 flex items-center justify-between flex-wrap gap-2 rounded-b-2xl">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onRenew?.(subscription.id);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
            >
              <RefreshCw size={13} />
              Renew Term
            </button>
            <button
              type="button"
              onClick={() => {
                onPause?.(subscription.id);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
            >
              <PauseCircle size={13} className="text-amber-600" />
              {subscription.status === 'Paused' ? 'Resume Subscription' : 'Pause Subscription'}
            </button>
            <button
              type="button"
              onClick={() => {
                onCancel?.(subscription.id);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-white hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors"
            >
              <XCircle size={13} />
              Cancel Subscription
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionDetailModal;

