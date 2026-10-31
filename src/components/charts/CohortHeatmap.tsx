import React from "react";
import { RetentionCohortRow } from "@/types/analytics";
import { cn } from "@/utils/cn";

interface CohortHeatmapProps {
  cohorts: RetentionCohortRow[];
}

export function CohortHeatmap({ cohorts }: CohortHeatmapProps) {
  // Function to calculate cell background color based on retention rate percentage
  const getCellBg = (rate: number) => {
    if (rate >= 95) return "bg-emerald-500/20 text-emerald-800 font-semibold";
    if (rate >= 90) return "bg-emerald-500/15 text-emerald-800 font-medium";
    if (rate >= 80) return "bg-blue-500/15 text-blue-800";
    if (rate >= 70) return "bg-amber-500/15 text-amber-800";
    return "bg-rose-500/15 text-rose-800";
  };

  const maxMonths = 6;

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-slate-200/80 bg-slate-50/70">
            <th className="py-2.5 px-3 font-semibold text-slate-700">Cohort</th>
            <th className="py-2.5 px-3 font-semibold text-slate-700">Accounts</th>
            {Array.from({ length: maxMonths }).map((_, i) => (
              <th
                key={i}
                className="py-2.5 px-2 text-center font-semibold text-slate-700"
              >
                M{i}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {cohorts.map((cohort) => (
            <tr key={cohort.cohortMonth} className="hover:bg-slate-50/50">
              <td className="py-2.5 px-3 font-medium text-slate-900 whitespace-nowrap">
                {cohort.cohortMonth}
              </td>
              <td className="py-2.5 px-3 text-slate-600 font-mono">
                {cohort.initialCustomers}
              </td>
              {Array.from({ length: maxMonths }).map((_, monthIdx) => {
                const rate = cohort.retentionRates[monthIdx];
                if (rate === undefined) {
                  return (
                    <td
                      key={monthIdx}
                      className="py-2.5 px-2 text-center text-slate-300"
                    >
                      —
                    </td>
                  );
                }
                return (
                  <td key={monthIdx} className="p-1 text-center">
                    <span
                      className={cn(
                        "inline-block w-full py-1 rounded text-[11px] font-mono transition-all",
                        getCellBg(rate)
                      )}
                    >
                      {rate}%
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

