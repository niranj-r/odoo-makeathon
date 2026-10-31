import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Layers,
  ArrowLeft,
  Clock,
  Calendar,
  AlertTriangle,
  History,
  XCircle,
  RefreshCw,
  Edit3
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export const SubscriptionDetail = () => {
  const { id } = useParams();
  const { session } = useAuth();
  const { addToast } = useToast();

  const [subscription, setSubscription] = useState(null);
  const [lines, setLines] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [planChangeModalOpen, setPlanChangeModalOpen] = useState(false);
  const [planReason, setPlanReason] = useState('');
  const [newPlanId, setNewPlanId] = useState('');
  const [plans, setPlans] = useState([]);
  const [submittingAction, setSubmittingAction] = useState(false);

  const fetchSubscription = async () => {
    if (!session?.access_token || !id) return;
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/api/staff/subscriptions/${id}`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSubscription(data.subscription);
        setLines(data.lines || []);
        setHistory(data.history || []);
      }
    } catch (err) {
      console.warn('Subscription detail fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [id, session?.access_token]);

  const handleCancelRequest = async (e) => {
    e.preventDefault();
    try {
      setSubmittingAction(true);
      const res = await fetch(`http://localhost:5000/api/staff/subscriptions/${id}/cancel-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ reason: cancelReason })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Cancellation failed.');

      addToast('Subscription cancellation recorded.', 'success');
      setCancelModalOpen(false);
      fetchSubscription();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handlePlanChangeRequest = async (e) => {
    e.preventDefault();
    try {
      setSubmittingAction(true);
      const res = await fetch(`http://localhost:5000/api/staff/subscriptions/${id}/change-plan-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          new_plan_id: newPlanId,
          reason: planReason
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Plan change request failed.');

      addToast('Plan change request logged for administrator execution.', 'success');
      setPlanChangeModalOpen(false);
      fetchSubscription();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSubmittingAction(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '4rem 0', textAlign: 'center' }}>
        <LoadingSpinner message="Loading subscription contract details..." />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div style={{ padding: '2rem' }}>
        <Link to="/staff/subscriptions" className="btn btn-secondary btn-sm">
          <ArrowLeft size={16} /> Back to Subscriptions
        </Link>
        <div className="alert alert-danger" style={{ marginTop: '1rem' }}>
          Subscription record could not be found.
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '3rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/staff/subscriptions" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
          <ArrowLeft size={16} /> Back to Subscriptions List
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 style={{ fontSize: '1.75rem', color: 'var(--primary-navy)' }}>
                Subscription #{subscription.subscription_number}
              </h1>
              <span className={`badge badge-${subscription.status?.toLowerCase()}`}>
                {subscription.status}
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)' }}>
              Client: <strong>{subscription.customers?.name || 'Customer'}</strong> ({subscription.customers?.email})
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {subscription.status === 'ACTIVE' && (
              <>
                <button
                  onClick={() => setPlanChangeModalOpen(true)}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Edit3 size={14} /> Request Plan Change
                </button>
                <button
                  onClick={() => setCancelModalOpen(true)}
                  className="btn btn-danger btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <XCircle size={14} /> Request Cancellation
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Cadence & Commercial Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="content-card" style={{ padding: '1.25rem' }}>
          <small style={{ color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600 }}>Billing Frequency</small>
          <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--primary-navy)', textTransform: 'capitalize', marginTop: '0.2rem' }}>
            {subscription.billing_frequency}
          </div>
        </div>
        <div className="content-card" style={{ padding: '1.25rem' }}>
          <small style={{ color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600 }}>Start Date</small>
          <div style={{ fontWeight: 700, fontSize: '1.05rem', marginTop: '0.2rem' }}>
            {subscription.start_date || '—'}
          </div>
        </div>
        <div className="content-card" style={{ padding: '1.25rem' }}>
          <small style={{ color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600 }}>Next Billing Date</small>
          <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#2B6CB0', marginTop: '0.2rem' }}>
            {subscription.next_billing_date || '—'}
          </div>
        </div>
        <div className="content-card" style={{ padding: '1.25rem' }}>
          <small style={{ color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600 }}>Auto-Renewal</small>
          <div style={{ fontWeight: 700, fontSize: '1.05rem', color: subscription.auto_renew ? '#28A745' : '#E53E3E', marginTop: '0.2rem' }}>
            {subscription.auto_renew ? 'Enabled' : 'Disabled'}
          </div>
        </div>
      </div>

      {/* Subscription Line Items */}
      <div className="content-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', color: 'var(--primary-navy)', marginBottom: '1rem' }}>Contracted Plan & Services</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Service / Plan Description</th>
              <th style={{ textAlign: 'center' }}>Qty</th>
              <th style={{ textAlign: 'right' }}>Unit Price</th>
              <th style={{ textAlign: 'right' }}>Line Total</th>
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                  No standalone line items breakdown on record.
                </td>
              </tr>
            ) : (
              lines.map(l => (
                <tr key={l.id}>
                  <td><strong>{l.description || l.products?.name || l.subscription_plans?.name || 'Recurring Service'}</strong></td>
                  <td style={{ textAlign: 'center' }}>{l.quantity}</td>
                  <td style={{ textAlign: 'right' }}>₹{l.unit_price}</td>
                  <td style={{ textAlign: 'right' }}><strong>₹{l.line_total}</strong></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Subscription Lifecycle History */}
      <div className="content-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <History size={18} color="var(--primary-navy)" />
          <h3 style={{ fontSize: '1rem', color: 'var(--primary-navy)', margin: 0 }}>Lifecycle & Audit History</h3>
        </div>

        {history.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem 0' }}>
            No status change events logged.
          </p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Operation</th>
                <th>Previous Status</th>
                <th>New Status</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {history.map(h => (
                <tr key={h.id}>
                  <td style={{ fontSize: '0.8rem' }}>{new Date(h.created_at).toLocaleString()}</td>
                  <td><strong>{h.operation}</strong></td>
                  <td>{h.previous_status}</td>
                  <td><span className="badge badge-staff">{h.new_status}</span></td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{h.remarks || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Cancellation Modal */}
      {cancelModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3 style={{ color: '#E53E3E', marginBottom: '0.5rem' }}>Request Subscription Cancellation</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Record the verified cancellation reason before halting renewals for {subscription.subscription_number}.
            </p>
            <form onSubmit={handleCancelRequest}>
              <textarea
                rows={3}
                className="form-input"
                placeholder="Reason for cancellation (e.g. customer moved to external vendor, budget limits)..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                required
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="button" onClick={() => setCancelModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={submittingAction} className="btn btn-danger">
                  {submittingAction ? 'Processing...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Plan Change Modal */}
      {planChangeModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3 style={{ color: 'var(--primary-navy)', marginBottom: '0.5rem' }}>Request Plan Upgrade / Downgrade</h3>
            <form onSubmit={handlePlanChangeRequest}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                  Target Plan UUID or Code *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Enterprise Annual Plan"
                  value={newPlanId}
                  onChange={(e) => setNewPlanId(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                  Reason / Notes
                </label>
                <textarea
                  rows={2}
                  className="form-input"
                  placeholder="Customer request remarks..."
                  value={planReason}
                  onChange={(e) => setPlanReason(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setPlanChangeModalOpen(false)} className="btn btn-secondary">
                  Close
                </button>
                <button type="submit" disabled={submittingAction} className="btn btn-primary">
                  {submittingAction ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionDetail;

