import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CreditCard,
  ArrowLeft,
  ShieldCheck,
  Calendar,
  RotateCcw,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export const PaymentDetail = () => {
  const { id } = useParams();
  const { session } = useAuth();
  const { addToast } = useToast();

  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);

  const fetchPayment = async () => {
    if (!session?.access_token || !id) return;
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/api/staff/payments/${id}`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      const data = await res.json();
      if (res.ok) setPayment(data.payment);
    } catch (err) {
      console.warn('Payment fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayment();
  }, [id, session?.access_token]);

  const handleRetry = async () => {
    try {
      setRetrying(true);
      const res = await fetch(`http://localhost:5000/api/staff/payments/${id}/retry`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Retry failed.');

      addToast(data.message || 'Payment retry instructions sent to customer.', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setRetrying(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '4rem 0', textAlign: 'center' }}>
        <LoadingSpinner message="Loading payment transaction records..." />
      </div>
    );
  }

  if (!payment) {
    return (
      <div style={{ padding: '2rem' }}>
        <Link to="/staff/payments" className="btn btn-secondary btn-sm">
          <ArrowLeft size={16} /> Back to Payments
        </Link>
        <div className="alert alert-danger" style={{ marginTop: '1rem' }}>
          Payment transaction could not be located.
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '3rem' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <Link to="/staff/payments" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
            <ArrowLeft size={16} /> Back to Payments
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 style={{ fontSize: '1.75rem', color: 'var(--primary-navy)' }}>
              Transaction #{payment.payment_number}
            </h1>
            <span className="badge badge-active">RECORDED</span>
          </div>
        </div>

        <button
          onClick={handleRetry}
          disabled={retrying}
          className="btn btn-outline btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <RotateCcw size={14} className={retrying ? 'spinner' : ''} />
          {retrying ? 'Processing...' : 'Help Customer Retry'}
        </button>
      </div>

      <div className="content-card" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
          <ShieldCheck size={20} color="#28A745" />
          <h3 style={{ fontSize: '1.1rem', color: 'var(--primary-navy)', margin: 0 }}>
            Transaction Audit & Settlement
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          <div>
            <small style={{ color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600 }}>Amount Settled</small>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#28A745', marginTop: '0.2rem' }}>
              ₹{payment.amount}
            </div>
          </div>

          <div>
            <small style={{ color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600 }}>Settlement Date</small>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '0.35rem' }}>
              {payment.payment_date || new Date(payment.created_at).toLocaleDateString()}
            </div>
          </div>

          <div>
            <small style={{ color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600 }}>Payment Method</small>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '0.35rem' }}>
              {payment.payment_method || 'Razorpay / Supabase PG'}
            </div>
          </div>

          <div>
            <small style={{ color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600 }}>Gateway Reference</small>
            <div style={{ fontSize: '0.95rem', fontFamily: 'monospace', marginTop: '0.35rem' }}>
              {payment.transaction_reference || 'REF-NIL'}
            </div>
          </div>
        </div>
      </div>

      {/* Linked Relationship Information */}
      <div className="content-card" style={{ padding: '1.75rem' }}>
        <h3 style={{ fontSize: '1.1rem', color: 'var(--primary-navy)', marginBottom: '1rem' }}>
          Associated Entities
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
          <div>
            <small style={{ color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600 }}>Customer Account</small>
            <div style={{ fontWeight: 700, fontSize: '1rem', marginTop: '0.2rem' }}>{payment.customers?.name || 'Customer'}</div>
            <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>{payment.customers?.email}</div>
            {payment.customer_id && (
              <Link to={`/staff/customers/${payment.customer_id}`} style={{ fontSize: '0.8rem', fontWeight: 600, display: 'inline-block', marginTop: '0.3rem' }}>
                Open Customer Profile &rarr;
              </Link>
            )}
          </div>

          <div>
            <small style={{ color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600 }}>Related Invoice</small>
            <div style={{ fontWeight: 700, fontSize: '1rem', marginTop: '0.2rem' }}>
              Invoice #{payment.invoices?.invoice_number || '—'}
            </div>
            {payment.invoice_id && (
              <Link to={`/staff/invoices/${payment.invoice_id}`} style={{ fontSize: '0.8rem', fontWeight: 600, display: 'inline-block', marginTop: '0.3rem' }}>
                Open Invoice Statement &rarr;
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetail;

