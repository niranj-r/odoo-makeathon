import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Search,
  Eye,
  Edit2,
  Archive,
  RefreshCw,
  Building,
  Mail,
  Phone,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { getCustomers, updateCustomerStatus } from '../../../services/api';
import { useToast } from '../../../components/common/Toast';
import Button from '../../../components/common/Button';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import CustomerModal from './CustomerModal';

export const CustomerList = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 10 });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  const fetchCustomersList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCustomers({
        page,
        limit: 10,
        search: search.trim() || undefined,
        status: statusFilter || undefined
      });
      setCustomers(res.data || []);
      if (res.pagination) {
        setPagination(res.pagination);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
      addToast(err.message || 'Failed to load customers', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, addToast]);

  useEffect(() => {
    fetchCustomersList();
  }, [fetchCustomersList]);

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (customer, e) => {
    e.stopPropagation();
    setEditingCustomer(customer);
    setModalOpen(true);
  };

  const handleToggleStatus = async (customer, e) => {
    e.stopPropagation();
    const newStatus = customer.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const confirmMsg = `Are you sure you want to mark customer '${customer.name}' as ${newStatus}?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await updateCustomerStatus(customer.id, newStatus);
      addToast(`Customer status updated to ${newStatus}`, 'success');
      fetchCustomersList();
    } catch (err) {
      console.error('Status toggle error:', err);
      addToast(err.message || 'Failed to change customer status', 'error');
    }
  };

  return (
    <div>
      {/* Top Header Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2>Customer Directory</h2>
          <p>Manage customer accounts, billing details, quotations, and active subscriptions.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button
            variant="outline"
            icon={RefreshCw}
            onClick={fetchCustomersList}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            icon={UserPlus}
            onClick={handleOpenAdd}
          >
            Add Customer
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="content-card" style={{ padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div className="input-wrapper" style={{ flex: 1, minWidth: '240px' }}>
            <span className="input-icon">
              <Search size={18} />
            </span>
            <input
              type="text"
              className="form-input has-icon"
              placeholder="Search by name, email, company, or customer number..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div style={{ minWidth: '160px' }}>
            <select
              className="form-input"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive / Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Customers Table */}
      <div className="content-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <LoadingSpinner size="large" color="dark" />
            <p style={{ marginTop: '1rem' }}>Loading customer records...</p>
          </div>
        ) : customers.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <Users size={48} style={{ color: 'var(--secondary-sand-dark)', margin: '0 auto 1rem' }} />
            <h3>No Customers Found</h3>
            <p style={{ maxWidth: '400px', margin: '0.5rem auto 1.5rem' }}>
              {search || statusFilter
                ? 'No customer records match your filter criteria. Try clearing your search.'
                : 'Get started by creating your first customer account in the system.'}
            </p>
            <Button variant="primary" icon={UserPlus} onClick={handleOpenAdd}>
              Add First Customer
            </Button>
          </div>
        ) : (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer #</th>
                  <th>Name & Company</th>
                  <th>Contact Details</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/staff/customers/${c.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <strong style={{ color: 'var(--primary-navy)' }}>
                        {c.customer_number || 'CUST-—'}
                      </strong>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--primary-navy)' }}>{c.name}</div>
                      {c.company_name && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Building size={12} /> {c.company_name}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                        <Mail size={13} style={{ color: 'var(--text-muted)' }} /> {c.email}
                      </div>
                      {c.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          <Phone size={12} /> {c.phone}
                        </div>
                      )}
                    </td>
                    <td>
                      {c.status === 'ACTIVE' ? (
                        <span className="badge badge-active">
                          <CheckCircle size={10} /> Active
                        </span>
                      ) : (
                        <span className="badge badge-inactive">
                          <XCircle size={10} /> Inactive
                        </span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          title="View Details"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/staff/customers/${c.id}`);
                          }}
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          title="Edit Customer"
                          onClick={(e) => handleOpenEdit(c, e)}
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          title={c.status === 'ACTIVE' ? 'Archive Customer' : 'Activate Customer'}
                          style={{ color: c.status === 'ACTIVE' ? '#C5221F' : '#137333' }}
                          onClick={(e) => handleToggleStatus(c, e)}
                        >
                          <Archive size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
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
              Showing {customers.length} of {pagination.total} records
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

      {/* Customer Modal */}
      <CustomerModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        customer={editingCustomer}
        onSuccess={fetchCustomersList}
      />
    </div>
  );
};

export default CustomerList;

