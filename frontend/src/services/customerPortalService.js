import {
  mockCustomerProfile,
  mockSubscriptionsData,
  mockInvoicesData,
  mockPaymentsData,
  mockSavedPaymentMethods,
} from '../mockData';
import { mockAsyncResponse } from './api';

/**
 * Customer Portal Service
 * Abstracted data layer for customer dashboard, subscriptions, invoices, and payments.
 * Architecture: Component -> Hook -> Service -> Mock Data (later Supabase)
 */
export const customerPortalService = {
  /**
   * Fetch customer company and account profile
   * @param {string} [customerId='cust_acme']
   */
  async getProfile(customerId = 'cust_acme') {
    return mockAsyncResponse(mockCustomerProfile);
  },

  /**
   * Fetch active and historical subscriptions for the customer
   * @param {string} [customerId='cust_acme']
   */
  async getSubscriptions(customerId = 'cust_acme') {
    const list = mockSubscriptionsData.filter((s) => s.customerId === customerId);
    return mockAsyncResponse(list.length > 0 ? list : mockSubscriptionsData.slice(0, 2));
  },

  /**
   * Fetch customer billing invoices
   * @param {string} [customerId='cust_acme']
   */
  async getInvoices(customerId = 'cust_acme') {
    const list = mockInvoicesData.filter((i) => i.customerId === customerId);
    return mockAsyncResponse(list.length > 0 ? list : mockInvoicesData.slice(0, 3));
  },

  /**
   * Fetch customer payment transaction history
   * @param {string} [customerId='cust_acme']
   */
  async getPaymentHistory(customerId = 'cust_acme') {
    const list = mockPaymentsData.filter((p) => p.customerId === customerId);
    return mockAsyncResponse(list.length > 0 ? list : mockPaymentsData.slice(0, 3));
  },

  /**
   * Fetch customer saved payment methods on file
   * @param {string} [customerId='cust_acme']
   */
  async getPaymentMethods(customerId = 'cust_acme') {
    return mockAsyncResponse(mockSavedPaymentMethods);
  },
};

export default customerPortalService;

