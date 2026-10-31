import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  User,
  LayoutDashboard,
  CreditCard,
  FileText,
  LogOut,
  Building2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SetupBanner from '../components/common/SetupBanner';

export const CustomerLayout = () => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Customer';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <SetupBanner />

      {/* Customer Portal Header */}
      <header style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid var(--border-light)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div className="brand-logo-icon" style={{ width: '32px', height: '32px' }}>
                <Building2 size={18} />
              </div>
              <span style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--primary-navy)', letterSpacing: '-0.02em' }}>
                BRIGHTLOOP
              </span>
              <span className="badge badge-customer">PORTAL</span>
            </div>

            <nav style={{ display: 'flex', gap: '0.5rem' }}>
              <NavLink
                to="/portal/dashboard"
                className={({ isActive }) => `btn btn-ghost btn-sm ${isActive ? 'btn-secondary' : ''}`}
              >
                <LayoutDashboard size={16} />
                <span>Dashboard</span>
              </NavLink>
            </nav>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="user-avatar" style={{ width: '34px', height: '34px', fontSize: '0.85rem' }}>
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="user-meta" style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="name" style={{ fontSize: '0.875rem' }}>{displayName}</span>
                <span className="role-line" style={{ fontSize: '0.75rem' }}>
                  {user?.email} &bull; <strong>CUSTOMER</strong>
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="btn btn-outline btn-sm"
              title="Sign Out"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Customer Portal Main Content */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '2rem 1.5rem', flex: 1 }}>
        <Outlet />
      </main>
    </div>
  );
};

export default CustomerLayout;

