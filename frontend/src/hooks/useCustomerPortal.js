import { useState, useEffect, useCallback } from 'react';
import { customerPortalService } from '../services/customerPortalService';

/**
 * Hook for consuming Customer Portal Data (profile, subscriptions, invoices, payment history)
 */
export function useCustomerPortal(customerId = 'cust_acme') {
  const [profile, setProfile] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPortalData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [prof, subs, invs, pmts, pms] = await Promise.all([
        customerPortalService.getProfile(customerId),
        customerPortalService.getSubscriptions(customerId),
        customerPortalService.getInvoices(customerId),
        customerPortalService.getPaymentHistory(customerId),
        customerPortalService.getPaymentMethods(customerId),
      ]);

      setProfile(prof);
      setSubscriptions(subs);
      setInvoices(invs);
      setPayments(pmts);
      setPaymentMethods(pms);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customer portal data');
    } finally {
      setIsLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchPortalData();
  }, [fetchPortalData]);

  return {
    profile,
    subscriptions,
    invoices,
    payments,
    paymentMethods,
    isLoading,
    error,
    refetch: fetchPortalData,
  };
}

export default useCustomerPortal;

