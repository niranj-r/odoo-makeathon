"use client";

import React, { useState } from "react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { DateRangePreset } from "@/types/common";
import { AnalyticsHeader } from "@/components/analytics/AnalyticsHeader";
import { MrrMovementsChart } from "@/components/analytics/MrrMovementsChart";
import { PlanBreakdownSection } from "@/components/analytics/PlanBreakdownSection";
import { ChurnTrendsSection } from "@/components/analytics/ChurnTrendsSection";
import { CohortRetentionSection } from "@/components/analytics/CohortRetentionSection";
import { BentoCard } from "@/components/common/BentoCard";
import { ChartSkeleton, KpiGridSkeleton } from "@/components/common/LoadingSkeleton";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { CustomChartTooltip } from "@/components/charts/CustomChartTooltip";
import { formatCurrency } from "@/utils/formatters";

export default function AnalyticsPage() {
  const [preset, setPreset] = useState<DateRangePreset>("12m");
  const { data, isLoading } = useAnalytics(preset);

  return (
    <div className="space-y-6 animate-fade-in">
      {isLoading || !data ? (
        <div className="space-y-6">
          <KpiGridSkeleton />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="col-span-1 lg:col-span-2">
              <ChartSkeleton />
            </div>
            <div className="col-span-1">
              <ChartSkeleton />
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Header & Metric Summary with Date Range Selector & CSV Export */}
          <AnalyticsHeader
            preset={preset}
            onPresetChange={setPreset}
            summary={data.summary}
            movementsData={data.mrrMovements}
          />

          {/* Section 1: MRR Movements Stacked Bar Chart & Plan Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <MrrMovementsChart movements={data.mrrMovements} />
            <PlanBreakdownSection planData={data.revenueByPlan} />
          </div>

          {/* Section 2: Churn Trends Line Chart & ARPU/LTV Evolution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ChurnTrendsSection churnTrends={data.churnTrends} />

            {/* ARPU & LTV Trend */}
            <BentoCard
              title="Unit Economics (ARPU vs LTV)"
              description="Average monthly revenue per account & customer lifetime value"
              className="col-span-1"
            >
              <div className="w-full h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={data.arpuLtvTrends}
                    margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      dy={8}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      tickFormatter={(val) => `$${val}`}
                    />
                    <Tooltip content={<CustomChartTooltip isCurrency={true} />} />
                    <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: 11 }} />
                    <Line
                      type="monotone"
                      dataKey="arpu"
                      name="ARPU ($)"
                      stroke="#0f172a"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
                <span>Current ARPU: <strong>${data.summary.avgArpu.toFixed(2)}</strong></span>
                <span>Projected LTV: <strong>{formatCurrency(data.summary.avgLtv)}</strong></span>
              </div>
            </BentoCard>
          </div>

          {/* Section 3: Cohort Retention Matrix */}
          <div className="grid grid-cols-1 gap-6">
            <CohortRetentionSection cohorts={data.retentionCohorts} />
          </div>
        </>
      )}
    </div>
  );
}

