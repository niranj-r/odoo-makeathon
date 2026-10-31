import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CalendarRange,
  ArrowLeft,
  Package,
  Clock,
  IndianRupee,
  Layers,
  Calendar,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Hash
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import Button from '../../components/common/Button';
import InputField from '../../components/forms/InputField';
import Alert from '../../components/common/Alert';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const API_BASE_URL = 'http://localhost:5000/api';

export const SubscriptionPlanCreate = () => {
  const { session } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Products lookup state
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Form states
  const [name, setName] = useState('');
  const [productId, setProductId] = useState('');
  const [billingInterval, setBillingInterval] = useState('monthly');
  const [price, setPrice] = useState('');
  const [minQuantity, setMinQuantity] = useState('1');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Policy toggles
  const [autoClose, setAutoClose] = useState(false);
  const [allowEarlyClose, setAllowEarlyClose] = useState(true);
  const [allowPause, setAllowPause] = useState(false);
  const [allowRenewal, setAllowRenewal] = useState(true);
  const [isActive, setIsActive] = useState(true);

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Fetch active products for dropdown
  useEffect(() => {
    const fetchActiveProducts = async () => {
      if (!session?.access_token) return;
      try {
        setLoadingProducts(true);
        const res = await fetch(`${API_BASE_URL}/products?status=ACTIVE&limit=100`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          const activeList = (data.products || []).filter((p) => p.is_active);
          setProducts(activeList);
        }
      } catch (err) {
        console.error('Error fetching products for plan creation:', err);
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchActiveProducts();
  }, [session?.access_token]);

  // When a product is selected, suggest its sales price if price is currently empty
  const handleProductChange = (e) => {
    const selectedId = e.target.value;
    setProductId(selectedId);
    if (fieldErrors.productId) setFieldErrors((prev) => ({ ...prev, productId: '' }));

    if (selectedId && !price) {
      const prod = products.find((p) => p.id === selectedId);
      if (prod && prod.sales_price !== undefined) {
        setPrice(String(prod.sales_price));
      }
    }
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

  // Client-side validation
  const validateForm = () => {
    const errors = {};

    if (!name.trim()) {
      errors.name = 'Plan name is required.';
    } else if (name.trim().length > 255) {
      errors.name = 'Plan name cannot exceed 255 characters.';
    }

    if (!productId) {
      errors.productId = 'Please select a parent product offering.';
    }

    if (!['daily', 'weekly', 'monthly', 'yearly'].includes(billingInterval)) {
      errors.billingInterval = 'Billing interval must be Daily, Weekly, Monthly, or Yearly.';
    }

    if (price === '' || price === null || price === undefined) {
      errors.price = 'Price is required.';
    } else {
      const numPrice = Number(price);
      if (isNaN(numPrice) || numPrice < 0) {
        errors.price = 'Price must be a valid non-negative number.';
      }
    }

    const numQty = Number(minQuantity);
    if (!Number.isInteger(numQty) || numQty < 1) {
      errors.minQuantity = 'Minimum quantity must be an integer of 1 or greater.';
    }

    if (startDate && endDate) {
      if (new Date(endDate) < new Date(startDate)) {
        errors.endDate = 'End date cannot be earlier than start date.';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!validateForm()) {
      setErrorMessage('Please fix the highlighted errors before submitting.');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        name: name.trim(),
        product_id: productId,
        billing_interval: billingInterval,
        price: parseFloat(price),
        min_quantity: parseInt(minQuantity, 10),
        start_date: startDate || null,
        end_date: endDate || null,
        auto_close: autoClose,
        allow_early_close: allowEarlyClose,
        allow_pause: allowPause,
        allow_renewal: allowRenewal,
        is_active: isActive
      };

      const res = await fetch(`${API_BASE_URL}/subscription-plans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to create subscription plan.');
      }

      addToast(`Subscription plan "${data.plan?.name || name}" created successfully.`, 'success');
      navigate(`/admin/subscription-plans/${data.plan?.id || ''}`);
    } catch (err) {
      console.error('Error creating subscription plan:', err);
      setErrorMessage(err.message || 'Failed to create subscription plan.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedProduct = products.find((p) => p.id === productId);

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto' }}>
      {/* Navigation Breadcrumb */}
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

      {/* Header */}
      <div className="section-header" style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <CalendarRange size={26} color="var(--primary-navy)" />
          Create Subscription Plan
        </h1>
        <p style={{ marginTop: '0.25rem' }}>
          Define billing intervals, cycle pricing, and lifecycle policies for customer subscriptions.
        </p>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <Alert
          type="error"
          message={errorMessage}
          onClose={() => setErrorMessage('')}
        />
      )}

      {/* Form Card */}
      <div
        className="form-card"
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-light)',
          padding: '2rem',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <form onSubmit={handleSubmit} noValidate>
          {/* Plan Name */}
          <InputField
            id="plan-name"
            name="name"
            label="Plan Name"
            placeholder="e.g. Starter Monthly, Pro Annual, Enterprise Dedicated"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: '' }));
            }}
            required
            error={fieldErrors.name}
            hint="A clear customer-facing title for this subscription option."
            icon={CalendarRange}
          />

          {/* Product Selection */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label htmlFor="plan-product" className="form-label">
              Parent Product <span className="required">*</span>
            </label>
            <div className="input-wrapper">
              <span className="input-icon">
                <Package size={18} />
              </span>
              <select
                id="plan-product"
                name="product_id"
                className={`form-input has-icon ${fieldErrors.productId ? 'input-error' : ''}`}
                value={productId}
                onChange={handleProductChange}
                disabled={loadingProducts}
              >
                <option value="">-- Select Active Product Offering --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.type} · Base {formatCurrency(p.sales_price)})
                  </option>
                ))}
              </select>
            </div>
            {fieldErrors.productId && <span className="field-error">{fieldErrors.productId}</span>}
            <small className="field-hint">
              Plans are tied directly to an active product offering from your catalog.
            </small>
          </div>

          {/* Selected Product Context Banner */}
          {selectedProduct && (
            <div
              style={{
                backgroundColor: 'var(--bg-sand)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.85rem 1.15rem',
                marginBottom: '1.5rem',
                fontSize: '0.85rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}
            >
              <div>
                Selected: <strong style={{ color: 'var(--primary-navy)' }}>{selectedProduct.name}</strong> ({selectedProduct.type})
              </div>
              <div>
                Standard Product Base: <strong>{formatCurrency(selectedProduct.sales_price)}</strong>
              </div>
            </div>
          )}

          {/* Billing Interval & Price Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
            {/* Billing Interval */}
            <div className="form-group" style={{ margin: 0 }}>
              <label htmlFor="plan-interval" className="form-label">
                Billing Interval <span className="required">*</span>
              </label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <Clock size={18} />
                </span>
                <select
                  id="plan-interval"
                  name="billing_interval"
                  className={`form-input has-icon ${fieldErrors.billingInterval ? 'input-error' : ''}`}
                  value={billingInterval}
                  onChange={(e) => {
                    setBillingInterval(e.target.value);
                    if (fieldErrors.billingInterval) setFieldErrors((prev) => ({ ...prev, billingInterval: '' }));
                  }}
                >
                  <option value="daily">Daily (billed every day)</option>
                  <option value="weekly">Weekly (billed every 7 days)</option>
                  <option value="monthly">Monthly (billed every calendar month)</option>
                  <option value="yearly">Yearly (billed annually)</option>
                </select>
              </div>
              {fieldErrors.billingInterval && <span className="field-error">{fieldErrors.billingInterval}</span>}
              <small className="field-hint">
                Frequency at which automated subscription invoices are generated.
              </small>
            </div>

            {/* Recurring Plan Price */}
            <div>
              <InputField
                id="plan-price"
                name="price"
                label="Recurring Plan Price (₹)"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={price}
                onChange={(e) => {
                  setPrice(e.target.value);
                  if (fieldErrors.price) setFieldErrors((prev) => ({ ...prev, price: '' }));
                }}
                required
                error={fieldErrors.price}
                hint={`Rate charged per ${billingInterval} interval.`}
                icon={IndianRupee}
              />
            </div>
          </div>

          {/* Minimum Quantity Row */}
          <div style={{ marginBottom: '1.5rem' }}>
            <InputField
              id="plan-min-quantity"
              name="min_quantity"
              label="Minimum Order Quantity"
              type="number"
              step="1"
              min="1"
              placeholder="1"
              value={minQuantity}
              onChange={(e) => {
                setMinQuantity(e.target.value);
                if (fieldErrors.minQuantity) setFieldErrors((prev) => ({ ...prev, minQuantity: '' }));
              }}
              required
              error={fieldErrors.minQuantity}
              hint="Minimum user seats or license units required to subscribe to this plan."
              icon={Hash}
            />
          </div>

          {/* Validity Dates: Start Date & End Date Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.75rem' }}>
            <div>
              <InputField
                id="plan-start-date"
                name="start_date"
                label="Start Date (Optional)"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (fieldErrors.startDate) setFieldErrors((prev) => ({ ...prev, startDate: '' }));
                }}
                hint="Date this plan becomes available for subscription."
                icon={Calendar}
              />
            </div>

            <div>
              <InputField
                id="plan-end-date"
                name="end_date"
                label="End Date (Optional)"
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  if (fieldErrors.endDate) setFieldErrors((prev) => ({ ...prev, endDate: '' }));
                }}
                error={fieldErrors.endDate}
                hint="Term end date. Leave blank for indefinite continuous offering."
                icon={Calendar}
              />
            </div>
          </div>

          {/* ============================================================================== */}
          {/* SUBSCRIPTION LIFECYCLE SETTINGS */}
          {/* ============================================================================== */}
          <div
            style={{
              borderTop: '1px solid var(--border-light)',
              paddingTop: '1.5rem',
              marginBottom: '2rem'
            }}
          >
            <h3 style={{ fontSize: '1.1rem', color: 'var(--primary-navy)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={18} />
              Subscription Lifecycle Policies
            </h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Configure how active subscriptions under this plan behave regarding pauses, closures, and renewals.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              {/* Allow Early Close */}
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={allowEarlyClose}
                  onChange={(e) => setAllowEarlyClose(e.target.checked)}
                  style={{ width: '16px', height: '16px', marginTop: '2px', cursor: 'pointer' }}
                />
                <div>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    Allow Early Closure
                  </strong>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Customers or staff can voluntarily terminate this subscription before the term end date.
                  </div>
                </div>
              </label>

              {/* Allow Pause */}
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={allowPause}
                  onChange={(e) => setAllowPause(e.target.checked)}
                  style={{ width: '16px', height: '16px', marginTop: '2px', cursor: 'pointer' }}
                />
                <div>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    Allow Subscription Pause
                  </strong>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Subscribers can pause billing and services temporarily without fully terminating their agreement.
                  </div>
                </div>
              </label>

              {/* Allow Renewal */}
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={allowRenewal}
                  onChange={(e) => setAllowRenewal(e.target.checked)}
                  style={{ width: '16px', height: '16px', marginTop: '2px', cursor: 'pointer' }}
                />
                <div>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    Allow Renewal
                  </strong>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Subscription extends automatically at cycle completion or can be manually renewed.
                  </div>
                </div>
              </label>

              {/* Auto Close */}
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={autoClose}
                  onChange={(e) => setAutoClose(e.target.checked)}
                  style={{ width: '16px', height: '16px', marginTop: '2px', cursor: 'pointer' }}
                />
                <div>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    Auto-Close on Term Completion
                  </strong>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Subscription closes automatically upon reaching the scheduled end date without renewing.
                  </div>
                </div>
              </label>

              {/* Active Standing */}
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', cursor: 'pointer', marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px dashed var(--border-light)' }}>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  style={{ width: '16px', height: '16px', marginTop: '2px', cursor: 'pointer' }}
                />
                <div>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    Active Plan Status
                  </strong>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Immediately enable this plan in the catalog for new customer subscriptions and quotations.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '1rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid var(--border-light)'
            }}
          >
            <Link to="/admin/subscription-plans">
              <Button variant="outline" type="button" disabled={submitting}>
                Cancel
              </Button>
            </Link>

            <Button
              variant="primary"
              type="submit"
              loading={submitting}
              icon={CalendarRange}
            >
              Create Subscription Plan
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubscriptionPlanCreate;

