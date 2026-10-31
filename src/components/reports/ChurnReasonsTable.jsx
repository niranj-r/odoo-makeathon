"use client";
import React from "react";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, } from "@/components/ui/table";
import { ExportButton } from "@/components/common/ExportButton";
import { formatCurrency } from "@/utils/formatters";
export function ChurnReasonsTable({ data }) {
    const csvColumns = [
        { header: "Cancellation Reason", accessorKey: "reason" },
        { header: "Category", accessorKey: "category" },
        { header: "Occurrences", accessorKey: "occurrences" },
        { header: "Percentage of Churn (%)", accessorKey: "percentageOfTotal" },
        { header: "Lost MRR ($)", accessorKey: "lostMrr" },
    ];
    return (<div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Cancellation Reasons & Lost MRR Analysis
          </h3>
          <p className="text-xs text-slate-500">
            Categorized exit survey feedback captured from customer cancellation flows.
          </p>
        </div>
        <ExportButton filename="churn_reasons_analysis" columns={csvColumns} data={data} label="Download Reasons CSV"/>
      </div>

      <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Feedback / Reason</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Responses</TableHead>
              <TableHead className="text-right">% of Total</TableHead>
              <TableHead className="text-right font-bold text-slate-900">Lost MRR</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, idx) => (<TableRow key={idx}>
                <TableCell className="font-medium text-slate-900">
                  {row.reason}
                </TableCell>
                <TableCell>
                  <span className="capitalize text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                    {row.category.replace("_", " ")}
                  </span>
                </TableCell>
                <TableCell className="text-right font-mono font-medium text-slate-700">
                  {row.occurrences}
                </TableCell>
                <TableCell className="text-right font-mono text-slate-600">
                  {row.percentageOfTotal}%
                </TableCell>
                <TableCell className="text-right font-mono font-bold text-rose-600">
                  -{formatCurrency(row.lostMrr)}
                </TableCell>
              </TableRow>))}
          </TableBody>
        </Table>
      </div>
    </div>);
}
