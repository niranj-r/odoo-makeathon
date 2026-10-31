import * as React from "react";
import { cn } from "@/utils/cn";
import { getStatusBadgeProps } from "@/utils/formatters";

interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: string;
  showDot?: boolean;
}

export function StatusBadge({ status, showDot = true, className, ...props }: StatusBadgeProps) {
  const { variant, label } = getStatusBadgeProps(status);

  const dotColorMap: Record<string, string> = {
    success: "bg-emerald-500",
    secondary: "bg-slate-400",
    default: "bg-blue-500",
    warning: "bg-amber-500",
    destructive: "bg-rose-500",
    outline: "bg-slate-400",
  };

  const badgeStyleMap: Record<string, string> = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    secondary: "bg-slate-50 text-slate-700 border-slate-200",
    default: "bg-blue-50 text-blue-700 border-blue-200/80",
    warning: "bg-amber-50 text-amber-700 border-amber-200/80",
    destructive: "bg-rose-50 text-rose-700 border-rose-200/80",
    outline: "bg-white text-slate-600 border-slate-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-tight",
        badgeStyleMap[variant] || badgeStyleMap.secondary,
        className
      )}
      {...props}
    >
      {showDot && (
        <span
          className={cn("h-1.5 w-1.5 rounded-full", dotColorMap[variant] || "bg-slate-400")}
        />
      )}
      {label}
    </span>
  );
}

