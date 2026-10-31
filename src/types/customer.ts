export interface CustomerAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface CustomerBillingDetails {
  companyName: string;
  taxId?: string; // VAT or GST
  address: CustomerAddress;
  billingEmail: string;
}

export interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  avatarUrl?: string;
  billing: CustomerBillingDetails;
  notificationPreferences: {
    emailInvoices: boolean;
    renewalReminders: boolean;
    paymentFailures: boolean;
    productUpdates: boolean;
  };
  createdAt: string;
}

export interface CustomerPortalSummary {
  profile: CustomerProfile;
  activePlanName: string;
  activePlanPrice: number;
  billingCycle: "monthly" | "yearly";
  nextBillingDate: string;
  unpaidBalance: number;
  openInvoicesCount: number;
  activeSubscriptionsCount: number;
  usage: {
    seatsUsed: number;
    seatsTotal: number;
    apiRequestsUsed: number;
    apiRequestsLimit: number;
    storageUsedGb: number;
    storageLimitGb: number;
  };
}

