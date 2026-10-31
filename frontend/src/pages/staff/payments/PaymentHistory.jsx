import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCard,
  Search,
  Printer,
  Calendar,
  DollarSign,
  AlertCircle,
  RefreshCw,
  Eye,
  CheckCircle,
  X
} from 'lucide-react';
import { getPayments } from '../../../services/api';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

export const PaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getPayments({ limit: 100 });
      if (res?.data) {
        setPayments(res.data);
      }
    } catch (err) {
      setError(err?.message || 'Failed to load transaction history.');
    } finally {
      setLoading(false);
    }
  };

  const filtered = payments.filter((p) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      p.payment_number?.toLowerCase().includes(term) ||
      p.invoices?.invoice_number?.toLowerCase().includes(term) ||
      p.customers?.name?.toLowerCase().includes(term) ||
      p.reference_id?.toLowerCase().includes(term) ||
      p.notes?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="page-container" style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', color: 'var(--primary-navy)', margin: 0 }}>Payment Audit History</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0' }}>
            Comprehensive transaction ledger and payment allocation audit trail.
          </p>
        </div>
        <Link to="/staff/payments/new" className="btn btn-primary" style={{ backgroundColor: '#0D9488', borderColor: '#0D9488' }}>
          <CreditCard size={16} />
          <span>Record New Payment</span>
        </Link>
      </div>

      {/* Filter */}
      <div style={{ background: '#FFFFFF', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
        <div className="input-wrapper" style={{ flex: 1 }}>
          <span className="input-icon"><Search size={16} /></span>
          <input
            type="text"
            placeholder="Search by receipt #, customer, invoice #, or check reference..."
            className="form-input has-icon"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button onClick={fetchHistory} className="btn btn-outline" title="Refresh">
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
        </button>
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
            <p style={{ marginTop: '0.75rem', color: 'var(--text-muted)' }}>Retrieving audit ledger...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No transactions found.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Receipt #</th>
                  <th>Date</th>
                  <th>Invoice Ref</th>
                  <th>Customer</th>
                  <th>Method</th>
                  <th>Reference</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th style={{ textAlign: 'center' }}>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.payment_number}</strong></td>
                    <td>{p.payment_date}</td>
                    <td>
                      <Link to={`/staff/invoices/${p.invoice_id}`} style={{ fontWeight: 600 }}>
                        {p.invoices?.invoice_number || 'Invoice'}
                      </Link>
                    </td>
                    <td>{p.customers?.name || 'Customer'}</td>
                    <td><span className="badge badge-staff">{p.payment_method}</span></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{p.reference_id || '—'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#0D9488' }}>
                      +${Number(p.amount).toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => setSelectedReceipt(p)}
                        className="btn btn-ghost btn-sm"
                        title="View Receipt"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Printable Receipt Modal */}
      {selectedReceipt && (
        <div className="modal-backdrop" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(27, 60, 83, 0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem'
        }}>
          <div className="modal-container" style={{
            backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-md)',
            maxWidth: '480px', width: '100%', padding: '2rem', boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0D9488' }}>
                <CheckCircle size={22} />
                <h2 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--primary-navy)' }}>Payment Receipt</h2>
              </div>
              <button onClick={() => setSelectedReceipt(null)} className="btn btn-ghost btn-sm" style={{ padding: '0.2rem' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ background: 'var(--bg-card-subtle)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Amount Received</span>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0D9488' }}>
                  ${Number(selectedReceipt.amount).toFixed(2)}
                </div>
                <small style={{ color: 'var(--text-secondary)' }}>Status: COMPLETED</small>
              </div>

              <table style={{ width: '100%', fontSize: '0.85rem' }}>
                <tbody>
                  <tr>
                    <td style={{ color: 'var(--text-muted)', padding: '0.25rem 0' }}>Receipt #:</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{selectedReceipt.payment_number}</td>
                  </tr>
                  <tr>
                    <td style={{ color: 'var(--text-muted)', padding: '0.25rem 0' }}>Payment Date:</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{selectedReceipt.payment_date}</td>
                  </tr>
                  <tr>
                    <td style={{ color: 'var(--text-muted)', padding: '0.25rem 0' }}>Applied To Invoice:</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{selectedReceipt.invoices?.invoice_number}</td>
                  </tr>
                  <tr>
                    <td style={{ color: 'var(--text-muted)', padding: '0.25rem 0' }}>Customer:</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{selectedReceipt.customers?.name}</td>
                  </tr>
                  <tr>
                    <td style={{ color: 'var(--text-muted)', padding: '0.25rem 0' }}>Method:</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{selectedReceipt.payment_method}</td>
                  </tr>
                  {selectedReceipt.reference_id && (
                    <tr>
                      <td style={{ color: 'var(--text-muted)', padding: '0.25rem 0' }}>Reference:</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{selectedReceipt.reference_id}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button onClick={() => setSelectedReceipt(null)} className="btn btn-outline btn-sm">
                Close
              </button>
              <button onClick={() => window.print()} className="btn btn-primary btn-sm">
                <Printer size={15} />
                <span>Print Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;
