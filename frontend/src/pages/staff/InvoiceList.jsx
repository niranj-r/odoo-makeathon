import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Receipt,
  Search,
  Filter,
  Eye,
  RefreshCw,
  Send,
  Calendar,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export const InvoiceList = () => {
  const { session } = useAuth();
  const { addToast } = useToast();

  const [invoices, setInvoices] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchInvoices = async () => {
    if (!session?.access_token) return;
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });
      if (paymentStatusFilter !== 'ALL') params.append('payment_status', paymentStatusFilter);
      if (searchTerm.trim()) params.append('search', searchTerm.trim());

      const res = await fetch(`http://localhost:5000/api/staff/invoices?${params.toString()}`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setInvoices(data.invoices || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.warn('Invoice list fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [session?.access_token, page, paymentStatusFilter]);

  return (
    <div style={{ paddingBottom: '3rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', color: 'var(--primary-navy)' }}>Customer Billing & Invoices</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Track client payment status, identify overdue balances, and dispatch invoices.
          </p>
        </div>
        <button onClick={fetchInvoices} className="btn btn-outline btn-sm" disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spinner' : ''} /> Refresh
        </button>
      </div>

      <div className="content-card" style={{ padding: '1.5rem' }}>
        <div className="table-toolbar">
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', flex: 1 }}>
            <div className="input-wrapper" style={{ minWidth: '240px', flex: 1 }}>
              <span className="input-icon">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="Search by invoice number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input has-icon"
                style={{ padding: '0.55rem 0.85rem 0.55rem 2.3rem' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Filter size={15} color="var(--text-muted)" />
              <select
                value={paymentStatusFilter}
                onChange={(e) => { setPaymentStatusFilter(e.target.value); setPage(1); }}
                className="filter-select"
              >
                <option value="ALL">All Payment States</option>
                <option value="PAID">Paid</option>
                <option value="UNPAID">Unpaid</option>
                <option value="OVERDUE">Overdue</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Total <strong>{total}</strong> invoices
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '3rem 0', textAlign: 'center' }}>
            <LoadingSpinner message="Loading invoices..." />
          </div>
        ) : invoices.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No invoice records found matching the query.
          </div>
        ) : (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Customer</th>
                  <th>Due Date</th>
                  <th>Payment Status</th>
                  <th>Amount</th>
                  <th>Sent Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id}>
                    <td><code>{inv.invoice_number}</code></td>
                    <td>
                      <strong>{inv.customers?.name || 'Customer'}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{inv.customers?.email}</div>
                    </td>
                    <td>{inv.due_date || '—'}</td>
                    <td>
                      <span className={`badge badge-${inv.payment_status?.toLowerCase() === 'paid' ? 'active' : 'inactive'}`}>
                        {inv.payment_status}
                      </span>
                    </td>
                    <td><strong style={{ color: 'var(--primary-navy)' }}>₹{inv.grand_total}</strong></td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {inv.sent_at ? new Date(inv.sent_at).toLocaleDateString() : 'Not sent'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link to={`/staff/invoices/${inv.id}`} className="action-btn" style={{ textDecoration: 'none' }}>
                        <Eye size={14} /> <span>Inspect</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn btn-outline btn-sm">
              <ChevronLeft size={16} /> Previous
            </button>
            <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: '0.875rem' }}>
              Page {page} of {totalPages}
            </span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn btn-outline btn-sm">
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceList;

