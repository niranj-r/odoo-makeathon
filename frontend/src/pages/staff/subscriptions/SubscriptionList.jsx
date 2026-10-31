import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  RefreshCw,
  Search,
  Eye,
  Calendar,
  Clock,
  CheckCircle,
  PauseCircle,
  XCircle,
  AlertCircle,
  Repeat,
  Plus
} from 'lucide-react';
import { getSubscriptions } from '../../../services/api';
import { useToast } from '../../../components/common/Toast';
import Button from '../../../components/common/Button';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

export const SubscriptionList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useToast();

  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const statusFilter = searchParams.get('status') || '';
  const customerIdFilter = searchParams.get('customer_id') || '';
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  const fetchSubscriptionsList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSubscriptions({
        page,
        limit: 10,
        status: statusFilter || undefined,
        customer_id: customerIdFilter || undefined,
        search: search.trim() || undefined
      });
      setSubscriptions(res.data || []);
      if (res.pagination) {
        setPagination(res.pagination);
      }
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
      addToast(err.message || 'Failed to load subscriptions', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, customerIdFilter, search, addToast]);

  useEffect(() => {
    fetchSubscriptionsList();
  }, [fetchSubscriptionsList]);

  const handleTabChange = (status) => {
    const params = new URLSearchParams(searchParams);
    if (status) {
      params.set('status', status);
    } else {
      params.delete('status');
    }
    setSearchParams(params);
    setPage(1);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="badge badge-active"><CheckCircle size={10} /> Active</span>;
      case 'PAUSED':
        return <span className="badge" style={{ backgroundColor: '#FEF3C7', color: '#B45309' }}><PauseCircle size={10} /> Paused</span>;
      case 'CONFIRMED':
        return <span className="badge" style={{ backgroundColor: '#E0F2FE', color: '#0369A1' }}><CheckCircle size={10} /> Confirmed</span>;
      case 'DRAFT':
        return <span className="badge badge-staff"><Clock size={10} /> Draft</span>;
      case 'CLOSED':
        return <span className="badge badge-inactive"><XCircle size={10} /> Closed</span>;
      case 'CANCELLED':
        return <span className="badge" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}><XCircle size={10} /> Cancelled</span>;
      default:
        return <span className="badge badge-staff">{status}</span>;
    }
  };

  const tabs = [
    { label: 'All Subscriptions', value: '' },
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Paused', value: 'PAUSED' },
    { label: 'Confirmed', value: 'CONFIRMED' },
    { label: 'Draft', value: 'DRAFT' },
    { label: 'Closed / Cancelled', value: 'CLOSED' }
  ];

  return (
    <div>
      {/* Header Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2>Subscription Management</h2>
          <p>Monitor recurring client contracts, lifecycle states, renewals, and automated expiration policies.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button
            variant="outline"
            icon={RefreshCw}
            onClick={fetchSubscriptionsList}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        {tabs.map((tab) => (
          <button
            key={tab.value}
            className={`btn btn-sm ${statusFilter === tab.value ? 'btn-primary' : 'btn-outline'}`}
            style={{ borderRadius: 'var(--radius-pill)', fontWeight: 600 }}
            onClick={() => handleTabChange(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="content-card" style={{ padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
        <div className="input-wrapper" style={{ maxWidth: '460px' }}>
          <span className="input-icon">
            <Search size={18} />
          </span>
          <input
            type="text"
            className="form-input has-icon"
            placeholder="Search by subscription # (SUB-...) or customer name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="content-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <LoadingSpinner size="large" color="dark" />
            <p style={{ marginTop: '1rem' }}>Loading subscription contracts...</p>
          </div>
        ) : subscriptions.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <RefreshCw size={48} style={{ color: 'var(--secondary-sand-dark)', margin: '0 auto 1rem' }} />
            <h3>No Subscriptions Found</h3>
            <p style={{ maxWidth: '420px', margin: '0.5rem auto 1.5rem' }}>
              {statusFilter || search
                ? 'No subscriptions match your current filter criteria.'
                : 'Convert an accepted quotation to generate a recurring subscription contract.'}
            </p>
            <Button variant="primary" onClick={() => navigate('/staff/quotations')}>
              View Quotations
            </Button>
          </div>
        ) : (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Subscription #</th>
                  <th>Customer</th>
                  <th>Plan & Frequency</th>
                  <th>Contract Term</th>
                  <th>Recurring Amount</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => navigate(`/staff/subscriptions/${s.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <strong style={{ color: 'var(--primary-navy)' }}>{s.subscription_number}</strong>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--primary-navy)' }}>
                        {s.customers?.name || 'Customer'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {s.customers?.company_name || s.customers?.email}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{s.plan_name_snapshot || 'Custom Plan'}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Repeat size={12} /> {s.billing_frequency}
                        {s.auto_renew && <span style={{ color: '#137333', marginLeft: '0.25rem' }}>&bull; Auto-renew</span>}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>Start: {s.start_date}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        End: {s.end_date || 'Ongoing'}
                      </div>
                    </td>
                    <td>
                      <strong style={{ fontSize: '0.95rem', color: 'var(--primary-navy)' }}>
                        ${parseFloat(s.grand_total || 0).toFixed(2)}
                      </strong>
                    </td>
                    <td>{getStatusBadge(s.status)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/staff/subscriptions/${s.id}`);
                        }}
                      >
                        <Eye size={15} /> Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div
            style={{
              padding: '0.85rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid var(--border-light)',
              backgroundColor: 'var(--bg-card-subtle)'
            }}
          >
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Showing {subscriptions.length} of {pagination.total} subscriptions
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-outline btn-sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <div style={{ display: 'flex', alignItems: 'center', padding: '0 0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
                Page {page} of {pagination.totalPages}
              </div>
              <button
                className="btn btn-outline btn-sm"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionList;

