import React from "react";
import { BentoCard } from "@/components/common/BentoCard";
import { StatusDistribution } from "@/types/dashboard";

interface SubscriptionStatusCardProps {
  distribution: StatusDistribution[];
  total: number;
}

export function SubscriptionStatusCard({
  distribution,
  total,
}: SubscriptionStatusCardProps) {
  return (
    <BentoCard
      title="Subscription Health"
      description="Distribution across active, past due, and trialing lifecycle"
    >
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
        {distribution.map((item) => (
          <div
            key={item.status}
            style={{
              width: `${item.percentage}%`,
              backgroundColor: item.color,
            }}
            title={`${item.label}: ${item.count} (${item.percentage}%)`}
            className="transition-all hover:opacity-90"
          />
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {distribution.map((item) => (
          <div
            key={item.status}
            className="flex items-center justify-between text-xs"
          >
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="font-medium text-slate-700">{item.label}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-slate-400 font-mono">{item.percentage}%</span>
              <span className="font-semibold text-slate-900 font-mono">
                {item.count}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-lg border border-slate-100 bg-slate-50/70 p-3 text-xs text-slate-600">
        <span className="font-medium text-slate-900">Health index: 94.6%</span>
        <p className="mt-0.5 text-[11px] text-slate-500">
          Delinquency rate is below the SaaS industry benchmark (5.0%).
        </p>
      </div>
    </BentoCard>
  );
}

