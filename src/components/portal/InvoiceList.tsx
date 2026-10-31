"use client";

import React, { useState } from "react";
import { Invoice } from "@/types/invoice";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { ExportButton } from "@/components/common/ExportButton";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { Search, Eye, FileText, Download } from "lucide-react";
import { InvoiceDetailModal } from "./InvoiceDetailModal";
import { EmptyState } from "@/components/common/EmptyState";
import { INVOICE_STATUS_OPTIONS } from "@/constants/filters";

interface InvoiceListProps {
  invoices: Invoice[];
  isLoading?: boolean;
}

export function InvoiceList({ invoices, isLoading }: InvoiceListProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.items.some((it) => it.description.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" || inv.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const csvColumns = [
    { header: "Invoice Number", accessorKey: "invoiceNumber" as const },
    { header: "Issue Date", accessorKey: "issueDate" as const },
    { header: "Due Date", accessorKey: "dueDate" as const },
    { header: "Subtotal ($)", accessorKey: "subtotal" as const },
    { header: "Tax Total ($)", accessorKey: "taxTotal" as const },
    { header: "Discount Total ($)", accessorKey: "discountTotal" as const },
    { header: "Total Amount ($)", accessorKey: "totalAmount" as const },
    { header: "Amount Paid ($)", accessorKey: "amountPaid" as const },
    { header: "Balance Due ($)", accessorKey: "balanceDue" as const },
    { header: "Status", accessorKey: "status" as const },
  ];

  return (
    <div className="space-y-4">
      {/* Filter and Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search invoice number or item..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 shadow-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            {INVOICE_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <ExportButton
          filename="customer_invoices_statement"
          columns={csvColumns}
          data={filteredInvoices}
          label="Download Invoices CSV"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Issued</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Plan Items</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="p-0">
                  <EmptyState
                    title="No invoices found"
                    description="No invoices match your selected status and search terms."
                    icon={FileText}
                  />
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-semibold text-slate-900 font-mono text-xs">
                    {inv.invoiceNumber}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {formatDate(inv.issueDate)}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {formatDate(inv.dueDate)}
                  </TableCell>
                  <TableCell className="text-xs text-slate-700 max-w-xs truncate">
                    {inv.items.map((i) => i.description).join(", ")}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-slate-900">
                    {formatCurrency(inv.totalAmount, "USD", 2)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={inv.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedInvoice(inv)}
                      className="h-8 gap-1.5 text-xs text-slate-600 hover:text-slate-900"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>View Receipt</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Invoice Detail Modal */}
      <InvoiceDetailModal
        invoice={selectedInvoice}
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
      />
    </div>
  );
}

