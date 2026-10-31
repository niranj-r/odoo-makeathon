import React from 'react';
import { Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Sparkles,
  CreditCard,
  FileText,
  History,
  User,
} from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import SetupBanner from '../components/common/SetupBanner';

const CUSTOMER_NAV_ITEMS = [
  {
    label: 'Dashboard',
    to: '/customer/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Browse Plans',
    to: '/customer/browse-plans',
    icon: Sparkles,
  },
  {
    label: 'My Subscriptions',
    to: '/customer/subscriptions',
    icon: CreditCard,
  },
  {
    label: 'My Invoices',
    to: '/customer/invoices',
    icon: FileText,
  },
  {
    label: 'Payment History',
    to: '/customer/payments',
    icon: History,
  },
  {
    label: 'Profile',
    to: '/customer/profile',
    icon: User,
  },
];

/**
 * CustomerLayout
 * Enterprise Customer Portal Shell using identical Deep Blue sidebar and Slate 50 background.
 */
export const CustomerLayout = () => {
  return (
    <>
      <SetupBanner />
      <DashboardLayout
        navItems={CUSTOMER_NAV_ITEMS}
        badgeLabel="PORTAL"
      >
        <Outlet />
      </DashboardLayout>
    </>
  );
};

export default CustomerLayout;
