import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCard,
  Search,
  Eye,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export const PaymentList = () => {
  const { session } = useAuth();
  const { addToast } = useToast();

  const [payments, setPayments] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState(null);

  const fetchPayments = async () => {
    if (!session?.access_token) return;
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });
      if (searchTerm.trim()) params.append('search', searchTerm.trim());

      const res = await fetch(`http://localhost:5000/api/staff/payments?${params.toString()}`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setPayments(data.payments || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.warn('Payment list fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [session?.access_token, page]);

  const handleRetryPayment = async (paymentId) => {
    try {
      setRetryingId(paymentId);
      const res = await fetch(`http://localhost:5000/api/staff/payments/${paymentId}/retry`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Payment retry failed.');

      addToast(data.message || 'Payment recovery notification dispatched.', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div style={{ paddingBottom: '3rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', color: 'var(--primary-navy)' }}>Customer Payments & Transactions</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Safe transaction ledger, verification logs, and customer retry assistance.
          </p>
        </div>
        <button onClick={fetchPayments} className="btn btn-outline btn-sm" disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spinner' : ''} /> Refresh
        </button>
      </div>

      <div className="content-card" style={{ padding: '1.5rem' }}>
        <div className="table-toolbar">
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', flex: 1 }}>
            <div className="input-wrapper" style={{ minWidth: '260px', flex: 1 }}>
              <span className="input-icon">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="Search by transaction reference or payment number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input has-icon"
                style={{ padding: '0.55rem 0.85rem 0.55rem 2.3rem' }}
              />
            </div>
            <button onClick={() => { setPage(1); fetchPayments(); }} className="btn btn-primary btn-sm">
              Search
            </button>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Total <strong>{total}</strong> payment records
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '3rem 0', textAlign: 'center' }}>
            <LoadingSpinner message="Loading payments ledger..." />
          </div>
        ) : payments.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No payment transaction entries recorded yet.
          </div>
        ) : (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Payment #</th>
                  <th>Customer</th>
                  <th>Invoice #</th>
                  <th>Date</th>
                  <th>Method</th>
                  <th>Amount</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id}>
                    <td><code>{p.payment_number}</code></td>
                    <td>
                      <strong>{p.customers?.name || 'Customer'}</strong>
                    </td>
                    <td><code>{p.invoices?.invoice_number || '—'}</code></td>
                    <td>{p.payment_date || '—'}</td>
                    <td>
                      <span className="badge badge-staff">
                        {p.payment_method || 'Online'}
                      </span>
                    </td>
                    <td><strong style={{ color: '#28A745' }}>₹{p.amount}</strong></td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="action-btn-group" style={{ justifyContent: 'flex-end' }}>
                        <Link to={`/staff/payments/${p.id}`} className="action-btn" style={{ textDecoration: 'none' }}>
                          <Eye size={14} /> <span>Inspect</span>
                        </Link>
                        <button
                          onClick={() => handleRetryPayment(p.id)}
                          disabled={retryingId === p.id}
                          className="action-btn"
                          title="Trigger Safe Customer Retry"
                        >
                          <RotateCcw size={14} className={retryingId === p.id ? 'spinner' : ''} />
                          <span>Retry</span>
                        </button>
                      </div>
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

export default PaymentList;

