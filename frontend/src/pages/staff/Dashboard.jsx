import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Users,
  FileSpreadsheet,
  Receipt,
  Plus,
  RefreshCw,
  Copy,
  LogOut,
  Info,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';

export const StaffDashboard = () => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();

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
            Logged in as <strong>{user?.email}</strong> with role <strong>STAFF</strong>. You have operational access to customer onboarding, quoting, and subscription management.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignSelf: 'flex-start' }}>
          <Button
            variant="secondary"
            size="sm"
            icon={Plus}
            onClick={() => navigate('/staff/quotations/new')}
          >
            New Quotation
          </Button>
          <button onClick={logout} className="btn btn-outline btn-sm" style={{ color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.4)' }}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>

      {/* Access Control Notice */}
      <div className="alert alert-info">
        <Info size={20} style={{ flexShrink: 0 }} />
        <div>
          <strong>Role-Based Access Control Notice:</strong> As a Staff member, you have operational permissions to manage customer quotes, templates, and subscriptions. Staff accounts are strictly forbidden from modifying system-wide products, tax configurations, and creating new staff users.
        </div>
      </div>

      {/* Operational Highlights / Modules */}
      <div className="stats-grid">
        <Link to="/staff/customers" className="stat-card" style={{ textDecoration: 'none' }}>
          <div className="stat-header">
            <span className="stat-title">Customer Directory</span>
            <Users size={20} color="var(--primary-navy)" />
          </div>
          <div className="stat-value" style={{ fontSize: '1.4rem' }}>Customers</div>
          <p style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>View, onboard, and manage customer accounts &rarr;</p>
        </Link>

        <Link to="/staff/quotations" className="stat-card" style={{ textDecoration: 'none' }}>
          <div className="stat-header">
            <span className="stat-title">Commercial Proposals</span>
            <FileSpreadsheet size={20} color="var(--primary-navy)" />
          </div>
          <div className="stat-value" style={{ fontSize: '1.4rem' }}>Quotations</div>
          <p style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>Draft, send, and convert accepted proposals &rarr;</p>
        </Link>

        <Link to="/staff/subscriptions" className="stat-card" style={{ textDecoration: 'none' }}>
          <div className="stat-header">
            <span className="stat-title">Recurring Contracts</span>
            <RefreshCw size={20} color="var(--primary-navy)" />
          </div>
          <div className="stat-value" style={{ fontSize: '1.4rem' }}>Subscriptions</div>
          <p style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>Activate, pause, renew, and close contracts &rarr;</p>
        </Link>

        <Link to="/staff/templates" className="stat-card" style={{ textDecoration: 'none' }}>
          <div className="stat-header">
            <span className="stat-title">Reusable Presets</span>
            <Copy size={20} color="var(--primary-navy)" />
          </div>
          <div className="stat-value" style={{ fontSize: '1.4rem' }}>Templates</div>
          <p style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>Standardized terms, presets, and lines &rarr;</p>
        </Link>
      </div>

      {/* Account Info Card */}
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
            <small style={{ color: 'var(--text-muted)', display: 'block' }}>STATUS</small>
            <div><span className="badge badge-active">ACTIVE</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
