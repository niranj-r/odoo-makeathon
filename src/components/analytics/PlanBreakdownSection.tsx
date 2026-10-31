"use client";

import React from "react";
import { BentoCard } from "@/components/common/BentoCard";
import { PlanDistributionDonut } from "@/components/charts/PlanDistributionDonut";
import { RevenueByPlanPoint } from "@/types/analytics";

interface PlanBreakdownSectionProps {
  planData: RevenueByPlanPoint[];
}

export function PlanBreakdownSection({ planData }: PlanBreakdownSectionProps) {
  return (
    <BentoCard
      title="Plan Revenue Concentration"
      description="MRR distribution by subscription tier"
      className="col-span-1"
    >
      <PlanDistributionDonut data={planData} height={200} />
    </BentoCard>
  );
}

