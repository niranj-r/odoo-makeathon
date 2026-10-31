"use client";

import React from "react";
import { DateRangePreset } from "@/types/common";
import { DATE_RANGE_PRESETS } from "@/constants/filters";
import { cn } from "@/utils/cn";

interface DateRangePickerProps {
  value: DateRangePreset;
  onChange: (value: DateRangePreset) => void;
  className?: string;
}

export function DateRangePicker({
  value,
  onChange,
  className,
}: DateRangePickerProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-lg border border-slate-200 bg-slate-50/80 p-0.5 text-xs font-medium text-slate-600 shadow-xs",
        className
      )}
    >
      {DATE_RANGE_PRESETS.map((preset) => {
        const isActive = value === preset.value;
        return (
          <button
            key={preset.value}
            type="button"
            onClick={() => onChange(preset.value)}
            className={cn(
              "rounded-md px-2.5 py-1.5 transition-all text-xs font-medium select-none",
              isActive
                ? "bg-white text-slate-900 shadow-xs font-semibold"
                : "text-slate-500 hover:text-slate-900"
            )}
          >
            {preset.label}
          </button>
        );
      })}
    </div>
  );
}

