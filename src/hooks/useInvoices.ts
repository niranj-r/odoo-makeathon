"use client";

import { useQuery } from "@tanstack/react-query";
import { invoiceService } from "@/services/invoiceService";
import { Invoice, InvoiceFilterParams } from "@/types/invoice";

export function useInvoices(params?: InvoiceFilterParams) {
  return useQuery<Invoice[], Error>({
    queryKey: ["invoices", params?.status, params?.search],
    queryFn: () => invoiceService.getInvoices(params),
  });
}

export function useInvoiceDetail(id: string) {
  return useQuery<Invoice | null, Error>({
    queryKey: ["invoiceDetail", id],
    queryFn: () => invoiceService.getInvoiceById(id),
    enabled: !!id,
  });
}

