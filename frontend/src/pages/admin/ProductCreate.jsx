import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package,
  ArrowLeft,
  IndianRupee,
  Tag,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Layers,
  Plus,
  Trash2,
  Edit2,
  X,
  Calculator,
  Hash,
  Eye
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import Button from '../../components/common/Button';
import InputField from '../../components/forms/InputField';
import Alert from '../../components/common/Alert';

const API_BASE_URL = 'http://localhost:5000/api';

export const ProductCreate = () => {
  const { session } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState('service');
  const [salesPrice, setSalesPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [notes, setNotes] = useState('');

  // Variants state (Draft variants to be created alongside product)
  const [variants, setVariants] = useState([]);

  // Variant Modal state
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [editingVariantIndex, setEditingVariantIndex] = useState(null);
  const [modalVarName, setModalVarName] = useState('');
  const [modalAttrName, setModalAttrName] = useState('');
  const [modalAttrValue, setModalAttrValue] = useState('');
  const [modalPriceExtra, setModalPriceExtra] = useState('0.00');
  const [modalSku, setModalSku] = useState('');
  const [modalIsActive, setModalIsActive] = useState(true);
  const [modalError, setModalError] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Real-time Margin & Profit calculations
  const numSales = parseFloat(salesPrice) || 0;
  const numCost = parseFloat(costPrice) || 0;
  const grossProfit = numSales - numCost;
  const marginPercentage = numSales > 0 ? ((grossProfit / numSales) * 100).toFixed(1) : '0.0';

  // Live modal price calculation
  const parsedModalExtra = parseFloat(modalPriceExtra) || 0;
  const liveModalFinalPrice = Number((numSales + parsedModalExtra).toFixed(2));

  // Reset variant modal form
  const resetVariantModal = () => {
    setModalVarName('');
    setModalAttrName('');
    setModalAttrValue('');
    setModalPriceExtra('0.00');
    setModalSku('');
    setModalIsActive(true);
    setModalError('');
    setEditingVariantIndex(null);
  };

  // Open modal to add a new variant
  const handleOpenAddVariant = () => {
    resetVariantModal();
    setShowVariantModal(true);
  };

  // Open modal to edit an existing draft variant
  const handleOpenEditVariant = (index) => {
    const v = variants[index];
    if (!v) return;
    setEditingVariantIndex(index);
    setModalVarName(v.variant_name);
    setModalAttrName(v.attribute_name);
    setModalAttrValue(v.attribute_value);
    setModalPriceExtra(String(v.price_extra));
    setModalSku(v.sku || '');
    setModalIsActive(v.is_active !== false);
    setModalError('');
    setShowVariantModal(true);
  };

  // Remove a variant from the draft list
  const handleRemoveVariant = (index) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
    addToast('Variant removed from draft.', 'info');
  };

  // Save variant from modal into draft list
  const handleSaveVariantModal = (e) => {
    e.preventDefault();
    setModalError('');

    if (!modalVarName.trim()) {
      setModalError('Variant name is required (e.g. Standard, Odoo Edition, Enterprise).');
      return;
    }
    if (!modalAttrName.trim()) {
      setModalError('Attribute name is required (e.g. Brand, Tier, Storage).');
      return;
    }
    if (!modalAttrValue.trim()) {
      setModalError('Attribute value is required (e.g. Odoo, SAP, 256GB).');
      return;
    }

    const numExtra = parseFloat(modalPriceExtra);
    if (isNaN(numExtra) || numExtra < 0) {
      setModalError('Additional price must be a valid non-negative number.');
      return;
    }

    const cleanedSku = modalSku.trim() ? modalSku.trim().toUpperCase() : null;

    // Check duplicate SKU among draft variants
    if (cleanedSku) {
      const isDuplicate = variants.some((v, idx) => {
        if (editingVariantIndex !== null && idx === editingVariantIndex) return false;
        return v.sku && v.sku.toUpperCase() === cleanedSku;
      });

      if (isDuplicate) {
        setModalError(`SKU "${cleanedSku}" is already assigned to another variant in this draft.`);
        return;
      }
    }

    const variantRecord = {
      variant_name: modalVarName.trim(),
      attribute_name: modalAttrName.trim(),
      attribute_value: modalAttrValue.trim(),
      price_extra: Number(numExtra.toFixed(2)),
      sku: cleanedSku,
      is_active: modalIsActive
    };

    if (editingVariantIndex !== null) {
      // Update existing variant
      setVariants((prev) => {
        const copy = [...prev];
        copy[editingVariantIndex] = variantRecord;
        return copy;
      });
      addToast(`Variant "${variantRecord.variant_name}" updated.`, 'success');
    } else {
      // Add new variant
      setVariants((prev) => [...prev, variantRecord]);
      addToast(`Variant "${variantRecord.variant_name}" added to draft.`, 'success');
    }

    setShowVariantModal(false);
    resetVariantModal();
  };

  // Validate form client-side
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!validateForm()) {
      setErrorMessage('Please fix the highlighted errors before submitting.');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        name: name.trim(),
        type,
        sales_price: parseFloat(salesPrice),
        cost_price: parseFloat(costPrice),
        notes: notes.trim() || null,
        variants: variants.map((v) => ({
          variant_name: v.variant_name,
          attribute_name: v.attribute_name,
          attribute_value: v.attribute_value,
          price_extra: v.price_extra,
          sku: v.sku,
          is_active: v.is_active
        }))
      };

      const res = await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to create product.');
      }

      const variantCountMsg = variants.length > 0 ? ` with ${variants.length} variant(s)` : '';
      addToast(`Product "${data.product?.name || name}"${variantCountMsg} created successfully.`, 'success');
      navigate(`/admin/products/${data.product?.id || ''}`);
    } catch (err) {
      console.error('Error creating product:', err);
      setErrorMessage(err.message || 'Failed to create product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto' }}>
      {/* Navigation Breadcrumb / Back Link */}
      <div style={{ marginBottom: '1.25rem' }}>
        <Link
          to="/admin/products"
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
          <span>Back to Product Listing</span>
        </Link>
      </div>

      {/* Header */}
      <div className="section-header" style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Package size={26} color="var(--primary-navy)" />
          Add New Product
        </h1>
        <p style={{ marginTop: '0.25rem' }}>
          Register a new core product offering and optionally define initial SKU variants and pricing tiers.
        </p>
      </div>

      {/* Error Banner */}
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
          {/* Product Name */}
          <InputField
            id="product-name"
            name="name"
            label="Product Name"
            placeholder="e.g. Enterprise Cloud Storage, Professional Support Tier"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: '' }));
            }}
            required
            error={fieldErrors.name}
            hint="A clear, distinctive name displayed on subscription plans and invoices."
            icon={Package}
          />

          {/* Product Type */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label htmlFor="product-type" className="form-label">
              Product Type <span className="required">*</span>
            </label>
            <div className="input-wrapper">
              <span className="input-icon">
                <Tag size={18} />
              </span>
              <select
                id="product-type"
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
            <small className="field-hint">
              Controls accounting treatment and fulfillment behavior across subscription cycles.
            </small>
          </div>

          {/* Pricing Row: Sales Price and Cost Price */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
            {/* Sales Price */}
            <div>
              <InputField
                id="sales-price"
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
                hint="Default list price billed to customers."
                icon={IndianRupee}
              />
            </div>

            {/* Cost Price */}
            <div>
              <InputField
                id="cost-price"
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
                hint="Internal baseline cost. Strictly hidden from staff & customers."
                icon={IndianRupee}
              />
            </div>
          </div>

          {/* Profit & Margin Preview Card */}
          {(salesPrice !== '' || costPrice !== '') && (
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
                    Gross Profit Margin
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: grossProfit >= 0 ? 'var(--status-active-text)' : 'var(--status-inactive-text)' }}>
                    ₹{grossProfit.toFixed(2)} ({marginPercentage}%)
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'right' }}>
                Sales: <strong>₹{numSales.toFixed(2)}</strong> | Cost: <strong>₹{numCost.toFixed(2)}</strong>
              </div>
            </div>
          )}

          {/* Notes / Description */}
          <div className="form-group" style={{ marginBottom: '1.75rem' }}>
            <label htmlFor="product-notes" className="form-label">
              Product Description / Internal Notes <small style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Optional)</small>
            </label>
            <div className="input-wrapper">
              <textarea
                id="product-notes"
                name="notes"
                className="form-input"
                style={{ minHeight: '85px', padding: '0.75rem', resize: 'vertical' }}
                placeholder="Add technical specifications, billing notes, or internal fulfillment instructions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <small className="field-hint">
              Visible to administrators and staff members in product details.
            </small>
          </div>

          {/* ============================================================================== */}
          {/* OPTIONAL PRODUCT VARIANTS SECTION */}
          {/* ============================================================================== */}
          <div
            style={{
              borderTop: '1px solid var(--border-light)',
              paddingTop: '1.5rem',
              marginBottom: '2rem'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}
            >
              <div>
                <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                  <Layers size={18} color="var(--primary-navy)" />
                  Product Variants ({variants.length})
                  <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-muted)' }}>
                    (Optional)
                  </span>
                </h3>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.2rem', marginBottom: 0 }}>
                  Configure product variants (e.g. editions, storage, tiers) with additional pricing increments now or later.
                </p>
              </div>

              <Button
                variant="outline"
                size="small"
                type="button"
                icon={Plus}
                onClick={handleOpenAddVariant}
              >
                Add Variant
              </Button>
            </div>

            {/* Variants Table or Empty Box */}
            {variants.length === 0 ? (
              <div
                style={{
                  padding: '1.75rem 1.25rem',
                  textAlign: 'center',
                  backgroundColor: 'var(--bg-sand)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px dashed var(--border-light)'
                }}
              >
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    backgroundColor: '#FFFFFF',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '0.5rem',
                    color: 'var(--primary-navy)'
                  }}
                >
                  <Layers size={18} />
                </div>
                <h4 style={{ fontSize: '0.95rem', color: 'var(--primary-navy)', marginBottom: '0.25rem' }}>
                  No initial variants configured
                </h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', maxWidth: '420px', margin: '0 auto 1rem' }}>
                  If this product has options (e.g., Standard vs Enterprise, Odoo vs SAP), you can add them now or after creating the product.
                </p>
                <Button
                  variant="outline"
                  size="small"
                  type="button"
                  icon={Plus}
                  onClick={handleOpenAddVariant}
                >
                  Add First Variant
                </Button>
              </div>
            ) : (
              <div className="table-responsive" style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)' }}>
                <table className="data-table" style={{ margin: 0 }}>
                  <thead>
                    <tr>
                      <th>Variant Name</th>
                      <th>Attribute</th>
                      <th>Additional Price</th>
                      <th>Calculated Final Price</th>
                      <th>SKU</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((v, idx) => {
                      const finalPriceCalc = Number((numSales + Number(v.price_extra || 0)).toFixed(2));
                      return (
                        <tr key={idx}>
                          <td>
                            <strong>{v.variant_name}</strong>
                          </td>
                          <td>
                            <span className="badge" style={{ backgroundColor: 'var(--bg-sand)', color: 'var(--text-primary)' }}>
                              {v.attribute_name}: <strong>{v.attribute_value}</strong>
                            </span>
                          </td>
                          <td>
                            <span style={{ fontWeight: 600, color: v.price_extra > 0 ? 'var(--primary-navy)' : 'var(--text-muted)' }}>
                              {v.price_extra > 0 ? `+₹${Number(v.price_extra).toFixed(2)}` : '₹0.00'}
                            </span>
                          </td>
                          <td>
                            <strong style={{ color: 'var(--primary-navy)' }}>
                              ₹{finalPriceCalc.toFixed(2)}
                            </strong>
                            {v.price_extra > 0 && (
                              <small style={{ display: 'block', fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                                (₹{numSales.toFixed(2)} + ₹{Number(v.price_extra).toFixed(2)})
                              </small>
                            )}
                          </td>
                          <td>
                            {v.sku ? (
                              <code style={{ fontSize: '0.8rem', backgroundColor: 'var(--bg-sand)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>
                                {v.sku}
                              </code>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>—</span>
                            )}
                          </td>
                          <td>
                            <span className={`badge ${v.is_active ? 'badge-active' : 'badge-inactive'}`}>
                              {v.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                              <button
                                type="button"
                                className="action-btn"
                                title="Edit Variant"
                                onClick={() => handleOpenEditVariant(idx)}
                              >
                                <Edit2 size={15} />
                              </button>
                              <button
                                type="button"
                                className="action-btn action-delete"
                                title="Remove Variant"
                                onClick={() => handleRemoveVariant(idx)}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
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
            <Link to="/admin/products">
              <Button variant="outline" type="button" disabled={loading}>
                Cancel
              </Button>
            </Link>

            <Button
              variant="primary"
              type="submit"
              loading={loading}
              icon={Package}
            >
              {variants.length > 0 ? `Create Product (${variants.length} Variants)` : 'Create Product'}
            </Button>
          </div>
        </form>
      </div>

      {/* ============================================================================== */}
      {/* ADD / EDIT DRAFT VARIANT MODAL */}
      {/* ============================================================================== */}
      {showVariantModal && (
        <div className="modal-backdrop">
          <div className="modal-container" style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Layers size={20} color="var(--primary-navy)" />
                <h3 className="modal-title">
                  {editingVariantIndex !== null ? 'Edit Draft Variant' : 'Add Product Variant'}
                </h3>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => {
                  setShowVariantModal(false);
                  resetVariantModal();
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveVariantModal}>
              <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                {modalError && (
                  <Alert
                    type="error"
                    message={modalError}
                    onClose={() => setModalError('')}
                  />
                )}

                {/* Base Product Info Banner */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-sand)',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '1.25rem',
                    border: '1px solid var(--border-light)',
                    fontSize: '0.85rem'
                  }}
                >
                  <div style={{ color: 'var(--text-secondary)' }}>Parent Product:</div>
                  <strong style={{ color: 'var(--primary-navy)', fontSize: '0.95rem' }}>
                    {name.trim() || 'New Product (Draft)'}
                  </strong>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Base Sales Price: <strong>₹{numSales.toFixed(2)}</strong>
                  </div>
                </div>

                {/* Variant Name */}
                <InputField
                  id="modal-var-name"
                  name="varName"
                  label="Variant Name"
                  placeholder="e.g. Standard, Odoo Edition, SAP Edition, 256GB"
                  value={modalVarName}
                  onChange={(e) => setModalVarName(e.target.value)}
                  required
                  hint="The distinctive name representing this specific variant choice."
                  icon={Layers}
                />

                {/* Attribute Group: Name & Value */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div>
                    <InputField
                      id="modal-attr-name"
                      name="attrName"
                      label="Attribute Name"
                      placeholder="e.g. Brand, Tier, Storage"
                      value={modalAttrName}
                      onChange={(e) => setModalAttrName(e.target.value)}
                      required
                      hint="Category of variation."
                      icon={Tag}
                    />
                  </div>

                  <div>
                    <InputField
                      id="modal-attr-value"
                      name="attrValue"
                      label="Attribute Value"
                      placeholder="e.g. Odoo, Enterprise, 256GB"
                      value={modalAttrValue}
                      onChange={(e) => setModalAttrValue(e.target.value)}
                      required
                      hint="Specific value."
                      icon={Tag}
                    />
                  </div>
                </div>

                {/* Pricing: Additional Price */}
                <InputField
                  id="modal-price-extra"
                  name="priceExtra"
                  label="Additional Price (₹)"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={modalPriceExtra}
                  onChange={(e) => setModalPriceExtra(e.target.value)}
                  required
                  hint="Amount added to base sales price (use 0 for standard/default variant)."
                  icon={IndianRupee}
                />

                {/* Live Calculated Price Preview */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-sand)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.9rem 1.1rem',
                    marginBottom: '1.25rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Calculator size={15} /> Final Calculated Variant Price
                    </span>
                    <strong style={{ fontSize: '1.15rem', color: 'var(--primary-navy)' }}>
                      ₹{liveModalFinalPrice.toFixed(2)}
                    </strong>
                  </div>
                  <div style={{ fontSize: '0.785rem', color: 'var(--text-secondary)' }}>
                    Base Price (<strong>₹{numSales.toFixed(2)}</strong>) + Additional Price (<strong>₹{parsedModalExtra.toFixed(2)}</strong>)
                  </div>
                </div>

                {/* SKU Code */}
                <InputField
                  id="modal-sku"
                  name="sku"
                  label="SKU Code"
                  placeholder="e.g. WEB-DEV-ODOO (Optional)"
                  value={modalSku}
                  onChange={(e) => setModalSku(e.target.value)}
                  hint="Unique stock keeping unit code across the entire catalog."
                  icon={Hash}
                />

                {/* Active Status Checkbox */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="modal-is-active"
                    checked={modalIsActive}
                    onChange={(e) => setModalIsActive(e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <label htmlFor="modal-is-active" style={{ fontSize: '0.875rem', cursor: 'pointer', fontWeight: 500, margin: 0 }}>
                    Active (variant is selectable for new subscriptions immediately)
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => {
                    setShowVariantModal(false);
                    resetVariantModal();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  icon={CheckCircle}
                >
                  {editingVariantIndex !== null ? 'Update Variant' : 'Add Variant'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductCreate;
