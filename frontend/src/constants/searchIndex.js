/**
 * Search Index for Global Autocomplete (Stripe / Linear style)
 * Provides searchable navigation across platform modules and workspace views.
 */
export const defaultSearchItems = [
  {
    id: 'nav_dashboard',
    category: 'Navigation',
    title: 'Customer Dashboard',
    subtitle: 'Overview of active subscriptions and account standing',
    link: '/customer/dashboard',
    badge: 'Overview',
    type: 'page',
  },
  {
    id: 'nav_browse_plans',
    category: 'Navigation',
    title: 'Browse Plans',
    subtitle: 'Explore available subscription tiers and services',
    link: '/customer/browse-plans',
    badge: 'Plans',
    type: 'page',
  },
  {
    id: 'nav_subscriptions',
    category: 'Navigation',
    title: 'My Subscriptions',
    subtitle: 'Manage active subscriptions, renewals, and lifecycle actions',
    link: '/customer/subscriptions',
    badge: 'Subscriptions',
    type: 'page',
  },
  {
    id: 'nav_invoices',
    category: 'Navigation',
    title: 'My Invoices',
    subtitle: 'View and download billing statements and receipts',
    link: '/customer/invoices',
    badge: 'Billing',
    type: 'page',
  },
  {
    id: 'nav_payments',
    category: 'Navigation',
    title: 'Payment History',
    subtitle: 'Review payment receipts and transaction records',
    link: '/customer/payments',
    badge: 'Receipts',
    type: 'page',
  },
  {
    id: 'nav_profile',
    category: 'Navigation',
    title: 'Company & Billing Profile',
    subtitle: 'Update company address, contact info, and preferences',
    link: '/customer/profile',
    badge: 'Settings',
    type: 'page',
  },
];

export default defaultSearchItems;
