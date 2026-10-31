import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Tag,
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
  Percent,
  Calendar,
  Layers,
  CheckCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const API_BASE_URL = 'http://localhost:5000/api';

export const DiscountList = () => {
  const { session, role } = useAuth();
  const { addToast } = useToast();

  // Discounts state
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [appliesFilter, setAppliesFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Status toggle confirmation modal
  const [confirmDiscount, setConfirmDiscount] = useState(null);
  const [statusActionLoading, setStatusActionLoading] = useState(false);

  const isAdmin = role === 'ADMIN';

  // Fetch discounts from backend
  const fetchDiscounts = useCallback(async () => {
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
      if (typeFilter) params.append('type', typeFilter);
      if (appliesFilter) params.append('applies_to', appliesFilter);
      if (statusFilter) params.append('status', statusFilter);

      const res = await fetch(`${API_BASE_URL}/discounts?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to retrieve discounts.');
      }

      setDiscounts(data.discounts || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCount(data.pagination?.total || 0);
    } catch (err) {
      console.error('Error fetching discounts:', err);
      setError(err.message || 'Failed to load discounts.');
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, page, limit, search, typeFilter, appliesFilter, statusFilter]);

  useEffect(() => {
    fetchDiscounts();
  }, [fetchDiscounts]);

  // Handle status toggle (Activate / Deactivate)
  const handleToggleStatus = async () => {
    if (!confirmDiscount || !session?.access_token) return;

    try {
      setStatusActionLoading(true);
      const newStatus = !confirmDiscount.is_active;

      const res = await fetch(`${API_BASE_URL}/discounts/${confirmDiscount.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ is_active: newStatus })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to update discount status.');
      }

      addToast(
        data.message || `Discount "${confirmDiscount.code}" ${newStatus ? 'activated' : 'deactivated'} successfully.`,
        'success'
      );

      setConfirmDiscount(null);
      fetchDiscounts();
    } catch (err) {
      console.error('Error updating discount status:', err);
      addToast(err.message || 'Failed to update discount status.', 'error');
    } finally {
      setStatusActionLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '—';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getApplicabilityBadge = (appliesTo) => {
    const val = (appliesTo || 'all').toLowerCase();
    if (val === 'product' || val === 'products') {
      return { label: 'Selected Products', bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' };
    }
    if (val === 'plan' || val === 'plans' || val === 'subscription') {
      return { label: 'Subscription Plans', bg: '#FAF5FF', text: '#7E22CE', border: '#E9D5FF' };
    }
    return { label: 'All Products & Plans', bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0' };
  };

  const isExpired = (endDate) => {
    if (!endDate) return false;
    const today = new Date().toISOString().split('T')[0];
    return endDate < today;
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Top Header Card */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
          backgroundColor: '#FFFFFF',
          padding: '1.5rem 2rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-light)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
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
            <Tag size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-navy)', margin: 0 }}>
              Discount & Promo Code Management
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '0.2rem 0 0 0' }}>
              Create, configure, and monitor percentage and fixed promotional discounts.
            </p>
          </div>
        </div>

        {isAdmin && (
          <Link to="/admin/discounts/new">
            <Button variant="primary" icon={Plus}>
              Create Discount
            </Button>
          </Link>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div style={{ marginBottom: '1.5rem' }}>
          <Alert type="error" message={error} onClose={() => setError('')} />
        </div>
      )}

      {/* Filter and Search Bar */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-light)',
          padding: '1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        {/* Search */}
        <div style={{ flex: '1 1 260px', position: 'relative' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '0.85rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)'
            }}
          />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.4rem' }}
            placeholder="Search by discount code (e.g. FESTIVE20)..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        {/* Filter Controls */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          {/* Type Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Type:</span>
            <select
              className="form-input"
              style={{ width: 'auto', padding: '0.45rem 1.75rem 0.45rem 0.75rem', fontSize: '0.85rem' }}
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Types</option>
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed (₹)</option>
            </select>
          </div>

          {/* Applicability Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Applies To:</span>
            <select
              className="form-input"
              style={{ width: 'auto', padding: '0.45rem 1.75rem 0.45rem 0.75rem', fontSize: '0.85rem' }}
              value={appliesFilter}
              onChange={(e) => {
                setAppliesFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Applicability</option>
              <option value="all">All Products & Plans</option>
              <option value="product">Selected Products</option>
              <option value="plan">Subscription Plans</option>
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Status:</span>
            <select
              className="form-input"
              style={{ width: 'auto', padding: '0.45rem 1.75rem 0.45rem 0.75rem', fontSize: '0.85rem' }}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <button
            onClick={fetchDiscounts}
            className="btn btn-ghost btn-sm"
            style={{ padding: '0.5rem', color: 'var(--primary-navy)' }}
            title="Refresh list"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-light)',
          overflow: 'hidden',
          marginBottom: '1.5rem'
        }}
      >
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center' }}>
            <LoadingSpinner size="large" message="Loading discounts catalog..." />
          </div>
        ) : discounts.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-sand)',
                color: 'var(--text-muted)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}
            >
              <Tag size={26} />
            </div>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--primary-navy)', marginBottom: '0.5rem' }}>
              No discounts found
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
              {search || typeFilter || appliesFilter || statusFilter
                ? 'No discount codes match your search criteria. Try adjusting or clearing filters.'
                : 'No promotional codes exist yet. Create your first discount campaign to offer price cuts.'}
            </p>
            {isAdmin && (
              <Link to="/admin/discounts/new">
                <Button variant="primary" icon={Plus}>
                  Create Discount
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Discount Code</th>
                  <th>Value</th>
                  <th>Applicability</th>
                  <th>Usage (Redemptions)</th>
                  <th>Validity Dates</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {discounts.map((d) => {
                  const isPct = d.type === 'percentage';
                  const appBadge = getApplicabilityBadge(d.applies_to);
                  const expired = isExpired(d.end_date);
                  const exhausted = d.max_usage !== null && d.current_usage >= d.max_usage;

                  return (
                    <tr key={d.id} style={{ opacity: !d.is_active || expired || exhausted ? 0.75 : 1 }}>
                      {/* Code */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              fontSize: '0.95rem',
                              color: 'var(--primary-navy)',
                              backgroundColor: 'var(--bg-sand)',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                              letterSpacing: '0.5px'
                            }}
                          >
                            {d.code}
                          </span>
                        </div>
                      </td>

                      {/* Value & Type */}
                      <td>
                        <span
                          className="badge"
                          style={{
                            backgroundColor: isPct ? '#EFF6FF' : '#F0FDF4',
                            color: isPct ? '#1D4ED8' : '#15803D',
                            border: isPct ? '1px solid #BFDBFE' : '1px solid #BBF7D0',
                            fontWeight: 700,
                            fontSize: '0.85rem'
                          }}
                        >
                          {d.display_value}
                        </span>
                      </td>

                      {/* Applicability */}
                      <td>
                        <span
                          className="badge"
                          style={{
                            backgroundColor: appBadge.bg,
                            color: appBadge.text,
                            border: `1px solid ${appBadge.border}`,
                            fontSize: '0.75rem',
                            fontWeight: 600
                          }}
                        >
                          {appBadge.label}
                        </span>
                      </td>

                      {/* Usage */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {d.current_usage} {d.max_usage !== null ? `/ ${d.max_usage}` : 'uses'}
                          </span>
                          <small style={{ fontSize: '0.75rem', color: exhausted ? '#DC2626' : 'var(--text-muted)' }}>
                            {exhausted ? 'Limit exhausted' : d.max_usage === null ? 'Unlimited usage' : `${d.max_usage - d.current_usage} remaining`}
                          </small>
                        </div>
                      </td>

                      {/* Validity Dates */}
                      <td>
                        <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                          {d.start_date || d.end_date ? (
                            <span>
                              {d.start_date || 'Start'} $\rightarrow$ {d.end_date || 'Indefinite'}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>Always Active</span>
                          )}
                          {expired && (
                            <span
                              style={{
                                display: 'block',
                                color: '#DC2626',
                                fontSize: '0.75rem',
                                fontWeight: 600
                              }}
                            >
                              Expired
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`badge ${d.is_active ? 'badge-active' : 'badge-inactive'}`}>
                          {d.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Link to={`/admin/discounts/${d.id}`}>
                            <button
                              className="btn btn-ghost btn-sm"
                              style={{ padding: '0.4rem', color: 'var(--primary-navy)' }}
                              title="View details"
                            >
                              <Eye size={16} />
                            </button>
                          </Link>

                          {isAdmin && (
                            <>
                              <Link to={`/admin/discounts/${d.id}/edit`}>
                                <button
                                  className="btn btn-ghost btn-sm"
                                  style={{ padding: '0.4rem', color: 'var(--primary-navy)' }}
                                  title="Edit discount"
                                >
                                  <Edit2 size={16} />
                                </button>
                              </Link>

                              <button
                                onClick={() => setConfirmDiscount(d)}
                                className="btn btn-ghost btn-sm"
                                style={{
                                  padding: '0.4rem',
                                  color: d.is_active ? '#DC2626' : '#166534'
                                }}
                                title={d.is_active ? 'Deactivate discount' : 'Reactivate discount'}
                              >
                                {d.is_active ? <Power size={16} /> : <RotateCcw size={16} />}
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
        )}

        {/* Pagination Footer */}
        {!loading && discounts.length > 0 && (
          <div
            style={{
              padding: '1rem 1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid var(--border-light)',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}
          >
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Showing {discounts.length} of {totalCount} discount{totalCount === 1 ? '' : 's'}
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Button
                variant="outline"
                size="small"
                icon={ChevronLeft}
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, padding: '0 0.5rem' }}>
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="small"
                icon={ChevronRight}
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================================== */}
      {/* MODAL: DEACTIVATE / REACTIVATE CONFIRMATION */}
      {/* ============================================================================== */}
      {confirmDiscount && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-md)',
              maxWidth: '480px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid var(--border-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle
                  size={20}
                  style={{ color: confirmDiscount.is_active ? '#DC2626' : '#166534' }}
                />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary-navy)' }}>
                  {confirmDiscount.is_active ? 'Deactivate Discount' : 'Reactivate Discount'}
                </h3>
              </div>
              <button
                onClick={() => setConfirmDiscount(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  padding: '0.25rem'
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
                {confirmDiscount.is_active ? (
                  <>
                    Are you sure you want to deactivate discount code{' '}
                    <strong>&quot;{confirmDiscount.code}&quot;</strong>?
                    <br /><br />
                    Customers will no longer be able to apply this code on new orders or quotations. Past orders and existing subscriptions will retain their contracted rates.
                  </>
                ) : (
                  <>
                    Are you sure you want to reactivate discount code{' '}
                    <strong>&quot;{confirmDiscount.code}&quot;</strong>?
                    <br /><br />
                    Once reactivated, customers and staff can immediately apply this promo code to eligible orders.
                  </>
                )}
              </p>
            </div>

            <div
              style={{
                padding: '1rem 1.5rem',
                backgroundColor: 'var(--bg-sand)',
                borderTop: '1px solid var(--border-light)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem'
              }}
            >
              <Button
                variant="outline"
                onClick={() => setConfirmDiscount(null)}
                disabled={statusActionLoading}
              >
                Cancel
              </Button>
              <Button
                variant={confirmDiscount.is_active ? 'danger' : 'primary'}
                onClick={handleToggleStatus}
                loading={statusActionLoading}
              >
                {confirmDiscount.is_active ? 'Deactivate' : 'Reactivate'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscountList;

