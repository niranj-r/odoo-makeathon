"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customerService } from "@/services/customerService";
import { CustomerProfile, CustomerPortalSummary } from "@/types/customer";

export function useCustomerPortalSummary(customerId: string = "cust_acme_corp") {
  return useQuery<CustomerPortalSummary, Error>({
    queryKey: ["customerSummary", customerId],
    queryFn: () => customerService.getCustomerPortalSummary(customerId),
  });
}

export function useCustomerProfile(customerId: string = "cust_acme_corp") {
  return useQuery<CustomerProfile, Error>({
    queryKey: ["customerProfile", customerId],
    queryFn: () => customerService.getCustomerProfile(customerId),
  });
}

export function useUpdateCustomerProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      customerId,
      data,
    }: {
      customerId: string;
      data: Partial<CustomerProfile>;
    }) => customerService.updateCustomerProfile(customerId, data),
    onSuccess: (updatedProfile, variables) => {
      queryClient.setQueryData(["customerProfile", variables.customerId], updatedProfile);
      queryClient.invalidateQueries({ queryKey: ["customerSummary", variables.customerId] });
    },
  });
}

