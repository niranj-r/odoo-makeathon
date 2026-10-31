import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, User, Building2, UserPlus, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import InputField from '../../components/forms/InputField';
import PasswordField, { validatePasswordCriteria } from '../../components/forms/PasswordField';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import SetupBanner from '../../components/common/SetupBanner';

export const Register = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successInfo, setSuccessInfo] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessInfo('');

    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      setErrorMessage('Please complete all required fields.');
      return;
    }

    // Password criteria check
    const criteria = validatePasswordCriteria(password);
    if (!criteria.isValid) {
      setErrorMessage(
        'Password must be more than 8 characters, and include uppercase, lowercase, and a special character.'
      );
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    try {
      setLoading(true);
      const data = await register({
        fullName: fullName.trim(),
        email: email.trim(),
        password
      });

      // Check if email confirmation is required by Supabase settings
      if (data?.user?.identities && data.user.identities.length === 0) {
        setErrorMessage('An account with this email address already exists. Please sign in instead.');
        return;
      }

      if (data?.session) {
        // Direct auto-login enabled
        navigate('/portal/dashboard', { replace: true });
      } else {
        setSuccessInfo(
          'Account created successfully! If email verification is enabled on your project, please check your inbox to confirm your address before logging in.'
        );
      }
    } catch (err) {
      console.error('Registration error:', err);
      setErrorMessage(err.message || 'Unable to complete registration. Please check the provided information.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SetupBanner />
      <div className="auth-page">
        <div className="auth-header">
          <div className="brand-badge">
            <div className="brand-logo-icon">
              <Building2 size={22} />
            </div>
            <span className="brand-title">BRIGHTLOOP</span>
          </div>
          <p className="brand-subtitle">Subscription Management Platform</p>
        </div>

        <div className="auth-card">
          <h2>Create Customer Account</h2>
          <p className="card-subtext">Sign up to manage your subscriptions, plans and invoices.</p>

          <Alert type="error" message={errorMessage} onClose={() => setErrorMessage('')} />
          {successInfo && (
            <div className="alert alert-success">
              <CheckCircle size={20} style={{ flexShrink: 0 }} />
              <div>
                <p style={{ color: '#166534', fontWeight: 600, marginBottom: '0.5rem' }}>{successInfo}</p>
                <Link to="/login" className="btn btn-primary btn-sm">
                  Proceed to Sign In
                </Link>
              </div>
            </div>
          )}

          {!successInfo && (
            <form onSubmit={handleRegister} noValidate>
              <InputField
                id="reg-fullname"
                name="fullName"
                label="Full Name"
                placeholder="Sarah Connor"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                icon={User}
                autoComplete="name"
              />

              <InputField
                id="reg-email"
                name="email"
                label="Work Email"
                type="email"
                placeholder="sarah@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                icon={Mail}
                autoComplete="email"
              />

              <PasswordField
                id="reg-password"
                name="password"
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                showCriteria={true}
                autoComplete="new-password"
              />

              <PasswordField
                id="reg-confirm-password"
                name="confirmPassword"
                label="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />

              <div style={{ marginTop: '1.25rem' }}>
                <Button
                  type="submit"
                  variant="primary"
                  block
                  loading={loading}
                  icon={UserPlus}
                >
                  Create Account
                </Button>
              </div>
            </form>
          )}

          <div className="auth-footer">
            Already have an account?{' '}
            <Link to="/login" style={{ fontWeight: 600 }}>
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;

