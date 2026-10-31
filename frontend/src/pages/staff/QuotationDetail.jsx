import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FileSpreadsheet,
  ArrowLeft,
  Send,
  CheckCircle,
  XCircle,
  Layers,
  Clock,
  User,
  Calendar,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export const QuotationDetail = () => {
  const { id } = useParams();
  const { session } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [quotation, setQuotation] = useState(null);
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchQuotation = async () => {
    if (!session?.access_token || !id) return;
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/api/staff/quotations/${id}`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setQuotation(data.quotation);
        setLines(data.lines || []);
      }
    } catch (err) {
      console.warn('Quotation detail error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotation();
  }, [id, session?.access_token]);

  const handleUpdateStatus = async (nextStatus) => {
    try {
      setActionLoading(true);
      const res = await fetch(`http://localhost:5000/api/staff/quotations/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Status update failed.');

      addToast(`Quotation status updated to ${nextStatus}.`, 'success');
      setQuotation(data.quotation);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConvertToSubscription = async () => {
    try {
      setActionLoading(true);
      const res = await fetch('http://localhost:5000/api/staff/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          customer_id: quotation.customer_id,
          quotation_id: quotation.id,
          billing_frequency: 'monthly',
          auto_renew: true
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to initiate subscription.');

      addToast('Active subscription created from approved quote.', 'success');
      navigate(`/staff/subscriptions/${data.subscription.id}`);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '4rem 0', textAlign: 'center' }}>
        <LoadingSpinner message="Loading quotation details..." />
      </div>
    );
  }

  if (!quotation) {
    return (
      <div style={{ padding: '2rem' }}>
        <Link to="/staff/quotations" className="btn btn-secondary btn-sm">
          <ArrowLeft size={16} /> Back to Quotations
        </Link>
        <div className="alert alert-danger" style={{ marginTop: '1rem' }}>
          Quotation record not found.
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '3rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/staff/quotations" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
          <ArrowLeft size={16} /> Back to Quotations Desk
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 style={{ fontSize: '1.75rem', color: 'var(--primary-navy)' }}>
                Quote #{quotation.quotation_number}
              </h1>
              <span className={`badge badge-${quotation.status?.toLowerCase()}`}>
                {quotation.status}
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)' }}>
              Order Date: {quotation.order_date || '—'} &bull; Payment Terms: {quotation.payment_terms || 'Due on receipt'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {quotation.status === 'DRAFT' && (
              <button
                onClick={() => handleUpdateStatus('SENT')}
                disabled={actionLoading}
                className="btn btn-primary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Send size={14} /> Send to Customer
              </button>
            )}

            {quotation.status === 'SENT' && (
              <button
                onClick={() => handleUpdateStatus('CONFIRMED')}
                disabled={actionLoading}
                className="btn btn-primary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <CheckCircle size={14} /> Approve Quotation
              </button>
            )}

            {quotation.status === 'CONFIRMED' && (
              <button
                onClick={handleConvertToSubscription}
                disabled={actionLoading}
                className="btn btn-primary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Layers size={14} /> Convert to Subscription
              </button>
            )}

            {quotation.status !== 'CANCELLED' && quotation.status !== 'CONFIRMED' && (
              <button
                onClick={() => handleUpdateStatus('CANCELLED')}
                disabled={actionLoading}
                className="btn btn-secondary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <XCircle size={14} /> Cancel Quote
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Customer Info Card */}
      <div className="content-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', color: 'var(--primary-navy)', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
          Customer & Commercial Terms
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div>
            <small style={{ color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600 }}>Customer Name</small>
            <strong style={{ fontSize: '1rem' }}>{quotation.customers?.name || 'Customer'}</strong>
          </div>
          <div>
            <small style={{ color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600 }}>Email Address</small>
            <div>{quotation.customers?.email || '—'}</div>
          </div>
          <div>
            <small style={{ color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600 }}>Validity Period</small>
            <div>{quotation.validity_date || 'Standard 30 Days'}</div>
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="content-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', color: 'var(--primary-navy)', marginBottom: '1rem' }}>
          Configured Products & Line Items
        </h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Description / Item</th>
              <th style={{ textAlign: 'center' }}>Quantity</th>
              <th style={{ textAlign: 'right' }}>Unit Price</th>
              <th style={{ textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                  No individual line items detailed for this quotation.
                </td>
              </tr>
            ) : (
              lines.map(line => (
                <tr key={line.id}>
                  <td>
                    <strong>{line.description || line.products?.name || 'Product'}</strong>
                  </td>
                  <td style={{ textAlign: 'center' }}>{line.quantity}</td>
                  <td style={{ textAlign: 'right' }}>₹{line.unit_price}</td>
                  <td style={{ textAlign: 'right' }}><strong>₹{line.line_total}</strong></td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Totals Summary */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Subtotal:</span>
              <span>₹{quotation.subtotal}</span>
            </div>
            {quotation.discount_amount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#28A745' }}>
                <span>Discount Applied:</span>
                <span>-₹{quotation.discount_amount}</span>
              </div>
            )}
            {quotation.tax_amount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Taxes:</span>
                <span>₹{quotation.tax_amount}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid var(--border-light)', paddingTop: '0.5rem', fontWeight: 800, fontSize: '1.15rem', color: 'var(--primary-navy)' }}>
              <span>Grand Total:</span>
              <span>₹{quotation.grand_total}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotationDetail;

