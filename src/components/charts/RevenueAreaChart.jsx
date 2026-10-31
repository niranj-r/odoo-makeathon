"use client";
import React from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, } from "recharts";
import { CustomChartTooltip } from "./CustomChartTooltip";
import { formatCompactNumber } from "@/utils/formatters";
export function RevenueAreaChart({ data, height = 280 }) {
    return (<div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="mrrGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0f172a" stopOpacity={0.15}/>
              <stop offset="95%" stopColor="#0f172a" stopOpacity={0.0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
          <XAxis dataKey="formattedDate" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} dy={8}/>
          <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={(val) => `$${formatCompactNumber(val)}`} dx={-4}/>
          <Tooltip content={<CustomChartTooltip isCurrency={true}/>}/>
          <Area type="monotone" dataKey="cumulativeMrr" name="Monthly Recurring Revenue" stroke="#0f172a" strokeWidth={2} fillOpacity={1} fill="url(#mrrGradient)"/>
        </AreaChart>
      </ResponsiveContainer>
    </div>);
}
