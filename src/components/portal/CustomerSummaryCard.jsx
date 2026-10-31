import React from "react";
import { BentoCard } from "@/components/common/BentoCard";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { StatusBadge } from "@/components/ui/status-badge";
import { Calendar, CreditCard, Layers, ShieldCheck } from "lucide-react";
export function CustomerSummaryCard({ summary }) {
    return (<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Current Plan Card */}
      <BentoCard title="Active Subscription" description="Your current organization tier" action={<StatusBadge status="active"/>}>
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900">
              {summary.activePlanName}
            </span>
            <span className="text-sm font-semibold text-slate-600 font-mono">
              {formatCurrency(summary.activePlanPrice)}/{summary.billingCycle === "monthly" ? "mo" : "yr"}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Calendar className="h-3.5 w-3.5 text-slate-400"/>
            <span>Next renewal scheduled for: <strong className="text-slate-700 font-medium">{formatDate(summary.nextBillingDate)}</strong></span>
          </div>
        </div>
      </BentoCard>

      {/* Billing & Balance Card */}
      <BentoCard title="Outstanding Balance" description="Current account reconciliation status" action={<span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
            Current
          </span>}>
        <div className="space-y-3">
          <div className="text-2xl font-bold text-slate-900">
            {formatCurrency(summary.unpaidBalance, "USD", 2)}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <CreditCard className="h-3.5 w-3.5 text-slate-400"/>
            <span>Default payment method: <strong>Visa •••• 4242</strong></span>
          </div>
        </div>
      </BentoCard>

      {/* Account Status Card */}
      <BentoCard title="Account Status" description="Enterprise enterprise service level" action={<ShieldCheck className="h-4 w-4 text-blue-600"/>}>
        <div className="space-y-3">
          <div className="text-base font-semibold text-slate-900">
            {summary.profile.billing.companyName}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Layers className="h-3.5 w-3.5 text-slate-400"/>
            <span>{summary.activeSubscriptionsCount} active subscriptions & add-ons</span>
          </div>
        </div>
      </BentoCard>
    </div>);
}
