import React from 'react';
import { Check, Sparkles, CheckCircle2, ArrowRight, Eye, Users, HardDrive, Zap, Headphones } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

/**
 * PlanCard
 * Task 1: Complete Enterprise SaaS pricing tier card with "View Details" and "Buy Now".
 */
export const PlanCard = ({
  plan,
  billingCycle = 'yearly',
  isCurrent = false,
  onViewDetails,
  onBuyNow,
}) => {
  const isYearly = billingCycle === 'yearly';
  const price = isYearly ? plan.yearlyMonthlyEquivalent : plan.monthlyPrice;
  const billedAmount = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
  const discountText = isYearly ? 'Save 20%' : null;

  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between relative overflow-hidden select-none ${isCurrent
        ? 'border-blue-600 ring-2 ring-blue-600/20 shadow-md'
        : plan.popular
          ? 'border-blue-400 dark:border-blue-600 shadow-md'
          : 'border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700'
        }`}
    >
      {/* Top Banner / Badge */}
      {isCurrent ? (
        <div className="bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider py-1 px-3 text-center flex items-center justify-center gap-1">
          <CheckCircle2 size={12} />
          Current Active Plan
        </div>
      ) : plan.popular ? (
        <div className="bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[10px] font-bold uppercase tracking-wider py-1 px-3 text-center border-b border-blue-100 dark:border-blue-900/50 flex items-center justify-center gap-1">
          <Sparkles size={12} />
          Most Popular Choice
        </div>
      ) : null}

      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {plan.name}
            </h3>
            {discountText && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                {discountText}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 min-h-[36px] leading-relaxed">
            {plan.tagline}
          </p>

          {/* Pricing Row */}
          <div className="pb-5 mb-5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                {formatCurrency(price)}
              </span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                / mo
              </span>
            </div>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 block">
              {isYearly
                ? `${formatCurrency(billedAmount)} billed annually`
                : 'Billed monthly, cancel anytime'}
            </span>
          </div>

          {/* Quotas & Specs Grid */}
          <div className="space-y-2 mb-5 text-xs bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Users size={13} className="text-blue-500" />
                <span>Users:</span>
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {plan.seatsIncluded > 100 ? 'Unlimited' : `${plan.seatsIncluded} seats`}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <HardDrive size={13} className="text-purple-500" />
                <span>Storage:</span>
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {plan.storageGb} GB SSD
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Zap size={13} className="text-teal-500" />
                <span>Throughput:</span>
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                {plan.apiLimit?.split(' ')[0] || '10,000'} /mo
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Headphones size={13} className="text-amber-500" />
                <span>Support:</span>
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                {plan.supportLevel?.split('&')[0]?.trim() || 'Standard'}
              </span>
            </div>
          </div>

          {/* Features Bullet Points */}
          <div className="mb-6">
            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block mb-2.5">
              Included Capabilities:
            </span>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              {plan.features?.slice(0, 4).map((feat, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <Check size={14} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <span className="leading-tight">{feat}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Action Buttons: View Details & Buy Now */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onViewDetails?.(plan)}
            className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-1.5"
            title="Inspect full specifications"
          >
            <Eye size={13} />
            <span>View Details</span>
          </button>

          {isCurrent ? (
            <button
              type="button"
              disabled
              className="flex-1 py-2 px-3 rounded-xl text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 cursor-default flex items-center justify-center gap-1"
            >
              <CheckCircle2 size={13} />
              <span>Active</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onBuyNow?.(plan)}
              className="flex-1 py-2 px-3 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-all flex items-center justify-center gap-1 shadow-sm hover:shadow-md"
            >
              <span>Buy Now</span>
              <ArrowRight size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlanCard;
