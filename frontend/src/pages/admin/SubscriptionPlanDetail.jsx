import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  CalendarRange,
  ArrowLeft,
  Edit2,
  Power,
  RotateCcw,
  Package,
  Clock,
  IndianRupee,
  Layers,
  Calendar,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Copy,
  Check,
  X,
  ExternalLink,
  Hash
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const API_BASE_URL = 'http://localhost:5000/api';

export const SubscriptionPlanDetail = () => {
  const { id } = useParams();
  const { session, role } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Plan state
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState(false);

  // Status toggle confirmation modal
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusActionLoading, setStatusActionLoading] = useState(false);

  const isAdmin = role === 'ADMIN';

  // Fetch plan details from backend
  const fetchPlan = useCallback(async () => {
    if (!id || !session?.access_token) return;

    try {
      setLoading(true);
      setError('');

      const res = await fetch(`${API_BASE_URL}/subscription-plans/${id}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to retrieve subscription plan details.');
      }

      setPlan(data.plan);
    } catch (err) {
      console.error('Error fetching subscription plan:', err);
      setError(err.message || 'Failed to load subscription plan.');
    } finally {
      setLoading(false);
    }
  }, [id, session?.access_token]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  // Handle plan status activation/deactivation
  const handleToggleStatus = async () => {
    if (!plan || !session?.access_token) return;

    try {
      setStatusActionLoading(true);
      const newStatus = !plan.is_active;

      const res = await fetch(`${API_BASE_URL}/subscription-plans/${plan.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ is_active: newStatus })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to update plan status.');
      }

      addToast(
        data.message || `Plan "${plan.name}" was ${newStatus ? 'activated' : 'deactivated'} successfully.`,
        'success'
      );

      setShowStatusModal(false);
      fetchPlan();
    } catch (err) {
      console.error('Error updating plan status:', err);
      addToast(err.message || 'Failed to update plan status.', 'error');
    } finally {
      setStatusActionLoading(false);
    }
  };

  // Copy ID to clipboard
  const handleCopyId = () => {
    if (!plan?.id) return;
    navigator.clipboard.writeText(plan.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Indian Rupee currency formatter
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null || isNaN(Number(amount))) return '₹0.00';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(Number(amount));
  };

  // Date formatter
  const formatDate = (isoString) => {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        <LoadingSpinner size="medium" message="Loading subscription plan..." />
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '1.25rem' }}>
          <Link
            to="/admin/subscription-plans"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: 'var(--text-secondary)',
              fontSize: '0.9rem',
              fontWeight: 500,
              textDecoration: 'none'
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to Plans Listing</span>
          </Link>
        </div>

        <Alert
          type="error"
          message={error || 'Subscription plan not found.'}
        />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      {/* Navigation Breadcrumb */}
      <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link
          to="/admin/subscription-plans"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--text-secondary)',
            fontSize: '0.9rem',
            fontWeight: 500,
            textDecoration: 'none'
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Plans Listing</span>
        </Link>

        {plan.product && (
          <Link
            to={`/admin/products/${plan.product.id}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: 'var(--primary-navy)',
              fontSize: '0.85rem',
              fontWeight: 600,
              textDecoration: 'none'
            }}
          >
            <Package size={15} />
            <span>View Parent Product</span>
          </Link>
        )}
      </div>

      {/* Top Header */}
      <div
        className="section-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0 }}>
              <CalendarRange size={26} color="var(--primary-navy)" />
              {plan.name}
            </h1>
            <span className={`badge ${plan.is_active ? 'badge-active' : 'badge-inactive'}`}>
              {plan.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>

          <p style={{ marginTop: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Billed every <strong>{plan.billing_interval}</strong> · Linked to{' '}
            <strong>{plan.product?.name || 'Product'}</strong>
          </p>
        </div>

        {isAdmin && (
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Link to={`/admin/subscription-plans/${plan.id}/edit`}>
              <Button variant="outline" size="small" icon={Edit2}>
                Edit Plan
              </Button>
            </Link>

            <Button
              variant={plan.is_active ? 'danger' : 'primary'}
              size="small"
              icon={plan.is_active ? Power : RotateCcw}
              onClick={() => setShowStatusModal(true)}
            >
              {plan.is_active ? 'Deactivate' : 'Activate'}
            </Button>
          </div>
        )}
      </div>

      {/* Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.25rem',
          marginBottom: '1.75rem'
        }}
      >
        {/* Recurring Price */}
        <div
          className="metric-card"
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-sm)',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Recurring Price
            </span>
            <IndianRupee size={18} color="var(--primary-navy)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary-navy)' }}>
            {formatCurrency(plan.price)}
          </div>
          <small style={{ color: 'var(--text-secondary)' }}>per {plan.billing_interval} cycle</small>
        </div>

        {/* Billing Interval */}
        <div
          className="metric-card"
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-sm)',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Billing Interval
            </span>
            <Clock size={18} color="var(--text-muted)" />
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
            {plan.billing_interval}
          </div>
          <small style={{ color: 'var(--text-secondary)' }}>Automated invoice cycle</small>
        </div>

        {/* Minimum Quantity */}
        <div
          className="metric-card"
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-sm)',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Min Quantity
            </span>
            <Hash size={18} color="var(--text-muted)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {plan.min_quantity}
          </div>
          <small style={{ color: 'var(--text-secondary)' }}>Required minimum units</small>
        </div>

        {/* Parent Product Base */}
        <div
          className="metric-card"
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-sm)',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Parent Base Price
            </span>
            <Package size={18} color="var(--text-muted)" />
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {plan.product ? formatCurrency(plan.product.sales_price) : '—'}
          </div>
          <small style={{ color: 'var(--text-secondary)' }}>Catalog sales price</small>
        </div>
      </div>

      {/* Main Details Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Left Column: Lifecycle Policies */}
        <div
          className="form-card"
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-light)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <h3 style={{ fontSize: '1.15rem', color: 'var(--primary-navy)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={20} />
            Subscription Lifecycle Policies
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Auto-Close Policy */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-light)' }}>
              <div>
                <strong>Auto-Close on Term Completion</strong>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Automatically closes subscription when scheduled end date is reached.
                </div>
              </div>
              <span className={`badge ${plan.auto_close ? 'badge-active' : 'badge-inactive'}`}>
                {plan.auto_close ? 'Enabled' : 'Disabled'}
              </span>
            </div>

            {/* Early Close Policy */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-light)' }}>
              <div>
                <strong>Allow Early Closure</strong>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Allows subscribers or staff to close subscription prior to term conclusion.
                </div>
              </div>
              <span className={`badge ${plan.allow_early_close ? 'badge-active' : 'badge-inactive'}`}>
                {plan.allow_early_close ? 'Allowed' : 'Prohibited'}
              </span>
            </div>

            {/* Pause Policy */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-light)' }}>
              <div>
                <strong>Allow Subscription Pause</strong>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Allows customers to pause recurring billing cycles temporarily.
                </div>
              </div>
              <span className={`badge ${plan.allow_pause ? 'badge-active' : 'badge-inactive'}`}>
                {plan.allow_pause ? 'Allowed' : 'Prohibited'}
              </span>
            </div>

            {/* Renewal Policy */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>Allow Renewal</strong>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Enables continuous subscription rollover or manual renewal extensions.
                </div>
              </div>
              <span className={`badge ${plan.allow_renewal ? 'badge-active' : 'badge-inactive'}`}>
                {plan.allow_renewal ? 'Allowed' : 'Prohibited'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Validity & Parent Product Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Validity Dates */}
          <div
            className="form-card"
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <h3 style={{ fontSize: '1.1rem', color: 'var(--primary-navy)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={18} />
              Term & Validity Dates
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Start Date: </span>
                <strong>{plan.start_date ? formatDate(plan.start_date) : 'Continuous (Immediate)'}</strong>
              </div>

              <div>
                <span style={{ color: 'var(--text-secondary)' }}>End Date: </span>
                <strong>{plan.end_date ? formatDate(plan.end_date) : 'Indefinite (No End Date)'}</strong>
              </div>
            </div>
          </div>

          {/* Linked Product Card */}
          {plan.product && (
            <div
              className="form-card"
              style={{
                backgroundColor: 'var(--bg-sand)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
                padding: '1.25rem',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  Parent Offering
                </span>
                <Link
                  to={`/admin/products/${plan.product.id}`}
                  style={{ color: 'var(--primary-navy)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.8rem', fontWeight: 600 }}
                >
                  Details <ExternalLink size={13} />
                </Link>
              </div>

              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--primary-navy)', marginBottom: '0.25rem' }}>
                {plan.product.name}
              </div>

              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Type: <strong style={{ textTransform: 'capitalize' }}>{plan.product.type}</strong> · Base:{' '}
                <strong>{formatCurrency(plan.product.sales_price)}</strong>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* System Metadata Footer */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-sm)',
          padding: '1rem 1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.825rem',
          color: 'var(--text-secondary)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>System UUID:</span>
          <code style={{ color: 'var(--primary-navy)', fontWeight: 600 }}>{plan.id}</code>
          <button
            type="button"
            onClick={handleCopyId}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: copiedId ? '#166534' : 'var(--text-muted)',
              display: 'inline-flex',
              alignItems: 'center'
            }}
            title="Copy Plan UUID"
          >
            {copiedId ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>

        <div>
          Registered: <strong>{formatDateTime(plan.created_at)}</strong>
          {plan.updated_at && (
            <span> · Last Updated: <strong>{formatDateTime(plan.updated_at)}</strong></span>
          )}
        </div>
      </div>

      {/* Status Confirmation Modal */}
      {showStatusModal && (
        <div className="modal-backdrop">
          <div className="modal-container" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle
                  size={20}
                  color={plan.is_active ? 'var(--status-inactive-text)' : 'var(--status-active-text)'}
                />
                <h3 className="modal-title">
                  {plan.is_active ? 'Deactivate Subscription Plan?' : 'Reactivate Subscription Plan?'}
                </h3>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowStatusModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <p style={{ margin: '0 0 1rem' }}>
                Are you sure you want to {plan.is_active ? 'deactivate' : 'reactivate'} the plan{' '}
                <strong>&quot;{plan.name}&quot;</strong>?
              </p>

              {plan.is_active ? (
                <div
                  style={{
                    backgroundColor: 'var(--bg-sand)',
                    padding: '0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-light)'
                  }}
                >
                  <strong>Note:</strong> Deactivating prevents new quotations or subscriptions from selecting this plan. Existing subscriptions will continue running without interruption.
                </div>
              ) : (
                <div
                  style={{
                    backgroundColor: 'var(--bg-sand)',
                    padding: '0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-light)'
                  }}
                >
                  <strong>Note:</strong> Reactivating will immediately restore this plan for new customer subscriptions.
                </div>
              )}
            </div>

            <div className="modal-footer">
              <Button
                variant="outline"
                type="button"
                onClick={() => setShowStatusModal(false)}
                disabled={statusActionLoading}
              >
                Cancel
              </Button>
              <Button
                variant={plan.is_active ? 'danger' : 'primary'}
                type="button"
                loading={statusActionLoading}
                onClick={handleToggleStatus}
              >
                {plan.is_active ? 'Deactivate Plan' : 'Reactivate Plan'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionPlanDetail;

