import React from "react";
import { BentoCard } from "@/components/common/BentoCard";
import { CohortHeatmap } from "@/components/charts/CohortHeatmap";
import { RetentionCohortRow } from "@/types/analytics";

interface CohortRetentionSectionProps {
  cohorts: RetentionCohortRow[];
}

export function CohortRetentionSection({ cohorts }: CohortRetentionSectionProps) {
  return (
    <BentoCard
      title="Cohort Retention Matrix"
      description="Percentage of subscribers retained across subsequent billing months (M0 - M5)"
      className="col-span-1 lg:col-span-3"
    >
      <CohortHeatmap cohorts={cohorts} />
    </BentoCard>
  );
}

