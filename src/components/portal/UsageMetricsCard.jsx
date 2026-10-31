import React from "react";
import { BentoCard } from "@/components/common/BentoCard";
import { formatCompactNumber } from "@/utils/formatters";
export function UsageMetricsCard({ usage }) {
    const seatsPct = Math.round((usage.seatsUsed / usage.seatsTotal) * 100);
    const apiPct = Math.round((usage.apiRequestsUsed / usage.apiRequestsLimit) * 100);
    const storagePct = Math.round((usage.storageUsedGb / usage.storageLimitGb) * 100);
    return (<BentoCard title="Plan Quotas & Resource Usage" description="Real-time seat count and platform consumption against tier limits">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Team Seats */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="font-semibold text-slate-800">Team Member Seats</span>
            <span className="font-mono text-slate-600">
              {usage.seatsUsed} / {usage.seatsTotal} ({seatsPct}%)
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full bg-slate-900 transition-all" style={{ width: `${seatsPct}%` }}/>
          </div>
          <span className="text-[11px] text-slate-400">
            {usage.seatsTotal - usage.seatsUsed} seats available to assign
          </span>
        </div>

        {/* API Quota */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="font-semibold text-slate-800">Monthly API Requests</span>
            <span className="font-mono text-slate-600">
              {formatCompactNumber(usage.apiRequestsUsed)} / {formatCompactNumber(usage.apiRequestsLimit)} ({apiPct}%)
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${apiPct}%` }}/>
          </div>
          <span className="text-[11px] text-slate-400">
            Resets automatically at start of next billing month
          </span>
        </div>

        {/* Cloud Storage */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="font-semibold text-slate-800">Encrypted Cloud Storage</span>
            <span className="font-mono text-slate-600">
              {usage.storageUsedGb} GB / {usage.storageLimitGb} GB ({storagePct}%)
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: `${storagePct}%` }}/>
          </div>
          <span className="text-[11px] text-slate-400">
            {usage.storageLimitGb - usage.storageUsedGb} GB remaining
          </span>
        </div>
      </div>
    </BentoCard>);
}
