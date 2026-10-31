import React from "react";
import { BentoCard } from "@/components/common/BentoCard";
import { formatCurrency } from "@/utils/formatters";
import { TrendingUp } from "lucide-react";
export function TopPlansCard({ plans }) {
    return (<BentoCard title="Plan Tier Performance" description="MRR contribution & subscriber count by plan">
      <div className="space-y-4">
        {plans.map((plan) => (<div key={plan.planId} className="rounded-lg border border-slate-100 bg-slate-50/50 p-3 transition-colors hover:bg-slate-50">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-slate-900">
                {plan.name}
              </span>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                <TrendingUp className="h-3 w-3"/>
                +{plan.growthPercentage}%
              </span>
            </div>

            <div className="mt-2 flex items-baseline justify-between text-xs text-slate-600">
              <span className="text-slate-500">
                {plan.subscribersCount} subscribers ({plan.sharePercentage}% share)
              </span>
              <span className="font-bold text-slate-900">
                {formatCurrency(plan.mrrContribution)}/mo
              </span>
            </div>

            {/* mini progress bar */}
            <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200/70 overflow-hidden">
              <div className="h-full rounded-full bg-slate-800" style={{ width: `${plan.sharePercentage}%` }}/>
            </div>
          </div>))}
      </div>
    </BentoCard>);
}
