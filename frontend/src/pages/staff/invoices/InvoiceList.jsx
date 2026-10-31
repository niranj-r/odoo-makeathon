import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  CalendarClock,
  Plus,
  Search,
  Filter,
  DollarSign,
  AlertCircle,
  Download,
  CreditCard,
  Eye,
  RefreshCw
} from 'lucide-react';
import { getInvoices, downloadInvoicePdf } from '../../../services/api';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import BillingRunModal from './BillingRunModal';

export const InvoiceList = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState({
    totalInvoiced: 0,
    totalCollected: 0,
    totalOutstanding: 0,
    overdueCount: 0
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    fetchInvoices();
  }, [pagination.page, statusFilter, paymentStatusFilter]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page: pagination.page,
        limit: pagination.limit
      };
      if (statusFilter) params.status = statusFilter;
      if (paymentStatusFilter) params.payment_status = paymentStatusFilter;
      if (searchTerm) params.search = searchTerm;

      const res = await getInvoices(params);
      if (res?.data) {
        setInvoices(res.data);
        if (res.summary) setSummary(res.summary);
        if (res.pagination) setPagination(res.pagination);
      }
    } catch (err) {
      setError(err?.message || 'Failed to load invoices.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchInvoices();
  };

  const handleDownloadPdf = async (e, invoice) => {
    e.stopPropagation();
    try {
      setDownloadingId(invoice.id);
      await downloadInvoicePdf(invoice.id, invoice.invoice_number);
    } catch (err) {
      alert(`Could not download PDF: ${err.message}`);
    } finally {
      setDownloadingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PAID':
        return <span className="badge badge-paid">PAID</span>;
      case 'CONFIRMED':
        return <span className="badge badge-confirmed">CONFIRMED</span>;
      case 'DRAFT':
        return <span className="badge badge-draft">DRAFT</span>;
      case 'CANCELLED':
        return <span className="badge badge-cancelled">CANCELLED</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  const getPaymentBadge = (paymentStatus) => {
    switch (paymentStatus) {
      case 'PAID':
        return <span className="badge badge-paid">PAID</span>;
      case 'PARTIALLY_PAID':
        return <span className="badge badge-partial">PARTIAL</span>;
      case 'UNPAID':
        return <span className="badge badge-unpaid">UNPAID</span>;
      default:
        return <span className="badge">{paymentStatus}</span>;
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="page-container" style={{ padding: '1.5rem', maxWidth: '1300px', margin: '0 auto' }}>
      {/* Top Header & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', color: 'var(--primary-navy)', margin: 0 }}>Invoices & Billing</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0' }}>
            Manage recurring and manual invoices, execute scheduled billing runs, and monitor receivables.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => setIsSchedulerOpen(true)}
            className="btn btn-secondary"
            title="Launch recurring billing generator"
          >
            <CalendarClock size={18} />
            <span>Billing Scheduler</span>
          </button>
          <Link to="/staff/invoices/new" className="btn btn-primary">
            <Plus size={18} />
            <span>Create Invoice</span>
          </Link>
        </div>
      </div>

      {/* Financial Metric Strip */}
      <div className="metric-strip">
        <div className="metric-card accent">
          <span className="metric-label">Total Invoiced</span>
          <span className="metric-value">${summary.totalInvoiced.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="metric-card success">
          <span className="metric-label">Total Collected</span>
          <span className="metric-value">${summary.totalCollected.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="metric-card warning">
          <span className="metric-label">Outstanding Balance</span>
          <span className="metric-value">${summary.totalOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className={`metric-card ${summary.overdueCount > 0 ? 'danger' : ''}`}>
          <span className="metric-label">Overdue Invoices</span>
          <span className="metric-value" style={{ color: summary.overdueCount > 0 ? '#DC2626' : 'var(--primary-navy)' }}>
            {summary.overdueCount}
          </span>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div style={{ background: '#FFFFFF', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', padding: '1rem', marginBottom: '1.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: 1, minWidth: '280px' }}>
          <div className="input-wrapper" style={{ flex: 1 }}>
            <span className="input-icon"><Search size={16} /></span>
            <input
              type="text"
              placeholder="Search by invoice #, customer, terms..."
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
              onClick={() => { setSearchTerm(''); fetchInvoices(); }}
            >
              Clear
            </button>
          )}
        </form>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {/* Invoice Lifecycle Status Filter */}
          <select
            className="form-input"
            style={{ width: 'auto', fontSize: '0.85rem' }}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
          >
            <option value="">All Invoice States</option>
            <option value="DRAFT">Draft</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PAID">Paid</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {/* Payment Status Filter */}
          <select
            className="form-input"
            style={{ width: 'auto', fontSize: '0.85rem' }}
            value={paymentStatusFilter}
            onChange={(e) => {
              setPaymentStatusFilter(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
          >
            <option value="">All Payment States</option>
            <option value="UNPAID">Unpaid</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
            <option value="PAID">Fully Paid</option>
          </select>

          <button
            onClick={fetchInvoices}
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

      {/* Invoices Table */}
      <div style={{ background: '#FFFFFF', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <LoadingSpinner />
            <p style={{ marginTop: '0.75rem', color: 'var(--text-muted)' }}>Loading financial ledger...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <FileText size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.15rem', color: 'var(--primary-navy)' }}>No invoices found</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              {statusFilter || paymentStatusFilter || searchTerm
                ? 'No invoices matched your filter criteria.'
                : 'No invoices have been generated yet. Run the billing scheduler or create a manual invoice.'}
            </p>
            <button onClick={() => setIsSchedulerOpen(true)} className="btn btn-primary">
              <CalendarClock size={16} />
              <span>Run Billing Scheduler</span>
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Customer</th>
                  <th>Subscription</th>
                  <th>Dates</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                  <th style={{ textAlign: 'right' }}>Balance Due</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const isOverdue = inv.due_date < todayStr && inv.payment_status !== 'PAID' && inv.status !== 'CANCELLED';
                  return (
                    <tr
                      key={inv.id}
                      onClick={() => navigate(`/staff/invoices/${inv.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <strong style={{ color: 'var(--primary-navy)' }}>{inv.invoice_number}</strong>
                      </td>
                      <td>
                        <div>{inv.customers?.name || 'Customer'}</div>
                        {inv.customers?.company_name && (
                          <small style={{ color: 'var(--text-muted)' }}>{inv.customers.company_name}</small>
                        )}
                      </td>
                      <td>
                        {inv.subscriptions?.subscription_number ? (
                          <span style={{ fontSize: '0.85rem', color: 'var(--primary-navy)', fontWeight: 600 }}>
                            {inv.subscriptions.subscription_number}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Direct Invoice</span>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem' }}>Inv: {inv.invoice_date}</div>
                        <div style={{ fontSize: '0.8rem', color: isOverdue ? '#DC2626' : 'var(--text-muted)', fontWeight: isOverdue ? 700 : 400 }}>
                          Due: {inv.due_date} {isOverdue ? '(OVERDUE)' : ''}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary-navy)' }}>
                        ${Number(inv.grand_total || 0).toFixed(2)}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: Number(inv.outstanding_amount || 0) > 0 ? '#D97706' : '#0D9488' }}>
                        ${Number(inv.outstanding_amount || 0).toFixed(2)}
                      </td>
                      <td>{getStatusBadge(inv.status)}</td>
                      <td>{getPaymentBadge(inv.payment_status)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }} onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => navigate(`/staff/invoices/${inv.id}`)}
                            className="btn btn-ghost btn-sm"
                            title="View Invoice"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={(e) => handleDownloadPdf(e, inv)}
                            className="btn btn-ghost btn-sm"
                            title="Download PDF"
                            disabled={downloadingId === inv.id}
                          >
                            <Download size={15} className={downloadingId === inv.id ? 'spin' : ''} />
                          </button>
                          {Number(inv.outstanding_amount || 0) > 0 && inv.status !== 'CANCELLED' && (
                            <button
                              onClick={() => navigate(`/staff/payments/new?invoice_id=${inv.id}`)}
                              className="btn btn-primary btn-sm"
                              title="Record Payment"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                            >
                              <CreditCard size={13} />
                              <span>Pay</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
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

      {/* Scheduler Modal */}
      <BillingRunModal
        isOpen={isSchedulerOpen}
        onClose={() => setIsSchedulerOpen(false)}
        onComplete={() => {
          fetchInvoices();
        }}
      />
    </div>
  );
};

export default InvoiceList;

