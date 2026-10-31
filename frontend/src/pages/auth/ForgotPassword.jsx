import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Building2, Send, CheckCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import InputField from '../../components/common/InputField';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import SetupBanner from '../../components/common/SetupBanner';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const { forgotPassword } = useAuth();

  const handleResetRequest = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim()) {
      setErrorMessage('Please enter the email address registered to your account.');
      return;
    }

    try {
      setLoading(true);
      await forgotPassword(email.trim());
      setSubmitted(true);
    } catch (err) {
      console.error('Password reset dispatch error:', err);
      setErrorMessage(
        err.message || 'Unable to send reset email. Please ensure your email address is correct.'
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
          <h2>Reset Your Password</h2>
          <p className="card-subtext">
            Enter your email address and we will dispatch a secure link to reset your account password.
          </p>

          <Alert type="error" message={errorMessage} onClose={() => setErrorMessage('')} />

          {submitted ? (
            <div>
              <div className="alert alert-success">
                <CheckCircle size={20} style={{ flexShrink: 0 }} />
                <div>
                  <strong>Reset Link Dispatched:</strong> If an active account is registered with{' '}
                  <strong>{email}</strong>, you will receive password reset instructions shortly.
                </div>
              </div>
              <p style={{ fontSize: '0.875rem', marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
                Please check your inbox (and spam folder). Reset links expire after a short period.
              </p>
              <Link to="/login" className="btn btn-outline btn-block">
                <ArrowLeft size={16} /> Return to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleResetRequest} noValidate>
              <InputField
                id="forgot-email"
                name="email"
                label="Registered Email Address"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                icon={Mail}
                autoComplete="email"
              />

              <Button
                type="submit"
                variant="primary"
                block
                loading={loading}
                icon={Send}
              >
                Send Password Reset Link
              </Button>

              <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
                <Link to="/login" style={{ fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <ArrowLeft size={14} /> Back to Sign In
                </Link>
              </div>
            </form>
          )}

          <div className="auth-footer">
            Need additional assistance? Contact support@brightloop.com
          </div>
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;

