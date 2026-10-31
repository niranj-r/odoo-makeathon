import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CalendarRange,
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
  CheckCircle,
  X,
  Package,
  IndianRupee,
  Layers,
  Clock,
  ShieldCheck,
  PauseCircle,
  Repeat
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const API_BASE_URL = 'http://localhost:5000/api';

export const SubscriptionPlanList = () => {
  const { session, role } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Plans data state
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Products lookup for filter dropdown
  const [productsList, setProductsList] = useState([]);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [productIdFilter, setProductIdFilter] = useState('');
  const [intervalFilter, setIntervalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Status toggle confirmation modal
  const [confirmPlan, setConfirmPlan] = useState(null);
  const [statusActionLoading, setStatusActionLoading] = useState(false);

  const isAdmin = role === 'ADMIN';

  // Load products list for the product dropdown filter
  useEffect(() => {
    const fetchProductsForFilter = async () => {
      if (!session?.access_token) return;
      try {
        const res = await fetch(`${API_BASE_URL}/products?limit=100`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setProductsList(data.products || []);
        }
      } catch (err) {
        console.warn('Could not load products for filter dropdown:', err);
      }
    };
    fetchProductsForFilter();
  }, [session?.access_token]);

  // Fetch subscription plans from backend
  const fetchPlans = useCallback(async () => {
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
      if (productIdFilter) params.append('product_id', productIdFilter);
      if (intervalFilter) params.append('billing_interval', intervalFilter);
      if (statusFilter) params.append('status', statusFilter);

      const res = await fetch(`${API_BASE_URL}/subscription-plans?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to retrieve subscription plans.');
      }

      setPlans(data.plans || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCount(data.pagination?.total || 0);
    } catch (err) {
      console.error('Error fetching subscription plans:', err);
      setError(err.message || 'Failed to load subscription plans.');
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, page, limit, search, productIdFilter, intervalFilter, statusFilter]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // Handle plan status activation/deactivation
  const handleToggleStatus = async () => {
    if (!confirmPlan || !session?.access_token) return;

    try {
      setStatusActionLoading(true);
      const newStatus = !confirmPlan.is_active;

      const res = await fetch(`${API_BASE_URL}/subscription-plans/${confirmPlan.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ is_active: newStatus })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to update plan status.');
      }

      addToast(
        data.message || `Plan "${confirmPlan.name}" was ${newStatus ? 'activated' : 'deactivated'} successfully.`,
        'success'
      );

      setConfirmPlan(null);
      fetchPlans();
    } catch (err) {
      console.error('Error updating plan status:', err);
      addToast(err.message || 'Failed to update plan status.', 'error');
    } finally {
      setStatusActionLoading(false);
    }
  };

  // Indian Rupee currency formatter
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

  // Interval badge styling
  const getIntervalBadge = (interval) => {
    const map = {
      daily: { label: 'Daily', bg: '#fef3c7', text: '#92400e' },
      weekly: { label: 'Weekly', bg: '#e0e7ff', text: '#3730a3' },
      monthly: { label: 'Monthly', bg: '#dbeafe', text: '#1e40af' },
      yearly: { label: 'Yearly', bg: '#dcfce7', text: '#166534' }
    };
    const conf = map[interval?.toLowerCase()] || { label: interval, bg: 'var(--bg-sand)', text: 'var(--text-primary)' };
    return (
      <span
        style={{
          display: 'inline-block',
          padding: '0.2rem 0.55rem',
          borderRadius: '4px',
          fontSize: '0.75rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.03em',
          backgroundColor: conf.bg,
          color: conf.text
        }}
      >
        {conf.label}
      </span>
    );
  };

  return (
    <div>
      {/* Top Header */}
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <CalendarRange size={26} color="var(--primary-navy)" />
            Subscription Plans
          </h1>
          <p style={{ marginTop: '0.25rem' }}>
            Configure recurring billing intervals, pricing models, and renewal rules for subscription offerings.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button
            variant="outline"
            size="small"
            icon={RefreshCw}
            onClick={fetchPlans}
            disabled={loading}
            title="Refresh subscription plans"
          >
            Refresh
          </Button>

          {isAdmin && (
            <Link to="/admin/subscription-plans/new">
              <Button variant="primary" size="small" icon={Plus}>
                Create Plan
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

      {/* Filters Card */}
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
              placeholder="Search plans by name..."
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

          {/* Product Filter */}
          <div className="input-wrapper" style={{ margin: 0 }}>
            <span className="input-icon">
              <Package size={18} />
            </span>
            <select
              className="form-input has-icon"
              value={productIdFilter}
              onChange={(e) => {
                setProductIdFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Products</option>
              {productsList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({formatCurrency(p.sales_price)})
                </option>
              ))}
            </select>
          </div>

          {/* Billing Interval Filter */}
          <div className="input-wrapper" style={{ margin: 0 }}>
            <span className="input-icon">
              <Clock size={18} />
            </span>
            <select
              className="form-input has-icon"
              value={intervalFilter}
              onChange={(e) => {
                setIntervalFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Billing Intervals</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
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

        {/* Clear Filters Button (shown if any filter active) */}
        {(search || productIdFilter || intervalFilter || statusFilter) && (
          <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setSearch('');
                setProductIdFilter('');
                setIntervalFilter('');
                setStatusFilter('');
                setPage(1);
              }}
            >
              <X size={14} style={{ marginRight: '0.3rem' }} />
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* Plans Data Table Card */}
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
            <LoadingSpinner size="medium" message="Loading subscription plans..." />
          </div>
        ) : plans.length === 0 ? (
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
              <CalendarRange size={26} />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--primary-navy)' }}>
              No subscription plans found
            </h3>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 1.5rem' }}>
              {search || productIdFilter || intervalFilter || statusFilter
                ? 'No subscription plans matched your filter criteria. Try adjusting or resetting your search.'
                : 'Get started by creating your first subscription plan tied to an active product offering.'}
            </p>
            {isAdmin && (
              <Link to="/admin/subscription-plans/new">
                <Button variant="primary" icon={Plus}>
                  Create First Plan
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
                    <th>Plan Name</th>
                    <th>Product</th>
                    <th>Billing Interval</th>
                    <th>Price</th>
                    <th>Min Qty</th>
                    <th>Lifecycle Policies</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((p) => (
                    <tr key={p.id}>
                      {/* Plan Name */}
                      <td>
                        <Link
                          to={`/admin/subscription-plans/${p.id}`}
                          style={{
                            fontWeight: 700,
                            color: 'var(--primary-navy)',
                            textDecoration: 'none'
                          }}
                        >
                          {p.name}
                        </Link>
                        {p.start_date && (
                          <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                            Starts: {formatDate(p.start_date)}
                            {p.end_date ? ` · Ends: ${formatDate(p.end_date)}` : ''}
                          </div>
                        )}
                      </td>

                      {/* Parent Product */}
                      <td>
                        {p.product ? (
                          <div>
                            <Link
                              to={`/admin/products/${p.product.id}`}
                              style={{
                                color: 'var(--primary-navy)',
                                fontWeight: 600,
                                fontSize: '0.9rem',
                                textDecoration: 'none'
                              }}
                            >
                              {p.product.name}
                            </Link>
                            <span
                              style={{
                                display: 'block',
                                fontSize: '0.725rem',
                                color: 'var(--text-muted)',
                                textTransform: 'capitalize'
                              }}
                            >
                              {p.product.type} · Base {formatCurrency(p.product.sales_price)}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>

                      {/* Interval */}
                      <td>{getIntervalBadge(p.billing_interval)}</td>

                      {/* Price */}
                      <td>
                        <strong style={{ fontSize: '1rem', color: 'var(--primary-navy)' }}>
                          {formatCurrency(p.price)}
                        </strong>
                        <small style={{ display: 'block', fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                          per {p.billing_interval}
                        </small>
                      </td>

                      {/* Min Qty */}
                      <td>
                        <span style={{ fontWeight: 600 }}>{p.min_quantity}</span>
                      </td>

                      {/* Policies */}
                      <td>
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                          {p.auto_close && (
                            <span
                              title="Auto-closes at term end"
                              className="badge"
                              style={{ backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '0.7rem' }}
                            >
                              Auto-Close
                            </span>
                          )}
                          {p.allow_early_close && (
                            <span
                              title="Early closure permitted"
                              className="badge"
                              style={{ backgroundColor: '#f1f5f9', color: '#475569', fontSize: '0.7rem' }}
                            >
                              Early-Close
                            </span>
                          )}
                          {p.allow_pause && (
                            <span
                              title="Subscription pausing allowed"
                              className="badge"
                              style={{ backgroundColor: '#fef3c7', color: '#92400e', fontSize: '0.7rem' }}
                            >
                              Pause
                            </span>
                          )}
                          {p.allow_renewal && (
                            <span
                              title="Auto-renewal enabled"
                              className="badge"
                              style={{ backgroundColor: '#dcfce7', color: '#166534', fontSize: '0.7rem' }}
                            >
                              Renew
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`badge ${p.is_active ? 'badge-active' : 'badge-inactive'}`}>
                          {p.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          <Link to={`/admin/subscription-plans/${p.id}`}>
                            <button
                              type="button"
                              className="action-btn"
                              title="View Plan Details"
                            >
                              <Eye size={16} />
                            </button>
                          </Link>

                          {isAdmin && (
                            <>
                              <Link to={`/admin/subscription-plans/${p.id}/edit`}>
                                <button
                                  type="button"
                                  className="action-btn"
                                  title="Edit Plan"
                                >
                                  <Edit2 size={16} />
                                </button>
                              </Link>

                              <button
                                type="button"
                                className={`action-btn ${p.is_active ? 'action-delete' : 'action-activate'}`}
                                title={p.is_active ? 'Deactivate Plan' : 'Activate Plan'}
                                onClick={() => setConfirmPlan(p)}
                              >
                                {p.is_active ? <Power size={16} /> : <RotateCcw size={16} />}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
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
                Showing <strong>{plans.length}</strong> of <strong>{totalCount}</strong> subscription plans
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

      {/* Status Confirmation Modal */}
      {confirmPlan && (
        <div className="modal-backdrop">
          <div className="modal-container" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle
                  size={20}
                  color={confirmPlan.is_active ? 'var(--status-inactive-text)' : 'var(--status-active-text)'}
                />
                <h3 className="modal-title">
                  {confirmPlan.is_active ? 'Deactivate Subscription Plan?' : 'Reactivate Subscription Plan?'}
                </h3>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setConfirmPlan(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <p style={{ margin: '0 0 1rem' }}>
                Are you sure you want to {confirmPlan.is_active ? 'deactivate' : 'reactivate'} the plan{' '}
                <strong>&quot;{confirmPlan.name}&quot;</strong>?
              </p>

              {confirmPlan.is_active ? (
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
                  <strong>Note:</strong> Deactivating this plan will prevent new quotations or subscriptions from selecting it. Existing active subscriptions running on this plan will not be deleted or interrupted.
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
                  <strong>Note:</strong> Reactivating will immediately restore this plan to the catalog for new customer subscriptions.
                </div>
              )}
            </div>

            <div className="modal-footer">
              <Button
                variant="outline"
                type="button"
                onClick={() => setConfirmPlan(null)}
                disabled={statusActionLoading}
              >
                Cancel
              </Button>
              <Button
                variant={confirmPlan.is_active ? 'danger' : 'primary'}
                type="button"
                loading={statusActionLoading}
                onClick={handleToggleStatus}
              >
                {confirmPlan.is_active ? 'Deactivate Plan' : 'Reactivate Plan'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionPlanList;

