import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  AlertCircle,
  Eye,
  CreditCard,
  Printer
} from 'lucide-react';
import { getInvoices, downloadInvoicePdf } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export const CustomerInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    fetchCustomerInvoices();
  }, []);

  const fetchCustomerInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getInvoices();
      if (res?.data) {
        setInvoices(res.data);
      }
    } catch (err) {
      setError(err?.message || 'Failed to load your invoices.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (invoice) => {
    try {
      setDownloadingId(invoice.id);
      await downloadInvoicePdf(invoice.id, invoice.invoice_number);
    } catch (err) {
      alert(`Could not download PDF: ${err.message}`);
    } finally {
      setDownloadingId(null);
    }
  };

  const totalOutstanding = invoices.reduce((acc, curr) => {
    return curr.status !== 'CANCELLED' ? acc + Number(curr.outstanding_amount || 0) : acc;
  }, 0);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', margin: 0, color: 'var(--primary-navy)' }}>My Invoices</h1>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)' }}>
            View your subscription billing statements and download official PDF tax invoices.
          </p>
        </div>
        {totalOutstanding > 0.001 && (
          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-sm)', textAlign: 'right' }}>
            <small style={{ color: '#92400E', fontWeight: 600 }}>Total Balance Due</small>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#B45309' }}>
              ${totalOutstanding.toFixed(2)}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div style={{ background: '#FFFFFF', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <LoadingSpinner />
            <p style={{ marginTop: '0.75rem', color: 'var(--text-muted)' }}>Retrieving your invoices...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <FileText size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.15rem' }}>No invoices issued yet</h3>
            <p style={{ color: 'var(--text-muted)' }}>Your invoices will automatically appear here on your scheduled billing dates.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Date</th>
                  <th>Due Date</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                  <th style={{ textAlign: 'right' }}>Balance Due</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td><strong>{inv.invoice_number}</strong></td>
                    <td>{inv.invoice_date}</td>
                    <td>{inv.due_date}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>
                      ${Number(inv.grand_total).toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: Number(inv.outstanding_amount) > 0 ? '#D97706' : '#0D9488' }}>
                      ${Number(inv.outstanding_amount).toFixed(2)}
                    </td>
                    <td>
                      <span className={`badge badge-${inv.payment_status === 'PARTIALLY_PAID' ? 'partial' : inv.payment_status.toLowerCase()}`}>
                        {inv.payment_status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => handleDownload(inv)}
                        className="btn btn-outline btn-sm"
                        disabled={downloadingId === inv.id}
                        title="Download Invoice PDF"
                      >
                        <Download size={14} className={downloadingId === inv.id ? 'spin' : ''} />
                        <span>PDF</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerInvoices;

