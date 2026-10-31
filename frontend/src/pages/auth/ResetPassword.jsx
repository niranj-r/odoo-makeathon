import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, KeyRound, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import PasswordField, { validatePasswordCriteria } from '../../components/forms/PasswordField';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import SetupBanner from '../../components/common/SetupBanner';

export const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [isInvalidToken, setIsInvalidToken] = useState(false);

  const { resetPassword, session, isConfigured } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if URL has error parameters from Supabase (e.g., token expired or invalid)
    const hash = window.location.hash;
    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(hash.replace(/^#/, ''));

    const error = searchParams.get('error') || hashParams.get('error');
    const errorDescription = searchParams.get('error_description') || hashParams.get('error_description');

    if (error) {
      setIsInvalidToken(true);
      setErrorMessage(
        errorDescription || 'The password reset link has expired or has already been used. Please request a new one.'
      );
    }
  }, []);

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!password || !confirmPassword) {
      setErrorMessage('Please enter and confirm your new password.');
      return;
    }

    const criteria = validatePasswordCriteria(password);
    if (!criteria.isValid) {
      setErrorMessage(
        'Password must be more than 8 characters, and include uppercase, lowercase, and a special character.'
      );
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please ensure both fields are identical.');
      return;
    }

    try {
      setLoading(true);
      await resetPassword(password);
      setSuccess(true);
    } catch (err) {
      console.error('Password update failure:', err);
      setErrorMessage(err.message || 'Failed to update password. Your reset session may have expired.');
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
          <h2>Set New Password</h2>
          <p className="card-subtext">Choose a secure password for your Brightloop account.</p>

          <Alert type="error" message={errorMessage} onClose={() => setErrorMessage('')} />

          {isInvalidToken ? (
            <div>
              <div className="alert alert-warning">
                <AlertTriangle size={20} style={{ flexShrink: 0 }} />
                <div>
                  <strong>Reset Link Expired or Invalid:</strong> This password recovery link is no longer valid.
                </div>
              </div>
              <Link to="/forgot-password" className="btn btn-primary btn-block">
                Request a New Reset Link
              </Link>
            </div>
          ) : success ? (
            <div>
              <div className="alert alert-success">
                <CheckCircle size={20} style={{ flexShrink: 0 }} />
                <div>
                  <strong>Password Updated Successfully!</strong> You can now sign in with your new password.
                </div>
              </div>
              <Link to="/login" className="btn btn-primary btn-block">
                Proceed to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handlePasswordUpdate} noValidate>
              <PasswordField
                id="reset-password"
                name="password"
                label="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                showCriteria={true}
                autoComplete="new-password"
              />

              <PasswordField
                id="reset-confirm-password"
                name="confirmPassword"
                label="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />

              <Button
                type="submit"
                variant="primary"
                block
                loading={loading}
                icon={KeyRound}
              >
                Update Password
              </Button>

              <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
                <Link to="/login" style={{ fontSize: '0.875rem' }}>
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}

          <div className="auth-footer">
            Brightloop Platform Security Standards Active
          </div>
        </div>
      </div>
    </>
  );
};

export default ResetPassword;

