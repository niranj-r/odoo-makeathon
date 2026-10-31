import React, { useState, useMemo } from 'react';
import { History, CreditCard, CheckCircle2, Search, ArrowUpDown } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { ExportDropdown } from '../common/ExportDropdown';
import { exportToCsv, exportToExcel } from '../../utils/exportCsv';
import { EmptyState } from '../common/EmptyState';

/**
 * PaymentHistoryTable
 * Upgraded with multi-parameter filter controls, sorting, universal export dropdown, and empty states.
 */
export const PaymentHistoryTable = ({ payments = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');

  const filteredPayments = useMemo(() => {
    let list = [...payments];

    if (statusFilter !== 'All') {
      list = list.filter((p) => p.status.toLowerCase() === statusFilter.toLowerCase());
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.invoice.toLowerCase().includes(q) ||
          p.referenceNumber.toLowerCase().includes(q) ||
          p.method.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      let aVal = a[sortField === 'amount' ? 'amount' : 'paymentDate'];
      let bVal = b[sortField === 'amount' ? 'amount' : 'paymentDate'];

      if (sortField === 'amount') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return sortDirection === 'asc'
        ? new Date(aVal) - new Date(bVal)
        : new Date(bVal) - new Date(aVal);
    });

    return list;
  }, [payments, statusFilter, searchTerm, sortField, sortDirection]);

  const handleExport = (format) => {
    const columns = [
      { header: 'Payment Date', accessor: (r) => formatDate(r.paymentDate) },
      { header: 'Invoice Number', accessor: 'invoice' },
      { header: 'Amount ($)', accessor: (r) => formatCurrency(r.amount) },
      { header: 'Method', accessor: 'method' },
      { header: 'Reference ID', accessor: 'referenceNumber' },
      { header: 'Status', accessor: 'status' },
    ];

    if (format === 'excel') {
      exportToExcel('Payment_Transactions_Ledger', columns, filteredPayments);
    } else if (format === 'pdf') {
      if (typeof window !== 'undefined') {
        window.print();
      }
    } else {
      exportToCsv('Payment_Transactions_Ledger', columns, filteredPayments);
    }
  };

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden select-none transition-colors duration-200">
      {/* Table Header Controls */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search payment ID, invoice, or method..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Filters & Export */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Success">Success (Settled)</option>
            <option value="Processing">Processing</option>
            <option value="Failed">Failed</option>
          </select>

          <ExportDropdown onExport={handleExport} />
        </div>
      </div>

      {/* Table Canvas */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <th
                className="px-6 py-3 cursor-pointer hover:text-slate-800 dark:hover:text-slate-200"
                onClick={() => toggleSort('date')}
              >
                <div className="flex items-center gap-1">
                  <span>Payment Date</span>
                  <ArrowUpDown size={11} />
                </div>
              </th>
              <th className="px-6 py-3">Related Invoice</th>
              <th
                className="px-6 py-3 text-right cursor-pointer hover:text-slate-800 dark:hover:text-slate-200"
                onClick={() => toggleSort('amount')}
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Amount Settled</span>
                  <ArrowUpDown size={11} />
                </div>
              </th>
              <th className="px-6 py-3">Payment Method</th>
              <th className="px-6 py-3">Transaction Reference</th>
              <th className="px-6 py-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredPayments.length > 0 ? (
              filteredPayments.map((pmt) => (
                <tr
                  key={pmt.id}
                  className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="px-6 py-3.5 font-medium text-slate-800 dark:text-slate-200">
                    {formatDate(pmt.paymentDate)}
                  </td>
                  <td className="px-6 py-3.5 font-mono text-blue-600 dark:text-blue-400 font-semibold">
                    {pmt.invoice}
                  </td>
                  <td className="px-6 py-3.5 text-right font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrency(pmt.amount)}
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <CreditCard size={14} className="text-slate-400" />
                      <span>{pmt.method}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                    {pmt.referenceNumber}
                  </td>
                  <td className="px-6 py-3.5 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 size={11} />
                      {pmt.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                  <EmptyState preset="payments" />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PaymentHistoryTable;
