import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  Package,
  ArrowLeft,
  IndianRupee,
  FileText,
  Tag,
  CheckCircle,
  AlertCircle,
  Save,
  TrendingUp,
  Clock,
  Layers,
  Plus,
  Edit2,
  Power,
  RotateCcw,
  X,
  ExternalLink,
  Calculator,
  Hash,
  Eye,
  Percent
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import Button from '../../components/common/Button';
import InputField from '../../components/forms/InputField';
import Alert from '../../components/common/Alert';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const API_BASE_URL = 'http://localhost:5000/api';

export const ProductEdit = () => {
  const { id } = useParams();
  const { session, role } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Form states
  const [name, setName] = useState('');
  const [type, setType] = useState('service');
  const [salesPrice, setSalesPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [initialProduct, setInitialProduct] = useState(null);

  // UI states
  const [initialLoading, setInitialLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Variants state
  const [variants, setVariants] = useState([]);
  const [loadingVariants, setLoadingVariants] = useState(false);

  // Variant Modal states
  const [showAddVariantModal, setShowAddVariantModal] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null);
  const [variantFormLoading, setVariantFormLoading] = useState(false);
  const [variantFormError, setVariantFormError] = useState('');

  // Variant Form fields
  const [varName, setVarName] = useState('');
  const [attrName, setAttrName] = useState('');
  const [attrValue, setAttrValue] = useState('');
  const [priceExtra, setPriceExtra] = useState('0.00');
  const [sku, setSku] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Status toggle confirmation
  const [confirmVariantStatus, setConfirmVariantStatus] = useState(null);
  const [variantToggleLoading, setVariantToggleLoading] = useState(false);

  const isAdmin = role === 'ADMIN';

  // Taxes state
  const [allTaxes, setAllTaxes] = useState([]);
  const [selectedTaxIds, setSelectedTaxIds] = useState([]);
  const [loadingTaxes, setLoadingTaxes] = useState(false);

  // Real-time calculation
  const numSales = parseFloat(salesPrice) || 0;
  const numCost = parseFloat(costPrice) || 0;
  const grossProfit = numSales - numCost;
  const marginPercentage = numSales > 0 ? ((grossProfit / numSales) * 100).toFixed(1) : '0.0';

  // Live modal price calculation
  const parsedModalExtra = parseFloat(priceExtra) || 0;
  const liveModalFinalPrice = Number((numSales + parsedModalExtra).toFixed(2));

  // Load product to edit
  const fetchProduct = useCallback(async () => {
    if (!id || !session?.access_token) return;

    try {
      setInitialLoading(true);
      setErrorMessage('');

      const res = await fetch(`${API_BASE_URL}/products/${id}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to retrieve product details.');
      }

      const p = data.product;
      setInitialProduct(p);
      setName(p.name || '');
      setType(p.type || 'service');
      setSalesPrice(p.sales_price !== undefined ? p.sales_price.toString() : '');
      setCostPrice(p.cost_price !== undefined ? p.cost_price.toString() : '');
      setNotes(p.notes || '');
    } catch (err) {
      console.error('Error fetching product for edit:', err);
      setErrorMessage(err.message || 'Product could not be loaded.');
    } finally {
      setInitialLoading(false);
    }
  }, [id, session?.access_token]);

  // Load variants for this product
  const fetchVariants = useCallback(async () => {
    if (!id || !session?.access_token) return;

    try {
      setLoadingVariants(true);

      const res = await fetch(`${API_BASE_URL}/products/${id}/variants`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      const data = await res.json();

      if (res.ok) {
        setVariants(data.variants || []);
      }
    } catch (err) {
      console.error('Error fetching variants in edit:', err);
    } finally {
      setLoadingVariants(false);
    }
  }, [id, session?.access_token]);

  // Load available active taxes and assigned product taxes
  const fetchTaxesData = useCallback(async () => {
    if (!id || !session?.access_token) return;
    try {
      setLoadingTaxes(true);
      const [resAssigned, resAll] = await Promise.all([
        fetch(`${API_BASE_URL}/products/${id}/taxes`, {
          headers: { Authorization: `Bearer ${session.access_token}` }
        }),
        fetch(`${API_BASE_URL}/taxes?status=active&limit=100`, {
          headers: { Authorization: `Bearer ${session.access_token}` }
        })
      ]);

      const [dataAssigned, dataAll] = await Promise.all([
        resAssigned.json(),
        resAll.json()
      ]);

      if (resAll.ok) {
        setAllTaxes(dataAll.taxes || []);
      }
      if (resAssigned.ok) {
        setSelectedTaxIds((dataAssigned.taxes || []).map((t) => t.id));
      }
    } catch (err) {
      console.error('Error fetching taxes for edit:', err);
    } finally {
      setLoadingTaxes(false);
    }
  }, [id, session?.access_token]);

  useEffect(() => {
    fetchProduct();
    fetchVariants();
    fetchTaxesData();
  }, [fetchProduct, fetchVariants, fetchTaxesData]);

  const handleToggleTaxSelection = (taxId) => {
    setSelectedTaxIds((prev) =>
      prev.includes(taxId) ? prev.filter((t) => t !== taxId) : [...prev, taxId]
    );
  };

  // Format currency (Indian Rupees)
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '—';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Client-side validation for Product
  const validateForm = () => {
    const errors = {};

    if (!name.trim()) {
      errors.name = 'Product name is required.';
    } else if (name.trim().length > 255) {
      errors.name = 'Product name cannot exceed 255 characters.';
    }

    if (!['service', 'goods', 'digital'].includes(type)) {
      errors.type = 'Product type must be Service, Goods, or Digital.';
    }

    if (salesPrice === '' || salesPrice === null || salesPrice === undefined) {
      errors.salesPrice = 'Sales price is required.';
    } else if (isNaN(Number(salesPrice)) || Number(salesPrice) < 0) {
      errors.salesPrice = 'Sales price must be a valid non-negative number.';
    }

    if (costPrice === '' || costPrice === null || costPrice === undefined) {
      errors.costPrice = 'Cost price is required.';
    } else if (isNaN(Number(costPrice)) || Number(costPrice) < 0) {
      errors.costPrice = 'Cost price must be a valid non-negative number.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit product changes
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!validateForm()) {
      setErrorMessage('Please fix the highlighted errors before saving.');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        name: name.trim(),
        type,
        sales_price: parseFloat(salesPrice),
        cost_price: parseFloat(costPrice),
        notes: notes.trim() || null
      };

      const res = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to update product.');
      }

      // Sync assigned product taxes
      await fetch(`${API_BASE_URL}/products/${id}/taxes`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ tax_ids: selectedTaxIds })
      });

      addToast(`Product "${name.trim()}" updated successfully.`, 'success');
      navigate(`/admin/products/${id}`);
    } catch (err) {
      console.error('Error updating product:', err);
      setErrorMessage(err.message || 'Failed to update product. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Reset Variant Form
  const resetVariantForm = () => {
    setVarName('');
    setAttrName('');
    setAttrValue('');
    setPriceExtra('0.00');
    setSku('');
    setIsActive(true);
    setVariantFormError('');
  };

  // Open Add Variant Modal
  const openAddVariantModal = () => {
    resetVariantForm();
    setShowAddVariantModal(true);
  };

  // Open Edit Variant Modal
  const openEditVariantModal = (v) => {
    setEditingVariant(v);
    setVarName(v.variant_name || '');
    setAttrName(v.attribute_name || '');
    setAttrValue(v.attribute_value || '');
    setPriceExtra(v.price_extra !== undefined ? v.price_extra.toString() : '0.00');
    setSku(v.sku || '');
    setIsActive(v.is_active !== false);
    setVariantFormError('');
  };

  // Create Variant handler
  const handleCreateVariant = async (e) => {
    e.preventDefault();
    setVariantFormError('');

    if (!varName.trim()) {
      setVariantFormError('Variant name is required.');
      return;
    }
    if (!attrName.trim()) {
      setVariantFormError('Attribute name is required (e.g. Brand, Color, Tier).');
      return;
    }
    if (!attrValue.trim()) {
      setVariantFormError('Attribute value is required (e.g. Standard, Odoo, SAP).');
      return;
    }

    const numExtra = parseFloat(priceExtra);
    if (isNaN(numExtra) || numExtra < 0) {
      setVariantFormError('Additional price must be a valid non-negative number.');
      return;
    }

    try {
      setVariantFormLoading(true);

      const payload = {
        variant_name: varName.trim(),
        attribute_name: attrName.trim(),
        attribute_value: attrValue.trim(),
        price_extra: numExtra,
        sku: sku.trim() || null,
        is_active: isActive
      };

      const res = await fetch(`${API_BASE_URL}/products/${id}/variants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to create product variant.');
      }

      addToast(data.message || `Variant "${varName}" created successfully.`, 'success');
      setShowAddVariantModal(false);
      resetVariantForm();
      fetchVariants();
    } catch (err) {
      console.error('Error creating variant:', err);
      setVariantFormError(err.message || 'Failed to create variant.');
    } finally {
      setVariantFormLoading(false);
    }
  };

  // Update Variant handler
  const handleUpdateVariant = async (e) => {
    e.preventDefault();
    if (!editingVariant) return;
    setVariantFormError('');

    if (!varName.trim()) {
      setVariantFormError('Variant name is required.');
      return;
    }
    if (!attrName.trim()) {
      setVariantFormError('Attribute name is required.');
      return;
    }
    if (!attrValue.trim()) {
      setVariantFormError('Attribute value is required.');
      return;
    }

    const numExtra = parseFloat(priceExtra);
    if (isNaN(numExtra) || numExtra < 0) {
      setVariantFormError('Additional price must be a valid non-negative number.');
      return;
    }

    try {
      setVariantFormLoading(true);

      const payload = {
        variant_name: varName.trim(),
        attribute_name: attrName.trim(),
        attribute_value: attrValue.trim(),
        price_extra: numExtra,
        sku: sku.trim() || null,
        is_active: isActive
      };

      const res = await fetch(`${API_BASE_URL}/products/${id}/variants/${editingVariant.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to update variant.');
      }

      addToast(data.message || `Variant "${varName}" updated successfully.`, 'success');
      setEditingVariant(null);
      resetVariantForm();
      fetchVariants();
    } catch (err) {
      console.error('Error updating variant:', err);
      setVariantFormError(err.message || 'Failed to update variant.');
    } finally {
      setVariantFormLoading(false);
    }
  };

  // Toggle Variant Status
  const handleConfirmToggleVariantStatus = async () => {
    if (!confirmVariantStatus) return;

    const targetStatus = confirmVariantStatus.is_active === false ? true : false;

    try {
      setVariantToggleLoading(true);

      const res = await fetch(`${API_BASE_URL}/products/${id}/variants/${confirmVariantStatus.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ is_active: targetStatus })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to update variant status.');
      }

      addToast(
        data.message || `Variant "${confirmVariantStatus.variant_name}" ${targetStatus ? 'activated' : 'deactivated'} successfully.`,
        'success'
      );

      setConfirmVariantStatus(null);
      fetchVariants();
    } catch (err) {
      console.error('Error toggling variant status:', err);
      addToast(err.message || 'Failed to update variant status.', 'error');
    } finally {
      setVariantToggleLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <LoadingSpinner size="large" message="Loading product information..." />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Navigation Breadcrumb / Back Link */}
      <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link
          to={`/admin/products/${id}`}
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
          <span>Back to Product Details</span>
        </Link>

        <Link
          to={`/admin/products/${id}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontSize: '0.85rem',
            color: 'var(--primary-navy)',
            fontWeight: 600
          }}
        >
          <Eye size={15} />
          <span>View Details Page</span>
        </Link>
      </div>

      {/* Header */}
      <div className="section-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Package size={26} color="var(--primary-navy)" />
            Edit Product
          </h1>
          <p style={{ marginTop: '0.25rem' }}>
            Modify pricing, specifications, and variants for &quot;{initialProduct?.name}&quot;.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={() => {
            const el = document.getElementById('variants-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          <Layers size={15} />
          <span>Jump to Variants ({variants.length})</span>
        </button>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <Alert
          type="error"
          message={errorMessage}
          onClose={() => setErrorMessage('')}
        />
      )}

      {/* Read-only System Metadata Banner */}
      {initialProduct && (
        <div
          style={{
            backgroundColor: 'var(--bg-sand)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.85rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)'
          }}
        >
          <div>
            System UUID: <code style={{ color: 'var(--primary-navy)', fontWeight: 600 }}>{initialProduct.id}</code>
          </div>
          <div>
            Status:{' '}
            <span className={`badge ${initialProduct.is_active ? 'badge-active' : 'badge-inactive'}`}>
              {initialProduct.is_active ? 'Active' : 'Archived'}
            </span>
          </div>
          <div>
            Registered:{' '}
            <strong>
              {new Date(initialProduct.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </strong>
          </div>
        </div>
      )}

      {/* Form Card */}
      <div
        className="form-card"
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-light)',
          padding: '2rem',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: '2rem'
        }}
      >
        <form onSubmit={handleSubmit} noValidate>
          {/* Product Name */}
          <InputField
            id="edit-product-name"
            name="name"
            label="Product Name"
            placeholder="e.g. Enterprise Cloud Storage"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: '' }));
            }}
            required
            error={fieldErrors.name}
            hint="Display name visible to administrators and customers."
            icon={Package}
          />

          {/* Product Type */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label htmlFor="edit-product-type" className="form-label">
              Product Type <span className="required">*</span>
            </label>
            <div className="input-wrapper">
              <span className="input-icon">
                <Tag size={18} />
              </span>
              <select
                id="edit-product-type"
                name="type"
                className={`form-input has-icon ${fieldErrors.type ? 'input-error' : ''}`}
                value={type}
                onChange={(e) => {
                  setType(e.target.value);
                  if (fieldErrors.type) setFieldErrors((prev) => ({ ...prev, type: '' }));
                }}
              >
                <option value="service">Service (Consulting, hosting, support tiers)</option>
                <option value="goods">Goods (Physical hardware, peripherals, bundled items)</option>
                <option value="digital">Digital (Software licenses, downloadable assets, APIs)</option>
              </select>
            </div>
            {fieldErrors.type && <span className="field-error">{fieldErrors.type}</span>}
          </div>

          {/* Pricing Row: Sales Price and Cost Price */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
            {/* Sales Price */}
            <div>
              <InputField
                id="edit-sales-price"
                name="sales_price"
                label="Sales Price (₹)"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={salesPrice}
                onChange={(e) => {
                  setSalesPrice(e.target.value);
                  if (fieldErrors.salesPrice) setFieldErrors((prev) => ({ ...prev, salesPrice: '' }));
                }}
                required
                error={fieldErrors.salesPrice}
                hint="Customer billing rate."
                icon={IndianRupee}
              />
            </div>

            {/* Cost Price */}
            <div>
              <InputField
                id="edit-cost-price"
                name="cost_price"
                label="Cost Price (₹)"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={costPrice}
                onChange={(e) => {
                  setCostPrice(e.target.value);
                  if (fieldErrors.costPrice) setFieldErrors((prev) => ({ ...prev, costPrice: '' }));
                }}
                required
                error={fieldErrors.costPrice}
                hint="Baseline cost (Admin only)."
                icon={IndianRupee}
              />
            </div>
          </div>

          {/* Profit & Margin Preview Card */}
          <div
            style={{
              backgroundColor: 'var(--bg-sand)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-sm)',
              padding: '1rem 1.25rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: grossProfit >= 0 ? 'var(--status-active-bg)' : 'var(--status-inactive-bg)',
                  color: grossProfit >= 0 ? 'var(--status-active-text)' : 'var(--status-inactive-text)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <TrendingUp size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Updated Margin
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: grossProfit >= 0 ? 'var(--status-active-text)' : 'var(--status-inactive-text)' }}>
                  ₹{grossProfit.toFixed(2)} ({marginPercentage}%)
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Sales: <strong>₹{numSales.toFixed(2)}</strong> | Cost: <strong>₹{numCost.toFixed(2)}</strong>
            </div>
          </div>

          {/* Notes / Description */}
          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label htmlFor="edit-product-notes" className="form-label">
              Product Description / Internal Notes <small style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Optional)</small>
            </label>
            <div className="input-wrapper">
              <textarea
                id="edit-product-notes"
                name="notes"
                className="form-input"
                style={{ minHeight: '90px', padding: '0.75rem', resize: 'vertical' }}
                placeholder="Product description, technical parameters, or internal instructions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Section: Applicable Taxes */}
          <div
            style={{
              marginBottom: '2rem',
              padding: '1.25rem',
              backgroundColor: '#F8FAFC',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid #E2E8F0'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.75rem',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Percent size={18} style={{ color: 'var(--primary-navy)' }} />
                <label className="form-label" style={{ margin: 0, fontWeight: 600 }}>
                  Applicable Fiscal Taxes ({selectedTaxIds.length} selected)
                </label>
              </div>

              <Link
                to="/admin/taxes"
                target="_blank"
                style={{ fontSize: '0.8rem', color: 'var(--primary-navy)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
              >
                <span>Tax Directory</span>
                <ExternalLink size={12} />
              </Link>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', marginBottom: '1rem' }}>
              Select which active taxes apply to this product during subscription billing.
            </p>

            {loadingTaxes ? (
              <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Loading available taxes...
              </div>
            ) : allTaxes.length === 0 ? (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                No active taxes configured.{' '}
                <Link to="/admin/taxes/new" style={{ color: 'var(--primary-navy)' }}>
                  Create a tax
                </Link>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                  gap: '0.65rem'
                }}
              >
                {allTaxes.map((t) => {
                  const isChecked = selectedTaxIds.includes(t.id);
                  const isPct = t.computation_type === 'percentage';
                  const rate = Number(t.rate_percentage) || 0;

                  return (
                    <div
                      key={t.id}
                      onClick={() => handleToggleTaxSelection(t.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.65rem 0.85rem',
                        borderRadius: 'var(--radius-sm)',
                        border: isChecked ? '1.5px solid var(--primary-navy)' : '1px solid var(--border-light)',
                        backgroundColor: isChecked ? 'var(--primary-navy-soft)' : '#FFFFFF',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          style={{ width: '15px', height: '15px', accentColor: 'var(--primary-navy)', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--primary-navy)' }}>
                          {t.name}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.825rem', fontWeight: 600, color: isPct ? 'var(--primary-navy)' : '#166534' }}>
                        {isPct ? `${rate}%` : formatCurrency(rate)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
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
            <Link to={`/admin/products/${id}`}>
              <Button variant="outline" type="button" disabled={submitting}>
                Cancel
              </Button>
            </Link>

            <Button
              variant="primary"
              type="submit"
              loading={submitting}
              icon={Save}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>

      {/* ============================================================================== */}
      {/* PRODUCT VARIANTS SECTION (Embedded right here on the Edit Page) */}
      {/* ============================================================================== */}
      <div
        id="variants-section"
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-light)',
          padding: '1.75rem',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: '2rem'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0 }}>
              <Layers size={20} color="var(--primary-navy)" />
              Product Variants ({variants.length})
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Add, edit, or toggle SKU variants and incremental pricing modifiers for this product.
            </p>
          </div>

          {isAdmin && (
            <Button
              variant="primary"
              size="small"
              icon={Plus}
              onClick={openAddVariantModal}
            >
              Add Variant
            </Button>
          )}
        </div>

        {/* Variants Table or Empty State */}
        {loadingVariants ? (
          <div style={{ padding: '2.5rem', textAlign: 'center' }}>
            <LoadingSpinner size="medium" message="Loading product variants..." />
          </div>
        ) : variants.length === 0 ? (
          <div
            style={{
              padding: '2.5rem 1.5rem',
              textAlign: 'center',
              backgroundColor: 'var(--bg-sand)',
              borderRadius: 'var(--radius-sm)',
              border: '1px dashed var(--border-light)'
            }}
          >
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                backgroundColor: '#FFFFFF',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '0.75rem',
                color: 'var(--primary-navy)'
              }}
            >
              <Layers size={22} />
            </div>
            <h4 style={{ fontSize: '1.05rem', color: 'var(--primary-navy)', marginBottom: '0.25rem' }}>
              No variants configured for this product
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: '440px', margin: '0 auto 1.25rem' }}>
              Configure product variants (e.g. Standard, Odoo Edition, SAP Edition, 256GB) to allow customer option selections with price adjustments.
            </p>
            {isAdmin && (
              <Button variant="primary" size="small" icon={Plus} onClick={openAddVariantModal}>
                Add First Variant
              </Button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Variant Name</th>
                  <th>Attribute</th>
                  <th>Value</th>
                  <th>Additional Price</th>
                  <th>Final Price</th>
                  <th>SKU</th>
                  <th>Status</th>
                  {isAdmin && <th style={{ textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {variants.map((v) => {
                  const isVarInactive = v.is_active === false;

                  return (
                    <tr key={v.id} style={{ opacity: isVarInactive ? 0.7 : 1 }}>
                      {/* Name */}
                      <td style={{ fontWeight: 600, color: 'var(--primary-navy)' }}>
                        {v.variant_name}
                      </td>

                      {/* Attribute */}
                      <td>
                        <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>
                          {v.attribute_name}
                        </span>
                      </td>

                      {/* Attribute Value */}
                      <td>
                        <span
                          className="badge"
                          style={{
                            backgroundColor: 'var(--bg-sand)',
                            color: 'var(--primary-navy)',
                            textTransform: 'none',
                            fontSize: '0.8rem'
                          }}
                        >
                          {v.attribute_value}
                        </span>
                      </td>

                      {/* Additional Price */}
                      <td style={{ fontWeight: 600 }}>
                        {v.price_extra > 0 ? (
                          <span style={{ color: '#166534' }}>+{formatCurrency(v.price_extra)}</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>₹0.00</span>
                        )}
                      </td>

                      {/* Final Calculated Price */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <strong style={{ fontSize: '0.95rem', color: 'var(--primary-navy)' }}>
                            {formatCurrency(v.final_price)}
                          </strong>
                          <small style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Base {formatCurrency(numSales)} + {formatCurrency(v.price_extra)}
                          </small>
                        </div>
                      </td>

                      {/* SKU */}
                      <td>
                        {v.sku ? (
                          <code style={{ fontSize: '0.8rem', backgroundColor: 'var(--bg-sand)', padding: '0.15rem 0.35rem', borderRadius: '3px' }}>
                            {v.sku}
                          </code>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`badge ${v.is_active !== false ? 'badge-active' : 'badge-inactive'}`}>
                          {v.is_active !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Actions */}
                      {isAdmin && (
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                            <button
                              type="button"
                              onClick={() => openEditVariantModal(v)}
                              className="btn btn-ghost btn-sm"
                              style={{ padding: '0.35rem', color: 'var(--primary-navy)' }}
                              title="Edit variant"
                            >
                              <Edit2 size={15} />
                            </button>

                            <button
                              type="button"
                              onClick={() => setConfirmVariantStatus(v)}
                              className="btn btn-ghost btn-sm"
                              style={{
                                padding: '0.35rem',
                                color: v.is_active !== false ? '#DC2626' : '#166534'
                              }}
                              title={v.is_active !== false ? 'Deactivate variant' : 'Activate variant'}
                            >
                              {v.is_active !== false ? <Power size={15} /> : <RotateCcw size={15} />}
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ============================================================================== */}
      {/* MODAL: ADD PRODUCT VARIANT */}
      {/* ============================================================================== */}
      {showAddVariantModal && (
        <div className="modal-overlay" onClick={() => !variantFormLoading && setShowAddVariantModal(false)}>
          <div className="modal-box" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plus size={18} />
                Add Product Variant
              </h3>
              <button
                className="modal-close"
                onClick={() => !variantFormLoading && setShowAddVariantModal(false)}
                disabled={variantFormLoading}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateVariant} noValidate>
              <div className="modal-body" style={{ padding: '1.25rem 1.5rem', overflowY: 'auto' }}>
                {variantFormError && (
                  <Alert
                    type="error"
                    message={variantFormError}
                    onClose={() => setVariantFormError('')}
                  />
                )}

                {/* Parent Product Info Banner */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-sand)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.75rem 1rem',
                    marginBottom: '1.25rem',
                    fontSize: '0.85rem'
                  }}
                >
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
                    Parent Product (Auto-Linked)
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--primary-navy)', fontSize: '0.95rem' }}>
                    {name || initialProduct?.name}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.15rem' }}>
                    Current Base Sales Price: <strong>{formatCurrency(numSales)}</strong>
                  </div>
                </div>

                {/* Variant Name */}
                <InputField
                  id="modal-variant-name"
                  name="variant_name"
                  label="Variant Name"
                  placeholder="e.g. Standard, Odoo Edition, SAP Edition, 256GB"
                  value={varName}
                  onChange={(e) => setVarName(e.target.value)}
                  required
                  hint="Descriptive name shown to customers on checkout."
                />

                {/* Attribute Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <InputField
                    id="modal-attribute-name"
                    name="attribute_name"
                    label="Attribute Name"
                    placeholder="e.g. Brand, Color, Tier"
                    value={attrName}
                    onChange={(e) => setAttrName(e.target.value)}
                    required
                    hint="Classification key"
                  />

                  <InputField
                    id="modal-attribute-value"
                    name="attribute_value"
                    label="Attribute Value"
                    placeholder="e.g. Odoo, SAP, Gold"
                    value={attrValue}
                    onChange={(e) => setAttrValue(e.target.value)}
                    required
                    hint="Specific option value"
                  />
                </div>

                {/* Pricing & SKU Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <InputField
                    id="modal-price-extra"
                    name="price_extra"
                    label="Additional Price (₹)"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={priceExtra}
                    onChange={(e) => setPriceExtra(e.target.value)}
                    required
                    hint="Added to base price (>= 0)"
                    icon={IndianRupee}
                  />

                  <InputField
                    id="modal-variant-sku"
                    name="sku"
                    label="SKU (Stock Keeping Unit)"
                    placeholder="e.g. ERP-ODOO-01"
                    value={sku}
                    onChange={(e) => setSku(e.target.value.toUpperCase())}
                    hint="Unique catalog SKU identifier"
                    icon={Hash}
                  />
                </div>

                {/* Real-time Final Price Calculation Card */}
                <div
                  style={{
                    backgroundColor: '#F0FDF4',
                    border: '1px solid #86EFAC',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.85rem 1rem',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calculator size={18} color="#166534" />
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 700, textTransform: 'uppercase' }}>
                        Calculated Final Price
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#15803D' }}>
                        Base {formatCurrency(numSales)} + Extra {formatCurrency(parsedModalExtra)}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#166534' }}>
                    {formatCurrency(liveModalFinalPrice)}
                  </div>
                </div>

                {/* Status Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="modal-variant-active-check"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--primary-navy)', cursor: 'pointer' }}
                  />
                  <label htmlFor="modal-variant-active-check" style={{ fontSize: '0.9rem', cursor: 'pointer', fontWeight: 500 }}>
                    Active (Ready for sales selection & quotation)
                  </label>
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', padding: '1rem 1.5rem', borderTop: '1px solid var(--border-light)' }}>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setShowAddVariantModal(false)}
                  disabled={variantFormLoading}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  loading={variantFormLoading}
                  icon={Plus}
                >
                  Create Variant
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================================== */}
      {/* MODAL: EDIT PRODUCT VARIANT */}
      {/* ============================================================================== */}
      {editingVariant && (
        <div className="modal-overlay" onClick={() => !variantFormLoading && setEditingVariant(null)}>
          <div className="modal-box" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Edit2 size={18} />
                Edit Variant: {editingVariant.variant_name}
              </h3>
              <button
                className="modal-close"
                onClick={() => !variantFormLoading && setEditingVariant(null)}
                disabled={variantFormLoading}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateVariant} noValidate>
              <div className="modal-body" style={{ padding: '1.25rem 1.5rem', overflowY: 'auto' }}>
                {variantFormError && (
                  <Alert
                    type="error"
                    message={variantFormError}
                    onClose={() => setVariantFormError('')}
                  />
                )}

                {/* Parent Product Info */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-sand)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.75rem 1rem',
                    marginBottom: '1.25rem',
                    fontSize: '0.85rem'
                  }}
                >
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
                    Parent Product
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--primary-navy)' }}>
                    {name || initialProduct?.name} (Base Price: {formatCurrency(numSales)})
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.775rem', marginTop: '0.2rem' }}>
                    Variant ID: <code>{editingVariant.id}</code>
                  </div>
                </div>

                {/* Variant Name */}
                <InputField
                  id="modal-edit-variant-name"
                  name="variant_name"
                  label="Variant Name"
                  placeholder="e.g. Standard, Odoo Edition"
                  value={varName}
                  onChange={(e) => setVarName(e.target.value)}
                  required
                />

                {/* Attribute Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <InputField
                    id="modal-edit-attribute-name"
                    name="attribute_name"
                    label="Attribute Name"
                    placeholder="e.g. Brand, Tier"
                    value={attrName}
                    onChange={(e) => setAttrName(e.target.value)}
                    required
                  />

                  <InputField
                    id="modal-edit-attribute-value"
                    name="attribute_value"
                    label="Attribute Value"
                    placeholder="e.g. Odoo, SAP"
                    value={attrValue}
                    onChange={(e) => setAttrValue(e.target.value)}
                    required
                  />
                </div>

                {/* Pricing & SKU Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <InputField
                    id="modal-edit-price-extra"
                    name="price_extra"
                    label="Additional Price (₹)"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={priceExtra}
                    onChange={(e) => setPriceExtra(e.target.value)}
                    required
                    icon={IndianRupee}
                  />

                  <InputField
                    id="modal-edit-variant-sku"
                    name="sku"
                    label="SKU"
                    placeholder="e.g. ERP-ODOO-01"
                    value={sku}
                    onChange={(e) => setSku(e.target.value.toUpperCase())}
                    icon={Hash}
                  />
                </div>

                {/* Live Final Price Calculation */}
                <div
                  style={{
                    backgroundColor: '#F0FDF4',
                    border: '1px solid #86EFAC',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.85rem 1rem',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calculator size={18} color="#166534" />
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 700, textTransform: 'uppercase' }}>
                        Calculated Final Price
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#15803D' }}>
                        Base {formatCurrency(numSales)} + Extra {formatCurrency(parsedModalExtra)}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#166534' }}>
                    {formatCurrency(liveModalFinalPrice)}
                  </div>
                </div>

                {/* Status Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="modal-edit-variant-active-check"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--primary-navy)', cursor: 'pointer' }}
                  />
                  <label htmlFor="modal-edit-variant-active-check" style={{ fontSize: '0.9rem', cursor: 'pointer', fontWeight: 500 }}>
                    Active Status
                  </label>
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', padding: '1rem 1.5rem', borderTop: '1px solid var(--border-light)' }}>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setEditingVariant(null)}
                  disabled={variantFormLoading}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  loading={variantFormLoading}
                  icon={Save}
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================================== */}
      {/* MODAL: DEACTIVATE / ACTIVATE VARIANT CONFIRMATION */}
      {/* ============================================================================== */}
      {confirmVariantStatus && (
        <div className="modal-overlay" onClick={() => !variantToggleLoading && setConfirmVariantStatus(null)}>
          <div className="modal-box" style={{ maxWidth: '460px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: confirmVariantStatus.is_active !== false ? '#B91C1C' : '#15803D' }}>
                {confirmVariantStatus.is_active !== false ? <Power size={20} /> : <RotateCcw size={20} />}
                {confirmVariantStatus.is_active !== false ? 'Deactivate Variant' : 'Activate Variant'}
              </h3>
              <button
                className="modal-close"
                onClick={() => !variantToggleLoading && setConfirmVariantStatus(null)}
                disabled={variantToggleLoading}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '1.25rem 1.5rem' }}>
              <p style={{ marginBottom: '1rem', lineHeight: 1.5 }}>
                Are you sure you want to {confirmVariantStatus.is_active !== false ? 'deactivate' : 'activate'}{' '}
                <strong>&quot;{confirmVariantStatus.variant_name}&quot;</strong>?
              </p>

              {confirmVariantStatus.is_active !== false ? (
                <div
                  style={{
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FCA5A5',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.75rem 1rem',
                    fontSize: '0.85rem',
                    color: '#991B1B'
                  }}
                >
                  <strong>Deactivation Impact:</strong> This variant will no longer be selectable for new customer subscriptions or quotations. Existing subscriptions will retain their contracted pricing.
                </div>
              ) : (
                <div
                  style={{
                    backgroundColor: '#F0FDF4',
                    border: '1px solid #86EFAC',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.75rem 1rem',
                    fontSize: '0.85rem',
                    color: '#166534'
                  }}
                >
                  Activating this variant makes it immediately available for new quotations and customer self-service plans.
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', padding: '1rem 1.5rem', borderTop: '1px solid var(--border-light)' }}>
              <Button
                variant="outline"
                type="button"
                onClick={() => setConfirmVariantStatus(null)}
                disabled={variantToggleLoading}
              >
                Cancel
              </Button>
              <Button
                variant={confirmVariantStatus.is_active !== false ? 'danger' : 'primary'}
                loading={variantToggleLoading}
                onClick={handleConfirmToggleVariantStatus}
              >
                {confirmVariantStatus.is_active !== false ? 'Confirm Deactivation' : 'Confirm Activation'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductEdit;
