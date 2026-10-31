import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  ArrowLeft,
  Edit2,
  ShieldCheck,
  ShieldAlert,
  Mail,
  Phone,
  Calendar,
  Clock,
  Activity,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export const StaffDetail = () => {
  const { id } = useParams();
  const { session } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [staff, setStaff] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  const fetchStaffDetails = async () => {
    if (!session?.access_token || !id) return;

    try {
      setLoading(true);
      setError('');

      const [staffRes, actRes] = await Promise.all([
        fetch(`http://localhost:5000/api/admin/staff/${id}`, {
          headers: { Authorization: `Bearer ${session.access_token}` }
        }),
        fetch(`http://localhost:5000/api/admin/staff/${id}/activity`, {
          headers: { Authorization: `Bearer ${session.access_token}` }
        })
      ]);

      const staffData = await staffRes.json();
      const actData = await actRes.json();

      if (!staffRes.ok) {
        throw new Error(staffData.message || 'Failed to fetch staff record.');
      }

      setStaff(staffData.staff);
      setActivities(actData.activities || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffDetails();
  }, [id, session?.access_token]);

  const handleToggleStatus = async () => {
    if (!staff) return;
    const nextStatus = staff.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    try {
      setStatusLoading(true);
      const res = await fetch(`http://localhost:5000/api/admin/staff/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update status.');

      addToast(data.message || `Staff account marked as ${nextStatus}.`, 'success');
      setStaff(data.staff);
      setShowStatusModal(false);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setStatusLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <LoadingSpinner message="Loading staff profile and activity records..." />
      </div>
    );
  }

  if (error || !staff) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
        <Link to="/admin/staff" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
          <ArrowLeft size={16} /> Back to Staff Directory
        </Link>
        <div className="alert alert-danger" style={{ marginTop: '1rem' }}>
          {error || 'Staff member could not be located.'}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <Link to="/admin/staff" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
            <ArrowLeft size={16} /> Back to Staff Directory
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 style={{ fontSize: '1.75rem', color: 'var(--primary-navy)' }}>{staff.full_name}</h1>
            <span className={`badge badge-${staff.status === 'ACTIVE' ? 'active' : 'inactive'}`}>
              {staff.status}
            </span>
            <span className="badge badge-staff">STAFF</span>
          </div>
          <p style={{ color: 'var(--text-muted)' }}>Member ID: <code>{staff.id}</code></p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to={`/admin/staff/${id}/edit`} className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <Edit2 size={16} /> Edit Profile
          </Link>
          <button
            onClick={() => setShowStatusModal(true)}
            className={`btn ${staff.status === 'ACTIVE' ? 'btn-danger' : 'btn-primary'}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            {staff.status === 'ACTIVE' ? <ShieldAlert size={16} /> : <ShieldCheck size={16} />}
            {staff.status === 'ACTIVE' ? 'Deactivate Account' : 'Activate Account'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Profile Card */}
        <div className="content-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--primary-navy)', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
            Contact & Identity
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div>
              <small style={{ color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600 }}>Email Address</small>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
                <Mail size={15} color="var(--primary-navy)" /> {staff.email}
              </div>
            </div>
            <div>
              <small style={{ color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600 }}>Phone Number</small>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
                <Phone size={15} color="var(--primary-navy)" /> {staff.phone || 'Not provided'}
              </div>
            </div>
            <div>
              <small style={{ color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600 }}>System Role</small>
              <div style={{ fontWeight: 600, color: 'var(--primary-navy)' }}>STAFF (Internal Operations)</div>
            </div>
          </div>
        </div>

        {/* Security & Dates Card */}
        <div className="content-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--primary-navy)', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
            Account Governance
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div>
              <small style={{ color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600 }}>Date Joined</small>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
                <Calendar size={15} color="var(--primary-navy)" />
                {new Date(staff.created_at).toLocaleDateString()} ({new Date(staff.created_at).toLocaleTimeString()})
              </div>
            </div>
            <div>
              <small style={{ color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600 }}>Last Login</small>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
                <Clock size={15} color="var(--primary-navy)" />
                {staff.last_sign_in_at ? new Date(staff.last_sign_in_at).toLocaleString() : 'Never logged in / Invitee'}
              </div>
            </div>
            <div>
              <small style={{ color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600 }}>Access Enforcement</small>
              <span className={`badge badge-${staff.status === 'ACTIVE' ? 'active' : 'inactive'}`}>
                {staff.status === 'ACTIVE' ? 'API & Portal Access Permitted' : 'Blocked at Auth Middleware'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Log Section */}
      <div className="content-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Activity size={18} color="var(--primary-navy)" />
          <h3 style={{ fontSize: '1.1rem', color: 'var(--primary-navy)', margin: 0 }}>
            Recent Operational Activity
          </h3>
        </div>

        {activities.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No recent operational activities recorded for this staff account.
          </div>
        ) : (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((act) => (
                  <tr key={act.id}>
                    <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      {new Date(act.created_at).toLocaleString()}
                    </td>
                    <td>
                      <span className="badge badge-staff" style={{ fontSize: '0.75rem' }}>
                        {act.action}
                      </span>
                    </td>
                    <td><code>{act.entity_type}</code></td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {JSON.stringify(act.details || {})}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Deactivation / Activation Modal Pop-up */}
      {showStatusModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <AlertTriangle size={24} color={staff.status === 'ACTIVE' ? '#D9534F' : '#28A745'} />
              <h3 style={{ margin: 0 }}>
                {staff.status === 'ACTIVE' ? 'Deactivate Staff Member?' : 'Reactivate Staff Member?'}
              </h3>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              {staff.status === 'ACTIVE'
                ? `Deactivating ${staff.full_name} will immediately revoke their access to the Staff Portal and block any existing authenticated sessions.`
                : `Activating ${staff.full_name} will restore their operational permissions and allow them to log into the Staff Portal.`}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowStatusModal(false)}
                disabled={statusLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`btn ${staff.status === 'ACTIVE' ? 'btn-danger' : 'btn-primary'}`}
                onClick={handleToggleStatus}
                disabled={statusLoading}
              >
                {statusLoading ? 'Processing...' : (staff.status === 'ACTIVE' ? 'Confirm Deactivation' : 'Confirm Activation')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffDetail;

