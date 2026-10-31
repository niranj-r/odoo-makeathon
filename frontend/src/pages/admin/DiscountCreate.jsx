import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Tag,
  ArrowLeft,
  Calculator,
  IndianRupee,
  Percent,
  CheckCircle,
  AlertCircle,
  Calendar,
  Layers,
  Package,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import Button from '../../components/common/Button';
import InputField from '../../components/forms/InputField';
import Alert from '../../components/common/Alert';

const API_BASE_URL = 'http://localhost:5000/api';

export const DiscountCreate = () => {
  const { session } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Form states
  const [code, setCode] = useState('');
  const [type, setType] = useState('percentage');
  const [value, setValue] = useState('');
  const [appliesTo, setAppliesTo] = useState('all');
  const [targetId, setTargetId] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [minQuantity, setMinQuantity] = useState('1');
  const [minAmount, setMinAmount] = useState('0.00');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [maxUsage, setMaxUsage] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Available options
  const [products, setProducts] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // UI states
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const isPercentage = type === 'percentage';
  const numValue = parseFloat(value) || 0;

  // Live simulation calculator on sample ₹1,000 base
  const sampleBase = 1000;
  const sampleDiscountAmount = isPercentage
    ? Math.round(((sampleBase * numValue) / 100 + Number.EPSILON) * 100) / 100
    : Math.min(sampleBase, numValue);
  const sampleFinalTotal = Math.round((sampleBase - sampleDiscountAmount + Number.EPSILON) * 100) / 100;

  // Load products and subscription plans for applicability selection
  useEffect(() => {
    const fetchOptions = async () => {
      if (!session?.access_token) return;
      try {
        setLoadingOptions(true);
        const [prodRes, planRes] = await Promise.all([
          fetch(`${API_BASE_URL}/products?status=active&limit=100`, {
            headers: { Authorization: `Bearer ${session.access_token}` }
          }),
          fetch(`${API_BASE_URL}/subscription-plans?status=active&limit=100`, {
            headers: { Authorization: `Bearer ${session.access_token}` }
          })
        ]);

        const [prodData, planData] = await Promise.all([
          prodRes.json(),
          planRes.json()
        ]);

        if (prodRes.ok) setProducts(prodData.products || []);
        if (planRes.ok) setPlans(planData.plans || []);
      } catch (err) {
        console.error('Error fetching applicability targets:', err);
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchOptions();
  }, [session?.access_token]);

  // Handle product multi-selection toggle
  const toggleProductSelection = (pId) => {
    setSelectedProductIds((prev) =>
      prev.includes(pId) ? prev.filter((id) => id !== pId) : [...prev, pId]
    );
  };

  // Client-side validation
  const validateForm = () => {
    const errors = {};

    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      errors.code = 'Discount code is required.';
    } else if (cleanCode.length < 2 || cleanCode.length > 50) {
      errors.code = 'Discount code must be between 2 and 50 characters.';
    } else if (!/^[A-Z0-9_-]+$/.test(cleanCode)) {
      errors.code = 'Code can only contain letters, numbers, hyphens, and underscores.';
    }

    if (!['percentage', 'fixed'].includes(type)) {
      errors.type = 'Discount type must be Percentage or Fixed.';
    }

    if (value === '' || value === null || value === undefined) {
      errors.value = 'Discount value is required.';
    } else {
      const val = Number(value);
      if (isNaN(val) || val <= 0) {
        errors.value = 'Discount value must be a positive number greater than 0.';
      } else if (isPercentage && val > 100) {
        errors.value = 'Percentage discount cannot exceed 100%.';
      }
    }

    if (minQuantity !== '') {
      const q = parseInt(minQuantity, 10);
      if (isNaN(q) || q < 1) {
        errors.minQuantity = 'Minimum quantity must be an integer >= 1.';
      }
    }

    if (minAmount !== '') {
      const a = parseFloat(minAmount);
      if (isNaN(a) || a < 0) {
        errors.minAmount = 'Minimum amount cannot be negative.';
      }
    }

    if (startDate && endDate && endDate < startDate) {
      errors.endDate = 'End date cannot be earlier than start date.';
    }

    if (maxUsage !== '') {
      const m = parseInt(maxUsage, 10);
      if (isNaN(m) || m <= 0) {
        errors.maxUsage = 'Max usage limit must be an integer greater than 0.';
      }
    }

    if (appliesTo === 'product' && selectedProductIds.length === 0 && !targetId) {
      errors.appliesTo = 'Please select at least one eligible product.';
    }

    if (appliesTo === 'plan' && !targetId) {
      errors.targetId = 'Please select an eligible subscription plan.';
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
        code: code.trim().toUpperCase(),
        type,
        value: parseFloat(value),
        min_quantity: minQuantity ? parseInt(minQuantity, 10) : 1,
        min_amount: minAmount ? parseFloat(minAmount) : 0.0,
        start_date: startDate || null,
        end_date: endDate || null,
        max_usage: maxUsage ? parseInt(maxUsage, 10) : null,
        applies_to: appliesTo,
        target_id: targetId || (selectedProductIds.length === 1 ? selectedProductIds[0] : null),
        product_ids: appliesTo === 'product' ? selectedProductIds : [],
        is_active: isActive
      };

      const res = await fetch(`${API_BASE_URL}/discounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to create discount.');
      }

      addToast(data.message || `Discount "${payload.code}" created successfully!`, 'success');
      navigate('/admin/discounts');
    } catch (err) {
      console.error('Error creating discount:', err);
      setErrorMessage(err.message || 'An error occurred while creating the discount.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto' }}>
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

      {/* Header Card */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-light)',
          padding: '1.5rem 2rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '10px',
            backgroundColor: 'var(--primary-navy-soft)',
            color: 'var(--primary-navy)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <Tag size={24} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-navy)', margin: 0 }}>
            Create New Discount
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
            Set up a promotional coupon code, value reduction, and eligibility rules.
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div style={{ marginBottom: '1.5rem' }}>
          <Alert type="error" message={errorMessage} onClose={() => setErrorMessage('')} />
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} noValidate>
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-light)',
            padding: '2rem',
            marginBottom: '1.5rem'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Discount Code */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '0.4rem'
                }}
              >
                Discount Code <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: '0.85rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)'
                  }}
                >
                  <Tag size={16} />
                </span>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    if (fieldErrors.code) setFieldErrors({ ...fieldErrors, code: null });
                  }}
                  className={`form-input ${fieldErrors.code ? 'is-invalid' : ''}`}
                  style={{ paddingLeft: '2.4rem', fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.5px' }}
                  placeholder="e.g. SUMMER2026, FESTIVE15, FLAT500"
                  maxLength={50}
                />
              </div>
              {fieldErrors.code && (
                <small style={{ color: '#DC2626', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>
                  {fieldErrors.code}
                </small>
              )}
              <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                Unique promo code entered by customer at checkout (automatically converted to uppercase).
              </small>
            </div>

            {/* Type & Value Selection */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '0.4rem'
                }}
              >
                Discount Type <span style={{ color: '#DC2626' }}>*</span>
              </label>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '0.75rem',
                  marginBottom: '1rem'
                }}
              >
                {/* Percentage */}
                <div
                  onClick={() => setType('percentage')}
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-sm)',
                    border: type === 'percentage'
                      ? '2px solid var(--primary-navy)'
                      : '1px solid var(--border-light)',
                    backgroundColor: type === 'percentage'
                      ? 'var(--primary-navy-soft)'
                      : '#FFFFFF',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem'
                  }}
                >
                  <input
                    type="radio"
                    name="discountType"
                    checked={type === 'percentage'}
                    onChange={() => setType('percentage')}
                    style={{ marginTop: '0.2rem', accentColor: 'var(--primary-navy)' }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--primary-navy)' }}>
                      Percentage Discount (%)
                    </div>
                    <small style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      Reduces eligible order subtotal by a percentage (e.g. 15% off).
                    </small>
                  </div>
                </div>

                {/* Fixed Amount */}
                <div
                  onClick={() => setType('fixed')}
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-sm)',
                    border: type === 'fixed'
                      ? '2px solid var(--primary-navy)'
                      : '1px solid var(--border-light)',
                    backgroundColor: type === 'fixed'
                      ? 'var(--primary-navy-soft)'
                      : '#FFFFFF',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem'
                  }}
                >
                  <input
                    type="radio"
                    name="discountType"
                    checked={type === 'fixed'}
                    onChange={() => setType('fixed')}
                    style={{ marginTop: '0.2rem', accentColor: 'var(--primary-navy)' }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--primary-navy)' }}>
                      Fixed Amount (₹)
                    </div>
                    <small style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      Subtracts a fixed rupee amount (e.g. ₹250 off order total).
                    </small>
                  </div>
                </div>
              </div>

              {/* Value Input */}
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: '0.85rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    fontWeight: 600
                  }}
                >
                  {isPercentage ? '%' : '₹'}
                </span>
                <input
                  type="number"
                  min="0.01"
                  max={isPercentage ? 100 : undefined}
                  step="0.01"
                  value={value}
                  onChange={(e) => {
                    setValue(e.target.value);
                    if (fieldErrors.value) setFieldErrors({ ...fieldErrors, value: null });
                  }}
                  className={`form-input ${fieldErrors.value ? 'is-invalid' : ''}`}
                  style={{ paddingLeft: '2.4rem' }}
                  placeholder={isPercentage ? '15.00' : '250.00'}
                />
              </div>
              {fieldErrors.value && (
                <small style={{ color: '#DC2626', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>
                  {fieldErrors.value}
                </small>
              )}
            </div>

            {/* Applicability Selection */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '0.4rem'
                }}
              >
                Applicability Scope <span style={{ color: '#DC2626' }}>*</span>
              </label>

              <select
                className="form-input"
                value={appliesTo}
                onChange={(e) => {
                  setAppliesTo(e.target.value);
                  setTargetId('');
                  setSelectedProductIds([]);
                  if (fieldErrors.appliesTo) setFieldErrors({ ...fieldErrors, appliesTo: null });
                }}
              >
                <option value="all">All Eligible Products & Subscription Plans</option>
                <option value="product">Selected Products Only</option>
                <option value="plan">Specific Subscription Plan Only</option>
              </select>

              {/* Conditional: Select Products */}
              {appliesTo === 'product' && (
                <div
                  style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    backgroundColor: 'var(--bg-sand)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-light)'
                  }}
                >
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-navy)', marginBottom: '0.5rem' }}>
                    Select Eligible Products ({selectedProductIds.length} selected):
                  </div>

                  {products.length === 0 ? (
                    <small style={{ color: 'var(--text-muted)' }}>No active products available.</small>
                  ) : (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                        gap: '0.5rem',
                        maxHeight: '180px',
                        overflowY: 'auto'
                      }}
                    >
                      {products.map((p) => {
                        const isChecked = selectedProductIds.includes(p.id);
                        return (
                          <div
                            key={p.id}
                            onClick={() => toggleProductSelection(p.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '0.5rem 0.75rem',
                              backgroundColor: isChecked ? 'var(--primary-navy-soft)' : '#FFFFFF',
                              borderRadius: '4px',
                              border: isChecked ? '1.5px solid var(--primary-navy)' : '1px solid var(--border-light)',
                              cursor: 'pointer',
                              fontSize: '0.825rem'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}}
                                style={{ accentColor: 'var(--primary-navy)', cursor: 'pointer' }}
                              />
                              <span style={{ fontWeight: 500 }}>{p.name}</span>
                            </div>
                            <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>
                              {formatCurrency(p.sales_price)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {fieldErrors.appliesTo && (
                    <small style={{ color: '#DC2626', fontSize: '0.8rem', marginTop: '0.35rem', display: 'block' }}>
                      {fieldErrors.appliesTo}
                    </small>
                  )}
                </div>
              )}

              {/* Conditional: Select Subscription Plan */}
              {appliesTo === 'plan' && (
                <div style={{ marginTop: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                    Select Subscription Plan:
                  </label>
                  <select
                    className={`form-input ${fieldErrors.targetId ? 'is-invalid' : ''}`}
                    value={targetId}
                    onChange={(e) => {
                      setTargetId(e.target.value);
                      if (fieldErrors.targetId) setFieldErrors({ ...fieldErrors, targetId: null });
                    }}
                  >
                    <option value="">-- Choose target subscription plan --</option>
                    {plans.map((pl) => (
                      <option key={pl.id} value={pl.id}>
                        {pl.name} ({pl.billing_interval} - {formatCurrency(pl.price)})
                      </option>
                    ))}
                  </select>
                  {fieldErrors.targetId && (
                    <small style={{ color: '#DC2626', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>
                      {fieldErrors.targetId}
                    </small>
                  )}
                </div>
              )}
            </div>

            {/* Threshold Rules: Minimum Quantity & Minimum Amount */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1rem'
              }}
            >
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                  Minimum Order Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={minQuantity}
                  onChange={(e) => setMinQuantity(e.target.value)}
                  className="form-input"
                  placeholder="1"
                />
                <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                  Minimum units required in the transaction (default: 1).
                </small>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                  Minimum Transaction Amount (₹)
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 600 }}>
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '2rem' }}
                    placeholder="0.00"
                  />
                </div>
                <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                  Order subtotal must meet or exceed this amount to unlock discount.
                </small>
              </div>
            </div>

            {/* Usage & Date Restrictions */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem'
              }}
            >
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="form-input"
                />
                <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                  Leave blank for immediate activation.
                </small>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                  Expiry / End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="form-input"
                />
                <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                  Leave blank for indefinite validity.
                </small>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                  Maximum Total Usage Limit
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={maxUsage}
                  onChange={(e) => setMaxUsage(e.target.value)}
                  className="form-input"
                  placeholder="Unlimited"
                />
                <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                  Leave blank for unlimited redemptions.
                </small>
              </div>
            </div>

            {/* Operational Active Status */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem',
                backgroundColor: 'var(--bg-sand)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-light)'
              }}
            >
              <input
                type="checkbox"
                id="isActiveCheckbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--primary-navy)' }}
              />
              <label htmlFor="isActiveCheckbox" style={{ cursor: 'pointer', margin: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--primary-navy)' }}>
                  Active Status
                </div>
                <small style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                  Active discounts can be validated and applied by customers and staff.
                </small>
              </label>
            </div>
          </div>

          {/* Live Simulation Preview */}
          <div
            style={{
              marginTop: '2rem',
              padding: '1.25rem',
              backgroundColor: '#F8FAFC',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid #E2E8F0'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Calculator size={18} style={{ color: 'var(--primary-navy)' }} />
              <strong style={{ fontSize: '0.95rem', color: 'var(--primary-navy)' }}>
                Calculation Preview on ₹1,000 Transaction
              </strong>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '1rem'
              }}
            >
              <div>
                <small style={{ color: 'var(--text-muted)', display: 'block' }}>Gross Order Amount</small>
                <strong style={{ fontSize: '1rem' }}>{formatCurrency(sampleBase)}</strong>
              </div>

              <div>
                <small style={{ color: 'var(--text-muted)', display: 'block' }}>
                  {code.trim().toUpperCase() || 'PROMO'} Deduction ({isPercentage ? `${numValue}%` : 'Fixed'})
                </small>
                <strong style={{ fontSize: '1rem', color: '#166534' }}>
                  -{formatCurrency(sampleDiscountAmount)}
                </strong>
              </div>

              <div>
                <small style={{ color: 'var(--text-muted)', display: 'block' }}>Final Net Amount</small>
                <strong style={{ fontSize: '1.1rem', color: 'var(--primary-navy)' }}>
                  {formatCurrency(sampleFinalTotal)}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/admin/discounts')}
            disabled={submitting}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            loading={submitting}
          >
            Create Discount
          </Button>
        </div>
      </form>
    </div>
  );
};

export default DiscountCreate;

