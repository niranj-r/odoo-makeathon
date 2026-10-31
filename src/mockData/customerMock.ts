import { CustomerProfile, CustomerPortalSummary } from "@/types/customer";

export const MOCK_CUSTOMER_PROFILE: CustomerProfile = {
  id: "cust_acme_corp",
  name: "Alex Morgan",
  email: "alex.morgan@acmetech.io",
  phone: "+1 (555) 349-2810",
  role: "VP of Engineering & Billing Administrator",
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  billing: {
    companyName: "Acme Technologies Inc.",
    taxId: "US-948201948",
    billingEmail: "invoices@acmetech.io",
    address: {
      line1: "450 Mission Street",
      line2: "Suite 1400",
      city: "San Francisco",
      state: "CA",
      postalCode: "94105",
      country: "United States",
    },
  },
  notificationPreferences: {
    emailInvoices: true,
    renewalReminders: true,
    paymentFailures: true,
    productUpdates: false,
  },
  createdAt: "2024-03-12T10:00:00Z",
};

export const MOCK_CUSTOMER_PORTAL_SUMMARY: CustomerPortalSummary = {
  profile: MOCK_CUSTOMER_PROFILE,
  activePlanName: "Professional Growth",
  activePlanPrice: 199.0,
  billingCycle: "monthly",
  nextBillingDate: "2026-11-15T00:00:00Z",
  unpaidBalance: 0,
  openInvoicesCount: 0,
  activeSubscriptionsCount: 2,
  usage: {
    seatsUsed: 18,
    seatsTotal: 25,
    apiRequestsUsed: 824500,
    apiRequestsLimit: 1000000,
    storageUsedGb: 48,
    storageLimitGb: 100,
  },
};

