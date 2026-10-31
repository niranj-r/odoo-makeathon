"use client";
import React from "react";
import Link from "next/link";
import { useCustomerPortalSummary } from "@/hooks/useCustomerPortal";
import { useInvoices } from "@/hooks/useInvoices";
import { CustomerSummaryCard } from "@/components/portal/CustomerSummaryCard";
import { UsageMetricsCard } from "@/components/portal/UsageMetricsCard";
import { BentoCard } from "@/components/common/BentoCard";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { KpiGridSkeleton, TableSkeleton } from "@/components/common/LoadingSkeleton";
import { ArrowRight, Receipt, CreditCard, ShieldCheck } from "lucide-react";
export default function CustomerDashboardPage() {
    const { data: summary, isLoading } = useCustomerPortalSummary();
    const { data: invoices, isLoading: isInvoicesLoading } = useInvoices();
    return (<div className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome back, {summary?.profile.name || "Customer"}
          </h1>
          <p className="text-xs text-slate-500">
            Manage your organization&apos;s subscription, billing invoices, and team quota.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/portal/subscriptions">
            <Button size="sm" className="h-8 gap-1.5 text-xs bg-blue-600 hover:bg-blue-700">
              <span>Manage Subscriptions</span>
              <ArrowRight className="h-3.5 w-3.5"/>
            </Button>
          </Link>
        </div>
      </div>

      {/* Account & Billing Summary */}
      {isLoading || !summary ? (<KpiGridSkeleton />) : (<CustomerSummaryCard summary={summary}/>)}

      {/* Usage & Quota Metrics */}
      {isLoading || !summary ? (<TableSkeleton rows={2} cols={3}/>) : (<UsageMetricsCard usage={summary.usage}/>)}

      {/* Recent Invoices & Quick Billing Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <BentoCard title="Recent Billing Invoices" description="Latest invoices generated for your active subscriptions" action={<Link href="/portal/invoices">
              <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-600 hover:text-blue-700 gap-1">
                <span>View All Invoices</span>
                <ArrowRight className="h-3.5 w-3.5"/>
              </Button>
            </Link>} className="col-span-1 lg:col-span-2">
          {isInvoicesLoading || !invoices ? (<TableSkeleton rows={3} cols={4}/>) : (<div className="divide-y divide-slate-100 text-xs">
              {invoices.slice(0, 3).map((inv) => (<div key={inv.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-slate-900">{inv.invoiceNumber}</span>
                      <StatusBadge status={inv.status}/>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Issued {formatDate(inv.issueDate)} · Due {formatDate(inv.dueDate)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-slate-900">
                      {formatCurrency(inv.totalAmount, "USD", 2)}
                    </span>
                  </div>
                </div>))}
            </div>)}
        </BentoCard>

        {/* Quick Portal Shortcuts */}
        <BentoCard title="Account Shortcuts" description="Direct access to self-service management" className="col-span-1">
          <div className="space-y-2">
            <Link href="/portal/payments" className="block">
              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-2.5">
                  <CreditCard className="h-4 w-4 text-slate-600"/>
                  <span className="text-xs font-semibold text-slate-800">Payment Methods</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400"/>
              </div>
            </Link>

            <Link href="/portal/invoices" className="block">
              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-2.5">
                  <Receipt className="h-4 w-4 text-slate-600"/>
                  <span className="text-xs font-semibold text-slate-800">Download Receipts</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400"/>
              </div>
            </Link>

            <Link href="/portal/profile" className="block">
              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-slate-600"/>
                  <span className="text-xs font-semibold text-slate-800">Billing Address & VAT</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400"/>
              </div>
            </Link>
          </div>
        </BentoCard>
      </div>
    </div>);
}
