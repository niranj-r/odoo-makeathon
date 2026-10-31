"use client";
import React from "react";
import { useInvoices } from "@/hooks/useInvoices";
import { InvoiceList } from "@/components/portal/InvoiceList";
import { TableSkeleton } from "@/components/common/LoadingSkeleton";
export default function MyInvoicesPage() {
    const { data: invoices, isLoading } = useInvoices();
    return (<div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          My Invoices & Receipts
        </h1>
        <p className="text-xs text-slate-500">
          Access complete billing history, itemized tax invoices, and export statements to CSV.
        </p>
      </div>

      {isLoading || !invoices ? (<TableSkeleton rows={4} cols={7}/>) : (<InvoiceList invoices={invoices} isLoading={isLoading}/>)}
    </div>);
}
