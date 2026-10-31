"use client";

import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services/dashboardService";
import { AdminDashboardData } from "@/types/dashboard";

export function useAdminDashboard() {
  return useQuery<AdminDashboardData, Error>({
    queryKey: ["adminDashboard"],
    queryFn: () => dashboardService.getAdminDashboardData(),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
}

