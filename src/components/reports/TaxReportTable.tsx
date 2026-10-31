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
import { TaxReportRow } from "@/types/reports";
import { formatCurrency } from "@/utils/formatters";
import { Search, FileSpreadsheet } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";

interface TaxReportTableProps {
  data: TaxReportRow[];
}

export function TaxReportTable({ data }: TaxReportTableProps) {
  const [search, setSearch] = useState("");

  const filteredData = data.filter(
    (row) =>
      row.jurisdiction.toLowerCase().includes(search.toLowerCase()) ||
      row.taxCode.toLowerCase().includes(search.toLowerCase())
  );

  const csvColumns = [
    { header: "Jurisdiction", accessorKey: "jurisdiction" as const },
    { header: "Tax Code", accessorKey: "taxCode" as const },
    { header: "Tax Rate (%)", accessorKey: "ratePercentage" as const },
    { header: "Taxable Sales ($)", accessorKey: "taxableSales" as const },
    { header: "Exempt Sales ($)", accessorKey: "exemptSales" as const },
    { header: "Tax Collected ($)", accessorKey: "taxCollected" as const },
    { header: "Invoices Count", accessorKey: "invoicesCount" as const },
  ];

  const totalTaxCollected = filteredData.reduce((acc, row) => acc + row.taxCollected, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search jurisdiction or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-500 font-medium hidden sm:block">
            Total Collected: <span className="font-bold text-slate-900">{formatCurrency(totalTaxCollected, "USD", 2)}</span>
          </div>
          <ExportButton
            filename="tax_collection_report"
            columns={csvColumns}
            data={filteredData}
            label="Download Tax CSV"
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tax Jurisdiction</TableHead>
              <TableHead>Tax Code</TableHead>
              <TableHead className="text-right">Rate</TableHead>
              <TableHead className="text-right">Taxable Base</TableHead>
              <TableHead className="text-right">Exempt Sales</TableHead>
              <TableHead className="text-right font-bold text-slate-900">Tax Collected</TableHead>
              <TableHead className="text-right">Invoices</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="p-0">
                  <EmptyState
                    title="No tax rules found"
                    description="No tax records match your search criteria."
                    icon={FileSpreadsheet}
                  />
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium text-slate-900">
                    {row.jurisdiction}
                  </TableCell>
                  <TableCell>
                    <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-700">
                      {row.taxCode}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium text-slate-700">
                    {row.ratePercentage}%
                  </TableCell>
                  <TableCell className="text-right font-mono text-slate-600">
                    {formatCurrency(row.taxableSales)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-slate-400">
                    {formatCurrency(row.exemptSales)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-emerald-700 bg-emerald-50/30">
                    {formatCurrency(row.taxCollected, "USD", 2)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-slate-600">
                    {row.invoicesCount}
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

