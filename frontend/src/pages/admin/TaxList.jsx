import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Percent,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Power,
  RotateCcw,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  X,
  IndianRupee,
  Package,
  Layers,
  Calculator
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const API_BASE_URL = 'http://localhost:5000/api';

export const TaxList = () => {
  const { session, role } = useAuth();
  const { addToast } = useToast();

  // Taxes state
  const [taxes, setTaxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Status toggle confirmation modal
  const [confirmTax, setConfirmTax] = useState(null);
  const [statusActionLoading, setStatusActionLoading] = useState(false);

  const isAdmin = role === 'ADMIN';

  // Fetch taxes
  const fetchTaxes = useCallback(async () => {
    if (!session?.access_token) return;

    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy: 'created_at',
        sortOrder: 'desc'
      });

      if (search.trim()) params.append('search', search.trim());
      if (typeFilter) params.append('computation_type', typeFilter);
      if (statusFilter) params.append('status', statusFilter);

      const res = await fetch(`${API_BASE_URL}/taxes?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to retrieve taxes.');
      }

      setTaxes(data.taxes || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCount(data.pagination?.total || 0);
    } catch (err) {
      console.error('Error fetching taxes:', err);
      setError(err.message || 'Failed to load taxes.');
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, page, limit, search, typeFilter, statusFilter]);

  useEffect(() => {
    fetchTaxes();
  }, [fetchTaxes]);

  // Handle status activation / deactivation
  const handleToggleStatus = async () => {
    if (!confirmTax || !session?.access_token) return;

    try {
      setStatusActionLoading(true);
      const newStatus = !confirmTax.is_active;

      const res = await fetch(`${API_BASE_URL}/taxes/${confirmTax.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ is_active: newStatus })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to update tax status.');
      }

      addToast(
        data.message || `Tax "${confirmTax.name}" was ${newStatus ? 'activated' : 'deactivated'} successfully.`,
        'success'
      );

      setConfirmTax(null);
      fetchTaxes();
    } catch (err) {
      console.error('Error updating tax status:', err);
      addToast(err.message || 'Failed to update tax status.', 'error');
    } finally {
      setStatusActionLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null || isNaN(Number(amount))) return '₹0.00';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(Number(amount));
  };

  // Date formatter
  const formatDate = (isoString) => {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div>
      {/* Top Header */}
      <div
        className="section-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}
      >
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Percent size={26} color="var(--primary-navy)" />
            Tax Management
          </h1>
          <p style={{ marginTop: '0.25rem' }}>
            Configure percentage and fixed regulatory taxes applicable to products, subscriptions, and billing invoices.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button
            variant="outline"
            size="small"
            icon={RefreshCw}
            onClick={fetchTaxes}
            disabled={loading}
            title="Refresh taxes"
          >
            Refresh
          </Button>

          {isAdmin && (
            <Link to="/admin/taxes/new">
              <Button variant="primary" size="small" icon={Plus}>
                Create Tax
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => setError('')}
        />
      )}

      {/* Filter Bar */}
      <div
        className="form-card"
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-light)',
          padding: '1.25rem',
          marginBottom: '1.5rem',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'center' }}>
          {/* Search Box */}
          <div className="input-wrapper" style={{ margin: 0 }}>
            <span className="input-icon">
              <Search size={18} />
            </span>
            <input
              type="text"
              className="form-input has-icon"
              placeholder="Search taxes by name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setPage(1);
                }}
                style={{
                  position: 'absolute',
                  right: '10px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)'
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Type Filter */}
          <div className="input-wrapper" style={{ margin: 0 }}>
            <span className="input-icon">
              <Calculator size={18} />
            </span>
            <select
              className="form-input has-icon"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Computation Types</option>
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount (₹)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="input-wrapper" style={{ margin: 0 }}>
            <span className="input-icon">
              <Filter size={18} />
            </span>
            <select
              className="form-input has-icon"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
          </div>
        </div>

        {(search || typeFilter || statusFilter) && (
          <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setSearch('');
                setTypeFilter('');
                setStatusFilter('');
                setPage(1);
              }}
            >
              <X size={14} style={{ marginRight: '0.3rem' }} />
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Taxes Table Card */}
      <div
        className="form-card"
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-sm)',
          overflow: 'hidden'
        }}
      >
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center' }}>
            <LoadingSpinner size="medium" message="Loading taxes..." />
          </div>
        ) : taxes.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
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
              <Percent size={26} />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--primary-navy)' }}>
              No taxes found
            </h3>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 1.5rem' }}>
              {search || typeFilter || statusFilter
                ? 'No taxes matched your filter criteria. Try resetting or adjusting your search filters.'
                : 'Get started by creating your first tax rate (e.g. GST 18%, Service Tax, Eco Fee).'}
            </p>
            {isAdmin && (
              <Link to="/admin/taxes/new">
                <Button variant="primary" icon={Plus}>
                  Create First Tax
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tax Name</th>
                    <th>Computation Type</th>
                    <th>Rate / Value</th>
                    <th>Status</th>
                    <th>Created Date</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {taxes.map((t) => {
                    const isPercentage = t.computation_type === 'percentage';
                    return (
                      <tr key={t.id}>
                        {/* Name */}
                        <td>
                          <Link
                            to={`/admin/taxes/${t.id}`}
                            style={{
                              fontWeight: 700,
                              color: 'var(--primary-navy)',
                              textDecoration: 'none'
                            }}
                          >
                            {t.name}
                          </Link>
                        </td>

                        {/* Computation Type */}
                        <td>
                          <span
                            className="badge"
                            style={{
                              backgroundColor: isPercentage ? '#dbeafe' : '#fef3c7',
                              color: isPercentage ? '#1e40af' : '#92400e',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              textTransform: 'uppercase'
                            }}
                          >
                            {isPercentage ? 'Percentage' : 'Fixed Amount'}
                          </span>
                        </td>

                        {/* Rate / Amount */}
                        <td>
                          <strong style={{ fontSize: '1.05rem', color: 'var(--primary-navy)' }}>
                            {isPercentage ? `${t.rate_percentage}%` : formatCurrency(t.rate_percentage)}
                          </strong>
                          <small style={{ display: 'block', fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                            {isPercentage ? 'applied to subtotal' : 'per unit / cycle'}
                          </small>
                        </td>

                        {/* Status */}
                        <td>
                          <span className={`badge ${t.is_active ? 'badge-active' : 'badge-inactive'}`}>
                            {t.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>

                        {/* Created Date */}
                        <td>
                          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            {formatDate(t.created_at)}
                          </span>
                        </td>

                        {/* Actions */}
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                            <Link to={`/admin/taxes/${t.id}`}>
                              <button
                                type="button"
                                className="action-btn"
                                title="View Tax Details"
                              >
                                <Eye size={16} />
                              </button>
                            </Link>

                            {isAdmin && (
                              <>
                                <Link to={`/admin/taxes/${t.id}/edit`}>
                                  <button
                                    type="button"
                                    className="action-btn"
                                    title="Edit Tax"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                </Link>

                                <button
                                  type="button"
                                  className={`action-btn ${t.is_active ? 'action-delete' : 'action-activate'}`}
                                  title={t.is_active ? 'Deactivate Tax' : 'Activate Tax'}
                                  onClick={() => setConfirmTax(t)}
                                >
                                  {t.is_active ? <Power size={16} /> : <RotateCcw size={16} />}
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem 1.25rem',
                borderTop: '1px solid var(--border-light)',
                flexWrap: 'wrap',
                gap: '0.75rem',
                fontSize: '0.875rem',
                color: 'var(--text-secondary)'
              }}
            >
              <div>
                Showing <strong>{taxes.length}</strong> of <strong>{totalCount}</strong> taxes
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Button
                  variant="outline"
                  size="small"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  icon={ChevronLeft}
                >
                  Previous
                </Button>

                <span style={{ margin: '0 0.5rem', fontWeight: 600 }}>
                  Page {page} of {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="small"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  icon={ChevronRight}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmTax && (
        <div className="modal-backdrop">
          <div className="modal-container" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle
                  size={20}
                  color={confirmTax.is_active ? 'var(--status-inactive-text)' : 'var(--status-active-text)'}
                />
                <h3 className="modal-title">
                  {confirmTax.is_active ? 'Deactivate Tax?' : 'Reactivate Tax?'}
                </h3>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setConfirmTax(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <p style={{ margin: '0 0 1rem' }}>
                Are you sure you want to {confirmTax.is_active ? 'deactivate' : 'reactivate'} the tax{' '}
                <strong>&quot;{confirmTax.name}&quot;</strong>?
              </p>

              {confirmTax.is_active ? (
                <div
                  style={{
                    backgroundColor: 'var(--bg-sand)',
                    padding: '0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-light)'
                  }}
                >
                  <strong>Note:</strong> Deactivating this tax prevents new product associations and new subscription/invoice calculations. Historical invoices and subscriptions that recorded this tax will remain unchanged.
                </div>
              ) : (
                <div
                  style={{
                    backgroundColor: 'var(--bg-sand)',
                    padding: '0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-light)'
                  }}
                >
                  <strong>Note:</strong> Reactivating this tax restores it for immediate product assignment and billing computation.
                </div>
              )}
            </div>

            <div className="modal-footer">
              <Button
                variant="outline"
                type="button"
                onClick={() => setConfirmTax(null)}
                disabled={statusActionLoading}
              >
                Cancel
              </Button>
              <Button
                variant={confirmTax.is_active ? 'danger' : 'primary'}
                type="button"
                loading={statusActionLoading}
                onClick={handleToggleStatus}
              >
                {confirmTax.is_active ? 'Deactivate Tax' : 'Reactivate Tax'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaxList;

