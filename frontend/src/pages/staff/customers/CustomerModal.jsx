import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { createCustomer, updateCustomer } from '../../../services/api';
import { useToast } from '../../../components/common/Toast';
import Button from '../../../components/common/Button';

export const CustomerModal = ({ isOpen, onClose, customer = null, onSuccess }) => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company_name: '',
    tax_id: '',
    billing_address: '',
    shipping_address: ''
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        company_name: customer.company_name || '',
        tax_id: customer.tax_id || '',
        billing_address: customer.billing_address || '',
        shipping_address: customer.shipping_address || ''
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        company_name: '',
        tax_id: '',
        billing_address: '',
        shipping_address: ''
      });
    }
    setErrors({});
  }, [customer, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Customer name is required.';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (formData.phone && formData.phone.trim().length > 0 && formData.phone.trim().length < 7) {
      newErrors.phone = 'Phone number must have at least 7 digits.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      if (customer?.id) {
        await updateCustomer(customer.id, formData);
        addToast('Customer updated successfully!', 'success');
      } else {
        await createCustomer(formData);
        addToast('Customer created successfully!', 'success');
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Customer form submit error:', err);
      addToast(err.message || 'Failed to save customer', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(18, 40, 56, 0.45)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        className="content-card"
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          overflowY: 'auto',
          marginBottom: 0,
          boxShadow: 'var(--shadow-lg)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-title-row">
          <h3>{customer ? 'Edit Customer' : 'Add New Customer'}</h3>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm"
            style={{ padding: '0.25rem' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              Full Name <span className="required">*</span>
            </label>
            <input
              type="text"
              name="name"
              className={`form-input ${errors.name ? 'input-error' : ''}`}
              placeholder="e.g. Jane Doe"
              value={formData.name}
              onChange={handleChange}
              disabled={loading}
            />
            {errors.name && (
              <span className="field-error">
                <AlertCircle size={14} /> {errors.name}
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">
                Email Address <span className="required">*</span>
              </label>
              <input
                type="email"
                name="email"
                className={`form-input ${errors.email ? 'input-error' : ''}`}
                placeholder="client@company.com"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
              />
              {errors.email && (
                <span className="field-error">
                  <AlertCircle size={14} /> {errors.email}
                </span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="text"
                name="phone"
                className={`form-input ${errors.phone ? 'input-error' : ''}`}
                placeholder="+1 555-0199"
                value={formData.phone}
                onChange={handleChange}
                disabled={loading}
              />
              {errors.phone && (
                <span className="field-error">
                  <AlertCircle size={14} /> {errors.phone}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Company Name</label>
              <input
                type="text"
                name="company_name"
                className="form-input"
                placeholder="Acme Corp"
                value={formData.company_name}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Tax ID / GST Number</label>
              <input
                type="text"
                name="tax_id"
                className="form-input"
                placeholder="e.g. GSTIN1234567"
                value={formData.tax_id}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Billing Address</label>
            <textarea
              name="billing_address"
              className="form-input"
              rows={2}
              placeholder="Street address, City, Postal Code, Country"
              value={formData.billing_address}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Shipping Address</label>
            <textarea
              name="shipping_address"
              className="form-input"
              rows={2}
              placeholder="Same as billing, or provide separate delivery address"
              value={formData.shipping_address}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <Button
              type="submit"
              variant="primary"
              icon={Save}
              loading={loading}
            >
              {customer ? 'Update Customer' : 'Create Customer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerModal;

