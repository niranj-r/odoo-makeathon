import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Check, X, AlertCircle } from 'lucide-react';

export const validatePasswordCriteria = (password = '') => {
  const hasLength = password.length > 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  return {
    hasLength,
    hasUpper,
    hasLower,
    hasSpecial,
    isValid: hasLength && hasUpper && hasLower && hasSpecial
  };
};

export const PasswordField = ({
  id,
  name = 'password',
  label = 'Password',
  value = '',
  onChange,
  placeholder = '••••••••',
  required = false,
  error = '',
  showCriteria = false,
  disabled = false,
  autoComplete = 'current-password',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || name;

  const criteria = validatePasswordCriteria(value);

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}

      <div className="input-wrapper">
        <span className="input-icon">
          <Lock size={18} />
        </span>

        <input
          id={inputId}
          name={name}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          className={`form-input has-icon has-action ${error ? 'input-error' : ''}`}
          {...props}
        />

        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="input-action"
          tabIndex={-1}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {error && (
        <div className="field-error">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {showCriteria && (
        <div className="password-criteria">
          <div className={`criteria-item ${criteria.hasLength ? 'valid' : ''}`}>
            {criteria.hasLength ? <Check size={14} /> : <X size={14} />}
            <span>More than 8 characters ({value.length}/9+)</span>
          </div>
          <div className={`criteria-item ${criteria.hasUpper ? 'valid' : ''}`}>
            {criteria.hasUpper ? <Check size={14} /> : <X size={14} />}
            <span>At least one uppercase letter (A-Z)</span>
          </div>
          <div className={`criteria-item ${criteria.hasLower ? 'valid' : ''}`}>
            {criteria.hasLower ? <Check size={14} /> : <X size={14} />}
            <span>At least one lowercase letter (a-z)</span>
          </div>
          <div className={`criteria-item ${criteria.hasSpecial ? 'valid' : ''}`}>
            {criteria.hasSpecial ? <Check size={14} /> : <X size={14} />}
            <span>At least one special character (!@#$%^&*...)</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PasswordField;

