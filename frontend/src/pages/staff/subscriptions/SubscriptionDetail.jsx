import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  Play,
  Pause,
  RefreshCw,
  XCircle,
  Lock,
  Calendar,
  Clock,
  Building,
  Mail,
  Repeat,
  History,
  FileSpreadsheet,
  AlertTriangle,
  FileText
} from 'lucide-react';
import {
  getSubscription,
  confirmSubscription,
  activateSubscription,
  pauseSubscription,
  resumeSubscription,
  renewSubscription,
  cancelSubscription,
  closeSubscription,
  getSubscriptionHistory
} from '../../../services/api';
import { useToast } from '../../../components/common/Toast';
import Button from '../../../components/common/Button';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

export const SubscriptionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [subscription, setSubscription] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchSubscriptionData = useCallback(async () => {
    setLoading(true);
    try {
      const [subRes, histRes] = await Promise.all([
        getSubscription(id),
        getSubscriptionHistory(id).catch(() => ({ data: [] }))
      ]);

      if (subRes.data) {
        setSubscription(subRes.data);
      }
      setHistory(histRes.data || []);
    } catch (err) {
      console.error('Error fetching subscription:', err);
      addToast(err.message || 'Subscription not found', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, addToast]);

  useEffect(() => {
    fetchSubscriptionData();
  }, [fetchSubscriptionData]);

  // Operational Action Handlers
  const handleConfirm = async () => {
    setActionLoading(true);
    try {
      await confirmSubscription(subscription.id);
      addToast('Subscription confirmed successfully!', 'success');
      fetchSubscriptionData();
    } catch (err) {
      addToast(err.message || 'Confirmation failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivate = async () => {
    setActionLoading(true);
    try {
      await activateSubscription(subscription.id);
      addToast('Subscription activated successfully!', 'success');
      fetchSubscriptionData();
    } catch (err) {
      addToast(err.message || 'Activation failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePause = async () => {
    const reason = window.prompt('Please enter the reason for pausing this subscription:');
    if (reason === null) return;

    setActionLoading(true);
    try {
      await pauseSubscription(subscription.id, reason);
      addToast('Subscription paused.', 'info');
      fetchSubscriptionData();
    } catch (err) {
      addToast(err.message || 'Failed to pause subscription', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResume = async () => {
    setActionLoading(true);
    try {
      await resumeSubscription(subscription.id);
      addToast('Subscription resumed to ACTIVE.', 'success');
      fetchSubscriptionData();
    } catch (err) {
      addToast(err.message || 'Failed to resume subscription', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRenew = async () => {
    if (!window.confirm('Renew subscription? This will advance the contract end date by the billing frequency period.')) return;

    setActionLoading(true);
    try {
      await renewSubscription(subscription.id);
      addToast('Subscription renewed successfully!', 'success');
      fetchSubscriptionData();
    } catch (err) {
      addToast(err.message || 'Renewal failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    const reason = window.prompt('Enter cancellation reason (mandatory):');
    if (reason === null) return;
    if (!reason.trim()) {
      addToast('Cancellation reason is required.', 'error');
      return;
    }

    setActionLoading(true);
    try {
      await cancelSubscription(subscription.id, reason);
      addToast('Subscription cancelled.', 'info');
      fetchSubscriptionData();
    } catch (err) {
      addToast(err.message || 'Cancellation failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClose = async () => {
    if (!window.confirm('Are you sure you want to permanently CLOSE this subscription? This action cannot be reversed.')) return;

    setActionLoading(true);
    try {
      await closeSubscription(subscription.id);
      addToast('Subscription closed.', 'info');
      fetchSubscriptionData();
    } catch (err) {
      addToast(err.message || 'Closure failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <LoadingSpinner size="large" color="dark" />
        <p style={{ marginTop: '1rem' }}>Loading subscription details...</p>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="content-card" style={{ textAlign: 'center', padding: '3rem' }}>
        <h3>Subscription Not Found</h3>
        <p style={{ margin: '1rem 0' }}>The requested subscription record does not exist.</p>
        <Button variant="primary" icon={ArrowLeft} onClick={() => navigate('/staff/subscriptions')}>
          Back to Subscriptions
        </Button>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="badge badge-active"><CheckCircle size={10} /> Active</span>;
      case 'PAUSED':
        return <span className="badge" style={{ backgroundColor: '#FEF3C7', color: '#B45309' }}><Pause size={10} /> Paused</span>;
      case 'CONFIRMED':
        return <span className="badge" style={{ backgroundColor: '#E0F2FE', color: '#0369A1' }}><CheckCircle size={10} /> Confirmed</span>;
      case 'DRAFT':
        return <span className="badge badge-staff"><Clock size={10} /> Draft</span>;
      case 'CLOSED':
        return <span className="badge badge-inactive"><Lock size={10} /> Closed</span>;
      case 'CANCELLED':
        return <span className="badge" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}><XCircle size={10} /> Cancelled</span>;
      default:
        return <span className="badge badge-staff">{status}</span>;
    }
  };

  return (
    <div>
      {/* Top Header Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => navigate('/staff/subscriptions')}
            className="btn btn-ghost btn-sm"
            style={{ padding: '0.4rem' }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2>{subscription.subscription_number}</h2>
              {getStatusBadge(subscription.status)}
            </div>
            <p style={{ fontSize: '0.875rem' }}>
              Plan: <strong>{subscription.plan_name_snapshot}</strong> &bull; Frequency:{' '}
              <span style={{ textTransform: 'capitalize' }}>{subscription.billing_frequency}</span>
            </p>
          </div>
        </div>

        {/* Dynamic Action Buttons Gated by State Machine (VULN-003) */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {subscription.status === 'DRAFT' && (
            <Button
              variant="primary"
              icon={CheckCircle}
              loading={actionLoading}
              onClick={handleConfirm}
            >
              Confirm Subscription
            </Button>
          )}

          {subscription.status === 'CONFIRMED' && (
            <Button
              variant="primary"
              icon={Play}
              loading={actionLoading}
              onClick={handleActivate}
            >
              Activate Contract
            </Button>
          )}

          {subscription.status === 'ACTIVE' && (
            <>
              <Button
                variant="outline"
                icon={Pause}
                loading={actionLoading}
                onClick={handlePause}
              >
                Pause
              </Button>
              <Button
                variant="outline"
                icon={RefreshCw}
                loading={actionLoading}
                onClick={handleRenew}
              >
                Renew Contract
              </Button>
              <Button
                variant="outline"
                icon={XCircle}
                style={{ color: '#DC2626' }}
                loading={actionLoading}
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button
                variant="ghost"
                icon={Lock}
                loading={actionLoading}
                onClick={handleClose}
              >
                Close
              </Button>
            </>
          )}

          {subscription.status === 'PAUSED' && (
            <>
              <Button
                variant="primary"
                icon={Play}
                loading={actionLoading}
                onClick={handleResume}
              >
                Resume
              </Button>
              <Button
                variant="outline"
                icon={XCircle}
                style={{ color: '#DC2626' }}
                loading={actionLoading}
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button
                variant="ghost"
                icon={Lock}
                loading={actionLoading}
                onClick={handleClose}
              >
                Close
              </Button>
            </>
          )}

          {['CLOSED', 'CANCELLED'].includes(subscription.status) && (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg-card-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <Lock size={14} /> Contract is permanently finalized. No further transitions permitted.
            </div>
          )}
        </div>
      </div>

      {/* Main Details Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        {/* Customer Information */}
        <div className="content-card" style={{ marginBottom: 0 }}>
          <div className="card-title-row">
            <h4>Customer Profile</h4>
            <Link to={`/staff/customers/${subscription.customer_id}`} className="btn btn-ghost btn-sm">
              View Profile
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary-navy)' }}>
              {subscription.customers?.name}
            </div>
            {subscription.customers?.company_name && (
              <div style={{ color: 'var(--text-secondary)' }}>{subscription.customers.company_name}</div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
              <Mail size={13} /> {subscription.customers?.email}
            </div>
          </div>
        </div>

        {/* Contract Schedule */}
        <div className="content-card" style={{ marginBottom: 0 }}>
          <div className="card-title-row">
            <h4>Contract Terms</h4>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Start Date:</span>
              <strong>{subscription.start_date}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>End Date:</span>
              <strong>{subscription.end_date || 'Continuous / No End Date'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Auto Renewal:</span>
              <strong>{subscription.auto_renew ? 'Enabled' : 'Disabled'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Payment Terms:</span>
              <span>{subscription.payment_terms || 'Due on receipt'}</span>
            </div>
            {subscription.source_quotation_id && (
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Source Quotation:</span>
                <Link to={`/staff/quotations/${subscription.source_quotation_id}`} style={{ fontWeight: 600 }}>
                  View Quotation &rarr;
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="content-card" style={{ marginBottom: '1.5rem', padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-light)' }}>
          <h4>Contract Line Items</h4>
        </div>

        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product Snapshot</th>
                <th style={{ textAlign: 'center' }}>Qty</th>
                <th style={{ textAlign: 'right' }}>Unit Price</th>
                <th style={{ textAlign: 'right' }}>Tax %</th>
                <th style={{ textAlign: 'right' }}>Tax Amount</th>
                <th style={{ textAlign: 'right' }}>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {(subscription.lines || []).map((line) => (
                <tr key={line.id}>
                  <td>
                    <strong>{line.product_name_snapshot}</strong>
                  </td>
                  <td style={{ textAlign: 'center' }}>{line.quantity}</td>
                  <td style={{ textAlign: 'right' }}>${parseFloat(line.unit_price || 0).toFixed(2)}</td>
                  <td style={{ textAlign: 'right' }}>{parseFloat(line.tax_percentage_snapshot || 0)}%</td>
                  <td style={{ textAlign: 'right' }}>${parseFloat(line.tax_amount || 0).toFixed(2)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>
                    ${parseFloat(line.final_amount || 0).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total Summary */}
        <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end', backgroundColor: 'var(--bg-card-subtle)' }}>
          <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Subtotal:</span>
              <strong>${parseFloat(subscription.subtotal || 0).toFixed(2)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Taxes:</span>
              <strong>${parseFloat(subscription.tax_amount || 0).toFixed(2)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid var(--border-light)', paddingTop: '0.5rem', fontSize: '1.1rem', color: 'var(--primary-navy)' }}>
              <strong>Grand Total:</strong>
              <strong>${parseFloat(subscription.grand_total || 0).toFixed(2)}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Lifecycle History Audit Timeline (VULN-010) */}
      <div className="content-card">
        <div className="card-title-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <History size={18} style={{ color: 'var(--primary-navy)' }} />
            <h4>Lifecycle History Audit Log</h4>
          </div>
        </div>

        {history.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            No lifecycle events recorded yet.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '2px solid var(--border-light)', paddingLeft: '1.25rem', marginLeft: '0.5rem' }}>
            {history.map((h) => (
              <div key={h.id} style={{ position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: '-1.65rem',
                    top: '0.2rem',
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary-navy)',
                    border: '2px solid #FFFFFF'
                  }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                  <span className="badge badge-staff" style={{ fontSize: '0.7rem' }}>
                    {h.operation}
                  </span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-navy)' }}>
                    {h.previous_status || 'INIT'} &rarr; {h.new_status}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                    {new Date(h.timestamp).toLocaleString()}
                  </span>
                </div>
                {h.remarks && (
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {h.remarks}
                  </p>
                )}
                {h.profiles?.full_name && (
                  <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '0.2rem' }}>
                    Performed by: {h.profiles.full_name}
                  </small>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionDetail;

