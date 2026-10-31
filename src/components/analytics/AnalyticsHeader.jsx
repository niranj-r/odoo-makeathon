"use client";
import React from "react";
import { DateRangePicker } from "@/components/common/DateRangePicker";
import { ExportButton } from "@/components/common/ExportButton";
import { MetricCard } from "@/components/common/MetricCard";
import { formatCurrency } from "@/utils/formatters";
import { DollarSign, TrendingUp, Users, ShieldAlert } from "lucide-react";
export function AnalyticsHeader({ preset, onPresetChange, summary, movementsData, }) {
    // Columns for CSV export of movements
    const csvColumns = [
        { header: "Month", accessorKey: "formattedDate" },
        { header: "New MRR ($)", accessorKey: "newMrr" },
        { header: "Expansion MRR ($)", accessorKey: "expansionMrr" },
        { header: "Contraction MRR ($)", accessorKey: "contractionMrr" },
        { header: "Churned MRR ($)", accessorKey: "churnedMrr" },
        { header: "Net MRR ($)", accessorKey: "netMrr" },
        { header: "Cumulative MRR ($)", accessorKey: "cumulativeMrr" },
    ];
    return (<div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Subscription & Revenue Analytics
          </h1>
          <p className="text-xs text-slate-500">
            Deep dive into MRR expansion, churn velocity, and customer cohort retention.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <DateRangePicker value={preset} onChange={onPresetChange}/>
          <ExportButton filename={`mrr_analytics_${preset}`} columns={csvColumns} data={movementsData} label="Export Analytics CSV"/>
        </div>
      </div>

      {/* Summary KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Period Net Revenue" value={formatCurrency(summary.totalRevenuePeriod)} subtitle="Cumulative recurring billing" icon={DollarSign}/>
        <MetricCard title="SaaS Quick Ratio" value={`${summary.quickRatio}x`} subtitle="(New + Expansion) / (Churn + Contraction)" trend={{ value: 12.5, direction: "up", label: "Strong growth (>4.0x)" }} icon={TrendingUp}/>
        <MetricCard title="Average Churn Rate" value={`${summary.avgChurnRate}%`} subtitle="Customer attrition rate" icon={ShieldAlert}/>
        <MetricCard title="LTV / CAC Efficiency" value={formatCurrency(summary.avgLtv)} subtitle={`Avg ARPU: ${formatCurrency(summary.avgArpu, "USD", 2)}/mo`} icon={Users}/>
      </div>
    </div>);
}
