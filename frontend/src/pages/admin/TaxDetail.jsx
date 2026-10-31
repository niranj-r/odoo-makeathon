import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  Percent,
  ArrowLeft,
  Edit2,
  Power,
  RotateCcw,
  IndianRupee,
  Clock,
  Calendar,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Copy,
  Check,
  X,
  Package,
  Calculator,
  Tag
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const API_BASE_URL = 'http://localhost:5000/api';

export const TaxDetail = () => {
  const { id } = useParams();
  const { session, role } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // State
  const [tax, setTax] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState(false);

  // Status toggle confirmation modal
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusActionLoading, setStatusActionLoading] = useState(false);

  // Live simulator state
  const [simBaseAmount, setSimBaseAmount] = useState('1000');

  const isAdmin = role === 'ADMIN';

  // Fetch tax details
  const fetchTax = useCallback(async () => {
    if (!id || !session?.access_token) return;

    try {
      setLoading(true);
      setError('');

      const res = await fetch(`${API_BASE_URL}/taxes/${id}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to retrieve tax details.');
      }

      setTax(data.tax);
    } catch (err) {
      console.error('Error fetching tax details:', err);
      setError(err.message || 'Failed to load tax details.');
    } finally {
      setLoading(false);
    }
  }, [id, session?.access_token]);

  useEffect(() => {
    fetchTax();
  }, [fetchTax]);

  // Handle status toggle (Activate / Deactivate)
  const handleToggleStatus = async () => {
    if (!tax || !session?.access_token) return;

    try {
      setStatusActionLoading(true);
      const newStatus = !tax.is_active;

      const res = await fetch(`${API_BASE_URL}/taxes/${tax.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ is_active: newStatus })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to update tax status.');
      }

      addToast(
        data.message || `Tax ${newStatus ? 'activated' : 'deactivated'} successfully.`,
        'success'
      );

      setShowStatusModal(false);
      fetchTax();
    } catch (err) {
      console.error('Error updating tax status:', err);
      addToast(err.message || 'Failed to update tax status.', 'error');
    } finally {
      setStatusActionLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '—';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <LoadingSpinner size="large" message="Loading tax details..." />
      </div>
    );
  }

  if (error || !tax) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '1.25rem' }}>
          <Link
            to="/admin/taxes"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}
          >
            <ArrowLeft size={16} />
            <span>Back to Taxes</span>
          </Link>
        </div>
        <Alert
          type="error"
          message={error || 'Tax record not found or inaccessible.'}
        />
      </div>
    );
  }

  const isPercentage = tax.computation_type === 'percentage';
  const numRate = Number(tax.rate_percentage) || 0;

  // Simulator calculation
  const parsedSimBase = parseFloat(simBaseAmount) || 0;
  const simTaxAmount = isPercentage
    ? Math.round(((parsedSimBase * numRate) / 100 + Number.EPSILON) * 100) / 100
    : numRate;
  const simTotalAmount = Math.round((parsedSimBase + simTaxAmount + Number.EPSILON) * 100) / 100;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Back Link */}
      <div style={{ marginBottom: '1.25rem' }}>
        <Link
          to="/admin/taxes"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--text-secondary)',
            fontSize: '0.9rem',
            fontWeight: 500
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Taxes Listing</span>
        </Link>
      </div>

      {/* Top Header Card */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-light)',
          padding: '1.5rem 2rem',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1.25rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '12px',
              backgroundColor: !tax.is_active ? 'var(--bg-sand)' : 'var(--primary-navy-soft)',
              color: !tax.is_active ? 'var(--text-muted)' : 'var(--primary-navy)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            {isPercentage ? <Percent size={26} /> : <IndianRupee size={26} />}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--primary-navy)', margin: 0 }}>
                {tax.name}
              </h1>
              <span className={`badge ${tax.is_active ? 'badge-active' : 'badge-inactive'}`}>
                {tax.is_active ? 'Active' : 'Inactive'}
              </span>
              <span
                className="badge"
                style={{
                  backgroundColor: isPercentage ? '#EFF6FF' : '#F0FDF4',
                  color: isPercentage ? '#1D4ED8' : '#15803D',
                  border: isPercentage ? '1px solid #BFDBFE' : '1px solid #BBF7D0',
                  fontWeight: 600,
                  fontSize: '0.75rem'
                }}
              >
                {isPercentage ? 'Percentage Rate' : 'Fixed Monetary Amount'}
              </span>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0.35rem 0 0 0' }}>
              Fiscal tax definition applied across invoices, subscriptions, and quotations.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        {isAdmin && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link to={`/admin/taxes/${tax.id}/edit`}>
              <Button variant="primary" icon={Edit2}>
                Edit Tax
              </Button>
            </Link>

            <Button
              variant={tax.is_active ? 'outline' : 'success'}
              icon={tax.is_active ? Power : RotateCcw}
              onClick={() => setShowStatusModal(true)}
              style={
                tax.is_active
                  ? { color: '#DC2626', borderColor: '#FCA5A5' }
                  : { color: '#166534', borderColor: '#86EFAC' }
              }
            >
              {tax.is_active ? 'Deactivate Tax' : 'Reactivate Tax'}
            </Button>
          </div>
        )}
      </div>

      {/* Grid: Details & Simulation */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem',
          marginBottom: '1.5rem'
        }}
      >
        {/* Card 1: Tax Parameters */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-light)',
            padding: '1.5rem'
          }}
        >
          <h3
            style={{
              fontSize: '1.05rem',
              fontWeight: 600,
              color: 'var(--primary-navy)',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              borderBottom: '1px solid var(--border-light)',
              paddingBottom: '0.75rem'
            }}
          >
            <Tag size={18} />
            <span>Tax Specifications</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Computation Type */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Computation Type:
              </span>
              <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                {tax.computation_type}
              </strong>
            </div>

            {/* Rate / Amount */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                {isPercentage ? 'Tax Rate:' : 'Fixed Amount:'}
              </span>
              <span
                style={{
                  fontSize: '1.3rem',
                  fontWeight: 700,
                  color: isPercentage ? 'var(--primary-navy)' : '#166534'
                }}
              >
                {isPercentage ? `${numRate}%` : formatCurrency(numRate)}
              </span>
            </div>

            {/* Associated Products Count */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Associated Products:
              </span>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <Package size={15} style={{ color: 'var(--text-muted)' }} />
                <strong style={{ fontSize: '0.95rem', color: 'var(--primary-navy)' }}>
                  {tax.associated_product_count || 0} product{tax.associated_product_count === 1 ? '' : 's'}
                </strong>
              </div>
            </div>

            {/* Application Mode */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Application Standard:
              </span>
              <span
                className="badge"
                style={{
                  backgroundColor: 'var(--bg-sand)',
                  color: 'var(--primary-navy)',
                  fontWeight: 600,
                  fontSize: '0.75rem'
                }}
              >
                Exclusive (Subtotal + Tax)
              </span>
            </div>

            {/* Status */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Operational State:
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: tax.is_active ? '#166534' : '#991B1B'
                }}
              >
                {tax.is_active ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
                {tax.is_active ? 'Active for new orders' : 'Archived / Inactive'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Interactive Tax Calculator Simulator */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-light)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <h3
              style={{
                fontSize: '1.05rem',
                fontWeight: 600,
                color: 'var(--primary-navy)',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                borderBottom: '1px solid var(--border-light)',
                paddingBottom: '0.75rem'
              }}
            >
              <Calculator size={18} />
              <span>Live Calculation Preview</span>
            </h3>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Test how this tax is computed on any line item or invoice subtotal:
            </p>

            <div style={{ marginBottom: '1.25rem' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '0.35rem'
                }}
              >
                Base Amount (₹):
              </label>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    fontSize: '0.9rem',
                    fontWeight: 600
                  }}
                >
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={simBaseAmount}
                  onChange={(e) => setSimBaseAmount(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '1.75rem', fontWeight: 600 }}
                  placeholder="1000.00"
                />
              </div>
            </div>

            {/* Computation Breakdown Card */}
            <div
              style={{
                backgroundColor: 'var(--bg-sand)',
                borderRadius: 'var(--radius-sm)',
                padding: '1rem',
                border: '1px solid var(--border-light)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '0.5rem',
                  fontSize: '0.85rem'
                }}
              >
                <span style={{ color: 'var(--text-muted)' }}>Taxable Subtotal:</span>
                <span style={{ fontWeight: 600 }}>{formatCurrency(parsedSimBase)}</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '0.5rem',
                  fontSize: '0.85rem'
                }}
              >
                <span style={{ color: 'var(--text-muted)' }}>
                  {tax.name} ({isPercentage ? `${numRate}%` : 'Fixed'}):
                </span>
                <span style={{ fontWeight: 700, color: '#166534' }}>
                  +{formatCurrency(simTaxAmount)}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '0.5rem',
                  borderTop: '1px dashed var(--border-light)',
                  fontSize: '0.95rem'
                }}
              >
                <span style={{ fontWeight: 700, color: 'var(--primary-navy)' }}>Final Invoice Total:</span>
                <span style={{ fontWeight: 700, color: 'var(--primary-navy)' }}>
                  {formatCurrency(simTotalAmount)}
                </span>
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: '1rem',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <ShieldCheck size={14} style={{ color: '#166534', flexShrink: 0 }} />
            <span>Rounded to two decimal places using IEEE 754 epsilon precision standard.</span>
          </div>
        </div>
      </div>

      {/* Audit & System Metadata Card */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-light)',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>SYSTEM ID:</span>
          <code
            style={{
              fontSize: '0.8rem',
              backgroundColor: 'var(--bg-sand)',
              padding: '0.2rem 0.5rem',
              borderRadius: '4px',
              color: 'var(--primary-navy)'
            }}
          >
            {tax.id}
          </code>
          <button
            onClick={() => copyToClipboard(tax.id)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: copiedId ? '#166534' : 'var(--text-muted)',
              padding: '0.25rem'
            }}
            title="Copy ID to clipboard"
          >
            {copiedId ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <Calendar size={14} />
            <span>Created: {formatDate(tax.created_at)}</span>
          </div>

          {tax.updated_at && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <Clock size={14} />
              <span>Updated: {formatDate(tax.updated_at)}</span>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================================== */}
      {/* MODAL: DEACTIVATE / REACTIVATE CONFIRMATION */}
      {/* ============================================================================== */}
      {showStatusModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-md)',
              maxWidth: '480px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid var(--border-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle
                  size={20}
                  style={{ color: tax.is_active ? '#DC2626' : '#166534' }}
                />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary-navy)' }}>
                  {tax.is_active ? 'Deactivate Tax' : 'Reactivate Tax'}
                </h3>
              </div>
              <button
                onClick={() => setShowStatusModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  padding: '0.25rem'
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
                {tax.is_active ? (
                  <>
                    Are you sure you want to deactivate <strong>"{tax.name}"</strong>?
                    <br /><br />
                    Deactivating this tax will prevent it from being selected for new quotes or subscriptions.
                    Historical invoices and active subscriptions will remain unaffected.
                  </>
                ) : (
                  <>
                    Are you sure you want to reactivate <strong>"{tax.name}"</strong>?
                    <br /><br />
                    Once reactivated, it will become immediately available for quotes, products, and subscriptions.
                  </>
                )}
              </p>
            </div>

            <div
              style={{
                padding: '1rem 1.5rem',
                backgroundColor: 'var(--bg-sand)',
                borderTop: '1px solid var(--border-light)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem'
              }}
            >
              <Button
                variant="outline"
                onClick={() => setShowStatusModal(false)}
                disabled={statusActionLoading}
              >
                Cancel
              </Button>
              <Button
                variant={tax.is_active ? 'danger' : 'primary'}
                onClick={handleToggleStatus}
                loading={statusActionLoading}
              >
                {tax.is_active ? 'Deactivate' : 'Reactivate'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaxDetail;

