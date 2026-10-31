"use client";

import React, { useState } from "react";
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
import { InvoiceAgingRow } from "@/types/reports";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { StatusBadge } from "@/components/ui/status-badge";
import { Search, Clock } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";

interface InvoiceAgingTableProps {
  data: InvoiceAgingRow[];
}

export function InvoiceAgingTable({ data }: InvoiceAgingTableProps) {
  const [search, setSearch] = useState("");

  const filteredData = data.filter(
    (row) =>
      row.customerName.toLowerCase().includes(search.toLowerCase()) ||
      row.invoiceNumber.toLowerCase().includes(search.toLowerCase())
  );

  const csvColumns = [
    { header: "Customer Name", accessorKey: "customerName" as const },
    { header: "Invoice Number", accessorKey: "invoiceNumber" as const },
    { header: "Due Date", accessorKey: "dueDate" as const },
    { header: "Current ($)", accessorKey: "currentAmount" as const },
    { header: "1-30 Days Overdue ($)", accessorKey: "days1To30" as const },
    { header: "31-60 Days Overdue ($)", accessorKey: "days31To60" as const },
    { header: "61-90 Days Overdue ($)", accessorKey: "days61To90" as const },
    { header: "90+ Days Overdue ($)", accessorKey: "days90Plus" as const },
    { header: "Total Outstanding ($)", accessorKey: "totalOutstanding" as const },
    { header: "Status", accessorKey: "status" as const },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search customer or invoice..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
        <ExportButton
          filename="invoice_aging_delinquency_report"
          columns={csvColumns}
          data={filteredData}
          label="Download Aging CSV"
        />
      </div>

      <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Invoice #</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Current</TableHead>
              <TableHead className="text-right">1-30d</TableHead>
              <TableHead className="text-right">31-60d</TableHead>
              <TableHead className="text-right">61-90d</TableHead>
              <TableHead className="text-right text-rose-600">90d+</TableHead>
              <TableHead className="text-right font-bold text-slate-900">Total Due</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="p-0">
                  <EmptyState
                    title="No outstanding invoices"
                    description="All invoices are fully reconciled."
                    icon={Clock}
                  />
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium text-slate-900">
                    {row.customerName}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-600">
                    {row.invoiceNumber}
                  </TableCell>
                  <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                    {formatDate(row.dueDate)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-slate-600">
                    {row.currentAmount > 0 ? formatCurrency(row.currentAmount) : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-amber-600">
                    {row.days1To30 > 0 ? formatCurrency(row.days1To30) : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-amber-700">
                    {row.days31To60 > 0 ? formatCurrency(row.days31To60) : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-rose-600">
                    {row.days61To90 > 0 ? formatCurrency(row.days61To90) : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold text-rose-700 bg-rose-50/40">
                    {row.days90Plus > 0 ? formatCurrency(row.days90Plus) : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-slate-900">
                    {formatCurrency(row.totalOutstanding)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={row.status} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

