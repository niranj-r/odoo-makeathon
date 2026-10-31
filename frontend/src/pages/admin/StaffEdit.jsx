import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  ArrowLeft,
  Save,
  AlertCircle,
  Lock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import InputField from '../../components/forms/InputField';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export const StaffEdit = () => {
  const { id } = useParams();
  const { session } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [staff, setStaff] = useState(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStaff = async () => {
      if (!session?.access_token || !id) return;
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:5000/api/admin/staff/${id}`, {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Staff member not found.');
        setStaff(data.staff);
        setFullName(data.staff.full_name || '');
        setPhone(data.staff.phone || '');
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStaff();
  }, [id, session?.access_token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Staff full name is required.');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const res = await fetch(`http://localhost:5000/api/admin/staff/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          full_name: fullName.trim(),
          phone: phone.trim() || null
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update staff record.');

      addToast('Staff profile updated successfully.', 'success');
      navigate(`/admin/staff/${id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <LoadingSpinner message="Loading staff data..." />
      </div>
    );
  }

  if (error && !staff) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
        <div className="alert alert-danger">{error}</div>
        <Link to="/admin/staff" className="btn btn-secondary" style={{ marginTop: '1rem' }}>
          Back to Directory
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '750px', margin: '0 auto', paddingBottom: '3rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to={`/admin/staff/${id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
          <ArrowLeft size={16} /> Back to Details
        </Link>
        <h1 style={{ fontSize: '1.75rem', color: 'var(--primary-navy)' }}>Edit Staff Profile</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Update permitted personal and contact details for {staff.full_name}.
        </p>
      </div>

      <div className="content-card" style={{ padding: '2rem' }}>
        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <InputField
            id="edit-fullname"
            name="fullName"
            label="Staff Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />

          <InputField
            id="edit-phone"
            name="phone"
            label="Contact Phone Number"
            placeholder="+91 98765 43210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <div style={{ opacity: 0.7, marginTop: '1rem' }}>
            <InputField
              id="edit-email"
              name="email"
              label="Email Address (Locked)"
              value={staff.email}
              disabled
              helpText="User authentication emails are managed through Supabase Auth."
            />
          </div>

          <div style={{ opacity: 0.7 }}>
            <InputField
              id="edit-role"
              name="role"
              label="Role Assignment (Locked)"
              value="STAFF"
              disabled
              helpText="Role elevation to ADMIN requires explicit database procedure."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
            <Link to={`/admin/staff/${id}`} className="btn btn-secondary">
              Cancel
            </Link>
            <Button
              type="submit"
              variant="primary"
              loading={saving}
              icon={Save}
            >
              Save Profile Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StaffEdit;

