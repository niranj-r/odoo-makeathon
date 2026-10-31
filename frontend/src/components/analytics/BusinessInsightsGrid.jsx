import React from 'react';
import {
  Award,
  CalendarCheck,
  DollarSign,
  CheckCircle2,
  ShieldCheck,
  Activity,
} from 'lucide-react';
import { LoadingSkeleton } from '../common/LoadingSkeleton';

const iconMap = {
  Award,
  CalendarCheck,
  DollarSign,
  CheckCircle2,
  ShieldCheck,
  Activity,
};

/**
 * BusinessInsightsGrid
 * Displays strategic SaaS health benchmarks: Top Product, Top Plan, ARPU, Renewal, Retention, Health Score.
 *
 * @param {Object} props
 * @param {Object} props.insights
 * @param {boolean} [props.loading=false]
 */
export const BusinessInsightsGrid = ({ insights, loading = false }) => {
  if (loading || !insights) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <LoadingSkeleton key={i} variant="stat" />
        ))}
      </div>
    );
  }

  const insightList = [
    insights.highestRevenueProduct,
    insights.highestRevenuePlan,
    insights.averageRevenuePerCustomer,
    insights.renewalRate,
    insights.customerRetention,
  ].filter(Boolean);

  const health = insights.healthScore;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">
          Executive Business Insights & Health
        </h3>
        <span className="text-xs text-slate-400 font-medium">
          Strategic operational benchmarks
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Standard 5 Insights */}
        {insightList.map((item, idx) => {
          const Icon = iconMap[item.iconName] || Award;
          return (
            <div
              key={idx}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-slate-300 transition-colors flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {item.title}
                </span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                  <Icon size={16} className="stroke-[2]" />
                </div>
              </div>

              <div className="mt-3">
                <div className="text-xl font-bold text-slate-900 tracking-tight">
                  {item.value}
                </div>
                <div className="mt-1 text-xs font-semibold text-blue-600 truncate">
                  {item.label}
                </div>
                <div className="mt-1 text-[11px] text-slate-400">
                  {item.meta}
                </div>
              </div>
            </div>
          );
        })}

        {/* 6th Card: Subscription Health Score (Calculated with visual gauge) */}
        {health && (
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-slate-300 transition-colors flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {health.title}
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <Activity size={16} className="stroke-[2.5]" />
              </div>
            </div>

            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 tracking-tight">
                  {health.score}
                </span>
                <span className="text-xs text-slate-400 font-semibold">
                  / {health.maxScore}
                </span>
                <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {health.status}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(health.score / health.maxScore) * 100}%` }}
                />
              </div>

              <div className="mt-2 text-[11px] text-slate-400 line-clamp-1">
                {health.meta}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessInsightsGrid;

