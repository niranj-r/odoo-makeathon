import React from 'react';
import { X, Download, Building2, CheckCircle2 } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';

/**
 * InvoiceDetailModal
 * Section 5: Detailed invoice view with line items, tax breakdown, billing address, and PDF export.
 */
export const InvoiceDetailModal = ({
  invoice,
  isOpen,
  onClose,
  onDownload,
}) => {
  if (!isOpen || !invoice) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <Building2 size={16} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Invoice {invoice.invoiceNumber}
              </h2>
              <p className="text-xs text-slate-500">
                Issued {formatDate(invoice.issueDate)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 size={12} />
              {invoice.status}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Invoice Printable Canvas Area */}
        <div className="p-6 space-y-6 text-xs text-slate-700">
          {/* Top Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-100">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                Billed To
              </span>
              <p className="font-bold text-slate-900 text-sm">
                {invoice.billingAddress?.company}
              </p>
              <p className="text-slate-600">{invoice.billingAddress?.attention}</p>
              <p className="text-slate-600">{invoice.billingAddress?.line1}</p>
              <p className="text-slate-600">
                {invoice.billingAddress?.city}, {invoice.billingAddress?.state} {invoice.billingAddress?.postalCode}
              </p>
              <p className="text-slate-500 text-[11px] mt-1 font-mono">
                Tax ID: {invoice.billingAddress?.taxId}
              </p>
            </div>

            <div className="sm:text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                Payment Details
              </span>
              <p className="text-slate-600">
                Payment Method:{' '}
                <span className="font-semibold text-slate-900">
                  {invoice.paymentMethod}
                </span>
              </p>
              <p className="text-slate-600">
                Reference ID:{' '}
                <span className="font-mono text-slate-800">
                  {invoice.paymentReference}
                </span>
              </p>
              <p className="text-slate-600">
                Paid Date: {formatDate(invoice.paidAt)}
              </p>
              <p className="text-slate-600">
                Due Date: {formatDate(invoice.dueDate)}
              </p>
            </div>
          </div>

          {/* Line Items Table */}
          <div>
            <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider mb-2">
              Itemized Charges
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <tr>
                    <th className="px-4 py-2.5">Description</th>
                    <th className="px-4 py-2.5 text-center">Qty</th>
                    <th className="px-4 py-2.5 text-right">Unit Price</th>
                    <th className="px-4 py-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoice.items?.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {item.description}
                      </td>
                      <td className="px-4 py-3 text-center">{item.quantity}</td>
                      <td className="px-4 py-3 text-right">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">
                        {formatCurrency(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals Summary */}
          <div className="flex justify-end">
            <div className="w-full sm:w-64 space-y-2 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900">
                  {formatCurrency(invoice.subtotal)}
                </span>
              </div>
              {invoice.taxes?.map((tax, idx) => (
                <div key={idx} className="flex justify-between text-slate-500 text-[11px]">
                  <span>{tax.name} ({tax.rate})</span>
                  <span>{formatCurrency(tax.amount)}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900 text-sm">
                <span>Total Amount</span>
                <span>{formatCurrency(invoice.total)}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-semibold text-xs pt-1">
                <span>Amount Paid</span>
                <span>{formatCurrency(invoice.amountPaid)}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-xs">
                <span>Balance Due</span>
                <span>{formatCurrency(invoice.balanceDue)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/75 flex items-center justify-between rounded-b-2xl">
          <button
            type="button"
            onClick={() => onDownload?.(invoice)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
          >
            <Download size={13} />
            Download PDF Statement
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetailModal;

