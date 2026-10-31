import { CustomerProfile, CustomerPortalSummary } from "@/types/customer";
import {
  MOCK_CUSTOMER_PROFILE,
  MOCK_CUSTOMER_PORTAL_SUMMARY,
} from "@/mockData/customerMock";

class CustomerService {
  async getCustomerPortalSummary(
    customerId: string = "cust_acme_corp"
  ): Promise<CustomerPortalSummary> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(MOCK_CUSTOMER_PORTAL_SUMMARY);
      }, 150);
    });
  }

  async getCustomerProfile(
    customerId: string = "cust_acme_corp"
  ): Promise<CustomerProfile> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(MOCK_CUSTOMER_PROFILE);
      }, 150);
    });
  }

  async updateCustomerProfile(
    customerId: string,
    updatedData: Partial<CustomerProfile>
  ): Promise<CustomerProfile> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const merged: CustomerProfile = {
          ...MOCK_CUSTOMER_PROFILE,
          ...updatedData,
          billing: {
            ...MOCK_CUSTOMER_PROFILE.billing,
            ...(updatedData.billing || {}),
          },
          notificationPreferences: {
            ...MOCK_CUSTOMER_PROFILE.notificationPreferences,
            ...(updatedData.notificationPreferences || {}),
          },
        };
        resolve(merged);
      }, 300);
    });
  }
}

export const customerService = new CustomerService();

