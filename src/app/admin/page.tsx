"use client";

import React from "react";
import { useAdminDashboard } from "@/hooks/useDashboard";
import { ExecutiveKpiGrid } from "@/components/dashboard/ExecutiveKpiGrid";
import { RevenueSparklineCard } from "@/components/dashboard/RevenueSparklineCard";
import { SubscriptionStatusCard } from "@/components/dashboard/SubscriptionStatusCard";
import { TopPlansCard } from "@/components/dashboard/TopPlansCard";
import { RecentActivityList } from "@/components/dashboard/RecentActivityList";
import { KpiGridSkeleton, ChartSkeleton } from "@/components/common/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { RefreshCw, Download, FileSpreadsheet, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  const { data, isLoading, refetch, isRefetching } = useAdminDashboard();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Executive Revenue Overview
          </h1>
          <p className="text-xs text-slate-500">
            Real-time pulse on recurring subscriptions, renewal velocity, and enterprise ARR.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="h-8 gap-1.5 text-xs text-slate-700"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${isRefetching ? "animate-spin" : ""}`} />
            <span>Sync</span>
          </Button>

          <Link href="/admin/reports">
            <Button size="sm" className="h-8 gap-1.5 text-xs">
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Financial Reports</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Grid */}
      {isLoading || !data ? (
        <KpiGridSkeleton />
      ) : (
        <ExecutiveKpiGrid kpis={data.kpis} />
      )}

      {/* Bento Grid: Revenue Sparkline + Subscription Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {isLoading || !data ? (
          <div className="col-span-1 lg:col-span-2">
            <ChartSkeleton />
          </div>
        ) : (
          <RevenueSparklineCard currentMrr={data.kpis.mrr.current} />
        )}

        {isLoading || !data ? (
          <ChartSkeleton />
        ) : (
          <SubscriptionStatusCard
            distribution={data.statusDistribution}
            total={data.kpis.activeSubscriptions.total}
          />
        )}
      </div>

      {/* Bento Grid: Plan Tier Breakdown + Live Audit Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="col-span-1">
          {isLoading || !data ? (
            <ChartSkeleton />
          ) : (
            <TopPlansCard plans={data.topPlans} />
          )}
        </div>

        <div className="col-span-1 lg:col-span-3">
          {isLoading || !data ? (
            <ChartSkeleton />
          ) : (
            <RecentActivityList activities={data.recentActivities} />
          )}
        </div>
      </div>
    </div>
  );
}

