"use client";
import React from "react";
import { BentoCard } from "@/components/common/BentoCard";
import { PlanDistributionDonut } from "@/components/charts/PlanDistributionDonut";
export function PlanBreakdownSection({ planData }) {
    return (<BentoCard title="Plan Revenue Concentration" description="MRR distribution by subscription tier" className="col-span-1">
      <PlanDistributionDonut data={planData} height={200}/>
    </BentoCard>);
}
