import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Receipt,
  ArrowLeft,
  Send,
  Printer,
  Calendar,
  CreditCard,
  Building,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export const InvoiceDetail = () => {
  const { id } = useParams();
  const { session } = useAuth();
  const { addToast } = useToast();

  const [invoice, setInvoice] = useState(null);
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchInvoice = async () => {
    if (!session?.access_token || !id) return;
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/api/staff/invoices/${id}`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setInvoice(data.invoice);
        setLines(data.lines || []);
      }
    } catch (err) {
      console.warn('Invoice fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [id, session?.access_token]);

  const handleSendInvoice = async () => {
    try {
      setSending(true);
      const res = await fetch(`http://localhost:5000/api/staff/invoices/${id}/send`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Dispatch failed.');

      addToast(data.message || 'Invoice sent to customer email successfully.', 'success');
      fetchInvoice();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSending(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ padding: '4rem 0', textAlign: 'center' }}>
        <LoadingSpinner message="Loading invoice statement..." />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div style={{ padding: '2rem' }}>
        <Link to="/staff/invoices" className="btn btn-secondary btn-sm">
          <ArrowLeft size={16} /> Back to Invoices
        </Link>
        <div className="alert alert-danger" style={{ marginTop: '1rem' }}>
          Invoice statement could not be located.
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto', paddingBottom: '3rem' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <Link to="/staff/invoices" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
            <ArrowLeft size={16} /> Back to Invoices
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 style={{ fontSize: '1.75rem', color: 'var(--primary-navy)' }}>
              Invoice #{invoice.invoice_number}
            </h1>
            <span className={`badge badge-${invoice.payment_status?.toLowerCase() === 'paid' ? 'active' : 'inactive'}`}>
              {invoice.payment_status}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={handlePrint} className="btn btn-outline btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <Printer size={15} /> Print / Save PDF
          </button>
          <button
            onClick={handleSendInvoice}
            disabled={sending}
            className="btn btn-primary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Send size={15} /> {sending ? 'Sending...' : 'Send Invoice to Customer'}
          </button>
        </div>
      </div>

      {/* Official Invoice Card Format */}
      <div className="content-card" style={{ padding: '2.5rem', border: '1px solid var(--border-light)' }}>
        {/* Header Block */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--border-light)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', color: 'var(--primary-navy)', letterSpacing: '0.05em' }}>BRIGHTLOOP</h2>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Subscription Operations & Billing Platform</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-navy)' }}>INVOICE</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Date: {invoice.invoice_date || new Date().toISOString().split('T')[0]}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Due: <strong>{invoice.due_date || 'Due on receipt'}</strong></div>
          </div>
        </div>

        {/* Customer & Billing Entity Info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          <div>
            <small style={{ color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700 }}>BILLED TO</small>
            <div style={{ fontWeight: 700, fontSize: '1rem', marginTop: '0.2rem' }}>{invoice.customers?.name || 'Customer'}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{invoice.customers?.email}</div>
            {invoice.customers?.company_name && <div style={{ fontSize: '0.85rem' }}>{invoice.customers.company_name}</div>}
            {invoice.customers?.billing_address && <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{invoice.customers.billing_address}</div>}
          </div>

          <div style={{ textAlign: 'right' }}>
            <small style={{ color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700 }}>PAYMENT DETAILS</small>
            <div style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>Terms: {invoice.payment_terms || 'Net 30'}</div>
            <div style={{ fontSize: '0.85rem' }}>Status: <strong style={{ textTransform: 'uppercase' }}>{invoice.payment_status}</strong></div>
            {invoice.sent_at && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Dispatched: {new Date(invoice.sent_at).toLocaleDateString()}</div>}
          </div>
        </div>

        {/* Line Items Table */}
        <table className="data-table" style={{ marginBottom: '1.5rem' }}>
          <thead>
            <tr>
              <th>Description</th>
              <th style={{ textAlign: 'center' }}>Qty</th>
              <th style={{ textAlign: 'right' }}>Unit Price</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 ? (
              <tr>
                <td><strong>Subscription Plan Fee</strong></td>
                <td style={{ textAlign: 'center' }}>1</td>
                <td style={{ textAlign: 'right' }}>₹{invoice.subtotal}</td>
                <td style={{ textAlign: 'right' }}><strong>₹{invoice.subtotal}</strong></td>
              </tr>
            ) : (
              lines.map(l => (
                <tr key={l.id}>
                  <td><strong>{l.description || l.products?.name || 'Item'}</strong></td>
                  <td style={{ textAlign: 'center' }}>{l.quantity}</td>
                  <td style={{ textAlign: 'right' }}>₹{l.unit_price}</td>
                  <td style={{ textAlign: 'right' }}><strong>₹{l.line_total}</strong></td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Financial Breakdown */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Subtotal:</span>
              <span>₹{invoice.subtotal}</span>
            </div>
            {invoice.discount_amount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#28A745' }}>
                <span>Discount Applied:</span>
                <span>-₹{invoice.discount_amount}</span>
              </div>
            )}
            {invoice.tax_amount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Tax Amount:</span>
                <span>₹{invoice.tax_amount}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid var(--border-light)', paddingTop: '0.5rem', fontWeight: 800, fontSize: '1.2rem', color: 'var(--primary-navy)' }}>
              <span>Grand Total:</span>
              <span>₹{invoice.grand_total}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)', paddingTop: '0.2rem' }}>
              <span>Amount Paid:</span>
              <span>₹{invoice.amount_paid || '0.00'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 700, color: invoice.outstanding_amount > 0 ? '#E53E3E' : 'inherit' }}>
              <span>Outstanding:</span>
              <span>₹{invoice.outstanding_amount ?? invoice.grand_total}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetail;

