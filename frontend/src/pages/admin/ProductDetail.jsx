import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  Package,
  ArrowLeft,
  Edit2,
  Archive,
  RotateCcw,
  IndianRupee,
  TrendingUp,
  Layers,
  Calendar,
  Clock,
  Tag,
  Copy,
  Check,
  AlertCircle,
  FileText,
  X,
  Plus,
  Power,
  Search,
  CheckCircle,
  Hash,
  Calculator
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import Button from '../../components/common/Button';
import InputField from '../../components/forms/InputField';
import Alert from '../../components/common/Alert';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const API_BASE_URL = 'http://localhost:5000/api';

export const ProductDetail = () => {
  const { id } = useParams();
  const { session, role } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Product state
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState(false);

  // Product status toggle modal
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusActionLoading, setStatusActionLoading] = useState(false);

  // Variants state
  const [variants, setVariants] = useState([]);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [variantSearch, setVariantSearch] = useState('');
  const [variantStatusFilter, setVariantStatusFilter] = useState('ALL');

  // Variant Add / Edit Modal states
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

  // Variant Deactivate/Activate Confirmation modal
  const [confirmVariantStatus, setConfirmVariantStatus] = useState(null);
  const [variantToggleLoading, setVariantToggleLoading] = useState(false);

  const isAdmin = role === 'ADMIN';

  // Fetch product information
  const fetchProduct = useCallback(async () => {
    if (!id || !session?.access_token) return;

    try {
      setLoading(true);
      setError('');

      const res = await fetch(`${API_BASE_URL}/products/${id}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to retrieve product details.');
      }

      setProduct(data.product);
    } catch (err) {
      console.error('Error fetching product:', err);
      setError(err.message || 'Product not found or service unavailable.');
    } finally {
      setLoading(false);
    }
  }, [id, session?.access_token]);

  // Fetch variants from dedicated variant API
  const fetchVariants = useCallback(async () => {
    if (!id || !session?.access_token) return;

    try {
      setLoadingVariants(true);

      const params = new URLSearchParams();
      if (variantStatusFilter !== 'ALL') params.append('status', variantStatusFilter);
      if (variantSearch.trim()) params.append('search', variantSearch.trim());

      const res = await fetch(`${API_BASE_URL}/products/${id}/variants?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to retrieve variants.');
      }

      setVariants(data.variants || []);
    } catch (err) {
      console.error('Error fetching variants:', err);
    } finally {
      setLoadingVariants(false);
    }
  }, [id, session?.access_token, variantStatusFilter, variantSearch]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  useEffect(() => {
    if (product) {
      fetchVariants();
    }
  }, [product?.id, fetchVariants]);

  // Reset variant form
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
  const openEditVariantModal = (variant) => {
    setEditingVariant(variant);
    setVarName(variant.variant_name || '');
    setAttrName(variant.attribute_name || '');
    setAttrValue(variant.attribute_value || '');
    setPriceExtra(variant.price_extra !== undefined ? variant.price_extra.toString() : '0.00');
    setSku(variant.sku || '');
    setIsActive(variant.is_active !== false);
    setVariantFormError('');
  };

  // Handle Create Variant Submit
  const handleCreateVariant = async (e) => {
    e.preventDefault();
    setVariantFormError('');

    if (!varName.trim()) {
      setVariantFormError('Variant name is required.');
      return;
    }
    if (!attrName.trim()) {
      setVariantFormError('Attribute name is required (e.g. "Brand", "Color", "Tier").');
      return;
    }
    if (!attrValue.trim()) {
      setVariantFormError('Attribute value is required (e.g. "Standard", "Odoo", "SAP").');
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
      fetchProduct(); // refresh variant count on product
    } catch (err) {
      console.error('Error creating variant:', err);
      setVariantFormError(err.message || 'Failed to create variant.');
    } finally {
      setVariantFormLoading(false);
    }
  };

  // Handle Update Variant Submit
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

  // Handle Toggle Variant Status (Activate/Deactivate)
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

  // Toggle Product active status
  const handleToggleProductStatus = async () => {
    if (!product || !session?.access_token) return;

    const newStatus = !product.is_active;

    try {
      setStatusActionLoading(true);

      const res = await fetch(`${API_BASE_URL}/products/${product.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ is_active: newStatus })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to update product status.');
      }

      addToast(
        data.message || `Product ${newStatus ? 'reactivated' : 'archived'} successfully.`,
        'success'
      );

      setShowStatusModal(false);
      fetchProduct();
    } catch (err) {
      console.error('Error updating product status:', err);
      addToast(err.message || 'Failed to update product status.', 'error');
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
        <LoadingSpinner size="large" message="Loading product details..." />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '1.25rem' }}>
          <Link
            to="/admin/products"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}
          >
            <ArrowLeft size={16} />
            <span>Back to Products</span>
          </Link>
        </div>
        <Alert
          type="error"
          message={error || 'Product not found'}
        />
      </div>
    );
  }

  const isArchived = !product.is_active;
  const numSales = Number(product.sales_price) || 0;
  const numCost = Number(product.cost_price) || 0;
  const grossProfit = numSales - numCost;
  const marginPercentage = numSales > 0 ? ((grossProfit / numSales) * 100).toFixed(1) : '0.0';

  // Live modal price calculation
  const parsedModalExtra = parseFloat(priceExtra) || 0;
  const liveModalFinalPrice = Number((numSales + parsedModalExtra).toFixed(2));

  return (
    <div style={{ maxWidth: '1050px', margin: '0 auto' }}>
      {/* Back Link */}
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
              backgroundColor: isArchived ? 'var(--bg-sand)' : 'var(--primary-navy-soft)',
              color: isArchived ? 'var(--text-muted)' : 'var(--primary-navy)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Package size={26} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.5rem', margin: 0 }}>{product.name}</h1>
              <span className={`badge ${product.is_active ? 'badge-active' : 'badge-inactive'}`}>
                {product.is_active ? 'Active' : 'Archived'}
              </span>
              <span className="badge badge-admin">
                {product.type}
              </span>
            </div>
            <p style={{ marginTop: '0.35rem', fontSize: '0.9rem' }}>
              Product ID:{' '}
              <code style={{ fontSize: '0.825rem', backgroundColor: 'var(--bg-sand)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                {product.id}
              </code>
              <button
                onClick={() => copyToClipboard(product.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: copiedId ? '#166534' : 'var(--text-muted)',
                  cursor: 'pointer',
                  marginLeft: '0.4rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                  fontSize: '0.8rem'
                }}
                title="Copy Product UUID"
              >
                {copiedId ? <Check size={13} /> : <Copy size={13} />}
                {copiedId ? 'Copied' : 'Copy'}
              </button>
            </p>
          </div>
        </div>

        {/* Product Action Buttons */}
        {isAdmin && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Link to={`/admin/products/${product.id}/edit`}>
              <Button variant="primary" icon={Edit2} size="small">
                Edit Product
              </Button>
            </Link>

            <Button
              variant={product.is_active ? 'danger' : 'outline'}
              icon={product.is_active ? Archive : RotateCcw}
              size="small"
              onClick={() => setShowStatusModal(true)}
            >
              {product.is_active ? 'Archive Product' : 'Reactivate'}
            </Button>
          </div>
        )}
      </div>

      {/* Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isAdmin ? 'repeat(auto-fit, minmax(210px, 1fr))' : 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.25rem',
          marginBottom: '1.5rem'
        }}
      >
        {/* Sales Price */}
        <div
          className="metric-card"
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-sm)',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Base Sales Price
            </span>
            <IndianRupee size={18} color="var(--primary-navy)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary-navy)' }}>
            {formatCurrency(product.sales_price)}
          </div>
          <small style={{ color: 'var(--text-secondary)' }}>Base list price</small>
        </div>

        {/* Cost Price (Admin Only) */}
        {isAdmin && (
          <div
            className="metric-card"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-sm)',
              padding: '1.25rem',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Cost Price
              </span>
              <IndianRupee size={18} color="var(--text-muted)" />
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {formatCurrency(product.cost_price)}
            </div>
            <small style={{ color: 'var(--text-secondary)' }}>Baseline internal cost</small>
          </div>
        )}

        {/* Profit Margin (Admin Only) */}
        {isAdmin && (
          <div
            className="metric-card"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-sm)',
              padding: '1.25rem',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Base Gross Margin
              </span>
              <TrendingUp size={18} color={grossProfit >= 0 ? 'var(--status-active-text)' : 'var(--status-inactive-text)'} />
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: grossProfit >= 0 ? 'var(--status-active-text)' : 'var(--status-inactive-text)' }}>
              {marginPercentage}%
            </div>
            <small style={{ color: 'var(--text-secondary)' }}>
              Base profit: {formatCurrency(grossProfit)}/unit
            </small>
          </div>
        )}

        {/* Variants Count */}
        <div
          className="metric-card"
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-sm)',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Configured Variants
            </span>
            <Layers size={18} color="var(--primary-navy)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary-navy)' }}>
            {variants.length}
          </div>
          <small style={{ color: 'var(--text-secondary)' }}>Active options: {variants.filter(v => v.is_active !== false).length}</small>
        </div>
      </div>

      {/* Details Grid: Product Details & Notes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Specification Card */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-light)',
            padding: '1.5rem'
          }}
        >
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Tag size={18} />
            Product Specifications
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Product Type</span>
              <strong style={{ textTransform: 'capitalize' }}>{product.type}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Status</span>
              <span className={`badge ${product.is_active ? 'badge-active' : 'badge-inactive'}`}>
                {product.is_active ? 'Active' : 'Archived'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Created Date</span>
              <span>{formatDate(product.created_at)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Last Updated</span>
              <span>{formatDate(product.updated_at)}</span>
            </div>
          </div>
        </div>

        {/* Notes & Description Card */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-light)',
            padding: '1.5rem'
          }}
        >
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={18} />
            Description & Notes
          </h3>

          {product.notes ? (
            <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, color: 'var(--text-primary)', fontSize: '0.925rem' }}>
              {product.notes}
            </p>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.9rem' }}>
              No description or internal notes have been recorded for this product yet.
            </p>
          )}
        </div>
      </div>

      {/* ============================================================================== */}
      {/* PRODUCT VARIANTS MANAGEMENT SECTION (Stage 3 Complete) */}
      {/* ============================================================================== */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-light)',
          padding: '1.75rem',
          marginBottom: '2rem'
        }}
      >
        {/* Section Header */}
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
              Assign attribute configurations, individual SKUs, and incremental price modifications.
            </p>
          </div>

          {isAdmin && (
            <div>
              {product.is_active ? (
                <Button
                  variant="primary"
                  size="small"
                  icon={Plus}
                  onClick={openAddVariantModal}
                >
                  Add Variant
                </Button>
              ) : (
                <div title="Reactivate this product to create additional variants">
                  <Button variant="primary" size="small" icon={Plus} disabled>
                    Add Variant
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Variants Filter Toolbar */}
        {variants.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              marginBottom: '1rem',
              flexWrap: 'wrap'
            }}
          >
            {/* Search */}
            <div style={{ flex: '1 1 240px', maxWidth: '340px', position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.25rem', fontSize: '0.85rem', padding: '0.45rem 0.75rem 0.45rem 2.25rem' }}
                placeholder="Filter variants by name, attribute, or SKU..."
                value={variantSearch}
                onChange={(e) => setVariantSearch(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Status:</span>
              <select
                className="form-input"
                style={{ width: 'auto', padding: '0.4rem 1.75rem 0.4rem 0.65rem', fontSize: '0.825rem' }}
                value={variantStatusFilter}
                onChange={(e) => setVariantStatusFilter(e.target.value)}
              >
                <option value="ALL">All Variants</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </div>
        )}

        {/* Variants Table or Empty State */}
        {loadingVariants ? (
          <div style={{ padding: '2.5rem', textAlign: 'center' }}>
            <LoadingSpinner size="medium" message="Refreshing variants list..." />
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
              No variants configured
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: '440px', margin: '0 auto 1.25rem' }}>
              {variantSearch || variantStatusFilter !== 'ALL'
                ? 'No variants match your current search or filter criteria.'
                : 'Configure variants to offer brand options, colors, editions, or storage capacities (e.g. Standard, Odoo, SAP).'}
            </p>
            {isAdmin && product.is_active && !variantSearch && variantStatusFilter === 'ALL' && (
              <Button variant="primary" size="small" icon={Plus} onClick={openAddVariantModal}>
                Create First Variant
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
                  <th>Final Calculated Price</th>
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
                      {/* Variant Name */}
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

                      {/* Final Calculated Price (Base + Extra) */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <strong style={{ fontSize: '0.95rem', color: 'var(--primary-navy)' }}>
                            {formatCurrency(v.final_price)}
                          </strong>
                          <small style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Base {formatCurrency(v.base_price)} + {formatCurrency(v.price_extra)}
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

                      {/* Actions (Admin Only) */}
                      {isAdmin && (
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                            {/* Edit */}
                            <button
                              onClick={() => openEditVariantModal(v)}
                              className="btn btn-ghost btn-sm"
                              style={{ padding: '0.35rem', color: 'var(--primary-navy)' }}
                              title="Edit variant"
                            >
                              <Edit2 size={15} />
                            </button>

                            {/* Activate / Deactivate Toggle */}
                            <button
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
                    {product.name}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.15rem' }}>
                    Base Sales Price: <strong>{formatCurrency(product.sales_price)}</strong>
                  </div>
                </div>

                {/* Variant Name */}
                <InputField
                  id="variant-name"
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
                    id="attribute-name"
                    name="attribute_name"
                    label="Attribute Name"
                    placeholder="e.g. Brand, Color, Tier"
                    value={attrName}
                    onChange={(e) => setAttrName(e.target.value)}
                    required
                    hint="Classification key"
                  />

                  <InputField
                    id="attribute-value"
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
                    id="price-extra"
                    name="price_extra"
                    label="Additional Price (₹)"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={priceExtra}
                    onChange={(e) => setPriceExtra(e.target.value)}
                    required
                    hint="Added to base sales price (>= 0)"
                    icon={IndianRupee}
                  />

                  <InputField
                    id="variant-sku"
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
                    id="variant-active-check"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--primary-navy)', cursor: 'pointer' }}
                  />
                  <label htmlFor="variant-active-check" style={{ fontSize: '0.9rem', cursor: 'pointer', fontWeight: 500 }}>
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
                    {product.name} (Base Price: {formatCurrency(product.sales_price)})
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.775rem', marginTop: '0.2rem' }}>
                    Variant ID: <code>{editingVariant.id}</code>
                  </div>
                </div>

                {/* Variant Name */}
                <InputField
                  id="edit-variant-name"
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
                    id="edit-attribute-name"
                    name="attribute_name"
                    label="Attribute Name"
                    placeholder="e.g. Brand, Tier"
                    value={attrName}
                    onChange={(e) => setAttrName(e.target.value)}
                    required
                  />

                  <InputField
                    id="edit-attribute-value"
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
                    id="edit-price-extra"
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
                    id="edit-variant-sku"
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
                    id="edit-variant-active-check"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--primary-navy)', cursor: 'pointer' }}
                  />
                  <label htmlFor="edit-variant-active-check" style={{ fontSize: '0.9rem', cursor: 'pointer', fontWeight: 500 }}>
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
                  icon={Check}
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
                  <strong>Deactivation Impact:</strong> This variant will no longer be selectable for new customer subscriptions or quotations. Existing subscriptions will retain their contracted pricing and variant attributes.
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

      {/* ============================================================================== */}
      {/* MODAL: PRODUCT ARCHIVE / REACTIVATE */}
      {/* ============================================================================== */}
      {showStatusModal && (
        <div className="modal-overlay" onClick={() => !statusActionLoading && setShowStatusModal(false)}>
          <div className="modal-box" style={{ maxWidth: '460px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: product.is_active ? '#B91C1C' : '#15803D' }}>
                {product.is_active ? <Archive size={20} /> : <RotateCcw size={20} />}
                {product.is_active ? 'Archive Product' : 'Reactivate Product'}
              </h3>
              <button
                className="modal-close"
                onClick={() => !statusActionLoading && setShowStatusModal(false)}
                disabled={statusActionLoading}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '1.25rem 1.5rem' }}>
              <p style={{ marginBottom: '1rem', lineHeight: 1.5 }}>
                Are you sure you want to {product.is_active ? 'archive' : 'reactivate'}{' '}
                <strong>&quot;{product.name}&quot;</strong>?
              </p>

              {product.is_active ? (
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
                  <strong>Soft Archival:</strong> The product will no longer appear for new subscriptions or customer self-service, but existing subscriptions and invoices will remain intact.
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
                  Reactivating this product will make it available for new subscriptions and catalog management.
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', padding: '1rem 1.5rem', borderTop: '1px solid var(--border-light)' }}>
              <Button
                variant="outline"
                onClick={() => setShowStatusModal(false)}
                disabled={statusActionLoading}
              >
                Cancel
              </Button>
              <Button
                variant={product.is_active ? 'danger' : 'primary'}
                loading={statusActionLoading}
                onClick={handleToggleProductStatus}
              >
                {product.is_active ? 'Confirm Archive' : 'Confirm Reactivation'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
