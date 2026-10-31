/**
 * Report Filter Options and Defaults
 * Standard enterprise filter criteria for BrightLoop SaaS Reports.
 */
export const reportFilterOptions = {
  dateRanges: [
    'All Time',
    'This Month',
    'Last Month',
    'This Quarter',
    'Year to Date',
    'Last Year',
  ],
  customers: [
    'All Customers',
    'Acme Corporation',
    'TechNova Solutions',
    'Starlight Systems',
    'Apex Dynamics',
    'CloudScale Inc',
    'Horizon Media Group',
    'Vanguard Logistics',
    'BlueWave Analytics',
    'Nexus Cybernetics',
    'Summit Financial Partners',
    'Krypton Labs',
    'Solaris Healthtech',
  ],
  plans: [
    'All Plans',
    'Enterprise Cloud',
    'Business Suite',
    'Professional Tier',
    'Starter Pack',
  ],
  subscriptionStatuses: [
    'All Statuses',
    'Active',
    'Past Due',
    'Trialing',
    'Cancelled',
  ],
  paymentStatuses: [
    'All Payments',
    'Paid',
    'Partially Paid',
    'Unpaid',
    'Overdue',
  ],
};

export const defaultReportFilters = {
  dateRange: 'All Time',
  customer: 'All Customers',
  plan: 'All Plans',
  subscriptionStatus: 'All Statuses',
  paymentStatus: 'All Payments',
  search: '',
};

export default {
  reportFilterOptions,
  defaultReportFilters,
};
