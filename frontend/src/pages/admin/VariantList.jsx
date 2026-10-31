import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  Package,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  IndianRupee,
  Tag,
  CheckCircle,
  AlertCircle,
  X,
  Power,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const API_BASE_URL = 'http://localhost:5000/api';

export const VariantList = () => {
  const { session, role } = useAuth();
  const { addToast } = useToast();

  const [variants, setVariants] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const limit = 15;

  const isAdmin = role === 'ADMIN';

  const fetchAllVariants = useCallback(async () => {
    if (!session?.access_token) return;

    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });

      if (search.trim()) params.append('search', search.trim());
      if (statusFilter !== 'ALL') params.append('status', statusFilter);

      const res = await fetch(`${API_BASE_URL}/variants?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to retrieve product variants.');
      }

      setVariants(data.variants || []);
      setTotal(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err) {
      console.error('Error fetching variants:', err);
      setError(err.message || 'Failed to load catalog variants.');
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, page, search, statusFilter]);

  useEffect(() => {
    fetchAllVariants();
  }, [fetchAllVariants]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearch('');
    setPage(1);
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
    return new Date(isoString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div>
      {/* Header */}
      <div
        className="section-header"
        style={{
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Layers size={26} color="var(--primary-navy)" />
            Product Variants Catalog
          </h1>
          <p style={{ marginTop: '0.25rem' }}>
            Master overview of all configured SKU options, attribute values, and price modifiers across products.
          </p>
        </div>

        <Link to="/admin/products">
          <Button variant="outline" icon={Package}>
            View Products
          </Button>
        </Link>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => setError('')}
        />
      )}

      {/* Toolbar */}
      <div
        className="table-toolbar"
        style={{
          backgroundColor: '#FFFFFF',
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-light)',
          marginBottom: '1.25rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        {/* Search */}
        <div style={{ flex: '1 1 280px', maxWidth: '420px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.5rem', paddingRight: search ? '2.25rem' : '0.85rem' }}
            placeholder="Search by variant name, SKU, or attribute..."
            value={search}
            onChange={handleSearchChange}
          />
          {search && (
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>Status:</span>
            <select
              className="form-input"
              style={{ width: 'auto', padding: '0.45rem 1.75rem 0.45rem 0.75rem', fontSize: '0.85rem' }}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">All Variants</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

          <button
            onClick={fetchAllVariants}
            disabled={loading}
            className="btn btn-outline btn-sm"
            style={{ padding: '0.5rem 0.75rem' }}
            title="Refresh variants"
          >
            <RefreshCw size={14} className={loading ? 'spinner spinner-dark' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Variants Table Card */}
      <div
        className="table-card"
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-light)',
          overflow: 'hidden'
        }}
      >
        {loading && variants.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <LoadingSpinner size="large" message="Loading product variants catalog..." />
          </div>
        ) : variants.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-sand)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
                color: 'var(--primary-navy)'
              }}
            >
              <Layers size={28} />
            </div>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--primary-navy)', marginBottom: '0.4rem' }}>
              No variants found
            </h3>
            <p style={{ maxWidth: '420px', margin: '0 auto 1.5rem', fontSize: '0.9rem' }}>
              {search || statusFilter !== 'ALL'
                ? 'No variants matched your search or status filter. Try clearing filters.'
                : 'No product variants have been added yet. Open any product from the Product Management screen to add variants.'}
            </p>
            <Link to="/admin/products">
              <Button variant="primary" size="small" icon={Package}>
                Go to Product Management
              </Button>
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Variant Name</th>
                  <th>Parent Product</th>
                  <th>Attribute</th>
                  <th>Value</th>
                  <th>Additional Price</th>
                  <th>Final Price</th>
                  <th>SKU</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {variants.map((v) => {
                  const isInactive = v.is_active === false;

                  return (
                    <tr key={v.id} style={{ opacity: isInactive ? 0.7 : 1 }}>
                      {/* Variant Name */}
                      <td style={{ fontWeight: 600, color: 'var(--primary-navy)' }}>
                        {v.variant_name}
                      </td>

                      {/* Parent Product */}
                      <td>
                        <Link
                          to={`/admin/products/${v.product_id}`}
                          style={{
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            color: 'var(--primary-navy)'
                          }}
                          title="Open parent product"
                        >
                          <span>{v.product_name}</span>
                          <ExternalLink size={12} color="var(--text-muted)" />
                        </Link>
                      </td>

                      {/* Attribute Name */}
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {v.attribute_name}
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

                      {/* Final Price */}
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

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <Link
                          to={`/admin/products/${v.product_id}`}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', gap: '0.3rem' }}
                          title="Manage in Product Details"
                        >
                          <span>Manage</span>
                          <ExternalLink size={13} />
                        </Link>
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
              of <strong style={{ color: 'var(--text-primary)' }}>{total}</strong> variants
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
    </div>
  );
};

export default VariantList;

