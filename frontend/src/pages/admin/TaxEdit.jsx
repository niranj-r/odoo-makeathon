import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  Percent,
  ArrowLeft,
  Calculator,
  IndianRupee,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Tag,
  Save,
  Clock,
  Calendar,
  Layers
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import Button from '../../components/common/Button';
import InputField from '../../components/forms/InputField';
import Alert from '../../components/common/Alert';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const API_BASE_URL = 'http://localhost:5000/api';

export const TaxEdit = () => {
  const { id } = useParams();
  const { session, role } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Form states
  const [name, setName] = useState('');
  const [computationType, setComputationType] = useState('percentage');
  const [rateValue, setRateValue] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [initialTax, setInitialTax] = useState(null);

  // UI states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const isPercentage = computationType === 'percentage';
  const numRate = parseFloat(rateValue) || 0;

  // Live calculation sample on ₹1,000 base
  const sampleBase = 1000;
  const sampleComputedTax = isPercentage
    ? Math.round(((sampleBase * numRate) / 100 + Number.EPSILON) * 100) / 100
    : numRate;
  const sampleTotal = sampleBase + sampleComputedTax;

  // Fetch initial tax data
  const fetchTax = useCallback(async () => {
    if (!id || !session?.access_token) return;

    try {
      setLoading(true);
      setErrorMessage('');

      const res = await fetch(`${API_BASE_URL}/taxes/${id}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to load tax details.');
      }

      const t = data.tax;
      setInitialTax(t);
      setName(t.name || '');
      setComputationType(t.computation_type || 'percentage');
      setRateValue(t.rate_percentage !== undefined ? String(t.rate_percentage) : '');
      setIsActive(t.is_active !== undefined ? t.is_active : true);
    } catch (err) {
      console.error('Error loading tax for editing:', err);
      setErrorMessage(err.message || 'Failed to load tax record.');
    } finally {
      setLoading(false);
    }
  }, [id, session?.access_token]);

  useEffect(() => {
    fetchTax();
  }, [fetchTax]);

  // Client-side validation
  const validateForm = () => {
    const errors = {};

    if (!name.trim()) {
      errors.name = 'Tax name is required.';
    } else if (name.trim().length > 255) {
      errors.name = 'Tax name cannot exceed 255 characters.';
    }

    if (!['percentage', 'fixed'].includes(computationType)) {
      errors.computationType = 'Computation type must be Percentage or Fixed.';
    }

    if (rateValue === '' || rateValue === null || rateValue === undefined) {
      errors.rateValue = isPercentage ? 'Tax percentage rate is required.' : 'Fixed tax amount is required.';
    } else {
      const val = Number(rateValue);
      if (isNaN(val) || val < 0) {
        errors.rateValue = 'Value must be a valid non-negative number.';
      } else if (isPercentage && val > 100) {
        errors.rateValue = 'Percentage tax rate cannot exceed 100%.';
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
        computation_type: computationType,
        rate_percentage: parseFloat(rateValue),
        is_active: isActive
      };

      const res = await fetch(`${API_BASE_URL}/taxes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to update tax record.');
      }

      addToast(data.message || `Tax "${name.trim()}" updated successfully!`, 'success');
      navigate(`/admin/taxes/${id}`);
    } catch (err) {
      console.error('Error updating tax:', err);
      setErrorMessage(err.message || 'An error occurred while updating the tax.');
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

  if (loading) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <LoadingSpinner size="large" message="Loading tax details for editing..." />
      </div>
    );
  }

  if (errorMessage && !initialTax) {
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
        <Alert type="error" message={errorMessage} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto' }}>
      {/* Back Link */}
      <div style={{ marginBottom: '1.25rem' }}>
        <Link
          to={`/admin/taxes/${id}`}
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
          <span>Back to Tax Details</span>
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
          <Percent size={24} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-navy)', margin: 0 }}>
            Edit Tax: {initialTax?.name}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
            Modify rate parameters, computation logic, and operational active status.
          </p>
        </div>
      </div>

      {/* Form Error Alert */}
      {errorMessage && (
        <div style={{ marginBottom: '1.5rem' }}>
          <Alert type="error" message={errorMessage} onClose={() => setErrorMessage('')} />
        </div>
      )}

      {/* Main Edit Form */}
      <form onSubmit={handleSubmit}>
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-light)',
            padding: '2rem',
            marginBottom: '1.5rem'
          }}
        >
          {/* Section: Basic Settings */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Tax Name */}
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
                Tax Name <span style={{ color: '#DC2626' }}>*</span>
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
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: null });
                  }}
                  className={`form-input ${fieldErrors.name ? 'is-invalid' : ''}`}
                  style={{ paddingLeft: '2.4rem' }}
                  placeholder="e.g. GST 18%, SGST 9%, Eco Cess, Flat Service Fee"
                  maxLength={255}
                />
              </div>
              {fieldErrors.name && (
                <small style={{ color: '#DC2626', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>
                  {fieldErrors.name}
                </small>
              )}
            </div>

            {/* Computation Type */}
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
                Computation Type <span style={{ color: '#DC2626' }}>*</span>
              </label>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '0.75rem'
                }}
              >
                {/* Option 1: Percentage */}
                <div
                  onClick={() => setComputationType('percentage')}
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-sm)',
                    border: computationType === 'percentage'
                      ? '2px solid var(--primary-navy)'
                      : '1px solid var(--border-light)',
                    backgroundColor: computationType === 'percentage'
                      ? 'var(--primary-navy-soft)'
                      : '#FFFFFF',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <input
                    type="radio"
                    name="computationType"
                    checked={computationType === 'percentage'}
                    onChange={() => setComputationType('percentage')}
                    style={{ marginTop: '0.2rem', accentColor: 'var(--primary-navy)' }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--primary-navy)' }}>
                      Percentage Rate (%)
                    </div>
                    <small style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      Calculated proportionally against line-item sales subtotal (0% to 100%).
                    </small>
                  </div>
                </div>

                {/* Option 2: Fixed Amount */}
                <div
                  onClick={() => setComputationType('fixed')}
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-sm)',
                    border: computationType === 'fixed'
                      ? '2px solid var(--primary-navy)'
                      : '1px solid var(--border-light)',
                    backgroundColor: computationType === 'fixed'
                      ? 'var(--primary-navy-soft)'
                      : '#FFFFFF',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <input
                    type="radio"
                    name="computationType"
                    checked={computationType === 'fixed'}
                    onChange={() => setComputationType('fixed')}
                    style={{ marginTop: '0.2rem', accentColor: 'var(--primary-navy)' }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--primary-navy)' }}>
                      Fixed Amount (₹)
                    </div>
                    <small style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      Fixed monetary fee in Indian Rupees added per unit or transaction.
                    </small>
                  </div>
                </div>
              </div>
            </div>

            {/* Rate / Amount Input */}
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
                {isPercentage ? 'Tax Rate (%)' : 'Fixed Tax Amount (₹)'}{' '}
                <span style={{ color: '#DC2626' }}>*</span>
              </label>
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
                  min="0"
                  max={isPercentage ? 100 : undefined}
                  step={isPercentage ? '0.01' : '0.01'}
                  value={rateValue}
                  onChange={(e) => {
                    setRateValue(e.target.value);
                    if (fieldErrors.rateValue) setFieldErrors({ ...fieldErrors, rateValue: null });
                  }}
                  className={`form-input ${fieldErrors.rateValue ? 'is-invalid' : ''}`}
                  style={{ paddingLeft: '2.4rem' }}
                  placeholder={isPercentage ? '18.00' : '50.00'}
                />
              </div>
              {fieldErrors.rateValue && (
                <small style={{ color: '#DC2626', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>
                  {fieldErrors.rateValue}
                </small>
              )}
              <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                {isPercentage
                  ? 'Enter rate percentage (e.g. 18 for 18% GST, 5 for 5%). Cannot exceed 100%.'
                  : 'Enter fixed fee in Indian Rupees (e.g. 50.00 for ₹50.00 environmental or handling surcharge).'}
              </small>
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
                  Active taxes are selectable in product forms, quotations, and subscriptions.
                </small>
              </label>
            </div>
          </div>

          {/* Section: Live Simulation Preview */}
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
                Live Calculation Simulation (on ₹1,000 Order)
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
                <small style={{ color: 'var(--text-muted)', display: 'block' }}>Line Item Subtotal</small>
                <strong style={{ fontSize: '1rem' }}>{formatCurrency(sampleBase)}</strong>
              </div>

              <div>
                <small style={{ color: 'var(--text-muted)', display: 'block' }}>
                  {name.trim() || 'Tax Amount'} ({isPercentage ? `${numRate}%` : 'Fixed'})
                </small>
                <strong style={{ fontSize: '1rem', color: '#166534' }}>
                  +{formatCurrency(sampleComputedTax)}
                </strong>
              </div>

              <div>
                <small style={{ color: 'var(--text-muted)', display: 'block' }}>Customer Final Total</small>
                <strong style={{ fontSize: '1.1rem', color: 'var(--primary-navy)' }}>
                  {formatCurrency(sampleTotal)}
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
            onClick={() => navigate(`/admin/taxes/${id}`)}
            disabled={submitting}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            icon={Save}
            loading={submitting}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TaxEdit;

