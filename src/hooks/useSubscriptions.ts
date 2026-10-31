"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { subscriptionService } from "@/services/subscriptionService";
import {
  CustomerSubscription,
  ChangePlanPayload,
  PauseSubscriptionPayload,
  CancelSubscriptionPayload,
} from "@/types/subscription";

export function useCustomerSubscriptions(customerId: string = "cust_acme_corp") {
  return useQuery<CustomerSubscription[], Error>({
    queryKey: ["subscriptions", customerId],
    queryFn: () => subscriptionService.getCustomerSubscriptions(customerId),
  });
}

export function useChangePlanMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ChangePlanPayload) => subscriptionService.changePlan(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["customerSummary"] });
    },
  });
}

export function usePauseSubscriptionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PauseSubscriptionPayload) =>
      subscriptionService.pauseSubscription(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["customerSummary"] });
    },
  });
}

export function useCancelSubscriptionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CancelSubscriptionPayload) =>
      subscriptionService.cancelSubscription(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["customerSummary"] });
    },
  });
}

