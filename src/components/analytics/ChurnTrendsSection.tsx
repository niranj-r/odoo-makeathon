"use client";

import React from "react";
import { BentoCard } from "@/components/common/BentoCard";
import { ChurnTrendLineChart } from "@/components/charts/ChurnTrendLineChart";
import { ChurnTrendPoint } from "@/types/analytics";

interface ChurnTrendsSectionProps {
  churnTrends: ChurnTrendPoint[];
}

export function ChurnTrendsSection({ churnTrends }: ChurnTrendsSectionProps) {
  return (
    <BentoCard
      title="Customer vs Revenue Churn Trends"
      description="Tracking customer logo churn vs net dollar churn rate over time"
      className="col-span-1 lg:col-span-2"
    >
      <ChurnTrendLineChart data={churnTrends} height={260} />
      <div className="mt-4 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
        <span>Average monthly churn: 1.62%</span>
        <span className="text-emerald-600 font-medium">Negative net revenue churn achieved</span>
      </div>
    </BentoCard>
  );
}

