import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  LayoutDashboard,
  FileSpreadsheet,
  Users,
  LogOut,
  Building2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SetupBanner from '../components/common/SetupBanner';

export const StaffLayout = () => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Staff Member';

  return (
    <div>
      <SetupBanner />
      <div className="app-layout">
        {/* Sidebar */}
        <aside className="app-sidebar">
          <div className="sidebar-header">
            <div className="brand-logo-icon">
              <Building2 size={20} />
            </div>
            <div>
              <div className="sidebar-brand-name">BRIGHTLOOP</div>
              <small style={{ color: 'var(--text-muted)', fontWeight: 600 }}>STAFF WORKSPACE</small>
            </div>
          </div>

          <nav className="sidebar-nav">
            <NavLink
              to="/staff/dashboard"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </NavLink>

            <div style={{ margin: '1rem 0 0.4rem 0.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Operations
            </div>

            <div className="nav-item" style={{ opacity: 0.65, cursor: 'default' }} title="Member 2 Module">
              <FileSpreadsheet size={18} />
              <span>Quotes & Subscriptions</span>
            </div>

            <div className="nav-item" style={{ opacity: 0.65, cursor: 'default' }} title="Customer Directory">
              <Users size={18} />
              <span>Customers Directory</span>
            </div>
          </nav>

          <div className="sidebar-footer">
            <button
              onClick={handleLogout}
              className="btn btn-outline btn-block"
              style={{ justifyContent: 'flex-start' }}
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="app-main">
          <header className="app-topbar">
            <div>
              <span className="badge badge-staff">
                <Briefcase size={12} /> Brightloop Staff
              </span>
            </div>

            <div className="topbar-user">
              <div className="user-avatar" style={{ backgroundColor: 'var(--secondary-sand-dark)' }}>
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="user-meta">
                <span className="name">{displayName}</span>
                <span className="role-line">
                  {user?.email} &bull; <strong style={{ color: 'var(--primary-navy)' }}>STAFF</strong>
                </span>
              </div>
            </div>
          </header>

          <main className="app-content">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default StaffLayout;

