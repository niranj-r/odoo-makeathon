"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { paymentService } from "@/services/paymentService";
import {
  PaymentTransaction,
  PaymentFilterParams,
  PaymentMethodDetails,
} from "@/types/payment";

export function usePaymentTransactions(params?: PaymentFilterParams) {
  return useQuery<PaymentTransaction[], Error>({
    queryKey: ["payments", params?.status, params?.search],
    queryFn: () => paymentService.getPaymentTransactions(params),
  });
}

export function useSavedPaymentMethods(customerId: string = "cust_acme_corp") {
  return useQuery<PaymentMethodDetails[], Error>({
    queryKey: ["paymentMethods", customerId],
    queryFn: () => paymentService.getSavedPaymentMethods(customerId),
  });
}

export function useSetDefaultPaymentMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (paymentMethodId: string) =>
      paymentService.setDefaultPaymentMethod(paymentMethodId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentMethods"] });
    },
  });
}

