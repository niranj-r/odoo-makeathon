"use client";

import React from "react";
import { useCustomerSubscriptions } from "@/hooks/useSubscriptions";
import { SubscriptionList } from "@/components/portal/SubscriptionList";
import { TableSkeleton } from "@/components/common/LoadingSkeleton";

export default function MySubscriptionsPage() {
  const { data: subscriptions, isLoading } = useCustomerSubscriptions();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          My Subscriptions & Add-ons
        </h1>
        <p className="text-xs text-slate-500">
          Review your active platform plans, product variants, renewal schedules, and lifecycle options.
        </p>
      </div>

      {isLoading || !subscriptions ? (
        <TableSkeleton rows={3} cols={4} />
      ) : (
        <SubscriptionList subscriptions={subscriptions} />
      )}
    </div>
  );
}

