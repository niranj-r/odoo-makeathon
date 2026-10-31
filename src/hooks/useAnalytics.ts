"use client";

import { useQuery } from "@tanstack/react-query";
import { analyticsService } from "@/services/analyticsService";
import { AnalyticsData } from "@/types/analytics";
import { DateRangePreset } from "@/types/common";

export function useAnalytics(preset: DateRangePreset = "12m") {
  return useQuery<AnalyticsData, Error>({
    queryKey: ["analytics", preset],
    queryFn: () => analyticsService.getAnalyticsData(preset),
    staleTime: 1000 * 60 * 5,
  });
}

