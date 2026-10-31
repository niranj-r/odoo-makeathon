import React from "react";
import { MetricCard } from "@/components/common/MetricCard";
import { formatCurrency, formatCompactNumber } from "@/utils/formatters";
import { DollarSign, TrendingUp, Users, Repeat, Target, ShieldCheck, } from "lucide-react";
export function ExecutiveKpiGrid({ kpis }) {
    return (<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* MRR */}
      <MetricCard title="Monthly Recurring Revenue" value={formatCurrency(kpis.mrr.current)} trend={kpis.mrr.trend} icon={DollarSign} badgeText="Core KPI"/>

      {/* ARR */}
      <MetricCard title="Annual Run Rate (ARR)" value={formatCurrency(kpis.arr.current)} trend={kpis.arr.trend} icon={TrendingUp}/>

      {/* Net Revenue */}
      <MetricCard title="Net Revenue MTD" value={formatCurrency(kpis.netRevenue.current)} subtitle={`Target: ${formatCurrency(kpis.netRevenue.target)}`} trend={kpis.netRevenue.trend} icon={Target}/>

      {/* Active Subscriptions */}
      <MetricCard title="Active Subscriptions" value={formatCompactNumber(kpis.activeSubscriptions.total)} subtitle={`${kpis.activeSubscriptions.breakdown.active} active · ${kpis.activeSubscriptions.breakdown.trialing} trial`} trend={kpis.activeSubscriptions.trend} icon={Users}/>

      {/* Churn Rate */}
      <MetricCard title="Customer Churn Rate" value={`${kpis.churnRate.percentage}%`} trend={kpis.churnRate.trend} icon={Repeat}/>

      {/* ARPU */}
      <MetricCard title="Average Revenue Per User (ARPU)" value={formatCurrency(kpis.arpu.current, "USD", 2)} trend={kpis.arpu.trend} icon={DollarSign}/>

      {/* LTV */}
      <MetricCard title="Customer Lifetime Value (LTV)" value={formatCurrency(kpis.ltv.current)} trend={kpis.ltv.trend} icon={ShieldCheck}/>

      {/* Delinquency / Past Due */}
      <MetricCard title="Past Due Invoices" value={kpis.activeSubscriptions.breakdown.pastDue} subtitle="3.2% total volume in grace period" badgeText="Attention" icon={TrendingUp}/>
    </div>);
}
