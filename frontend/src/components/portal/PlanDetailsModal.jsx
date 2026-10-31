import React from 'react';
import {
  X,
  CheckCircle2,
  Users,
  HardDrive,
  Zap,
  Headphones,
  Shield,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

/**
 * PlanDetailsModal
 * Task 2: Comprehensive Plan Deep-Dive Modal.
 * Displays complete features, limits, included modules, billing options, and Buy Now trigger.
 */
export const PlanDetailsModal = ({
  plan,
  billingCycle = 'yearly',
  isOpen = false,
  onClose,
  onBuyNow,
}) => {
  if (!isOpen || !plan) return null;

  const isYearly = billingCycle === 'yearly';
  const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
  const savePercentage = isYearly ? 'Save 20%' : null;

  const modules = [
    { name: 'Subscription Automation Engine', desc: 'Auto-renewal, prorations, and plan switches' },
    { name: 'Multi-Currency Invoicing', desc: 'Automated tax calculations, VAT, and GST' },
    { name: 'Customer Self-Service Portal', desc: 'Secure customer management and billing history' },
    { name: 'Executive BI Analytics', desc: 'MRR trajectory, churn forecasting, and cohort retention' },
    { name: 'Real-time Webhook Dispatcher', desc: 'Instant events to Zapier, Slack, and webhooks' },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 select-none animate-in fade-in duration-150"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 transition-all duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Plan Overview
              </span>
              {savePercentage && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  {savePercentage}
                </span>
              )}
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {plan.name} Tier
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {plan.tagline}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Price & Billing */}
          <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 flex items-center justify-between flex-wrap gap-4">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
                Investment ({billingCycle} billing)
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-3xl font-extrabold text-blue-700 dark:text-blue-400">
                  {formatCurrency(price)}
                </span>
                <span className="text-slate-500 font-medium">
                  / {isYearly ? 'year' : 'month'}
                </span>
              </div>
              {isYearly && (
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Equivalent to {formatCurrency(plan.yearlyMonthlyEquivalent)} / month billed annually
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onBuyNow?.(plan, billingCycle);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition-colors text-xs"
            >
              <span>Subscribe to {plan.name}</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {/* Core Limits Grid */}
          <div>
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] mb-3">
              Included Limits & Allowances
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <Users size={16} className="text-blue-600 mb-1" />
                <span className="text-[10px] text-slate-400 block font-medium">Team Seats</span>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {plan.seatsIncluded === 999 ? 'Unlimited' : `${plan.seatsIncluded} Seats`}
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <HardDrive size={16} className="text-purple-600 mb-1" />
                <span className="text-[10px] text-slate-400 block font-medium">Storage Quota</span>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {plan.storageGb} GB SSD
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <Zap size={16} className="text-teal-600 mb-1" />
                <span className="text-[10px] text-slate-400 block font-medium">API Throughput</span>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate block">
                  {plan.apiLimit?.split(' ')[0] || '10,000'} /mo
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <Headphones size={16} className="text-amber-600 mb-1" />
                <span className="text-[10px] text-slate-400 block font-medium">Support SLA</span>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate block">
                  {plan.supportLevel?.split('&')[0]?.trim() || 'Standard'}
                </span>
              </div>
            </div>
          </div>

          {/* Included Modules */}
          <div>
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] mb-3 flex items-center gap-1.5">
              <Layers size={13} className="text-blue-600" />
              <span>Bundled Enterprise Modules</span>
            </h4>
            <div className="space-y-2">
              {modules.map((mod, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40"
                >
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                      {mod.name}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {mod.desc}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Complete Feature Checkmarks */}
          <div>
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] mb-3 flex items-center gap-1.5">
              <Shield size={13} className="text-blue-600" />
              <span>Full Feature Specifications</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {plan.features?.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <CheckCircle2 size={13} className="text-blue-600 shrink-0" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onBuyNow?.(plan, billingCycle);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition-colors text-xs"
          >
            <span>Proceed to Buy Flow</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlanDetailsModal;

