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
  Package,
  CalendarRange,
  CreditCard,
  Building2,
} from 'lucide-react';

/**
 * Sidebar
 * Professional vertical ERP navigation drawer for BrightLoop Subscription Management.
 * Palette: Brightloop Primary Navy (#1B3C53), Active (#2A5A7B), Warm Sand borders.
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
      label: 'Products',
      to: '/admin/products',
      icon: Package,
    },
    {
      label: 'Subscription Plans',
      to: '/admin/subscription-plans',
      icon: CalendarRange,
    },
    {
      label: 'User Management',
      to: '/admin/users',
      icon: Users,
    },
    {
      label: 'Invoices & Billing',
      to: '/staff/invoices',
      icon: FileText,
    },
    {
      label: 'Payments',
      to: '/staff/payments',
      icon: CreditCard,
    },
  ];

  const items = navItems || defaultAdminItems;

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#1B3C53] border-r border-[#122838] select-none text-white">
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-[#2A5A7B]/40">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-[#2A5A7B] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
            <Building2 size={18} />
          </div>
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-white whitespace-nowrap">
                BRIGHTLOOP
              </span>
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-[#D2C1B6] text-[#1B3C53]">
                {badgeLabel}
              </span>
            </div>
          )}
        </div>

        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-md text-[#D2C1B6] hover:text-white hover:bg-[#2A5A7B] transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        )}
      </div>

      {/* Navigation List */}
      <div className="flex-1 py-4 overflow-y-auto overflow-x-hidden space-y-1 px-3">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? location.pathname === item.to
            : location.pathname.startsWith(item.to);

          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onCloseMobile}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-[#2A5A7B] text-white shadow-xs'
                  : 'text-[#EDE5DF] hover:text-white hover:bg-[#122838]/50'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon size={18} className="shrink-0 text-white" />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </div>

      {/* Footer / Logout */}
      <div className="p-3 border-t border-[#2A5A7B]/40">
        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-xs font-semibold text-[#EDE5DF] hover:text-white hover:bg-red-900/40 transition-colors"
          title="Sign out of BrightLoop"
        >
          <LogOut size={16} className="shrink-0" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#1B3C53] transform transition-transform duration-200 ease-in-out lg:hidden shadow-2xl ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 h-screen sticky top-0 transition-all duration-200 ease-in-out ${
          isCollapsed ? 'w-18' : 'w-60'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};

export default Sidebar;
