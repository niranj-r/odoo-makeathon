import {
  LayoutDashboard,
  BarChart3,
  FileSpreadsheet,
  Layers,
  CreditCard,
  Receipt,
  UserCheck,
  Package,
  Percent,
  Users,
} from 'lucide-react';

export const ADMIN_NAV_ITEMS = [
  {
    label: 'Dashboard',
    to: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Analytics',
    to: '/admin/analytics',
    icon: BarChart3,
  },
  {
    label: 'Reports & CSV',
    to: '/admin/reports',
    icon: FileSpreadsheet,
  },
];

export const CUSTOMER_NAV_ITEMS = [
  {
    label: 'Dashboard',
    to: '/portal/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'My Subscriptions',
    to: '/portal/subscriptions',
    icon: Layers,
  },
  {
    label: 'Invoices',
    to: '/portal/invoices',
    icon: Receipt,
  },
  {
    label: 'Payments',
    to: '/portal/payments',
    icon: CreditCard,
  },
  {
    label: 'Profile',
    to: '/portal/profile',
    icon: UserCheck,
  },
];

