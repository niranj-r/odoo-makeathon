import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Archive,
  RotateCcw,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  X,
  Layers,
  IndianRupee
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const API_BASE_URL = 'http://localhost:5000/api';

export const ProductList = () => {
  const { session, role } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Data states
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter & Pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Confirmation modal state for Archiving / Reactivating
  const [confirmProduct, setConfirmProduct] = useState(null);
  const [statusActionLoading, setStatusActionLoading] = useState(false);

  const isAdmin = role === 'ADMIN';

  // Fetch products from Express API
  const fetchProducts = useCallback(async () => {
    if (!session?.access_token) return;

    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });

      if (searchTerm.trim()) params.append('search', searchTerm.trim());
      if (typeFilter !== 'ALL') params.append('type', typeFilter);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);

      const res = await fetch(`${API_BASE_URL}/products?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch product catalog.');
      }

      setProducts(data.products || []);
      setTotal(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err.message || 'Error connecting to product catalog service.');
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, page, searchTerm, typeFilter, statusFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setPage(1);
  };

  const handleTypeChange = (e) => {
    setTypeFilter(e.target.value);
    setPage(1);
  };

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  // Toggle or Set Product Status (Soft Archive / Reactivate)
  const handleToggleStatus = async () => {
    if (!confirmProduct || !session?.access_token) return;

    const newStatus = !confirmProduct.is_active;

    try {
      setStatusActionLoading(true);

      const res = await fetch(`${API_BASE_URL}/products/${confirmProduct.id}/status`, {
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
        data.message || `Product "${confirmProduct.name}" ${newStatus ? 'reactivated' : 'archived'} successfully.`,
        'success'
      );

      setConfirmProduct(null);
      fetchProducts();
    } catch (err) {
      console.error('Error updating product status:', err);
      addToast(err.message || 'Failed to update product status.', 'error');
    } finally {
      setStatusActionLoading(false);
    }
  };

  // Currency formatter (Indian Rupees)
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '—';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Date formatter
  const formatDate = (isoString) => {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Type badge styling
  const getTypeBadgeClass = (type) => {
    switch (type?.toLowerCase()) {
      case 'service':
        return 'badge-admin';
      case 'goods':
        return 'badge-staff';
      case 'digital':
        return 'badge-customer';
      default:
        return 'badge';
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="section-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Package size={26} color="var(--primary-navy)" />
            Product Management
          </h1>
          <p style={{ marginTop: '0.25rem' }}>
            Manage your subscription catalog, sales pricing, cost baselines, and active offerings.
          </p>
        </div>

        {isAdmin && (
          <Link to="/admin/products/new">
            <Button variant="primary" icon={Plus}>
              Add Product
            </Button>
          </Link>
        )}
      </div>

      {/* Global Error Banner */}
      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => setError('')}
        />
      )}

      {/* Table Toolbar */}
      <div className="table-toolbar" style={{ backgroundColor: '#FFFFFF', padding: '1rem 1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', marginBottom: '1.25rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Search */}
        <div style={{ flex: '1 1 280px', maxWidth: '420px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.5rem', paddingRight: searchTerm ? '2.25rem' : '0.85rem' }}
            placeholder="Search by product name..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
          {searchTerm && (
            <button
              onClick={handleClearSearch}
              style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
              title="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Type Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>Type:</span>
            <select
              className="form-input"
              style={{ width: 'auto', padding: '0.45rem 1.75rem 0.45rem 0.75rem', fontSize: '0.85rem' }}
              value={typeFilter}
              onChange={handleTypeChange}
            >
              <option value="ALL">All Types</option>
              <option value="service">Service</option>
              <option value="goods">Goods</option>
              <option value="digital">Digital</option>
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>Status:</span>
            <select
              className="form-input"
              style={{ width: 'auto', padding: '0.45rem 1.75rem 0.45rem 0.75rem', fontSize: '0.85rem' }}
              value={statusFilter}
              onChange={handleStatusChange}
            >
              <option value="ALL">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="archived">Archived Only</option>
            </select>
          </div>

          {/* Refresh */}
          <button
            onClick={fetchProducts}
            disabled={loading}
            className="btn btn-outline btn-sm"
            style={{ padding: '0.5rem 0.75rem' }}
            title="Refresh product list"
          >
            <RefreshCw size={14} className={loading ? 'spinner spinner-dark' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Product Table Container */}
      <div className="table-card" style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
        {loading && products.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <LoadingSpinner size="large" message="Loading product catalog..." />
          </div>
        ) : products.length === 0 ? (
          /* Empty State */
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--bg-sand)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', color: 'var(--primary-navy)' }}>
              <Package size={28} />
            </div>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--primary-navy)', marginBottom: '0.4rem' }}>
              No products found
            </h3>
            <p style={{ maxWidth: '420px', margin: '0 auto 1.5rem', fontSize: '0.9rem' }}>
              {searchTerm || typeFilter !== 'ALL' || statusFilter !== 'ALL'
                ? 'No products matched your search or filter criteria. Try resetting your filters.'
                : 'Your platform does not have any products configured yet. Create your first product to start offering subscription plans.'}
            </p>
            {searchTerm || typeFilter !== 'ALL' || statusFilter !== 'ALL' ? (
              <Button
                variant="outline"
                size="small"
                onClick={() => {
                  setSearchTerm('');
                  setTypeFilter('ALL');
                  setStatusFilter('ALL');
                  setPage(1);
                }}
              >
                Reset Filters
              </Button>
            ) : (
              isAdmin && (
                <Link to="/admin/products/new">
                  <Button variant="primary" size="small" icon={Plus}>
                    Create First Product
                  </Button>
                </Link>
              )
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '28%' }}>Product Name</th>
                  <th>Type</th>
                  <th>Sales Price</th>
                  {isAdmin && <th>Cost Price</th>}
                  <th>Variants</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const isArchived = !product.is_active;

                  return (
                    <tr key={product.id} style={{ opacity: isArchived ? 0.75 : 1 }}>
                      {/* Name & Notes */}
                      <td>
                        <Link
                          to={`/admin/products/${product.id}`}
                          style={{ fontWeight: 600, color: 'var(--primary-navy)', display: 'block', fontSize: '0.95rem' }}
                        >
                          {product.name}
                        </Link>
                        {product.notes && (
                          <small
                            style={{
                              color: 'var(--text-muted)',
                              display: 'block',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: '260px'
                            }}
                            title={product.notes}
                          >
                            {product.notes}
                          </small>
                        )}
                      </td>

                      {/* Type Badge */}
                      <td>
                        <span className={`badge ${getTypeBadgeClass(product.type)}`}>
                          {product.type}
                        </span>
                      </td>

                      {/* Sales Price */}
                      <td style={{ fontWeight: 600, color: 'var(--primary-navy)' }}>
                        {formatCurrency(product.sales_price)}
                      </td>

                      {/* Cost Price (Admin Only) */}
                      {isAdmin && (
                        <td style={{ color: 'var(--text-secondary)' }}>
                          {formatCurrency(product.cost_price)}
                        </td>
                      )}

                      {/* Variants Count */}
                      <td>
                        <span
                          className="badge"
                          style={{
                            backgroundColor: 'var(--bg-sand)',
                            color: 'var(--primary-navy)',
                            fontWeight: 600
                          }}
                        >
                          <Layers size={12} style={{ marginRight: '2px' }} />
                          {product.variant_count || 0} {product.variant_count === 1 ? 'variant' : 'variants'}
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`badge ${product.is_active ? 'badge-active' : 'badge-inactive'}`}>
                          {product.is_active ? 'Active' : 'Archived'}
                        </span>
                      </td>

                      {/* Created Date */}
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {formatDate(product.created_at)}
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                          {/* View details */}
                          <Link
                            to={`/admin/products/${product.id}`}
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '0.4rem', color: 'var(--text-secondary)' }}
                            title="View product details"
                          >
                            <Eye size={15} />
                          </Link>

                          {/* Edit (Admin Only) */}
                          {isAdmin && (
                            <Link
                              to={`/admin/products/${product.id}/edit`}
                              className="btn btn-ghost btn-sm"
                              style={{ padding: '0.4rem', color: 'var(--primary-navy)' }}
                              title="Edit product"
                            >
                              <Edit2 size={15} />
                            </Link>
                          )}

                          {/* Archive / Reactivate toggle (Admin Only) */}
                          {isAdmin && (
                            <button
                              onClick={() => setConfirmProduct(product)}
                              className="btn btn-ghost btn-sm"
                              style={{
                                padding: '0.4rem',
                                color: product.is_active ? '#DC2626' : '#166534'
                              }}
                              title={product.is_active ? 'Archive product' : 'Reactivate product'}
                            >
                              {product.is_active ? <Archive size={15} /> : <RotateCcw size={15} />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {total > 0 && (
          <div
            className="pagination-bar"
            style={{
              padding: '0.85rem 1.25rem',
              borderTop: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              backgroundColor: '#FFFFFF'
            }}
          >
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Showing{' '}
              <strong style={{ color: 'var(--text-primary)' }}>
                {Math.min((page - 1) * limit + 1, total)}
              </strong>{' '}
              to{' '}
              <strong style={{ color: 'var(--text-primary)' }}>
                {Math.min(page * limit, total)}
              </strong>{' '}
              of <strong style={{ color: 'var(--text-primary)' }}>{total}</strong> products
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                style={{ padding: '0.35rem 0.65rem' }}
              >
                <ChevronLeft size={15} />
                <span>Prev</span>
              </button>

              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', padding: '0 0.5rem' }}>
                Page <strong>{page}</strong> of <strong>{totalPages}</strong>
              </span>

              <button
                className="btn btn-outline btn-sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
                style={{ padding: '0.35rem 0.65rem' }}
              >
                <span>Next</span>
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog: Archive / Reactivate */}
      {confirmProduct && (
        <div className="modal-overlay" onClick={() => !statusActionLoading && setConfirmProduct(null)}>
          <div className="modal-box" style={{ maxWidth: '460px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: confirmProduct.is_active ? '#B91C1C' : '#15803D' }}>
                {confirmProduct.is_active ? <Archive size={20} /> : <RotateCcw size={20} />}
                {confirmProduct.is_active ? 'Archive Product' : 'Reactivate Product'}
              </h3>
              <button
                className="modal-close"
                onClick={() => !statusActionLoading && setConfirmProduct(null)}
                disabled={statusActionLoading}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '1.25rem 1.5rem' }}>
              <p style={{ marginBottom: '1rem', lineHeight: 1.5 }}>
                Are you sure you want to {confirmProduct.is_active ? 'archive' : 'reactivate'}{' '}
                <strong>&quot;{confirmProduct.name}&quot;</strong>?
              </p>

              {confirmProduct.is_active ? (
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
                  <strong>Soft Archival Note:</strong> Archived products are hidden from customer plan selection
                  and catalog listings, but existing active subscriptions, invoices, and audit logs are safely preserved.
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
                onClick={() => setConfirmProduct(null)}
                disabled={statusActionLoading}
              >
                Cancel
              </Button>
              <Button
                variant={confirmProduct.is_active ? 'danger' : 'primary'}
                loading={statusActionLoading}
                onClick={handleToggleStatus}
              >
                {confirmProduct.is_active ? 'Confirm Archive' : 'Confirm Reactivation'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;

