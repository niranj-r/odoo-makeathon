import React from 'react';
import { NavLink } from 'react-router-dom';
import { Building2, LogOut } from 'lucide-react';

export const Sidebar = ({
  title = 'BRIGHTLOOP',
  subtitle = 'WORKSPACE',
  navItems = [],
  onLogout,
  children,
}) => {
  return (
    <aside className="app-sidebar">
      <div className="sidebar-header">
        <div className="brand-logo-icon">
          <Building2 size={20} />
        </div>
        <div>
          <div className="sidebar-brand-name">{title}</div>
          <small style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{subtitle}</small>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item, idx) => (
          <NavLink
            key={idx}
            to={item.to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            {item.icon && <item.icon size={18} />}
            <span>{item.label}</span>
          </NavLink>
        ))}
        {children}
      </nav>

      {onLogout && (
        <div className="sidebar-footer">
          <button
            onClick={onLogout}
            className="btn btn-outline btn-block"
            style={{ justifyContent: 'flex-start' }}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;

