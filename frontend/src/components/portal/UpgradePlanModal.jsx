import React, { useState } from 'react';
import { X, Check, ArrowRight, CreditCard, Sparkles, Calendar, ShieldCheck } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

/**
 * UpgradePlanModal
 * Professional Stripe / Linear style subscription upgrade confirmation dialog.
 */
export const UpgradePlanModal = ({
  isOpen,
  selectedPlan,
  currentSubscription,
  onClose,
  onConfirmUpgrade,
}) => {
  const [billingCycle, setBillingCycle] = useState('yearly');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !selectedPlan) return null;

  const currentPlanName = currentSubscription?.plan || 'Professional';
  const currentMonthlyPrice = currentSubscription?.monthlyEquivalent || 79;
  const newMonthlyPrice =
    billingCycle === 'yearly'
      ? selectedPlan.yearlyMonthlyEquivalent
      : selectedPlan.monthlyPrice;
  const billedAmount =
    billingCycle === 'yearly' ? selectedPlan.yearlyPrice : selectedPlan.monthlyPrice;
  const priceDiff = newMonthlyPrice - currentMonthlyPrice;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirmUpgrade?.(selectedPlan.id, billingCycle);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto flex flex-col animate-fadeIn">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Sparkles size={16} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Confirm Subscription Change
              </h2>
              <p className="text-xs text-slate-500">
                Review terms and billing adjustments
              </p>
            </div>
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
        <div className="p-6 space-y-5 text-xs text-slate-700">
          {/* Plan Comparison Box */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-4">
            <div className="flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Current Plan
              </span>
              <p className="font-bold text-slate-900 text-sm">{currentPlanName}</p>
              <p className="text-slate-500">{formatCurrency(currentMonthlyPrice)} / mo</p>
            </div>

            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <ArrowRight size={14} />
            </div>

            <div className="flex-1 text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block mb-0.5">
                New Selection
              </span>
              <p className="font-bold text-slate-900 text-sm">{selectedPlan.name}</p>
              <p className="text-blue-700 font-semibold">{formatCurrency(newMonthlyPrice)} / mo</p>
            </div>
          </div>

          {/* Billing Cycle Switcher */}
          <div>
            <label className="block text-xs font-semibold text-slate-900 mb-1.5">
              Choose Billing Cadence
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Monthly ({formatCurrency(selectedPlan.monthlyPrice)}/mo)
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('yearly')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  billingCycle === 'yearly'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Annual ({formatCurrency(selectedPlan.yearlyMonthlyEquivalent)}/mo)</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded">
                  Save 17%
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Adjustments Summary */}
          <div className="space-y-2 p-4 border border-slate-200 rounded-xl bg-white">
            <div className="flex justify-between">
              <span className="text-slate-500">Effective Date:</span>
              <span className="font-semibold text-slate-900">Immediate Activation</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Billed Today:</span>
              <span className="font-bold text-slate-900 text-sm">
                {formatCurrency(billedAmount)}
              </span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Net Monthly Difference:</span>
              <span className={priceDiff >= 0 ? 'text-blue-600 font-semibold' : 'text-emerald-600 font-semibold'}>
                {priceDiff >= 0 ? `+${formatCurrency(priceDiff)}/mo` : `${formatCurrency(priceDiff)}/mo`}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-100 text-slate-600">
              <span className="flex items-center gap-1">
                <CreditCard size={13} className="text-slate-400" />
                Payment Method:
              </span>
              <span className="font-semibold text-slate-900">
                {currentSubscription?.paymentMethod?.brand || 'Visa'} ••••{' '}
                {currentSubscription?.paymentMethod?.last4 || '4242'}
              </span>
            </div>
          </div>

          {/* Assurance info */}
          <div className="flex items-start gap-2 p-3 bg-blue-50/50 border border-blue-100 rounded-xl text-[11px] text-blue-900">
            <ShieldCheck size={16} className="text-blue-600 shrink-0 mt-0.5" />
            <p>
              Your plan features and increased quotas (storage, team seats, API throughput) will be unlocked immediately upon confirmation.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/75 flex items-center justify-between rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleConfirm}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors"
          >
            {isSubmitting ? 'Processing Upgrade...' : `Confirm & Switch to ${selectedPlan.name}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpgradePlanModal;

