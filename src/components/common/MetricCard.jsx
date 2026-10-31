import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/utils/cn";
export function MetricCard({ title, value, subtitle, trend, icon: Icon, className, badgeText, }) {
    return (<Card className={cn("overflow-hidden border border-slate-200/80 bg-white", className)}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            {title}
          </span>
          <div className="flex items-center gap-1.5">
            {badgeText && (<span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                {badgeText}
              </span>)}
            {Icon && (<div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-50 text-slate-600">
                <Icon className="h-4 w-4"/>
              </div>)}
          </div>
        </div>

        <div className="mt-3 flex items-baseline justify-between">
          <div className="text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </div>
          {trend && (<div className={cn("inline-flex items-center gap-1 text-xs font-semibold rounded-md px-1.5 py-0.5", trend.direction === "up"
                ? "bg-emerald-50 text-emerald-700"
                : trend.direction === "down"
                    ? "bg-rose-50 text-rose-700"
                    : "bg-slate-100 text-slate-700")}>
              {trend.direction === "up" && <TrendingUp className="h-3 w-3"/>}
              {trend.direction === "down" && <TrendingDown className="h-3 w-3"/>}
              {trend.direction === "neutral" && <Minus className="h-3 w-3"/>}
              <span>{trend.value}%</span>
            </div>)}
        </div>

        {(subtitle || trend?.label) && (<p className="mt-2 text-xs text-slate-500 truncate">
            {trend?.label ? trend.label : subtitle}
          </p>)}
      </CardContent>
    </Card>);
}
