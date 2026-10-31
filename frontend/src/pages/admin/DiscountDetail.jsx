import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  Tag,
  ArrowLeft,
  Edit2,
  Power,
  RotateCcw,
  IndianRupee,
  Percent,
  Calendar,
  Layers,
  Package,
  Calculator,
  CheckCircle,
  AlertCircle,
  Clock,
  Copy,
  Check,
  X,
  ShieldCheck,
  TrendingDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const API_BASE_URL = 'http://localhost:5000/api';

export const DiscountDetail = () => {
  const { id } = useParams();
  const { session, role } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Discount state
  const [discount, setDiscount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState(false);

  // Status toggle confirmation modal
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusActionLoading, setStatusActionLoading] = useState(false);

  // Live tester state
  const [testAmount, setTestAmount] = useState('1000');
  const [testQuantity, setTestQuantity] = useState('1');

  const isAdmin = role === 'ADMIN';

  // Fetch discount details
  const fetchDiscount = useCallback(async () => {
    if (!id || !session?.access_token) return;

    try {
      setLoading(true);
      setError('');

      const res = await fetch(`${API_BASE_URL}/discounts/${id}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to retrieve discount details.');
      }

      setDiscount(data.discount);
    } catch (err) {
      console.error('Error fetching discount:', err);
      setError(err.message || 'Discount not found or service unavailable.');
    } finally {
      setLoading(false);
    }
  }, [id, session?.access_token]);

  useEffect(() => {
    fetchDiscount();
  }, [fetchDiscount]);

  // Handle status toggle (Activate / Deactivate)
  const handleToggleStatus = async () => {
    if (!discount || !session?.access_token) return;

    try {
      setStatusActionLoading(true);
      const newStatus = !discount.is_active;

      const res = await fetch(`${API_BASE_URL}/discounts/${discount.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ is_active: newStatus })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to update discount status.');
      }

      addToast(
        data.message || `Discount "${discount.code}" ${newStatus ? 'activated' : 'deactivated'} successfully.`,
        'success'
      );

      setShowStatusModal(false);
      fetchDiscount();
    } catch (err) {
      console.error('Error toggling status:', err);
      addToast(err.message || 'Failed to update status.', 'error');
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
        <LoadingSpinner size="large" message="Loading discount specifications..." />
      </div>
    );
  }

  if (error || !discount) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '1.25rem' }}>
          <Link
            to="/admin/discounts"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}
          >
            <ArrowLeft size={16} />
            <span>Back to Discounts</span>
          </Link>
        </div>
        <Alert type="error" message={error || 'Discount record not found.'} />
      </div>
    );
  }

  const isPct = discount.type === 'percentage';
  const numVal = parseFloat(discount.value) || 0;
  const isExhausted = discount.max_usage !== null && discount.current_usage >= discount.max_usage;

  // Simulator calculation
  const parsedAmt = parseFloat(testAmount) || 0;
  const parsedQty = parseInt(testQuantity, 10) || 1;
  const meetsMinAmt = parsedAmt >= (discount.min_amount || 0);
  const meetsMinQty = parsedQty >= (discount.min_quantity || 1);
  const isSimulationEligible = meetsMinAmt && meetsMinQty;

  const simDiscountAmt = isSimulationEligible
    ? isPct
      ? Math.round(((parsedAmt * numVal) / 100 + Number.EPSILON) * 100) / 100
      : Math.min(parsedAmt, numVal)
    : 0;
  const simFinalAmt = Math.round((Math.max(0, parsedAmt - simDiscountAmt) + Number.EPSILON) * 100) / 100;

  // Usage percentage
  const usagePercentage = discount.max_usage
    ? Math.min(100, Math.round((discount.current_usage / discount.max_usage) * 100))
    : 0;

  return (
    <div style={{ maxWidth: '1050px', margin: '0 auto' }}>
      {/* Back Link */}
      <div style={{ marginBottom: '1.25rem' }}>
        <Link
          to="/admin/discounts"
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
          <span>Back to Discounts Listing</span>
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
              width: '54px',
              height: '54px',
              borderRadius: '12px',
              backgroundColor: !discount.is_active ? 'var(--bg-sand)' : 'var(--primary-navy-soft)',
              color: !discount.is_active ? 'var(--text-muted)' : 'var(--primary-navy)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Tag size={26} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h1
                style={{
                  fontSize: '1.65rem',
                  fontWeight: 700,
                  color: 'var(--primary-navy)',
                  margin: 0,
                  fontFamily: 'monospace',
                  letterSpacing: '0.5px'
                }}
              >
                {discount.code}
              </h1>
              <span className={`badge ${discount.is_active ? 'badge-active' : 'badge-inactive'}`}>
                {discount.is_active ? 'Active' : 'Inactive'}
              </span>
              <span
                className="badge"
                style={{
                  backgroundColor: isPct ? '#EFF6FF' : '#F0FDF4',
                  color: isPct ? '#1D4ED8' : '#15803D',
                  border: isPct ? '1px solid #BFDBFE' : '1px solid #BBF7D0',
                  fontWeight: 700,
                  fontSize: '0.85rem'
                }}
              >
                {discount.display_value} Off
              </span>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '0.35rem 0 0 0' }}>
              Promotional discount rule configured for quotations, subscriptions, and billing checkouts.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        {isAdmin && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link to={`/admin/discounts/${discount.id}/edit`}>
              <Button variant="primary" icon={Edit2}>
                Edit Discount
              </Button>
            </Link>

            <Button
              variant={discount.is_active ? 'outline' : 'success'}
              icon={discount.is_active ? Power : RotateCcw}
              onClick={() => setShowStatusModal(true)}
              style={
                discount.is_active
                  ? { color: '#DC2626', borderColor: '#FCA5A5' }
                  : { color: '#166534', borderColor: '#86EFAC' }
              }
            >
              {discount.is_active ? 'Deactivate' : 'Reactivate'}
            </Button>
          </div>
        )}
      </div>

      {/* Grid: Specifications & Usage Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem',
          marginBottom: '1.5rem'
        }}
      >
        {/* Card 1: Discount Specifications */}
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
            <span>Discount Parameters</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Discount Type:
              </span>
              <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                {discount.type} ({isPct ? 'Percentage' : 'Fixed Monetary Amount'})
              </strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Deduction Value:
              </span>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-navy)' }}>
                {discount.display_value}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Applicability Scope:
              </span>
              <span
                className="badge"
                style={{
                  backgroundColor: 'var(--bg-sand)',
                  color: 'var(--primary-navy)',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  textTransform: 'capitalize'
                }}
              >
                {discount.applies_to}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Minimum Order Quantity:
              </span>
              <strong style={{ fontSize: '0.9rem' }}>
                {discount.min_quantity} unit{discount.min_quantity === 1 ? '' : 's'}
              </strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Minimum Transaction Amount:
              </span>
              <strong style={{ fontSize: '0.9rem' }}>
                {formatCurrency(discount.min_amount)}
              </strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Validity Window:
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                {discount.start_date || 'Active now'} $\rightarrow$ {discount.end_date || 'Never expires'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Usage & Redemptions Tracking */}
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
              <Clock size={18} />
              <span>Redemption & Usage Stats</span>
            </h3>

            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Redemptions Count:</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary-navy)' }}>
                  {discount.current_usage} {discount.max_usage !== null ? `/ ${discount.max_usage}` : 'uses'}
                </span>
              </div>

              {/* Visual Progress Bar if Max Usage defined */}
              {discount.max_usage !== null ? (
                <div>
                  <div
                    style={{
                      height: '8px',
                      backgroundColor: 'var(--bg-sand)',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      marginBottom: '0.35rem'
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${usagePercentage}%`,
                        backgroundColor: isExhausted ? '#DC2626' : 'var(--primary-navy)',
                        borderRadius: '4px'
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>{usagePercentage}% consumed</span>
                    <span>{Math.max(0, discount.max_usage - discount.current_usage)} remaining</span>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 600 }}>
                  ✓ Unlimited redemptions permitted
                </div>
              )}
            </div>

            {isExhausted && (
              <div
                style={{
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FCA5A5',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.825rem',
                  color: '#991B1B',
                  marginBottom: '1rem'
                }}
              >
                <strong>Usage Limit Exhausted:</strong> Customers attempting to use this code will be rejected at checkout.
              </div>
            )}
          </div>

          <div
            style={{
              padding: '0.75rem',
              backgroundColor: 'var(--bg-sand)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <ShieldCheck size={16} style={{ color: '#166534', flexShrink: 0 }} />
            <span>Usage increments atomically on confirmed order completion, preventing race conditions.</span>
          </div>
        </div>
      </div>

      {/* Target Associations (if applicable) */}
      {discount.associated_products?.length > 0 && (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-light)',
            padding: '1.5rem',
            marginBottom: '1.5rem'
          }}
        >
          <h3
            style={{
              fontSize: '1.05rem',
              fontWeight: 600,
              color: 'var(--primary-navy)',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Package size={18} />
            <span>Eligible Products ({discount.associated_products.length})</span>
          </h3>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Sales Price</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {discount.associated_products.map((p) => (
                  <tr key={p.mapping_id}>
                    <td style={{ fontWeight: 600 }}>
                      <Link to={`/admin/products/${p.product_id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                        {p.product_name}
                      </Link>
                    </td>
                    <td>{formatCurrency(p.sales_price)}</td>
                    <td>
                      <span className={`badge ${p.is_active ? 'badge-active' : 'badge-inactive'}`}>
                        {p.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Target Plan (if applicable) */}
      {discount.target_plan && (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-light)',
            padding: '1.5rem',
            marginBottom: '1.5rem'
          }}
        >
          <h3
            style={{
              fontSize: '1.05rem',
              fontWeight: 600,
              color: 'var(--primary-navy)',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Layers size={18} />
            <span>Eligible Subscription Plan</span>
          </h3>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem',
              backgroundColor: 'var(--bg-sand)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-light)'
            }}
          >
            <div>
              <Link
                to={`/admin/subscription-plans/${discount.target_plan.id}`}
                style={{ fontWeight: 600, color: 'var(--primary-navy)', fontSize: '1rem' }}
              >
                {discount.target_plan.name}
              </Link>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Billed {discount.target_plan.billing_interval}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary-navy)' }}>
                {formatCurrency(discount.target_plan.price)}
              </div>
              <span className={`badge ${discount.target_plan.is_active ? 'badge-active' : 'badge-inactive'}`}>
                {discount.target_plan.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Calculation Simulator Card */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-light)',
          padding: '1.5rem',
          marginBottom: '1.5rem'
        }}
      >
        <h3
          style={{
            fontSize: '1.05rem',
            fontWeight: 600,
            color: 'var(--primary-navy)',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Calculator size={18} />
          <span>Interactive Discount Calculator & Policy Simulator</span>
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              Eligible Order Amount (₹):
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 600 }}>
                ₹
              </span>
              <input
                type="number"
                min="0"
                step="any"
                value={testAmount}
                onChange={(e) => setTestAmount(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '1.75rem', fontWeight: 600 }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              Order Quantity (Units):
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={testQuantity}
              onChange={(e) => setTestQuantity(e.target.value)}
              className="form-input"
              style={{ fontWeight: 600 }}
            />
          </div>
        </div>

        {/* Breakdown Box */}
        <div
          style={{
            backgroundColor: 'var(--bg-sand)',
            borderRadius: 'var(--radius-sm)',
            padding: '1.25rem',
            border: '1px solid var(--border-light)'
          }}
        >
          {!isSimulationEligible ? (
            <div style={{ color: '#DC2626', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={16} />
              <span>
                {!meetsMinQty
                  ? `Requires minimum order quantity of ${discount.min_quantity} units.`
                  : `Order amount is below the required minimum threshold of ${formatCurrency(discount.min_amount)}.`}
              </span>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Gross Amount:</span>
                <span style={{ fontWeight: 600 }}>{formatCurrency(parsedAmt)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>
                  Promo Deduction ({discount.code} - {discount.display_value}):
                </span>
                <span style={{ fontWeight: 700, color: '#166534' }}>
                  -{formatCurrency(simDiscountAmt)}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '0.5rem',
                  borderTop: '1px dashed var(--border-light)',
                  fontSize: '1rem'
                }}
              >
                <span style={{ fontWeight: 700, color: 'var(--primary-navy)' }}>Customer Net Total:</span>
                <strong style={{ fontSize: '1.15rem', color: 'var(--primary-navy)' }}>
                  {formatCurrency(simFinalAmt)}
                </strong>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Audit & Metadata Card */}
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
            {discount.id}
          </code>
          <button
            onClick={() => copyToClipboard(discount.id)}
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
            <span>Created: {formatDate(discount.created_at)}</span>
          </div>

          {discount.updated_at && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <Clock size={14} />
              <span>Updated: {formatDate(discount.updated_at)}</span>
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
                  style={{ color: discount.is_active ? '#DC2626' : '#166534' }}
                />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary-navy)' }}>
                  {discount.is_active ? 'Deactivate Discount' : 'Reactivate Discount'}
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
                {discount.is_active ? (
                  <>
                    Are you sure you want to deactivate discount code{' '}
                    <strong>&quot;{discount.code}&quot;</strong>?
                    <br /><br />
                    Once deactivated, customers will be prevented from applying this code to new checkouts and quotations.
                  </>
                ) : (
                  <>
                    Are you sure you want to reactivate discount code{' '}
                    <strong>&quot;{discount.code}&quot;</strong>?
                    <br /><br />
                    It will become immediately valid for eligible customer orders.
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
                variant={discount.is_active ? 'danger' : 'primary'}
                onClick={handleToggleStatus}
                loading={statusActionLoading}
              >
                {discount.is_active ? 'Deactivate' : 'Reactivate'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscountDetail;

