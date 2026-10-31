import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  AlertCircle,
  CheckCircle,
  FileText
} from 'lucide-react';
import { getPayments } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export const CustomerPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getPayments();
      if (res?.data) {
        setPayments(res.data);
      }
    } catch (err) {
      setError(err?.message || 'Failed to retrieve payments.');
    } finally {
      setLoading(false);
    }
  };

  const totalPaid = payments.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', margin: 0, color: 'var(--primary-navy)' }}>My Payments & Receipts</h1>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)' }}>
            Record of all payments applied to your subscriptions and invoices.
          </p>
        </div>
        <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-sm)', textAlign: 'right' }}>
          <small style={{ color: '#166534', fontWeight: 600 }}>Total Payments Made</small>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#166534' }}>
            ${totalPaid.toFixed(2)}
          </div>
        </div>
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
            <p style={{ marginTop: '0.75rem', color: 'var(--text-muted)' }}>Retrieving your payments...</p>
          </div>
        ) : payments.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <CreditCard size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.15rem' }}>No payments recorded yet</h3>
            <p style={{ color: 'var(--text-muted)' }}>Once payments are received and processed, your payment receipts will appear here.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Receipt #</th>
                  <th>Payment Date</th>
                  <th>Invoice Ref</th>
                  <th>Method</th>
                  <th>Reference</th>
                  <th style={{ textAlign: 'right' }}>Amount Paid</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.payment_number}</strong></td>
                    <td>{p.payment_date}</td>
                    <td>{p.invoices?.invoice_number || '—'}</td>
                    <td><span className="badge badge-staff">{p.payment_method}</span></td>
                    <td>{p.reference_id || '—'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#0D9488' }}>
                      ${Number(p.amount).toFixed(2)}
                    </td>
                    <td><span className="badge badge-paid">{p.status}</span></td>
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

export default CustomerPayments;
