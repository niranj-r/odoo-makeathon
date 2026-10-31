import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  Search,
  Filter,
  Eye,
  RefreshCw,
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export const SubscriptionList = () => {
  const { session } = useAuth();

  const [subscriptions, setSubscriptions] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchSubscriptions = async () => {
    if (!session?.access_token) return;
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (searchTerm.trim()) params.append('search', searchTerm.trim());

      const res = await fetch(`http://localhost:5000/api/staff/subscriptions?${params.toString()}`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSubscriptions(data.subscriptions || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.warn('Subscription list error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [session?.access_token, page, statusFilter]);

  return (
    <div style={{ paddingBottom: '3rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', color: 'var(--primary-navy)' }}>Customer Subscriptions</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Active recurring service contracts, renewal schedules, and lifecycle operations.
          </p>
        </div>
        <button onClick={fetchSubscriptions} className="btn btn-outline btn-sm" disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spinner' : ''} /> Refresh
        </button>
      </div>

      <div className="content-card" style={{ padding: '1.5rem' }}>
        <div className="table-toolbar">
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', flex: 1 }}>
            <div className="input-wrapper" style={{ minWidth: '240px', flex: 1 }}>
              <span className="input-icon">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="Search by subscription number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input has-icon"
                style={{ padding: '0.55rem 0.85rem 0.55rem 2.3rem' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Filter size={15} color="var(--text-muted)" />
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="filter-select"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="PAUSED">Paused</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
          </div>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Total <strong>{total}</strong> subscriptions
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '3rem 0', textAlign: 'center' }}>
            <LoadingSpinner message="Loading subscriptions..." />
          </div>
        ) : subscriptions.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No subscriptions found matching the selected filter.
          </div>
        ) : (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Subscription #</th>
                  <th>Customer</th>
                  <th>Cadence</th>
                  <th>Status</th>
                  <th>Next Billing</th>
                  <th>Auto Renew</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map(s => (
                  <tr key={s.id}>
                    <td><code>{s.subscription_number}</code></td>
                    <td>
                      <strong>{s.customers?.name || 'Customer'}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.customers?.email}</div>
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>{s.billing_frequency}</td>
                    <td>
                      <span className={`badge badge-${s.status?.toLowerCase()}`}>
                        {s.status}
                      </span>
                    </td>
                    <td>{s.next_billing_date || '—'}</td>
                    <td>{s.auto_renew ? 'Yes' : 'No'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <Link to={`/staff/subscriptions/${s.id}`} className="action-btn" style={{ textDecoration: 'none' }}>
                        <Eye size={14} /> <span>Inspect</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn btn-outline btn-sm">
              <ChevronLeft size={16} /> Previous
            </button>
            <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: '0.875rem' }}>
              Page {page} of {totalPages}
            </span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn btn-outline btn-sm">
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionList;

