import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  DollarSign,
  AlertCircle,
  RefreshCw,
  FileText
} from 'lucide-react';
import { getPayments } from '../../../services/api';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

export const PaymentList = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Metrics
  const [totalCollected, setTotalCollected] = useState(0);

  useEffect(() => {
    fetchPayments();
  }, [pagination.page, methodFilter]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page: pagination.page,
        limit: pagination.limit
      };
      if (methodFilter) params.payment_method = methodFilter;
      if (searchTerm) params.search = searchTerm;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const res = await getPayments(params);
      if (res?.data) {
        setPayments(res.data);
        if (res.pagination) setPagination(res.pagination);

        // Calculate sum
        const sum = res.data.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
        setTotalCollected(sum);
      }
    } catch (err) {
      setError(err?.message || 'Failed to fetch payments.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchPayments();
  };

  return (
    <div className="page-container" style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', color: 'var(--primary-navy)', margin: 0 }}>Payments & Transactions</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0' }}>
            Ledger of all incoming customer payments, wire transfers, and receipts.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/staff/payments/new" className="btn btn-primary" style={{ backgroundColor: '#0D9488', borderColor: '#0D9488' }}>
            <Plus size={18} />
            <span>Record Payment</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="metric-strip">
        <div className="metric-card success">
          <span className="metric-label">Total Transactions</span>
          <span className="metric-value">{pagination.total}</span>
        </div>
        <div className="metric-card accent">
          <span className="metric-label">Current Page Volume</span>
          <span className="metric-value">${totalCollected.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div style={{ background: '#FFFFFF', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', padding: '1rem', marginBottom: '1.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: 1, minWidth: '280px' }}>
          <div className="input-wrapper" style={{ flex: 1 }}>
            <span className="input-icon"><Search size={16} /></span>
            <input
              type="text"
              placeholder="Search payment #, reference, notes..."
              className="form-input has-icon"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-sm">Search</button>
          {searchTerm && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => { setSearchTerm(''); fetchPayments(); }}
            >
              Clear
            </button>
          )}
        </form>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select
            className="form-input"
            style={{ width: 'auto', fontSize: '0.85rem' }}
            value={methodFilter}
            onChange={(e) => {
              setMethodFilter(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
          >
            <option value="">All Payment Methods</option>
            <option value="CREDIT_CARD">Credit Card</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="CASH">Cash</option>
            <option value="CHECK">Check</option>
            <option value="PAYPAL">PayPal</option>
            <option value="STRIPE">Stripe</option>
            <option value="OTHER">Other</option>
          </select>

          <button
            onClick={fetchPayments}
            className="btn btn-outline btn-sm"
            title="Refresh"
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Table */}
      <div style={{ background: '#FFFFFF', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <LoadingSpinner />
            <p style={{ marginTop: '0.75rem', color: 'var(--text-muted)' }}>Retrieving transactions...</p>
          </div>
        ) : payments.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <CreditCard size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.15rem', color: 'var(--primary-navy)' }}>No payments found</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              {methodFilter || searchTerm
                ? 'No transactions match your search criteria.'
                : 'No payments have been recorded in the platform yet.'}
            </p>
            <Link to="/staff/payments/new" className="btn btn-primary" style={{ backgroundColor: '#0D9488', borderColor: '#0D9488' }}>
              <Plus size={16} />
              <span>Record First Payment</span>
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Payment #</th>
                  <th>Invoice #</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Method</th>
                  <th>Reference</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong style={{ color: 'var(--primary-navy)' }}>{p.payment_number}</strong>
                    </td>
                    <td>
                      {p.invoices?.invoice_number ? (
                        <Link to={`/staff/invoices/${p.invoice_id}`} style={{ fontWeight: 600 }}>
                          {p.invoices.invoice_number}
                        </Link>
                      ) : (
                        p.invoice_id
                      )}
                    </td>
                    <td>
                      <div>{p.customers?.name || 'Customer'}</div>
                      {p.customers?.company_name && (
                        <small style={{ color: 'var(--text-muted)' }}>{p.customers.company_name}</small>
                      )}
                    </td>
                    <td>{p.payment_date}</td>
                    <td>
                      <span className="badge badge-staff">{p.payment_method}</span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{p.reference_id || '—'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#0D9488', fontSize: '1rem' }}>
                      +${Number(p.amount).toFixed(2)}
                    </td>
                    <td>
                      <span className="badge badge-paid">{p.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1.25rem', borderTop: '1px solid var(--border-light)' }}>
            <small style={{ color: 'var(--text-muted)' }}>
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} records
            </small>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-outline btn-sm"
                disabled={pagination.page <= 1}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
              >
                Previous
              </button>
              <span style={{ display: 'flex', alignItems: 'center', padding: '0 0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                className="btn btn-outline btn-sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentList;

