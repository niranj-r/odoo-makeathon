"use client";

import React, { useState } from "react";
import {
  useMonthlyRevenueReports,
  useTaxReports,
  useInvoiceAgingReports,
  usePlanPerformanceReports,
  useChurnReasonsReports,
} from "@/hooks/useReports";
import { FinancialReportTable } from "@/components/reports/FinancialReportTable";
import { TaxReportTable } from "@/components/reports/TaxReportTable";
import { InvoiceAgingTable } from "@/components/reports/InvoiceAgingTable";
import { PlanPerformanceTable } from "@/components/reports/PlanPerformanceTable";
import { ChurnReasonsTable } from "@/components/reports/ChurnReasonsTable";
import { TableSkeleton } from "@/components/common/LoadingSkeleton";
import {
  DollarSign,
  Receipt,
  Clock,
  Layers,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/utils/cn";

type ReportTab =
  | "financial"
  | "tax"
  | "aging"
  | "plans"
  | "churn";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>("financial");

  const { data: financialData, isLoading: isFinancialLoading } = useMonthlyRevenueReports();
  const { data: taxData, isLoading: isTaxLoading } = useTaxReports();
  const { data: agingData, isLoading: isAgingLoading } = useInvoiceAgingReports();
  const { data: planData, isLoading: isPlanLoading } = usePlanPerformanceReports();
  const { data: churnData, isLoading: isChurnLoading } = useChurnReasonsReports();

  const tabs: { id: ReportTab; label: string; icon: React.ElementType }[] = [
    { id: "financial", label: "Monthly Revenue Statements", icon: DollarSign },
    { id: "tax", label: "Tax Collection Summary", icon: Receipt },
    { id: "aging", label: "Invoice Aging & Delinquency", icon: Clock },
    { id: "plans", label: "Plan Tier Performance", icon: Layers },
    { id: "churn", label: "Cancellation & Exit Feedback", icon: HelpCircle },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Financial & Subscription Reports
        </h1>
        <p className="text-xs text-slate-500">
          Audit-ready financial statements, tax jurisdiction reconciliations, and exportable datasets.
        </p>
      </div>

      {/* Tabs bar */}
      <div className="flex border-b border-slate-200/80 overflow-x-auto scrollbar-none gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 border-b-2 py-3 px-3.5 text-xs font-semibold whitespace-nowrap transition-all",
                isActive
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
              )}
            >
              <Icon className={cn("h-4 w-4", isActive ? "text-slate-900" : "text-slate-400")} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="pt-2">
        {activeTab === "financial" && (
          isFinancialLoading || !financialData ? (
            <TableSkeleton rows={6} cols={8} />
          ) : (
            <FinancialReportTable data={financialData} />
          )
        )}

        {activeTab === "tax" && (
          isTaxLoading || !taxData ? (
            <TableSkeleton rows={5} cols={7} />
          ) : (
            <TaxReportTable data={taxData} />
          )
        )}

        {activeTab === "aging" && (
          isAgingLoading || !agingData ? (
            <TableSkeleton rows={5} cols={10} />
          ) : (
            <InvoiceAgingTable data={agingData} />
          )
        )}

        {activeTab === "plans" && (
          isPlanLoading || !planData ? (
            <TableSkeleton rows={3} cols={9} />
          ) : (
            <PlanPerformanceTable data={planData} />
          )
        )}

        {activeTab === "churn" && (
          isChurnLoading || !churnData ? (
            <TableSkeleton rows={5} cols={5} />
          ) : (
            <ChurnReasonsTable data={churnData} />
          )
        )}
      </div>
    </div>
  );
}

