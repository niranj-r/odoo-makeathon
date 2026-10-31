"use client";
import React, { useState } from "react";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { ExportButton } from "@/components/common/ExportButton";
import { formatCurrency } from "@/utils/formatters";
import { Search, Layers } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
export function PlanPerformanceTable({ data }) {
    const [search, setSearch] = useState("");
    const filteredData = data.filter((row) => row.planName.toLowerCase().includes(search.toLowerCase()));
    const csvColumns = [
        { header: "Plan Name", accessorKey: "planName" },
        { header: "Billing Interval", accessorKey: "billingInterval" },
        { header: "Price ($)", accessorKey: "price" },
        { header: "Active Subscriptions", accessorKey: "activeSubscriptions" },
        { header: "New Subs (MTD)", accessorKey: "newSubscriptionsMonth" },
        { header: "Churned Subs (MTD)", accessorKey: "churnedSubscriptionsMonth" },
        { header: "Monthly Recurring Revenue ($)", accessorKey: "mrr" },
        { header: "Churn Rate (%)", accessorKey: "churnRate" },
        { header: "Avg Tenure (Months)", accessorKey: "avgTenureMonths" },
    ];
    return (<div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400"/>
          <Input placeholder="Search plan name..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-xs"/>
        </div>
        <ExportButton filename="plan_performance_report" columns={csvColumns} data={filteredData} label="Download Plans CSV"/>
      </div>

      <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plan</TableHead>
              <TableHead>Billing Cycle</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Active Subs</TableHead>
              <TableHead className="text-right text-emerald-700">New</TableHead>
              <TableHead className="text-right text-rose-600">Churned</TableHead>
              <TableHead className="text-right font-bold text-slate-900">MRR</TableHead>
              <TableHead className="text-right">Churn %</TableHead>
              <TableHead className="text-right">Avg Tenure</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (<TableRow>
                <TableCell colSpan={9} className="p-0">
                  <EmptyState title="No plans found" description="No plans match your search query." icon={Layers}/>
                </TableCell>
              </TableRow>) : (filteredData.map((row) => (<TableRow key={row.planId}>
                  <TableCell className="font-semibold text-slate-900">
                    {row.planName}
                  </TableCell>
                  <TableCell className="capitalize text-slate-600 text-xs">
                    {row.billingInterval}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(row.price)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium text-slate-800">
                    {row.activeSubscriptions}
                  </TableCell>
                  <TableCell className="text-right font-mono text-emerald-600 font-medium">
                    +{row.newSubscriptionsMonth}
                  </TableCell>
                  <TableCell className="text-right font-mono text-rose-600 font-medium">
                    -{row.churnedSubscriptionsMonth}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-slate-900 bg-slate-50/50">
                    {formatCurrency(row.mrr)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-slate-700">
                    {row.churnRate}%
                  </TableCell>
                  <TableCell className="text-right font-mono text-slate-600">
                    {row.avgTenureMonths} mo
                  </TableCell>
                </TableRow>)))}
          </TableBody>
        </Table>
      </div>
    </div>);
}
