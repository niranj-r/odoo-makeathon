import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  Package,
  Layers,
  Percent,
  PlusCircle,
  CheckCircle,
  AlertCircle,
  Lock,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import InputField from '../../components/forms/InputField';
import PasswordField, { validatePasswordCriteria } from '../../components/forms/PasswordField';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';

export const AdminDashboard = () => {
  const { user, profile, session, logout } = useAuth();

  const [staffFullName, setStaffFullName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [createStaffLoading, setCreateStaffLoading] = useState(false);
  const [staffFormMessage, setStaffFormMessage] = useState({ type: '', text: '' });

  // Users list state
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const fetchUsers = async () => {
    if (!session?.access_token) return;
    try {
      setLoadingUsers(true);
      const res = await fetch('http://localhost:5000/api/users', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      if (res.ok) {
        const json = await res.json();
        setUsersList(json.users || []);
      }
    } catch (err) {
      // Backend might be offline or unconfigured
      console.log('Backend user list unavailable:', err.message);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [session?.access_token]);

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setStaffFormMessage({ type: '', text: '' });

    if (!staffFullName.trim() || !staffEmail.trim() || !staffPassword) {
      setStaffFormMessage({ type: 'error', text: 'All staff account fields are required.' });
      return;
    }

    const criteria = validatePasswordCriteria(staffPassword);
    if (!criteria.isValid) {
      setStaffFormMessage({
        type: 'error',
        text: 'Password must be longer than 8 characters, with uppercase, lowercase, and a special character.'
      });
      return;
    }

    try {
      setCreateStaffLoading(true);
      const res = await fetch('http://localhost:5000/api/users/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          full_name: staffFullName.trim(),
          email: staffEmail.trim(),
          password: staffPassword
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to create staff account.');
      }

      setStaffFormMessage({
        type: 'success',
        text: `Staff account for ${staffFullName} (${staffEmail}) created successfully.`
      });
      setStaffFullName('');
      setStaffEmail('');
      setStaffPassword('');
      fetchUsers();
    } catch (err) {
      setStaffFormMessage({ type: 'error', text: err.message });
    } finally {
      setCreateStaffLoading(false);
    }
  };

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Administrator';

  return (
    <div>
      {/* Hero Welcome Banner */}
      <div className="dashboard-hero">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem' }}>
            <span className="badge badge-admin">
              <ShieldAlert size={14} /> Full System Access
            </span>
            <span className="badge badge-active">ACTIVE STATUS</span>
          </div>
          <h1>Welcome, {displayName}</h1>
          <p>
            Logged in as <strong>{user?.email}</strong> with role <strong>ADMIN</strong>. You have complete operational control over Brightloop.
          </p>
        </div>

        <button onClick={logout} className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }}>
          <LogOut size={16} /> Sign Out
        </button>
      </div>

      {/* Stats & Scope Indicators */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Products & Variants</span>
            <Package size={20} color="var(--primary-navy)" />
          </div>
          <div className="stat-value">Ready</div>
          <p style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>Member 1: Products database foundation active</p>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Subscription Plans</span>
            <Layers size={20} color="var(--primary-navy)" />
          </div>
          <div className="stat-value">Ready</div>
          <p style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>Member 1: Daily/Weekly/Monthly/Yearly cadences</p>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Taxes & Discounts</span>
            <Percent size={20} color="var(--primary-navy)" />
          </div>
          <div className="stat-value">Ready</div>
          <p style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>Member 1: Percentage & fixed rule definitions</p>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Staff Management</span>
            <Users size={20} color="var(--primary-navy)" />
          </div>
          <div className="stat-value">Active</div>
          <p style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>Admin-only staff creation active</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {/* Create Staff Member Panel */}
        <div className="content-card">
          <div className="card-title-row">
            <div>
              <h3>Provision Staff Account</h3>
              <p style={{ fontSize: '0.825rem' }}>Only administrators can provision internal staff members.</p>
            </div>
            <Lock size={18} color="var(--text-muted)" />
          </div>

          {staffFormMessage.text && (
            <Alert
              type={staffFormMessage.type}
              message={staffFormMessage.text}
              onClose={() => setStaffFormMessage({ type: '', text: '' })}
            />
          )}

          <form onSubmit={handleCreateStaff}>
            <InputField
              id="staff-fullname"
              name="staffFullName"
              label="Staff Full Name"
              placeholder="Alex Morgan"
              value={staffFullName}
              onChange={(e) => setStaffFullName(e.target.value)}
              required
            />

            <InputField
              id="staff-email"
              name="staffEmail"
              label="Staff Email Address"
              type="email"
              placeholder="alex@brightloop.com"
              value={staffEmail}
              onChange={(e) => setStaffEmail(e.target.value)}
              required
            />

            <PasswordField
              id="staff-password"
              name="staffPassword"
              label="Initial Temporary Password"
              value={staffPassword}
              onChange={(e) => setStaffPassword(e.target.value)}
              required
              showCriteria={true}
            />

            <Button
              type="submit"
              variant="primary"
              block
              loading={createStaffLoading}
              icon={PlusCircle}
            >
              Create Staff Account
            </Button>
          </form>
        </div>

        {/* User Profiles & RBAC Monitor */}
        <div className="content-card">
          <div className="card-title-row">
            <div>
              <h3>Role-Based Access Control (RBAC)</h3>
              <p style={{ fontSize: '0.825rem' }}>Live profile directory and assigned privilege levels.</p>
            </div>
            <button onClick={fetchUsers} className="btn btn-outline btn-sm">
              Refresh
            </button>
          </div>

          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {usersList.length > 0 ? (
                  usersList.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <strong>{u.full_name || 'Anonymous'}</strong>
                        <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>{u.email}</div>
                      </td>
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
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td>
                      <strong>{displayName} (You)</strong>
                      <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>{user?.email}</div>
                    </td>
                    <td>
                      <span className="badge badge-admin">ADMIN</span>
                    </td>
                    <td>
                      <span className="badge badge-active">ACTIVE</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

