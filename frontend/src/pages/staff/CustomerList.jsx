import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  Eye,
  Building,
  Phone,
  Mail,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export const CustomerList = () => {
  const { session } = useAuth();

  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const fetchCustomers = async () => {
    if (!session?.access_token) return;

    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });
      if (searchTerm.trim()) params.append('search', searchTerm.trim());
      if (statusFilter !== 'ALL') params.append('status', statusFilter);

      const res = await fetch(`http://localhost:5000/api/staff/customers?${params.toString()}`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setCustomers(data.customers || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.warn('Customer list error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [session?.access_token, page, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCustomers();
  };

  return (
    <div style={{ paddingBottom: '3rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', color: 'var(--primary-navy)' }}>Permitted Customer Accounts</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Client directory, subscription relationships, billing histories, and service contacts.
          </p>
        </div>
        <button onClick={fetchCustomers} className="btn btn-outline btn-sm" disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spinner' : ''} /> Refresh
        </button>
      </div>

      <div className="content-card" style={{ padding: '1.5rem' }}>
        {/* Search & Filter Toolbar */}
        <div className="table-toolbar">
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', flex: 1 }}>
            <div className="input-wrapper" style={{ minWidth: '260px', flex: 1 }}>
              <span className="input-icon">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="Search by customer name, email, or ID..."
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
                <option value="ACTIVE">Active Customers</option>
                <option value="INACTIVE">Inactive Customers</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary btn-sm">
              Search
            </button>
          </form>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing <strong>{customers.length}</strong> of <strong>{total}</strong> customers
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '3rem 0', textAlign: 'center' }}>
            <LoadingSpinner message="Loading customer directory..." />
          </div>
        ) : customers.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No customers found matching the criteria.
          </div>
        ) : (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Customer ID</th>
                  <th>Company</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <strong>{c.name}</strong>
                      <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>{c.email}</div>
                    </td>
                    <td>
                      <code>{c.customer_number || c.id.slice(0, 8)}</code>
                    </td>
                    <td>{c.company_name || '—'}</td>
                    <td>{c.phone || '—'}</td>
                    <td>
                      <span className={`badge badge-${c.status?.toLowerCase() === 'active' ? 'active' : 'inactive'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem' }}>
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link
                        to={`/staff/customers/${c.id}`}
                        className="action-btn"
                        title="View Customer Profile"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', textDecoration: 'none' }}
                      >
                        <Eye size={14} /> <span>Inspect</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn btn-outline btn-sm"
            >
              <ChevronLeft size={16} /> Previous
            </button>
            <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: '0.875rem' }}>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn btn-outline btn-sm"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerList;

