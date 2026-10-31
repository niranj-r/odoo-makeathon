import React from "react";
import { BentoCard } from "@/components/common/BentoCard";
import { formatCurrency, formatDateTime } from "@/utils/formatters";
import { StatusBadge } from "@/components/ui/status-badge";
import { CreditCard, Layers, AlertTriangle, ArrowUpRight, CheckCircle2, } from "lucide-react";
export function RecentActivityList({ activities }) {
    const getIcon = (type) => {
        switch (type) {
            case "payment_received":
            case "invoice_paid":
                return <CheckCircle2 className="h-4 w-4 text-emerald-600"/>;
            case "subscription_upgraded":
                return <ArrowUpRight className="h-4 w-4 text-blue-600"/>;
            case "subscription_created":
                return <Layers className="h-4 w-4 text-slate-700"/>;
            case "invoice_overdue":
                return <AlertTriangle className="h-4 w-4 text-amber-600"/>;
            default:
                return <CreditCard className="h-4 w-4 text-slate-500"/>;
        }
    };
    return (<BentoCard title="Recent Billing & Subscription Activity" description="Live audit trail of payments, plan updates, and invoices" className="col-span-1 lg:col-span-3">
      <div className="divide-y divide-slate-100">
        {activities.map((activity) => (<div key={activity.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3.5 first:pt-0 last:pb-0">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-50 border border-slate-200/70">
                {getIcon(activity.type)}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs text-slate-900">
                    {activity.title}
                  </span>
                  <StatusBadge status={activity.status}/>
                </div>
                <p className="text-xs text-slate-600">{activity.description}</p>
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span className="font-medium text-slate-600">
                    {activity.customerName}
                  </span>
                  <span>·</span>
                  <span>{activity.customerEmail}</span>
                  <span>·</span>
                  <span>{formatDateTime(activity.timestamp)}</span>
                </div>
              </div>
            </div>

            {activity.amount !== undefined && (<div className="text-right sm:self-center">
                <span className="text-sm font-bold font-mono text-slate-900">
                  {formatCurrency(activity.amount, "USD", 2)}
                </span>
              </div>)}
          </div>))}
      </div>
    </BentoCard>);
}
