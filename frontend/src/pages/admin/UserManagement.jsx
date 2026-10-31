import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  Filter,
  Eye,
  Edit2,
  ShieldCheck,
  ShieldAlert,
  X,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import Button from '../../components/common/Button';
import InputField from '../../components/forms/InputField';
import Alert from '../../components/common/Alert';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const API_BASE_URL = 'http://localhost:5000/api';

export const UserManagement = () => {
  const { session, user: currentAdmin } = useAuth();
  const { addToast } = useToast();

  // Data states
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter & pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Modal states
  const [viewingUser, setViewingUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editFullName, setEditFullName] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [confirmStatusUser, setConfirmStatusUser] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);

  // Fetch users from Express API
  const fetchUsers = useCallback(async () => {
    if (!session?.access_token) return;

    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });

      if (searchTerm.trim()) params.append('search', searchTerm.trim());
      if (roleFilter !== 'ALL') params.append('role', roleFilter);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);

      const res = await fetch(`${API_BASE_URL}/users?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch user directory.');
      }

      setUsers(data.users || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Error connecting to user service.');
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, page, searchTerm, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle Search Input Change with Page Reset
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  // Handle Role Filter
  const handleRoleChange = (e) => {
    setRoleFilter(e.target.value);
    setPage(1);
  };

  // Handle Status Filter
  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  // Open Edit Modal
  const openEditModal = (u) => {
    setEditingUser(u);
    setEditFullName(u.full_name);
  };

  // Submit Profile Edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingUser || !editFullName.trim()) return;

    try {
      setEditLoading(true);
      const res = await fetch(`${API_BASE_URL}/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ full_name: editFullName.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update user profile.');
      }

      addToast(`Updated profile for ${data.user.email}`, 'success');
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setEditLoading(false);
    }
  };

  // Execute Status Toggle (ACTIVE <-> INACTIVE)
  const handleToggleStatus = async () => {
    if (!confirmStatusUser) return;

    const newStatus = confirmStatusUser.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    try {
      setStatusLoading(true);
      const res = await fetch(`${API_BASE_URL}/users/${confirmStatusUser.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update account status.');
      }

      addToast(`Account for ${confirmStatusUser.email} is now ${newStatus}.`, 'success');
      setConfirmStatusUser(null);
      fetchUsers();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setStatusLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
        <div>
          <h2>User Directory & Access Control</h2>
          <p style={{ marginTop: '0.25rem' }}>
            Comprehensive directory of all customer, staff, and administrator profiles stored in Supabase.
          </p>
        </div>

        <button onClick={fetchUsers} className="btn btn-outline btn-sm" disabled={loading}>
          <RefreshCw size={15} className={loading ? 'spinner' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      <Alert type="error" message={error} onClose={() => setError('')} />

      {/* Main Card with Toolbar & Table */}
      <div className="content-card" style={{ padding: '1.5rem' }}>
        {/* Table Toolbar (Search & Filters) */}
        <div className="table-toolbar">
          <div className="toolbar-group">
            {/* Search Box */}
            <div className="input-wrapper" style={{ minWidth: '260px' }}>
              <span className="input-icon">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="form-input has-icon"
                style={{ padding: '0.55rem 0.85rem 0.55rem 2.3rem', fontSize: '0.875rem' }}
              />
            </div>

            {/* Role Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Filter size={15} color="var(--text-muted)" />
              <select value={roleFilter} onChange={handleRoleChange} className="filter-select">
                <option value="ALL">All Roles</option>
                <option value="ADMIN">Administrators</option>
                <option value="STAFF">Staff Members</option>
                <option value="CUSTOMER">Customers</option>
              </select>
            </div>

            {/* Status Filter */}
            <select value={statusFilter} onChange={handleStatusChange} className="filter-select">
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
          </div>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing <strong>{users.length}</strong> of <strong>{total}</strong> users
          </div>
        </div>

        {/* Data Table */}
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Registration Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3rem' }}>
                    <LoadingSpinner size="normal" color="dark" message="Loading users from database..." />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6">
                    <div className="empty-state">
                      <Users size={36} color="var(--secondary-sand-dark)" />
                      <p>No user profiles match your filter criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isSelf = currentAdmin?.id === u.id;
                  return (
                    <tr key={u.id}>
                      <td>
                        <strong>{u.full_name}</strong>
                        {isSelf && (
                          <span style={{ marginLeft: '0.4rem', fontSize: '0.725rem', color: 'var(--primary-navy)', fontWeight: 700 }}>
                            (You)
                          </span>
                        )}
                      </td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`badge badge-${u.role?.toLowerCase()}`}>
                          {u.role}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-${u.status?.toLowerCase()}`}>
                          {u.status}
                        </span>
                      </td>
                      <td>{formatDate(u.created_at)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="action-btn-group" style={{ justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => setViewingUser(u)}
                            className="action-btn"
                            title="View Profile Details"
                          >
                            <Eye size={14} />
                            <span>View</span>
                          </button>

                          <button
                            onClick={() => openEditModal(u)}
                            className="action-btn"
                            title="Edit Name"
                          >
                            <Edit2 size={14} />
                            <span>Edit</span>
                          </button>

                          <button
                            onClick={() => setConfirmStatusUser(u)}
                            disabled={isSelf && u.status === 'ACTIVE'}
                            className={`action-btn ${u.status === 'ACTIVE' ? 'action-btn-danger' : 'action-btn-success'}`}
                            title={
                              isSelf && u.status === 'ACTIVE'
                                ? 'You cannot deactivate your own admin account.'
                                : u.status === 'ACTIVE'
                                ? 'Deactivate Account'
                                : 'Activate Account'
                            }
                          >
                            {u.status === 'ACTIVE' ? (
                              <>
                                <ShieldAlert size={14} />
                                <span>Deactivate</span>
                              </>
                            ) : (
                              <>
                                <ShieldCheck size={14} />
                                <span>Activate</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {!loading && totalPages > 1 && (
          <div className="pagination-bar">
            <div>
              Page <strong>{page}</strong> of <strong>{totalPages}</strong>
            </div>

            <div className="pagination-controls">
              <button
                className="page-btn"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft size={16} />
                <span>Prev</span>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .map((p, idx, arr) => (
                  <React.Fragment key={p}>
                    {idx > 0 && arr[idx - 1] !== p - 1 && <span style={{ padding: '0 4px' }}>...</span>}
                    <button
                      className={`page-btn ${page === p ? 'active' : ''}`}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                ))}

              <button
                className="page-btn"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ==============================================================================
         1. VIEW USER DETAILS MODAL
         ============================================================================== */}
      {viewingUser && (
        <div className="modal-overlay" onClick={() => setViewingUser(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>User Profile Details</h3>
              <button className="modal-close" onClick={() => setViewingUser(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <div className="label">Full Name</div>
                  <div className="value">{viewingUser.full_name}</div>
                </div>

                <div className="detail-item">
                  <div className="label">Email Address</div>
                  <div className="value">{viewingUser.email}</div>
                </div>

                <div className="detail-item">
                  <div className="label">Assigned Role</div>
                  <div className="value">
                    <span className={`badge badge-${viewingUser.role?.toLowerCase()}`}>
                      {viewingUser.role}
                    </span>
                  </div>
                </div>

                <div className="detail-item">
                  <div className="label">Account Status</div>
                  <div className="value">
                    <span className={`badge badge-${viewingUser.status?.toLowerCase()}`}>
                      {viewingUser.status}
                    </span>
                  </div>
                </div>

                <div className="detail-item">
                  <div className="label">Registered On</div>
                  <div className="value">{formatDate(viewingUser.created_at)}</div>
                </div>

                <div className="detail-item">
                  <div className="label">Last Profile Update</div>
                  <div className="value">{formatDate(viewingUser.updated_at)}</div>
                </div>
              </div>

              <div className="detail-item" style={{ marginBottom: 0 }}>
                <div className="label">Supabase Auth User ID (UUID)</div>
                <div className="value" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                  {viewingUser.id}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <Button variant="secondary" size="sm" onClick={() => setViewingUser(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================================
         2. EDIT USER MODAL (Edit Full Name)
         ============================================================================== */}
      {editingUser && (
        <div className="modal-overlay" onClick={() => setEditingUser(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit User Profile</h3>
              <button className="modal-close" onClick={() => setEditingUser(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <div className="modal-body">
                <p style={{ fontSize: '0.875rem', marginBottom: '1.25rem', color: 'var(--text-secondary)' }}>
                  Updating profile information for <strong>{editingUser.email}</strong>. (Role and email are immutable for security).
                </p>

                <InputField
                  id="edit-fullname"
                  name="editFullName"
                  label="Full Name"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  required
                />
              </div>

              <div className="modal-footer">
                <Button variant="outline" size="sm" onClick={() => setEditingUser(null)} disabled={editLoading}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" loading={editLoading}>
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==============================================================================
         3. STATUS TOGGLE CONFIRMATION DIALOG
         ============================================================================== */}
      {confirmStatusUser && (
        <div className="modal-overlay" onClick={() => setConfirmStatusUser(null)}>
          <div className="modal-box" style={{ maxWidth: '460px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {confirmStatusUser.status === 'ACTIVE' ? 'Deactivate Account' : 'Reactivate Account'}
              </h3>
              <button className="modal-close" onClick={() => setConfirmStatusUser(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {confirmStatusUser.status === 'ACTIVE' ? (
                <div>
                  <div className="alert alert-warning">
                    <ShieldAlert size={20} style={{ flexShrink: 0 }} />
                    <div>
                      <strong>Warning:</strong> Deactivating <strong>{confirmStatusUser.email}</strong> will immediately revoke their access to all protected APIs and workflows.
                    </div>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Their profile, subscriptions, and financial history are safely preserved and not deleted. You can reactivate this account at any time.
                  </p>
                </div>
              ) : (
                <div>
                  <div className="alert alert-info">
                    <ShieldCheck size={20} style={{ flexShrink: 0 }} />
                    <div>
                      Reactivating <strong>{confirmStatusUser.email}</strong> will restore their access to their account workspace.
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <Button variant="outline" size="sm" onClick={() => setConfirmStatusUser(null)} disabled={statusLoading}>
                Cancel
              </Button>
              <Button
                variant={confirmStatusUser.status === 'ACTIVE' ? 'danger' : 'primary'}
                size="sm"
                loading={statusLoading}
                onClick={handleToggleStatus}
              >
                {confirmStatusUser.status === 'ACTIVE' ? 'Confirm Deactivation' : 'Confirm Activation'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;

