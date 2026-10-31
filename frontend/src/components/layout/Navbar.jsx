import React from 'react';
import { LogOut } from 'lucide-react';

export const Navbar = ({
  badge = null,
  displayName = 'User',
  onLogout,
  children,
}) => {
  return (
    <header className="app-topbar">
      <div>
        {badge}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {children}

        <div className="topbar-user">
          <div className="user-avatar">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="user-meta">
            <span className="name">{displayName}</span>
          </div>
        </div>

        {onLogout && (
          <button
            onClick={onLogout}
            className="btn btn-ghost btn-sm"
            title="Sign Out"
            style={{ padding: '0.4rem', color: 'var(--text-muted)' }}
          >
            <LogOut size={16} />
          </button>
        )}
      </div>
    </header>
  );
};

export default Navbar;

