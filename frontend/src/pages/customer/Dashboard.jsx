import React from 'react';
import {
  User,
  CreditCard,
  FileText,
  Calendar,
  LogOut,
  ShieldCheck,
  PackageCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const CustomerDashboard = () => {
  const { user, profile, logout } = useAuth();

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Customer';

  return (
    <div>
      {/* Welcome Banner */}
      <div className="dashboard-hero" style={{ background: 'linear-gradient(135deg, #1B3C53 0%, #2A5A7B 100%)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem' }}>
            <span className="badge badge-customer">
              <User size={14} /> Customer Portal
            </span>
            <span className="badge badge-active">ACTIVE SUBSCRIPTION STANDING</span>
          </div>
          <h1>Welcome, {displayName}</h1>
          <p>
            Logged in as <strong>{user?.email}</strong> with role <strong>CUSTOMER</strong>. Here you can review your active subscription plans, payment records, and monthly invoices.
          </p>
        </div>

        <button onClick={logout} className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }}>
          <LogOut size={16} /> Sign Out
        </button>
      </div>

      {/* Customer Quick Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Current Plans</span>
            <PackageCheck size={20} color="var(--primary-navy)" />
          </div>
          <div className="stat-value">Active</div>
          <p style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>Managed through Brightloop Subscription Engine</p>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Billing Status</span>
            <CreditCard size={20} color="var(--primary-navy)" />
          </div>
          <div className="stat-value">Current</div>
          <p style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>All invoices settled on schedule</p>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Statements</span>
            <FileText size={20} color="var(--primary-navy)" />
          </div>
          <div className="stat-value">Up to date</div>
          <p style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>Automated monthly statements generated</p>
        </div>
      </div>

      {/* Account Details & Role Isolation Info */}
      <div className="content-card">
        <div className="card-title-row">
          <div>
            <h3>Your Profile & Security Status</h3>
            <p style={{ fontSize: '0.825rem' }}>Your account is protected with Row Level Security (RLS).</p>
          </div>
          <ShieldCheck size={20} color="#10B981" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
          <div>
            <small style={{ color: 'var(--text-muted)', display: 'block' }}>FULL NAME</small>
            <strong style={{ fontSize: '1rem' }}>{displayName}</strong>
          </div>
          <div>
            <small style={{ color: 'var(--text-muted)', display: 'block' }}>REGISTERED EMAIL</small>
            <strong style={{ fontSize: '1rem' }}>{user?.email}</strong>
          </div>
          <div>
            <small style={{ color: 'var(--text-muted)', display: 'block' }}>USER ROLE</small>
            <div><span className="badge badge-customer">CUSTOMER</span></div>
          </div>
          <div>
            <small style={{ color: 'var(--text-muted)', display: 'block' }}>DATA ISOLATION</small>
            <span style={{ color: '#166534', fontWeight: 600 }}>RLS Enforced (Self-only)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;

