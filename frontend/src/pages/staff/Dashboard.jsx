import React from 'react';
import {
  Briefcase,
  Users,
  FileSpreadsheet,
  Receipt,
  ShieldAlert,
  LogOut,
  Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const StaffDashboard = () => {
  const { user, profile, logout } = useAuth();

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Staff Member';

  return (
    <div>
      {/* Hero Welcome Banner */}
      <div className="dashboard-hero" style={{ background: 'linear-gradient(135deg, #244C6B 0%, #173247 100%)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem' }}>
            <span className="badge badge-staff">
              <Briefcase size={14} /> Internal Staff Operations
            </span>
            <span className="badge badge-active">ACTIVE STATUS</span>
          </div>
          <h1>Welcome, {displayName}</h1>
          <p>
            Logged in as <strong>{user?.email}</strong> with role <strong>STAFF</strong>. You have access to customer support and day-to-day operations.
          </p>
        </div>

        <button onClick={logout} className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }}>
          <LogOut size={16} /> Sign Out
        </button>
      </div>

      {/* Access Control Notice */}
      <div className="alert alert-info">
        <Info size={20} style={{ flexShrink: 0 }} />
        <div>
          <strong>Role-Based Access Control Notice:</strong> As a Staff member, you have operational permissions to manage customer quotes and subscriptions. Staff accounts are strictly forbidden from modifying system-wide products, tax configurations, and creating new staff users.
        </div>
      </div>

      {/* Operational Highlights */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Customer Subscriptions</span>
            <FileSpreadsheet size={20} color="var(--primary-navy)" />
          </div>
          <div className="stat-value">Operational</div>
          <p style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>Member 2: Lifecycle management module</p>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Customer Accounts</span>
            <Users size={20} color="var(--primary-navy)" />
          </div>
          <div className="stat-value">Verified</div>
          <p style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>View permitted customer directory profiles</p>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Invoicing & Billing</span>
            <Receipt size={20} color="var(--primary-navy)" />
          </div>
          <div className="stat-value">Automated</div>
          <p style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>Member 3: Automated billing module</p>
        </div>
      </div>

      <div className="content-card">
        <div className="card-title-row">
          <div>
            <h3>Your Account Credentials & Security</h3>
            <p style={{ fontSize: '0.825rem' }}>Authenticated session details maintained by Supabase Auth.</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <small style={{ color: 'var(--text-muted)', display: 'block' }}>FULL NAME</small>
            <strong style={{ fontSize: '1rem' }}>{displayName}</strong>
          </div>
          <div>
            <small style={{ color: 'var(--text-muted)', display: 'block' }}>EMAIL ADDRESS</small>
            <strong style={{ fontSize: '1rem' }}>{user?.email}</strong>
          </div>
          <div>
            <small style={{ color: 'var(--text-muted)', display: 'block' }}>SYSTEM ROLE</small>
            <div><span className="badge badge-staff">STAFF</span></div>
          </div>
          <div>
            <small style={{ color: 'var(--text-muted)', display: 'block' }}>ADMIN ACCESS</small>
            <strong style={{ color: '#DC2626' }}>Restricted (Forbidden)</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;

