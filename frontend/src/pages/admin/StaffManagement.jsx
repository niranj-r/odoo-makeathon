import React, { useState, useEffect, useCallback } from 'react';
import {
  Briefcase,
  Search,
  Filter,
  PlusCircle,
  Eye,
  Edit2,
  ShieldCheck,
  ShieldAlert,
  X,
  Mail,
  KeyRound,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import Button from '../../components/common/Button';
import InputField from '../../components/forms/InputField';
import PasswordField, { validatePasswordCriteria } from '../../components/forms/PasswordField';
import Alert from '../../components/common/Alert';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const API_BASE_URL = 'http://localhost:5000/api';

export const StaffManagement = () => {
  const { session } = useAuth();
  const { addToast } = useToast();

  // Data states
  const [staffList, setStaffList] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Add Staff Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [creationMethod, setCreationMethod] = useState('password'); // 'password' or 'invite'
  const [addFullName, setAddFullName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addConfirmPassword, setAddConfirmPassword] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addModalError, setAddModalError] = useState('');

  // View / Edit / Status Modals
  const [viewingStaff, setViewingStaff] = useState(null);
  const [editingStaff, setEditingStaff] = useState(null);
  const [editFullName, setEditFullName] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [confirmStatusStaff, setConfirmStatusStaff] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);

  // Fetch Staff List from Backend
  const fetchStaff = useCallback(async () => {
    if (!session?.access_token) return;

    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });

      if (searchTerm.trim()) params.append('search', searchTerm.trim());
      if (statusFilter !== 'ALL') params.append('status', statusFilter);

      const res = await fetch(`${API_BASE_URL}/users/staff?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch staff members.');
      }

      setStaffList(data.staff || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Error fetching staff list:', err);
      setError(err.message || 'Error connecting to staff service.');
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, page, searchTerm, statusFilter]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  // Handle Search Change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  // Handle Status Filter
  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  // Submit Add Staff
  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setAddModalError('');

    if (!addFullName.trim() || !addEmail.trim()) {
      setAddModalError('Full name and email are required.');
      return;
    }

    if (creationMethod === 'password') {
      if (!addPassword || !addConfirmPassword) {
        setAddModalError('Please set and confirm a temporary password.');
        return;
      }

      const criteria = validatePasswordCriteria(addPassword);
      if (!criteria.isValid) {
        setAddModalError(
          'Password must be more than 8 characters and include uppercase, lowercase, and a special character.'
        );
        return;
      }

      if (addPassword !== addConfirmPassword) {
        setAddModalError('Passwords do not match. Please re-enter.');
        return;
      }
    }

    try {
      setAddLoading(true);
      const res = await fetch(`${API_BASE_URL}/users/staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          full_name: addFullName.trim(),
          email: addEmail.trim(),
          method: creationMethod,
          ...(creationMethod === 'password' && { password: addPassword })
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to create staff account.');
      }

      addToast(data.message || 'Staff member added successfully.', 'success');
      setIsAddModalOpen(false);
      setAddFullName('');
      setAddEmail('');
      setAddPassword('');
      setAddConfirmPassword('');
      fetchStaff();
    } catch (err) {
      setAddModalError(err.message || 'Error provisioning staff account.');
    } finally {
      setAddLoading(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (staff) => {
    setEditingStaff(staff);
    setEditFullName(staff.full_name);
  };

  // Save Edit Full Name
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingStaff || !editFullName.trim()) return;

    try {
      setEditLoading(true);
      const res = await fetch(`${API_BASE_URL}/users/${editingStaff.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ full_name: editFullName.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update staff member.');
      }

      addToast(`Updated details for ${data.user.email}`, 'success');
      setEditingStaff(null);
      fetchStaff();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setEditLoading(false);
    }
  };

  // Execute Status Toggle (ACTIVE <-> INACTIVE)
  const handleToggleStatus = async () => {
    if (!confirmStatusStaff) return;

    const newStatus = confirmStatusStaff.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    try {
      setStatusLoading(true);
      const res = await fetch(`${API_BASE_URL}/users/${confirmStatusStaff.id}/status`, {
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

      addToast(`Staff account for ${confirmStatusStaff.email} is now ${newStatus}.`, 'success');
      setConfirmStatusStaff(null);
      fetchStaff();
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
      {/* Header with Add Staff Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
        <div>
          <h2>Staff Operations Management</h2>
          <p style={{ marginTop: '0.25rem' }}>
            Manage internal team members who operate customer quotations, subscriptions, and support.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={fetchStaff} className="btn btn-outline btn-sm" disabled={loading}>
            <RefreshCw size={15} className={loading ? 'spinner' : ''} />
            <span>Refresh</span>
          </button>

          <Button
            variant="primary"
            size="sm"
            icon={PlusCircle}
            onClick={() => setIsAddModalOpen(true)}
          >
            Add Staff Member
          </Button>
        </div>
      </div>

      <Alert type="error" message={error} onClose={() => setError('')} />

      {/* Main Content Card */}
      <div className="content-card" style={{ padding: '1.5rem' }}>
        {/* Table Toolbar */}
        <div className="table-toolbar">
          <div className="toolbar-group">
            {/* Search Box */}
            <div className="input-wrapper" style={{ minWidth: '260px' }}>
              <span className="input-icon">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="Search staff by name or email..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="form-input has-icon"
                style={{ padding: '0.55rem 0.85rem 0.55rem 2.3rem', fontSize: '0.875rem' }}
              />
            </div>

            {/* Status Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Filter size={15} color="var(--text-muted)" />
              <select value={statusFilter} onChange={handleStatusChange} className="filter-select">
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active Staff</option>
                <option value="INACTIVE">Inactive Staff</option>
              </select>
            </div>
          </div>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing <strong>{staffList.length}</strong> of <strong>{total}</strong> staff members
          </div>
        </div>

        {/* Staff Table */}
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Staff Name</th>
                <th>Work Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Date Added</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3rem' }}>
                    <LoadingSpinner size="normal" color="dark" message="Loading staff directory..." />
                  </td>
                </tr>
              ) : staffList.length === 0 ? (
                <tr>
                  <td colSpan="6">
                    <div className="empty-state">
                      <Briefcase size={36} color="var(--secondary-sand-dark)" />
                      <p>No staff accounts found.</p>
                      <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="btn btn-outline btn-sm"
                        style={{ marginTop: '0.75rem' }}
                      >
                        Provision First Staff Account
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                staffList.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <strong>{s.full_name}</strong>
                    </td>
                    <td>{s.email}</td>
                    <td>
                      <span className="badge badge-staff">STAFF</span>
                    </td>
                    <td>
                      <span className={`badge badge-${s.status?.toLowerCase()}`}>
                        {s.status}
                      </span>
                    </td>
                    <td>{formatDate(s.created_at)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="action-btn-group" style={{ justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => setViewingStaff(s)}
                          className="action-btn"
                          title="View Details"
                        >
                          <Eye size={14} />
                          <span>View</span>
                        </button>

                        <button
                          onClick={() => openEditModal(s)}
                          className="action-btn"
                          title="Edit Details"
                        >
                          <Edit2 size={14} />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => setConfirmStatusStaff(s)}
                          className={`action-btn ${s.status === 'ACTIVE' ? 'action-btn-danger' : 'action-btn-success'}`}
                          title={s.status === 'ACTIVE' ? 'Deactivate Staff Member' : 'Activate Staff Member'}
                        >
                          {s.status === 'ACTIVE' ? (
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
                ))
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
         1. ADD STAFF MODAL
         ============================================================================== */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Provision New Staff Account</h3>
              <button className="modal-close" onClick={() => setIsAddModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <div className="modal-body">
                <Alert type="error" message={addModalError} onClose={() => setAddModalError('')} />

                {/* Method Selector Tabs */}
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Account Provisioning Method</label>
                  <div className="method-tabs">
                    <button
                      type="button"
                      className={`method-tab ${creationMethod === 'password' ? 'active' : ''}`}
                      onClick={() => setCreationMethod('password')}
                    >
                      <KeyRound size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                      Temporary Password
                    </button>

                    <button
                      type="button"
                      className={`method-tab ${creationMethod === 'invite' ? 'active' : ''}`}
                      onClick={() => setCreationMethod('invite')}
                    >
                      <Mail size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                      Email Invitation Link
                    </button>
                  </div>
                </div>

                <InputField
                  id="add-staff-fullname"
                  name="addStaffFullName"
                  label="Staff Full Name"
                  placeholder="e.g. Alex Morgan"
                  value={addFullName}
                  onChange={(e) => setAddFullName(e.target.value)}
                  required
                />

                <InputField
                  id="add-staff-email"
                  name="addStaffEmail"
                  label="Work Email Address"
                  type="email"
                  placeholder="alex@brightloop.com"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  required
                />

                {creationMethod === 'password' ? (
                  <>
                    <PasswordField
                      id="add-staff-password"
                      name="addStaffPassword"
                      label="Initial Temporary Password"
                      value={addPassword}
                      onChange={(e) => setAddPassword(e.target.value)}
                      required
                      showCriteria={true}
                    />

                    <PasswordField
                      id="add-staff-confirm"
                      name="addStaffConfirm"
                      label="Confirm Temporary Password"
                      value={addConfirmPassword}
                      onChange={(e) => setAddConfirmPassword(e.target.value)}
                      required
                    />
                  </>
                ) : (
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', background: 'var(--bg-card-subtle)', padding: '0.75rem', borderRadius: 'var(--radius-xs)' }}>
                    An invitation email will be dispatched by Supabase Auth with a link allowing the staff member to complete their account setup and choose their password.
                  </p>
                )}
              </div>

              <div className="modal-footer">
                <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)} disabled={addLoading}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" loading={addLoading} icon={UserPlus}>
                  {creationMethod === 'password' ? 'Create Staff Account' : 'Dispatch Invitation'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==============================================================================
         2. VIEW STAFF DETAILS MODAL
         ============================================================================== */}
      {viewingStaff && (
        <div className="modal-overlay" onClick={() => setViewingStaff(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Staff Member Details</h3>
              <button className="modal-close" onClick={() => setViewingStaff(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <div className="label">Full Name</div>
                  <div className="value">{viewingStaff.full_name}</div>
                </div>

                <div className="detail-item">
                  <div className="label">Work Email</div>
                  <div className="value">{viewingStaff.email}</div>
                </div>

                <div className="detail-item">
                  <div className="label">Platform Role</div>
                  <div className="value">
                    <span className="badge badge-staff">STAFF</span>
                  </div>
                </div>

                <div className="detail-item">
                  <div className="label">Operational Status</div>
                  <div className="value">
                    <span className={`badge badge-${viewingStaff.status?.toLowerCase()}`}>
                      {viewingStaff.status}
                    </span>
                  </div>
                </div>

                <div className="detail-item">
                  <div className="label">Added Date</div>
                  <div className="value">{formatDate(viewingStaff.created_at)}</div>
                </div>

                <div className="detail-item">
                  <div className="label">Last Updated</div>
                  <div className="value">{formatDate(viewingStaff.updated_at)}</div>
                </div>
              </div>

              <div className="detail-item" style={{ marginBottom: 0 }}>
                <div className="label">Supabase Auth ID (UUID)</div>
                <div className="value" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                  {viewingStaff.id}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <Button variant="secondary" size="sm" onClick={() => setViewingStaff(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================================
         3. EDIT STAFF MODAL
         ============================================================================== */}
      {editingStaff && (
        <div className="modal-overlay" onClick={() => setEditingStaff(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Staff Member</h3>
              <button className="modal-close" onClick={() => setEditingStaff(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <div className="modal-body">
                <p style={{ fontSize: '0.875rem', marginBottom: '1.25rem', color: 'var(--text-secondary)' }}>
                  Modifying profile information for <strong>{editingStaff.email}</strong>.
                </p>

                <InputField
                  id="edit-staff-fullname"
                  name="editStaffFullName"
                  label="Full Name"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  required
                />
              </div>

              <div className="modal-footer">
                <Button variant="outline" size="sm" onClick={() => setEditingStaff(null)} disabled={editLoading}>
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
         4. STATUS TOGGLE CONFIRMATION DIALOG
         ============================================================================== */}
      {confirmStatusStaff && (
        <div className="modal-overlay" onClick={() => setConfirmStatusStaff(null)}>
          <div className="modal-box" style={{ maxWidth: '460px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {confirmStatusStaff.status === 'ACTIVE' ? 'Deactivate Staff Account' : 'Reactivate Staff Account'}
              </h3>
              <button className="modal-close" onClick={() => setConfirmStatusStaff(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {confirmStatusStaff.status === 'ACTIVE' ? (
                <div>
                  <div className="alert alert-warning">
                    <ShieldAlert size={20} style={{ flexShrink: 0 }} />
                    <div>
                      <strong>Deactivation Warning:</strong> Deactivating <strong>{confirmStatusStaff.email}</strong> will immediately terminate their access to staff operations and APIs.
                    </div>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    All past quotes and customer history associated with this account are securely retained. The account can be reactivated whenever needed.
                  </p>
                </div>
              ) : (
                <div>
                  <div className="alert alert-info">
                    <ShieldCheck size={20} style={{ flexShrink: 0 }} />
                    <div>
                      Reactivating <strong>{confirmStatusStaff.email}</strong> will allow this staff member to resume logging in and performing operations.
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <Button variant="outline" size="sm" onClick={() => setConfirmStatusStaff(null)} disabled={statusLoading}>
                Cancel
              </Button>
              <Button
                variant={confirmStatusStaff.status === 'ACTIVE' ? 'danger' : 'primary'}
                size="sm"
                loading={statusLoading}
                onClick={handleToggleStatus}
              >
                {confirmStatusStaff.status === 'ACTIVE' ? 'Confirm Deactivation' : 'Confirm Activation'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;

