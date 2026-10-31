import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { useAuth } from '../../context/AuthContext';

/**
 * DashboardLayout
 * Enterprise SaaS Shell containing responsive Sidebar, Top Navbar, and Main Content Area.
 * Fully responsive across Desktop, Tablet, and Mobile with dark mode support.
 *
 * @param {Object} props
 * @param {React.ReactNode} [props.children]
 * @param {string} [props.className]
 */
export const DashboardLayout = ({
  children,
  className = '',
  navItems,
  badgeLabel = 'ERP',
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, profile, logout } = useAuth();

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => !prev);
  };

  const handleToggleMobileSidebar = () => {
    setMobileOpen((prev) => !prev);
  };

  const handleCloseMobile = () => {
    setMobileOpen(false);
  };

  const handleLogout = async () => {
    if (logout) {
      await logout();
    }
  };

  const authUser = user ? { ...user, profile } : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex text-slate-900 dark:text-slate-100 font-sans antialiased transition-colors duration-200">
      {/* Vertical Navigation Sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
        mobileOpen={mobileOpen}
        onCloseMobile={handleCloseMobile}
        onLogout={handleLogout}
        navItems={navItems}
        badgeLabel={badgeLabel}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Navbar */}
        <Navbar
          user={authUser}
          onToggleMobileSidebar={handleToggleMobileSidebar}
          onLogout={handleLogout}
        />

        {/* Main Content Area */}
        <main className={`flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto ${className}`}>
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
