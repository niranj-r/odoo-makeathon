import React from 'react';
import {
  Award,
  AlertTriangle,
  Star,
  Zap,
  Receipt,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

const INSIGHT_ICONS = {
  'best-plan': Award,
  'worst-plan': AlertTriangle,
  'top-customer': Star,
  'popular-product': Zap,
  'avg-invoice': Receipt,
  'collection-eff': ShieldCheck,
};

const TAG_STYLES = {
  'Highest Margin': 'bg-blue-50 text-blue-700 border-blue-200',
  'Attention Needed': 'bg-rose-50 text-rose-700 border-rose-200',
  'Enterprise Key': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Flagship Tier': 'bg-purple-50 text-purple-700 border-purple-200',
  'Expansion': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Optimal': 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

/**
 * ReportInsightsSection
 * Section 6: Executive subscription benchmarks and operational performance highlights.
 *
 * @param {Object} props
 * @param {Array} props.insights - List of 6 insight items
 * @param {boolean} [props.loading=false]
 */
export const ReportInsightsSection = ({ insights = [], loading = false }) => {
  return (
    <div>
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-900 tracking-tight">
          Executive Report Insights & Benchmarks
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Actionable intelligence derived from subscription revenues and customer billing cycles
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {insights.map((item) => {
          const Icon = INSIGHT_ICONS[item.id] || Award;
          const isNegative = item.trendType === 'negative';
          const tagStyle =
            TAG_STYLES[item.tag] || 'bg-slate-50 text-slate-700 border-slate-200';

          return (
            <div
              key={item.id}
              className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-slate-300 transition-colors flex flex-col justify-between"
            >
              <div>
                {/* Header with icon and tag */}
                <div className="flex items-center justify-between gap-1 mb-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-600">
                    <Icon size={16} />
                  </div>
                  {item.tag && (
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${tagStyle}`}
                    >
                      {item.tag}
                    </span>
                  )}
                </div>

                {/* Title & Value */}
                <span className="text-[11px] font-medium text-slate-500 block truncate">
                  {item.title}
                </span>
                <div className="text-sm font-bold text-slate-900 mt-1 truncate">
                  {item.value}
                </div>
                <div className="text-xs text-slate-600 mt-0.5 font-medium">
                  {item.metric}
                </div>
              </div>

              {/* Trend */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-1 text-[11px]">
                {isNegative ? (
                  <TrendingDown size={13} className="text-rose-500" />
                ) : (
                  <TrendingUp size={13} className="text-emerald-500" />
                )}
                <span
                  className={
                    isNegative
                      ? 'text-rose-600 font-semibold'
                      : 'text-emerald-600 font-semibold'
                  }
                >
                  {item.trend}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ReportInsightsSection;

