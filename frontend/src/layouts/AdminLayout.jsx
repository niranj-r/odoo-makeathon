import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  LayoutDashboard,
  Package,
  Layers,
  CalendarRange,
  Users,
  FileText,
  CreditCard,
  LogOut,
  Building2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SetupBanner from '../components/common/SetupBanner';

export const AdminLayout = () => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Administrator';

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
              <small style={{ color: 'var(--text-muted)', fontWeight: 600 }}>ADMIN CONSOLE</small>
            </div>
          </div>

          <nav className="sidebar-nav">
            <NavLink
              to="/admin/dashboard"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </NavLink>

            <NavLink
              to="/admin/users"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Users size={18} />
              <span>User Management</span>
            </NavLink>

            <NavLink
              to="/admin/staff"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Building2 size={18} />
              <span>Staff Management</span>
            </NavLink>

            <NavLink
              to="/admin/products"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Package size={18} />
              <span>Product Management</span>
            </NavLink>

            <NavLink
              to="/admin/variants"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Layers size={18} />
              <span>Product Variants</span>
            </NavLink>

            <NavLink
              to="/admin/subscription-plans"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <CalendarRange size={18} />
              <span>Subscription Plans</span>
            </NavLink>

            <div style={{ margin: '1rem 0 0.4rem 0.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Financial Engine
            </div>

            <NavLink
              to="/staff/invoices"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <FileText size={18} />
              <span>Invoices & Billing</span>
            </NavLink>

            <NavLink
              to="/staff/payments"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <CreditCard size={18} />
              <span>Payments Ledger</span>
            </NavLink>
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
              <span className="badge badge-admin">
                <ShieldAlert size={12} /> System Admin
              </span>
            </div>

            <div className="topbar-user">
              <div className="user-avatar">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="user-meta">
                <span className="name">{displayName}</span>
                <span className="role-line">
                  {user?.email} &bull; <strong style={{ color: 'var(--primary-navy)' }}>ADMIN</strong>
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

export default AdminLayout;
