"use client";
import React, { useState } from "react";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { ExportButton } from "@/components/common/ExportButton";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatDateTime } from "@/utils/formatters";
import { Search, Download, Receipt } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { PAYMENT_STATUS_OPTIONS } from "@/constants/filters";
import { Button } from "@/components/ui/button";
export function PaymentHistoryList({ transactions, isLoading, }) {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const filteredTransactions = transactions.filter((txn) => {
        const matchesSearch = txn.transactionNumber.toLowerCase().includes(search.toLowerCase()) ||
            txn.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
            (txn.receiptNumber && txn.receiptNumber.toLowerCase().includes(search.toLowerCase()));
        const matchesStatus = statusFilter === "all" || txn.status.toLowerCase() === statusFilter.toLowerCase();
        return matchesSearch && matchesStatus;
    });
    const csvColumns = [
        { header: "Transaction ID", accessorKey: "transactionNumber" },
        { header: "Invoice Number", accessorKey: "invoiceNumber" },
        { header: "Date Paid", accessorKey: "paidAt" },
        { header: "Amount ($)", accessorKey: "amount" },
        {
            header: "Payment Method",
            accessorKey: (row) => `${row.paymentMethod.brand || "Card"} •••• ${row.paymentMethod.last4 || ""}`,
        },
        { header: "Receipt Number", accessorKey: "receiptNumber" },
        { header: "Status", accessorKey: "status" },
    ];
    const handleDownloadReceiptMock = (txn) => {
        alert(`Downloading Official Payment Receipt for ${txn.transactionNumber} (${txn.receiptNumber})`);
    };
    return (<div className="space-y-4">
      {/* Search and Action Row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400"/>
            <Input placeholder="Search transaction or invoice..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-xs"/>
          </div>

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 shadow-xs focus:outline-none focus:ring-2 focus:ring-slate-900">
            {PAYMENT_STATUS_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>
                {opt.label}
              </option>))}
          </select>
        </div>

        <ExportButton filename="payment_transaction_history" columns={csvColumns} data={filteredTransactions} label="Download Transactions CSV"/>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Transaction #</TableHead>
              <TableHead>Settled Date</TableHead>
              <TableHead>Invoice Ref</TableHead>
              <TableHead>Payment Method</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Receipt</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.length === 0 ? (<TableRow>
                <TableCell colSpan={7} className="p-0">
                  <EmptyState title="No payments found" description="No payment records match your filters." icon={Receipt}/>
                </TableCell>
              </TableRow>) : (filteredTransactions.map((txn) => (<TableRow key={txn.id}>
                  <TableCell className="font-semibold text-slate-900 font-mono text-xs">
                    {txn.transactionNumber}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {formatDateTime(txn.paidAt)}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-slate-600">
                    {txn.invoiceNumber}
                  </TableCell>
                  <TableCell className="text-xs text-slate-700">
                    <span className="font-medium text-slate-900">
                      {txn.paymentMethod.brand || "Card"}
                    </span>{" "}
                    <span className="font-mono text-slate-500">
                      •••• {txn.paymentMethod.last4}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-slate-900">
                    {formatCurrency(txn.amount, "USD", 2)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={txn.status}/>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleDownloadReceiptMock(txn)} className="h-8 gap-1 text-xs text-slate-600 hover:text-slate-900">
                      <Download className="h-3.5 w-3.5"/>
                      <span>{txn.receiptNumber || "Receipt"}</span>
                    </Button>
                  </TableCell>
                </TableRow>)))}
          </TableBody>
        </Table>
      </div>
    </div>);
}
