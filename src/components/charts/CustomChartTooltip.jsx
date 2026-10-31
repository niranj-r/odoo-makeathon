import React from "react";
import { formatCurrency } from "@/utils/formatters";
export function CustomChartTooltip({ active, payload, label, isCurrency = true, isPercentage = false, }) {
    if (!active || !payload || !payload.length) {
        return null;
    }
    return (<div className="rounded-lg border border-slate-800 bg-slate-900/95 px-3 py-2 text-xs text-white shadow-xl backdrop-blur-xs min-w-[140px]">
      {label && <div className="font-semibold text-slate-300 pb-1 mb-1 border-b border-slate-800">{label}</div>}
      <div className="space-y-1">
        {payload.map((item, index) => {
            let formattedValue = String(item.value);
            if (isCurrency) {
                formattedValue = formatCurrency(item.value);
            }
            else if (isPercentage) {
                formattedValue = `${item.value}%`;
            }
            return (<div key={index} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color || "#3b82f6" }}/>
                <span className="text-slate-400 capitalize">{item.name}:</span>
              </div>
              <span className="font-mono font-medium text-white">{formattedValue}</span>
            </div>);
        })}
      </div>
    </div>);
}
