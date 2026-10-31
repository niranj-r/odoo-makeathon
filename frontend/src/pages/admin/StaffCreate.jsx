import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Briefcase,
  ArrowLeft,
  Mail,
  User,
  Phone,
  KeyRound,
  Send,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import InputField from '../../components/forms/InputField';
import PasswordField, { validatePasswordCriteria } from '../../components/forms/PasswordField';
import Button from '../../components/common/Button';

export const StaffCreate = () => {
  const { session } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [creationMethod, setCreationMethod] = useState('invite'); // 'invite' or 'password'
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim() || !email.trim()) {
      setError('Full name and email address are required.');
      return;
    }

    if (creationMethod === 'password') {
      const criteria = validatePasswordCriteria(password);
      if (!criteria.isValid) {
        setError('Temporary password must meet all security requirements.');
        return;
      }
    }

    try {
      setLoading(true);

      const payload = {
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || null,
        method: creationMethod
      };

      if (creationMethod === 'password') {
        payload.password = password;
      }

      const res = await fetch('http://localhost:5000/api/admin/staff/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to provision staff account.');
      }

      addToast(data.message || 'Staff account created successfully.', 'success');
      navigate('/admin/staff');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '3rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/admin/staff" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
          <ArrowLeft size={16} /> Back to Staff Directory
        </Link>
        <h1 style={{ fontSize: '1.75rem', color: 'var(--primary-navy)' }}>Invite or Add Staff Member</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Provision an internal operational staff account with role-based access to customer management, quotations, and subscriptions.
        </p>
      </div>

      <div className="content-card" style={{ padding: '2rem' }}>
        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            Account Provisioning Method
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div
              onClick={() => setCreationMethod('invite')}
              style={{
                border: creationMethod === 'invite' ? '2px solid var(--primary-navy)' : '1px solid var(--border-light)',
                backgroundColor: creationMethod === 'invite' ? '#F0F7FF' : '#FFFFFF',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: 'var(--primary-navy)' }}>
                <Mail size={18} /> Supabase Email Invite
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                Dispatches a secure invitation link allowing the staff member to set their password.
              </p>
            </div>

            <div
              onClick={() => setCreationMethod('password')}
              style={{
                border: creationMethod === 'password' ? '2px solid var(--primary-navy)' : '1px solid var(--border-light)',
                backgroundColor: creationMethod === 'password' ? '#F0F7FF' : '#FFFFFF',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: 'var(--primary-navy)' }}>
                <KeyRound size={18} /> Set Temporary Password
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                Admin defines an initial temporary password for direct in-person provisioning.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <InputField
            id="staff-fullname"
            name="fullName"
            label="Staff Full Name"
            placeholder="e.g. Rachel Green"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />

          <InputField
            id="staff-email"
            name="email"
            type="email"
            label="Corporate Email Address"
            placeholder="rachel@brightloop.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <InputField
            id="staff-phone"
            name="phone"
            label="Phone Number (Optional)"
            placeholder="+91 98765 43210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          {creationMethod === 'password' && (
            <div style={{ marginTop: '1rem' }}>
              <PasswordField
                id="staff-temp-password"
                name="password"
                label="Initial Temporary Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                showCriteria={true}
              />
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
            <Link to="/admin/staff" className="btn btn-secondary">
              Cancel
            </Link>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              icon={creationMethod === 'invite' ? Send : CheckCircle2}
            >
              {creationMethod === 'invite' ? 'Send Invitation Email' : 'Create Staff Account'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StaffCreate;

