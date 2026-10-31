"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from "recharts";
import { CustomChartTooltip } from "./CustomChartTooltip";
import { formatCompactNumber } from "@/utils/formatters";

interface MrrMovementData {
  formattedDate: string;
  newMrr: number;
  expansionMrr: number;
  contractionMrr: number;
  churnedMrr: number;
}

interface NetMrrBarChartProps {
  data: MrrMovementData[];
  height?: number;
}

export function NetMrrBarChart({ data, height = 300 }: NetMrrBarChartProps) {
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          stackOffset="sign"
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#f1f5f9"
          />
          <XAxis
            dataKey="formattedDate"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748b", fontSize: 11 }}
            dy={8}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748b", fontSize: 11 }}
            tickFormatter={(val) => `$${formatCompactNumber(val)}`}
          />
          <Tooltip content={<CustomChartTooltip isCurrency={true} />} />
          <ReferenceLine y={0} stroke="#cbd5e1" />
          <Bar
            dataKey="newMrr"
            name="New MRR"
            fill="#10b981"
            radius={[2, 2, 0, 0]}
            maxBarSize={32}
          />
          <Bar
            dataKey="expansionMrr"
            name="Expansion MRR"
            fill="#3b82f6"
            radius={[2, 2, 0, 0]}
            maxBarSize={32}
          />
          <Bar
            dataKey="contractionMrr"
            name="Contraction MRR"
            fill="#f59e0b"
            radius={[0, 0, 2, 2]}
            maxBarSize={32}
          />
          <Bar
            dataKey="churnedMrr"
            name="Churned MRR"
            fill="#f43f5e"
            radius={[0, 0, 2, 2]}
            maxBarSize={32}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

