import React from 'react';
import { CheckCircle2, Clock, Sparkles } from 'lucide-react';

/**
 * SubscriptionTimelineCard
 * Visual stage stepper (Purchased ➔ Renewed ➔ Current Term ➔ Next Renewal).
 * Full light & dark mode support.
 */
export const SubscriptionTimelineCard = ({ stages = [] }) => {
  if (!stages || stages.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm transition-colors duration-200">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400">
          <Clock size={16} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Subscription Lifecycle Timeline
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Account onboarding and renewal milestones
          </p>
        </div>
      </div>

      {/* Horizontal / Responsive Stepper */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
        {stages.map((stage, idx) => {
          const isDone = stage.status === 'completed';
          const isActive = stage.status === 'active';

          return (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border transition-all ${
                isActive
                  ? 'bg-blue-50/50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 ring-1 ring-blue-500/20'
                  : isDone
                  ? 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                  : 'bg-white dark:bg-slate-900 border-dashed border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Step 0{idx + 1}
                </span>
                {isDone ? (
                  <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400" />
                ) : isActive ? (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-600 text-white">
                    Current
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    Upcoming
                  </span>
                )}
              </div>

              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                {stage.title}
              </h4>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                {stage.date}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 leading-relaxed">
                {stage.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SubscriptionTimelineCard;
