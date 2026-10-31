import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, AlertCircle } from 'lucide-react';
import { createTemplate, updateTemplate, getCatalogProducts } from '../../../services/api';
import { useToast } from '../../../components/common/Toast';
import Button from '../../../components/common/Button';

export const TemplateModal = ({ isOpen, onClose, template = null, onSuccess }) => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    validity_days: 30,
    payment_terms: 'Due on receipt',
    terms_and_conditions: '',
    lines: []
  });

  useEffect(() => {
    // Load active products for preset line item selection
    const loadProducts = async () => {
      const data = await getCatalogProducts();
      setProducts(data || []);
    };
    if (isOpen) {
      loadProducts();
    }
  }, [isOpen]);

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name || '',
        description: template.description || '',
        validity_days: template.validity_days || 30,
        payment_terms: template.payment_terms || 'Due on receipt',
        terms_and_conditions: template.terms_and_conditions || '',
        lines: (template.lines || []).map((l) => ({
          product_id: l.product_id,
          quantity: l.quantity || 1
        }))
      });
    } else {
      setFormData({
        name: '',
        description: '',
        validity_days: 30,
        payment_terms: 'Due on receipt',
        terms_and_conditions: 'Standard Brightloop Terms of Service apply.',
        lines: []
      });
    }
    setErrors({});
  }, [template, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Template name is required.';
    }
    const days = parseInt(formData.validity_days, 10);
    if (isNaN(days) || days < 1 || days > 365) {
      newErrors.validity_days = 'Validity days must be between 1 and 365.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddLine = () => {
    if (products.length === 0) {
      addToast('No products available to add as presets.', 'warning');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      lines: [...prev.lines, { product_id: products[0].id, quantity: 1 }]
    }));
  };

  const handleRemoveLine = (index) => {
    setFormData((prev) => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== index)
    }));
  };

  const handleLineChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.lines];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, lines: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        validity_days: parseInt(formData.validity_days, 10),
        payment_terms: formData.payment_terms.trim(),
        terms_and_conditions: formData.terms_and_conditions.trim() || undefined,
        lines: formData.lines.length > 0 ? formData.lines : undefined
      };

      if (template?.id) {
        await updateTemplate(template.id, payload);
        addToast('Template updated successfully!', 'success');
      } else {
        await createTemplate(payload);
        addToast('Template created successfully!', 'success');
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Template form error:', err);
      addToast(err.message || 'Failed to save template', 'error');
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
          maxWidth: '620px',
          maxHeight: '90vh',
          overflowY: 'auto',
          marginBottom: 0,
          boxShadow: 'var(--shadow-lg)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-title-row">
          <h3>{template ? 'Edit Quotation Template' : 'Create Quotation Template'}</h3>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: '0.25rem' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              Template Name <span className="required">*</span>
            </label>
            <input
              type="text"
              className={`form-input ${errors.name ? 'input-error' : ''}`}
              placeholder="e.g. Standard SaaS Annual Plan"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={loading}
            />
            {errors.name && (
              <span className="field-error">
                <AlertCircle size={14} /> {errors.name}
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <input
              type="text"
              className="form-input"
              placeholder="Brief summary of when to use this template"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={loading}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">
                Validity (Days) <span className="required">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="365"
                className={`form-input ${errors.validity_days ? 'input-error' : ''}`}
                value={formData.validity_days}
                onChange={(e) => setFormData({ ...formData, validity_days: e.target.value })}
                disabled={loading}
              />
              {errors.validity_days && (
                <span className="field-error">
                  <AlertCircle size={14} /> {errors.validity_days}
                </span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Payment Terms</label>
              <select
                className="form-input"
                value={formData.payment_terms}
                onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                disabled={loading}
              >
                <option value="Due on receipt">Due on receipt</option>
                <option value="Net 15">Net 15 days</option>
                <option value="Net 30">Net 30 days</option>
                <option value="Net 60">Net 60 days</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Terms & Conditions</label>
            <textarea
              className="form-input"
              rows={2}
              placeholder="Terms and contractual conditions displayed on generated quotations"
              value={formData.terms_and_conditions}
              onChange={(e) => setFormData({ ...formData, terms_and_conditions: e.target.value })}
              disabled={loading}
            />
          </div>

          {/* Preset Line Items Section */}
          <div style={{ marginTop: '1.25rem', marginBottom: '1.5rem', borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>
                Default Line Items (Presets)
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={Plus}
                onClick={handleAddLine}
              >
                Add Preset Item
              </Button>
            </div>

            {formData.lines.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                No default lines configured. Quotations created from this template will start with empty lines.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {formData.lines.map((line, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <select
                      className="form-input"
                      style={{ flex: 1 }}
                      value={line.product_id}
                      onChange={(e) => handleLineChange(idx, 'product_id', e.target.value)}
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (${parseFloat(p.unit_price || 0).toFixed(2)})
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      style={{ width: '80px' }}
                      value={line.quantity}
                      onChange={(e) => handleLineChange(idx, 'quantity', parseInt(e.target.value, 10) || 1)}
                    />

                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ color: '#DC2626' }}
                      onClick={() => handleRemoveLine(idx)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
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
              {template ? 'Save Changes' : 'Create Template'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TemplateModal;

