"use client";

import React from "react";
import { Invoice } from "@/types/invoice";
import { formatCurrency, formatDate, formatDateTime } from "@/utils/formatters";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { X, Printer, Download, CheckCircle2, Building, ShieldCheck } from "lucide-react";

interface InvoiceDetailModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
}

export function InvoiceDetailModal({
  invoice,
  isOpen,
  onClose,
}: InvoiceDetailModalProps) {
  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Header Actions */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white font-bold text-sm">
              BL
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  {invoice.invoiceNumber}
                </h2>
                <StatusBadge status={invoice.status} />
              </div>
              <p className="text-xs text-slate-500">
                Issued on {formatDate(invoice.issueDate)} · Due on {formatDate(invoice.dueDate)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-1.5 text-xs"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print</span>
            </Button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Billed From & Billed To */}
        <div className="mt-6 grid grid-cols-2 gap-6 text-xs border-b border-slate-100 pb-6">
          <div>
            <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
              Billed From
            </span>
            <div className="mt-1 font-bold text-slate-900 text-sm">
              BrightLoop Platform Inc.
            </div>
            <p className="mt-1 text-slate-500 leading-relaxed">
              100 Technology Plaza, Floor 8<br />
              San Francisco, CA 94105, USA<br />
              Tax ID: US-EIN-88410293
            </p>
          </div>

          <div>
            <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
              Billed To
            </span>
            <div className="mt-1 font-bold text-slate-900 text-sm">
              {invoice.customerName}
            </div>
            <p className="mt-1 text-slate-500 leading-relaxed">
              {invoice.billingAddress}<br />
              Email: {invoice.customerEmail}
            </p>
          </div>
        </div>

        {/* Invoice Items Table */}
        <div className="mt-6">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-2">Description</th>
                <th className="py-2 text-center">Qty</th>
                <th className="py-2 text-right">Unit Price</th>
                <th className="py-2 text-right">Discount</th>
                <th className="py-2 text-right font-bold text-slate-900">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.items.map((item) => (
                <tr key={item.id} className="text-slate-700">
                  <td className="py-3 font-medium text-slate-900">
                    {item.description}
                  </td>
                  <td className="py-3 text-center font-mono">{item.quantity}</td>
                  <td className="py-3 text-right font-mono">
                    {formatCurrency(item.unitPrice, "USD", 2)}
                  </td>
                  <td className="py-3 text-right font-mono text-amber-600">
                    {item.discountAmount > 0 ? `-${formatCurrency(item.discountAmount, "USD", 2)}` : "—"}
                  </td>
                  <td className="py-3 text-right font-mono font-semibold text-slate-900">
                    {formatCurrency(item.total, "USD", 2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Summary */}
        <div className="mt-6 flex justify-end border-t border-slate-100 pt-4">
          <div className="w-64 space-y-2 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal:</span>
              <span className="font-mono font-medium text-slate-900">
                {formatCurrency(invoice.subtotal, "USD", 2)}
              </span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Discount Total:</span>
              <span className="font-mono text-amber-600">
                -{formatCurrency(invoice.discountTotal, "USD", 2)}
              </span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Estimated Sales Tax (8.25%):</span>
              <span className="font-mono text-slate-900">
                +{formatCurrency(invoice.taxTotal, "USD", 2)}
              </span>
            </div>
            <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-bold text-slate-900">
              <span>Total Amount:</span>
              <span className="font-mono">
                {formatCurrency(invoice.totalAmount, "USD", 2)}
              </span>
            </div>
            <div className="flex justify-between text-xs font-semibold text-emerald-700 bg-emerald-50 p-2 rounded">
              <span>Amount Paid:</span>
              <span className="font-mono">
                {formatCurrency(invoice.amountPaid, "USD", 2)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        {invoice.notes && (
          <div className="mt-6 rounded-lg bg-slate-50 p-3 text-[11px] text-slate-500">
            <strong>Notes:</strong> {invoice.notes}
          </div>
        )}
      </div>
    </div>
  );
}

