"use client";
import React from "react";
import { BentoCard } from "@/components/common/BentoCard";
import { NetMrrBarChart } from "@/components/charts/NetMrrBarChart";
export function MrrMovementsChart({ movements }) {
    return (<BentoCard title="Net MRR Movements Breakdown" description="Components of recurring revenue growth: New + Expansion vs Contraction + Churn" className="col-span-1 lg:col-span-2">
      <div className="mb-4 flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"/>
          <span className="text-slate-600 font-medium">New MRR</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-500"/>
          <span className="text-slate-600 font-medium">Expansion (Upgrades)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500"/>
          <span className="text-slate-600 font-medium">Contraction (Downgrades)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500"/>
          <span className="text-slate-600 font-medium">Churned MRR</span>
        </div>
      </div>

      <NetMrrBarChart data={movements} height={280}/>
    </BentoCard>);
}
