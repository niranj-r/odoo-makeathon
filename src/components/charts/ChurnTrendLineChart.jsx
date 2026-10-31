"use client";
import React from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, } from "recharts";
import { CustomChartTooltip } from "./CustomChartTooltip";
export function ChurnTrendLineChart({ data, height = 240, }) {
    return (<div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} dy={8}/>
          <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={(val) => `${val}%`} domain={[0, 3]}/>
          <Tooltip content={<CustomChartTooltip isCurrency={false} isPercentage={true}/>}/>
          <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: 12, fontSize: 11 }}/>
          <Line type="monotone" dataKey="customerChurnRate" name="Customer Churn %" stroke="#f43f5e" strokeWidth={2} dot={{ r: 3, fill: "#f43f5e" }} activeDot={{ r: 5 }}/>
          <Line type="monotone" dataKey="revenueChurnRate" name="Net Revenue Churn %" stroke="#6366f1" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3, fill: "#6366f1" }} activeDot={{ r: 5 }}/>
        </LineChart>
      </ResponsiveContainer>
    </div>);
}
