import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Building2, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import InputField from '../../components/forms/InputField';
import PasswordField from '../../components/forms/PasswordField';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import SetupBanner from '../../components/common/SetupBanner';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { login, isConfigured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    try {
      setLoading(true);
      const { user, profile } = await login(email.trim(), password);

      // Determine redirect path based on user role
      const userRole = profile?.role || 'CUSTOMER';

      const redirectPath =
        location.state?.from?.pathname ||
        (userRole === 'ADMIN'
          ? '/admin/dashboard'
          : userRole === 'STAFF'
          ? '/staff/dashboard'
          : '/portal/dashboard');

      navigate(redirectPath, { replace: true });
    } catch (err) {
      console.error('Login failure:', err);
      setErrorMessage(
        err.message || 'Invalid email or password. Please verify your credentials and try again.'
      );
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
          <h2>Sign In to Brightloop</h2>
          <p className="card-subtext">Enter your credentials to access your account workspace.</p>

          <Alert type="error" message={errorMessage} onClose={() => setErrorMessage('')} />

          <form onSubmit={handleLogin} noValidate>
            <InputField
              id="login-email"
              name="email"
              label="Email Address"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              icon={Mail}
              autoComplete="email"
            />

            <PasswordField
              id="login-password"
              name="password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.25rem' }}>
              <Link to="/forgot-password" style={{ fontSize: '0.85rem' }}>
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              block
              loading={loading}
              icon={LogIn}
            >
              Sign In
            </Button>
          </form>

          <div className="auth-footer">
            Don&apos;t have a Brightloop account?{' '}
            <Link to="/register" style={{ fontWeight: 600 }}>
              Create customer account
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;

