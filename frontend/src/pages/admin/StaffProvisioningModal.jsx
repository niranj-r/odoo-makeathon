import React, { useState } from 'react';
import { PlusCircle, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import InputField from '../../components/common/InputField';
import PasswordField, { validatePasswordCriteria } from '../../components/common/PasswordField';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';

/**
 * StaffProvisioningCard
 * Preserved administrative utility component for creating staff credentials.
 */
export const StaffProvisioningCard = ({ onUserCreated }) => {
  const { session } = useAuth();
  const [staffFullName, setStaffFullName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [createStaffLoading, setCreateStaffLoading] = useState(false);
  const [staffFormMessage, setStaffFormMessage] = useState({ type: '', text: '' });

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
        text: 'Password must be longer than 8 characters, with uppercase, lowercase, and a special character.',
      });
      return;
    }

    try {
      setCreateStaffLoading(true);
      const res = await fetch('http://localhost:5000/api/users/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          full_name: staffFullName.trim(),
          email: staffEmail.trim(),
          password: staffPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to create staff account.');
      }

      setStaffFormMessage({
        type: 'success',
        text: `Staff account for ${staffFullName} (${staffEmail}) created successfully.`,
      });
      setStaffFullName('');
      setStaffEmail('');
      setStaffPassword('');
      if (onUserCreated) {
        onUserCreated();
      }
    } catch (err) {
      setStaffFormMessage({ type: 'error', text: err.message });
    } finally {
      setCreateStaffLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Provision Staff Account</h3>
          <p className="text-xs text-slate-500">Only administrators can provision internal staff members.</p>
        </div>
        <Lock size={18} className="text-slate-400" />
      </div>

      {staffFormMessage.text && (
        <Alert
          type={staffFormMessage.type}
          message={staffFormMessage.text}
          onClose={() => setStaffFormMessage({ type: '', text: '' })}
        />
      )}

      <form onSubmit={handleCreateStaff} className="space-y-4">
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
  );
};

export default StaffProvisioningCard;

