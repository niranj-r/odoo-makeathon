import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Save,
  KeyRound,
  ShieldAlert,
  Mail,
  Phone,
  Calendar,
  Lock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import { supabase } from '../../services/supabase';
import InputField from '../../components/forms/InputField';
import PasswordField, { validatePasswordCriteria } from '../../components/forms/PasswordField';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export const StaffProfile = () => {
  const { user, profile, session } = useAuth();
  const { addToast } = useToast();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  // Change password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const fetchProfile = async () => {
    if (!session?.access_token) return;
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/staff/profile', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      const data = await res.json();
      if (res.ok && data.profile) {
        setFullName(data.profile.full_name || '');
        setPhone(data.profile.phone || '');
      }
    } catch (err) {
      console.warn('Profile fetch warning:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [session?.access_token]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      addToast('Full name is required.', 'error');
      return;
    }

    try {
      setSavingProfile(true);
      const res = await fetch('http://localhost:5000/api/staff/profile', {
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
      if (!res.ok) throw new Error(data.message || 'Failed to update profile.');

      addToast(data.message || 'Profile details updated successfully.', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    const criteria = validatePasswordCriteria(newPassword);
    if (!criteria.isValid) {
      setPasswordError('New password must satisfy all criteria.');
      return;
    }

    try {
      setChangingPassword(true);
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      addToast('Password changed successfully.', 'success');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err.message || 'Failed to update password.');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '4rem 0', textAlign: 'center' }}>
        <LoadingSpinner message="Loading account security credentials..." />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '3rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', color: 'var(--primary-navy)' }}>Staff Profile & Security</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Manage your operational identity, verified contact details, and account credentials.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {/* Personal Details Form */}
        <div className="content-card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
            <UserCheck size={18} color="var(--primary-navy)" />
            <h3 style={{ fontSize: '1.1rem', color: 'var(--primary-navy)', margin: 0 }}>Personal Details</h3>
          </div>

          <form onSubmit={handleUpdateProfile}>
            <InputField
              id="staff-my-name"
              name="fullName"
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />

            <InputField
              id="staff-my-phone"
              name="phone"
              label="Contact Phone"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <div style={{ opacity: 0.75, marginTop: '0.5rem' }}>
              <InputField
                id="staff-my-email"
                name="email"
                label="Registered Work Email (Read-Only)"
                value={user?.email || ''}
                disabled
              />
            </div>

            <div style={{ opacity: 0.75 }}>
              <InputField
                id="staff-my-role"
                name="role"
                label="System Role (Read-Only)"
                value="STAFF"
                disabled
              />
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="submit" variant="primary" loading={savingProfile} icon={Save}>
                Save Changes
              </Button>
            </div>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="content-card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
            <KeyRound size={18} color="var(--primary-navy)" />
            <h3 style={{ fontSize: '1.1rem', color: 'var(--primary-navy)', margin: 0 }}>Change Password</h3>
          </div>

          {passwordError && (
            <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
              <AlertCircle size={16} />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword}>
            <PasswordField
              id="staff-new-pw"
              name="newPassword"
              label="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              showCriteria={true}
            />

            <PasswordField
              id="staff-confirm-pw"
              name="confirmPassword"
              label="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="submit" variant="primary" loading={changingPassword} icon={Lock}>
                Update Password
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StaffProfile;
