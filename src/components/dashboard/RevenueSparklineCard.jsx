"use client";
import React from "react";
import { BentoCard } from "@/components/common/BentoCard";
import { RevenueAreaChart } from "@/components/charts/RevenueAreaChart";
import { formatCurrency } from "@/utils/formatters";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
export function RevenueSparklineCard({ currentMrr }) {
    // 6-month historical sparkline
    const sparklineData = [
        { formattedDate: "May", cumulativeMrr: 115890 },
        { formattedDate: "Jun", cumulativeMrr: 119160 },
        { formattedDate: "Jul", cumulativeMrr: 121390 },
        { formattedDate: "Aug", cumulativeMrr: 124410 },
        { formattedDate: "Sep", cumulativeMrr: 125880 },
        { formattedDate: "Oct", cumulativeMrr: 128450 },
    ];
    return (<BentoCard title="Recurring Revenue Velocity" description="Consolidated MRR run-rate over the preceding 6 months" action={<Link href="/admin/analytics">
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-slate-600 hover:text-slate-900">
            <span>Detailed Analytics</span>
            <ArrowUpRight className="h-3.5 w-3.5"/>
          </Button>
        </Link>} className="col-span-1 lg:col-span-2">
      <div className="mb-4 flex items-baseline gap-3">
        <span className="text-3xl font-bold tracking-tight text-slate-900">
          {formatCurrency(currentMrr)}
        </span>
        <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
          +14.2% MoM Expansion
        </span>
      </div>

      <RevenueAreaChart data={sparklineData} height={220}/>
    </BentoCard>);
}
