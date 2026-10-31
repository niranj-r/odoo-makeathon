import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BarChart3,
  FileText,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Layers,
} from 'lucide-react';

/**
 * Sidebar
 * Professional vertical ERP navigation drawer for BrightLoop Subscription Management.
 * Palette: Deep Blue (#1E40AF), Active (#2563EB), White text and icons.
 *
 * @param {Object} props
 * @param {boolean} [props.isCollapsed=false]
 * @param {() => void} [props.onToggleCollapse]
 * @param {boolean} [props.mobileOpen=false]
 * @param {() => void} [props.onCloseMobile]
 * @param {() => void} [props.onLogout]
 */
export const Sidebar = ({
  isCollapsed = false,
  onToggleCollapse,
  mobileOpen = false,
  onCloseMobile,
  onLogout,
  navItems,
  badgeLabel = 'ERP',
}) => {
  const location = useLocation();

  const defaultAdminItems = [
    {
      label: 'Dashboard',
      to: '/admin/dashboard',
      icon: LayoutDashboard,
      exact: true,
    },
    {
      label: 'Analytics',
      to: '/admin/analytics',
      icon: BarChart3,
    },
    {
      label: 'Reports',
      to: '/admin/reports',
      icon: FileText,
    },
    {
      label: 'Customers',
      to: '/admin/customers',
      icon: Users,
    },
    {
      label: 'Settings',
      to: '/admin/settings',
      icon: Settings,
    },
  ];

  const navigationItems = navItems || defaultAdminItems;

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#1E40AF] border-r border-blue-900/60 select-none text-white">
      {/* Company Logo Area */}
      <div className="h-16 flex items-center px-5 border-b border-blue-700/50 justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0 shadow-xs">
            <Layers size={18} className="text-white" />
          </div>
          {!isCollapsed && (
            <div className="flex items-center gap-2 transition-opacity duration-200">
              <span className="font-bold text-white tracking-tight text-base">
                BrightLoop
              </span>
              <span className="text-[10px] font-semibold text-blue-200 bg-white/10 px-1.5 py-0.5 rounded border border-white/15 tracking-wide">
                {badgeLabel}
              </span>
            </div>
          )}
        </div>

        {/* Desktop Collapse Toggle */}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-md text-blue-200 hover:text-white hover:bg-blue-700/60 transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        )}
      </div>

      {/* Navigation Menu Items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? location.pathname === item.to
            : location.pathname.startsWith(item.to);

          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onCloseMobile}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative ${
                isActive
                  ? 'bg-[#2563EB] text-white shadow-xs'
                  : 'text-blue-100/90 hover:text-white hover:bg-blue-700/60'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon
                size={19}
                className={`shrink-0 transition-colors ${
                  isActive
                    ? 'text-white stroke-[2.25]'
                    : 'text-blue-200 group-hover:text-white stroke-[1.75]'
                }`}
              />

              {!isCollapsed && (
                <span className="truncate tracking-normal font-medium">{item.label}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Footer Area (Logout) */}
      <div className="p-3 border-t border-blue-700/50 space-y-1">
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-blue-100 hover:text-white hover:bg-rose-600/80 transition-colors group ${
              isCollapsed ? 'justify-center' : ''
            }`}
            title={isCollapsed ? 'Log out' : undefined}
          >
            <LogOut
              size={19}
              className="shrink-0 text-blue-200 group-hover:text-white stroke-[1.75] transition-colors"
            />
            {!isCollapsed && <span>Logout</span>}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#1E40AF] transform transition-transform duration-200 ease-in-out lg:hidden shadow-2xl ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Desktop Sticky Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 h-screen sticky top-0 transition-all duration-200 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};

export default Sidebar;
