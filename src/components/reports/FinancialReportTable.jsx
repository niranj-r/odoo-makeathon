"use client";
import React, { useState } from "react";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { ExportButton } from "@/components/common/ExportButton";
import { formatCurrency } from "@/utils/formatters";
import { Search, FileSpreadsheet } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
export function FinancialReportTable({ data, isLoading }) {
    const [search, setSearch] = useState("");
    const filteredData = data.filter((row) => row.period.toLowerCase().includes(search.toLowerCase()));
    const csvColumns = [
        { header: "Period", accessorKey: "period" },
        { header: "Gross Revenue ($)", accessorKey: "grossRevenue" },
        { header: "Discounts Applied ($)", accessorKey: "discounts" },
        { header: "Taxes Collected ($)", accessorKey: "taxesCollected" },
        { header: "Refunds ($)", accessorKey: "refunds" },
        { header: "Net Revenue ($)", accessorKey: "netRevenue" },
        { header: "Invoices Billed", accessorKey: "invoiceCount" },
        { header: "Payments Cleared", accessorKey: "paymentCount" },
    ];
    return (<div className="space-y-4">
      {/* Search and Export Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400"/>
          <Input placeholder="Search billing period (e.g. Oct 2026)..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-xs"/>
        </div>
        <ExportButton filename="monthly_financial_revenue_report" columns={csvColumns} data={filteredData} label="Download Financial CSV"/>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Billing Period</TableHead>
              <TableHead className="text-right">Gross Revenue</TableHead>
              <TableHead className="text-right">Discounts</TableHead>
              <TableHead className="text-right">Taxes Collected</TableHead>
              <TableHead className="text-right">Refunds</TableHead>
              <TableHead className="text-right font-bold text-slate-900">Net Revenue</TableHead>
              <TableHead className="text-right">Invoices</TableHead>
              <TableHead className="text-right">Payments</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (<TableRow>
                <TableCell colSpan={8} className="p-0">
                  <EmptyState title="No financial statements found" description="No statements match your search period criteria." icon={FileSpreadsheet}/>
                </TableCell>
              </TableRow>) : (filteredData.map((row) => (<TableRow key={row.id}>
                  <TableCell className="font-semibold text-slate-900">
                    {row.period}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(row.grossRevenue)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-amber-600">
                    -{formatCurrency(row.discounts)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-slate-600">
                    +{formatCurrency(row.taxesCollected)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-rose-600">
                    -{formatCurrency(row.refunds)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-slate-900 bg-slate-50/50">
                    {formatCurrency(row.netRevenue)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-slate-600">
                    {row.invoiceCount}
                  </TableCell>
                  <TableCell className="text-right font-mono text-slate-600">
                    {row.paymentCount}
                  </TableCell>
                </TableRow>)))}
          </TableBody>
        </Table>
      </div>
    </div>);
}
