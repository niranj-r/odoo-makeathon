"use client";

import React from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import { RevenueByPlanPoint } from "@/types/analytics";
import { formatCurrency } from "@/utils/formatters";
import { CustomChartTooltip } from "./CustomChartTooltip";

interface PlanDistributionDonutProps {
  data: RevenueByPlanPoint[];
  height?: number;
}

export function PlanDistributionDonut({
  data,
  height = 240,
}: PlanDistributionDonutProps) {
  const totalRevenue = data.reduce((acc, curr) => acc + curr.revenue, 0);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={65}
              outerRadius={90}
              paddingAngle={3}
              dataKey="revenue"
              nameKey="planName"
              stroke="#ffffff"
              strokeWidth={2}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomChartTooltip isCurrency={true} />} />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
            Total MRR
          </span>
          <span className="text-lg font-bold text-slate-900">
            {formatCurrency(totalRevenue)}
          </span>
        </div>
      </div>

      {/* Legend list */}
      <div className="mt-2 w-full space-y-2">
        {data.map((item) => (
          <div
            key={item.planName}
            className="flex items-center justify-between text-xs text-slate-600"
          >
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="font-medium text-slate-800">{item.planName}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-slate-500">{item.percentage}%</span>
              <span className="font-semibold text-slate-900">
                {formatCurrency(item.revenue)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
