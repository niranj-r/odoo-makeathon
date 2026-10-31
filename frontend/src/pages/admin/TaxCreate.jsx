import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Percent,
  ArrowLeft,
  Calculator,
  IndianRupee,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Tag
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import Button from '../../components/common/Button';
import InputField from '../../components/forms/InputField';
import Alert from '../../components/common/Alert';

const API_BASE_URL = 'http://localhost:5000/api';

export const TaxCreate = () => {
  const { session } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Form states
  const [name, setName] = useState('');
  const [computationType, setComputationType] = useState('percentage');
  const [rateValue, setRateValue] = useState('');
  const [isActive, setIsActive] = useState(true);

  // UI states
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

      const res = await fetch(`${API_BASE_URL}/taxes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to create tax.');
      }

      addToast(`Tax "${data.tax?.name || name}" created successfully.`, 'success');
      navigate(`/admin/taxes/${data.tax?.id || ''}`);
    } catch (err) {
      console.error('Error creating tax:', err);
      setErrorMessage(err.message || 'Failed to create tax.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto' }}>
      {/* Navigation Breadcrumb */}
      <div style={{ marginBottom: '1.25rem' }}>
        <Link
          to="/admin/taxes"
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
          <span>Back to Taxes Listing</span>
        </Link>
      </div>

      {/* Header */}
      <div className="section-header" style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Percent size={26} color="var(--primary-navy)" />
          Create Tax Rate
        </h1>
        <p style={{ marginTop: '0.25rem' }}>
          Configure a percentage rate (e.g. GST) or fixed monetary fee to attach to products and billing invoices.
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
          {/* Tax Name */}
          <InputField
            id="tax-name"
            name="name"
            label="Tax Name"
            placeholder="e.g. GST 18%, State Sales Tax 6%, Environmental Fee"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: '' }));
            }}
            required
            error={fieldErrors.name}
            hint="A clear label displayed on customer invoice line items."
            icon={Tag}
          />

          {/* Computation Type Selection */}
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">
              Computation Type <span className="required">*</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.35rem' }}>
              {/* Percentage Option */}
              <div
                onClick={() => {
                  setComputationType('percentage');
                  if (fieldErrors.rateValue) setFieldErrors((prev) => ({ ...prev, rateValue: '' }));
                }}
                style={{
                  border: isPercentage ? '2px solid var(--primary-navy)' : '1px solid var(--border-light)',
                  backgroundColor: isPercentage ? '#f0f4ff' : '#FFFFFF',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  transition: 'border-color 0.15s ease'
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: isPercentage ? 'var(--primary-navy)' : 'var(--bg-sand)',
                    color: isPercentage ? '#FFFFFF' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Percent size={18} />
                </div>
                <div>
                  <strong style={{ fontSize: '0.95rem', display: 'block', color: 'var(--primary-navy)' }}>
                    Percentage Rate (%)
                  </strong>
                  <span style={{ fontSize: '0.785rem', color: 'var(--text-secondary)' }}>
                    Computed as % of item subtotal (e.g. 18%)
                  </span>
                </div>
              </div>

              {/* Fixed Amount Option */}
              <div
                onClick={() => {
                  setComputationType('fixed');
                  if (fieldErrors.rateValue) setFieldErrors((prev) => ({ ...prev, rateValue: '' }));
                }}
                style={{
                  border: !isPercentage ? '2px solid var(--primary-navy)' : '1px solid var(--border-light)',
                  backgroundColor: !isPercentage ? '#f0f4ff' : '#FFFFFF',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  transition: 'border-color 0.15s ease'
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: !isPercentage ? 'var(--primary-navy)' : 'var(--bg-sand)',
                    color: !isPercentage ? '#FFFFFF' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <IndianRupee size={18} />
                </div>
                <div>
                  <strong style={{ fontSize: '0.95rem', display: 'block', color: 'var(--primary-navy)' }}>
                    Fixed Monetary Amount (₹)
                  </strong>
                  <span style={{ fontSize: '0.785rem', color: 'var(--text-secondary)' }}>
                    Fixed rupee fee charged per unit (e.g. ₹50)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Rate or Amount Input */}
          <div style={{ marginBottom: '1.5rem' }}>
            <InputField
              id="tax-rate-value"
              name="rateValue"
              label={isPercentage ? 'Tax Rate Percentage (%)' : 'Fixed Tax Amount (₹)'}
              type="number"
              step="0.01"
              min="0"
              max={isPercentage ? '100' : undefined}
              placeholder={isPercentage ? '18.00' : '50.00'}
              value={rateValue}
              onChange={(e) => {
                setRateValue(e.target.value);
                if (fieldErrors.rateValue) setFieldErrors((prev) => ({ ...prev, rateValue: '' }));
              }}
              required
              error={fieldErrors.rateValue}
              hint={isPercentage ? 'Enter percentage between 0 and 100.' : 'Enter fixed fee in Rupees.'}
              icon={isPercentage ? Percent : IndianRupee}
            />
          </div>

          {/* Live Calculation Preview Banner */}
          <div
            style={{
              backgroundColor: 'var(--bg-sand)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-sm)',
              padding: '1.1rem 1.25rem',
              marginBottom: '1.75rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Calculator size={15} /> Sample Calculation Preview (₹1,000 Item)
              </span>
              <strong style={{ fontSize: '1.15rem', color: 'var(--primary-navy)' }}>
                ₹{sampleComputedTax.toFixed(2)} tax
              </strong>
            </div>

            <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
              {isPercentage ? (
                <>Subtotal ₹1,000.00 × <strong>{numRate}%</strong> = ₹{sampleComputedTax.toFixed(2)} tax (Customer Billed Total: <strong>₹{sampleTotal.toFixed(2)}</strong>)</>
              ) : (
                <>Subtotal ₹1,000.00 + Fixed <strong>₹{numRate.toFixed(2)}</strong> fee = Customer Billed Total: <strong>₹{sampleTotal.toFixed(2)}</strong></>
              )}
            </div>
          </div>

          {/* Active Status Checkbox */}
          <div style={{ marginBottom: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                style={{ width: '16px', height: '16px', marginTop: '2px', cursor: 'pointer' }}
              />
              <div>
                <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  Active Tax Rate
                </strong>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Immediately available for product assignments and automatic invoice calculations.
                </div>
              </div>
            </label>
          </div>

          {/* Actions */}
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
            <Link to="/admin/taxes">
              <Button variant="outline" type="button" disabled={submitting}>
                Cancel
              </Button>
            </Link>

            <Button
              variant="primary"
              type="submit"
              loading={submitting}
              icon={Percent}
            >
              Create Tax Rate
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaxCreate;

