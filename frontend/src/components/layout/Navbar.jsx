import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, Bell, Menu, ChevronDown, LogOut, User as UserIcon, Calendar, Sun, Moon } from 'lucide-react';
import { GlobalSearchDropdown } from './GlobalSearchDropdown';
import { NotificationsDropdown } from './NotificationsDropdown';
import { useTheme } from '../../context/ThemeContext';

/**
 * Top Navbar
 * Minimal enterprise top bar for BrightLoop ERP Dashboard.
 * Supports theme toggling (Dark / Light mode), Global Search, Notifications, and Account Profile.
 *
 * @param {Object} props
 * @param {Object} [props.user]
 * @param {() => void} [props.onToggleMobileSidebar]
 * @param {() => void} [props.onLogout]
 */
export const Navbar = ({
  user,
  onToggleMobileSidebar,
  onLogout,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { theme, toggleTheme, isDark } = useTheme();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const displayName = user?.profile?.full_name || user?.email?.split('@')[0] || 'Administrator';
  const email = user?.email || 'admin@brightloop.io';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const formattedDate = useMemo(() => {
    try {
      return new Date().toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Oct 31, 2026';
    }
  }, []);

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 select-none transition-colors duration-200">
      {/* Left side: Mobile menu toggle + Search bar */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-lg">
        {onToggleMobileSidebar && (
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Open mobile navigation"
          >
            <Menu size={20} />
          </button>
        )}

        {/* Minimal Search Bar */}
        <GlobalSearchDropdown />
      </div>

      {/* Right side: Current Date + Theme Toggle + Notification icon + User Avatar / Dropdown */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Current Date Badge */}
        <div className="hidden md:flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg">
          <Calendar size={14} className="text-slate-400 dark:text-slate-500 stroke-[2]" />
          <span>{formattedDate}</span>
        </div>

        {/* Theme Toggle (Light / Dark Mode) */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          {isDark ? <Sun size={17} className="stroke-[2.2]" /> : <Moon size={17} className="stroke-[2.2]" />}
        </button>

        {/* Live Notification Dropdown */}
        <NotificationsDropdown />

        <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 mx-0.5 hidden sm:block" />

        {/* User Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
          >
            <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-700 dark:text-blue-300 font-semibold text-xs tracking-tight shrink-0">
              {initials}
            </div>

            <div className="hidden md:flex flex-col text-left">
              <span className="text-sm font-medium text-slate-800 dark:text-slate-100 leading-tight">
                {displayName}
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight">
                {email}
              </span>
            </div>

            <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {displayName}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {email}
                </p>
              </div>

              <div className="py-1">
                <div className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors">
                  <UserIcon size={14} className="text-slate-400 dark:text-slate-500" />
                  <span>Account Profile</span>
                </div>
              </div>

              {onLogout && (
                <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 transition-colors"
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
