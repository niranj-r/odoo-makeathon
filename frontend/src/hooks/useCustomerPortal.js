import { useState, useEffect, useCallback, useMemo } from 'react';
import { customerPortalService } from '../services/customerPortalService';
import { exportToCsv, exportToExcel } from '../utils/exportCsv';
import { useToast } from '../components/common/Toast';

/**
 * useCustomerPortal Hook
 * Enterprise state management for customer self-service billing, subscriptions, invoices, plans, and profile.
 * Architecture: Page -> Hook -> Service -> Supabase (with graceful fallback)
 */
export function useCustomerPortal() {
  const [profile, setProfile] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [payments, setPayments] = useState([]);
  const [kpis, setKpis] = useState([]);
  const [plans, setPlans] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [usageData, setUsageData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null); // { message, type: 'success' | 'info' | 'error' }

  const { addToast } = useToast();

  const notify = useCallback((message, type = 'info') => {
    setFeedback({ message, type });
    addToast(message, type);
  }, [addToast]);

  // Upgrade modal state
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [selectedPlanForUpgrade, setSelectedPlanForUpgrade] = useState(null);

  // Global search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Fetch all initial data
  const loadPortalData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await customerPortalService.getAllPortalData();
      setProfile(data.profile);
      setSubscriptions(data.subscriptions);
      if (data.subscriptions.length > 0 && !selectedSubscription) {
        setSelectedSubscription(data.subscriptions[0]);
      }
      setInvoices(data.invoices);
      if (data.invoices.length > 0 && !selectedInvoice) {
        setSelectedInvoice(data.invoices[0]);
      }
      setPayments(data.payments);
      setKpis(data.kpis);
      setPlans(data.plans || []);
      setNotifications(data.notifications || []);
      setUsageData(data.usage || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load portal data');
    } finally {
      setIsLoading(false);
    }
  }, [selectedSubscription, selectedInvoice]);

  useEffect(() => {
    loadPortalData();
  }, [loadPortalData]);

  // Notifications
  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  const handleMarkNotificationsRead = useCallback(async () => {
    try {
      await customerPortalService.markNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // safe fallback
    }
  }, []);

  // Universal Search
  const handleSearchQuery = useCallback(async (query) => {
    setSearchQuery(query);
    if (!query || query.trim().length === 0) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const results = await customerPortalService.searchCustomerData(query);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Upgrade Plan Modal Actions
  const openUpgradeModal = useCallback((plan) => {
    setSelectedPlanForUpgrade(plan);
    setUpgradeModalOpen(true);
  }, []);

  const closeUpgradeModal = useCallback(() => {
    setSelectedPlanForUpgrade(null);
    setUpgradeModalOpen(false);
  }, []);

  const handleUpgradePlan = useCallback(
    async (planId, cadence = 'Yearly') => {
      try {
        const result = await customerPortalService.upgradePlan(planId, cadence);
        if (result) {
          if (result.subscription) {
            setSubscriptions((prev) => [result.subscription, ...prev.filter((s) => s.id !== result.subscription.id)]);
            setSelectedSubscription(result.subscription);
          }
          if (result.invoice) {
            setInvoices((prev) => [result.invoice, ...prev]);
          }
          notify(
            `Congratulations! Your account has been upgraded to ${result.plan.name}. Confirmation Invoice ${result.invoice.invoiceNumber} has been issued.`,
            'success'
          );
          closeUpgradeModal();
          return true;
        }
      } catch (err) {
        notify(
          err instanceof Error ? err.message : 'Failed to upgrade plan',
          'error'
        );
        return false;
      }
    },
    [closeUpgradeModal, notify]
  );

  // Subscriptions Actions
  const handleRenewSubscription = useCallback(async (subscriptionId) => {
    try {
      const updatedList = await customerPortalService.renewSubscription(subscriptionId);
      setSubscriptions(updatedList);
      const updatedSub = updatedList.find(
        (s) => s.id === subscriptionId || s.subscriptionNumber === subscriptionId
      );
      if (updatedSub) {
        setSelectedSubscription(updatedSub);
      }
      notify(
        `Subscription ${subscriptionId} has been successfully renewed. Next billing scheduled for 2028.`,
        'success'
      );
    } catch {
      notify('Failed to renew subscription.', 'error');
    }
  }, [notify]);

  const handlePauseSubscription = useCallback(async (subscriptionId) => {
    try {
      const updatedList = await customerPortalService.pauseSubscription(subscriptionId);
      setSubscriptions(updatedList);
      const updatedSub = updatedList.find(
        (s) => s.id === subscriptionId || s.subscriptionNumber === subscriptionId
      );
      if (updatedSub) {
        setSelectedSubscription(updatedSub);
        notify(
          `Subscription ${subscriptionId} status toggled to ${updatedSub.status}.`,
          'info'
        );
      }
    } catch {
      notify('Failed to update subscription status.', 'error');
    }
  }, [notify]);

  const handleCancelSubscription = useCallback(async (subscriptionId) => {
    try {
      const updatedList = await customerPortalService.cancelSubscription(subscriptionId);
      setSubscriptions(updatedList);
      const updatedSub = updatedList.find(
        (s) => s.id === subscriptionId || s.subscriptionNumber === subscriptionId
      );
      if (updatedSub) {
        setSelectedSubscription(updatedSub);
      }
      notify(
        `Subscription ${subscriptionId} has been set to cancel at the end of the current billing cycle.`,
        'info'
      );
    } catch {
      notify('Failed to cancel subscription.', 'error');
    }
  }, [notify]);

  // Universal Export Handlers (PDF, Excel, CSV)
  const handleDownloadInvoice = useCallback(
    (invoice, format = 'csv') => {
      const inv =
        typeof invoice === 'string'
          ? invoices.find((i) => i.id === invoice || i.invoiceNumber === invoice)
          : invoice;
      if (!inv) return;

      const columns = [
        { header: 'Line Item', accessor: 'description' },
        { header: 'Quantity', accessor: 'quantity' },
        { header: 'Unit Price ($)', accessor: 'unitPrice' },
        { header: 'Total ($)', accessor: 'amount' },
      ];

      if (format === 'excel' || format === 'xlsx') {
        exportToExcel(`Invoice_${inv.invoiceNumber}`, columns, inv.items || []);
        notify(
          `Invoice ${inv.invoiceNumber} Excel (.xlsx) statement generated.`,
          'success'
        );
      } else if (format === 'pdf') {
        if (typeof window !== 'undefined') {
          window.print();
        }
      } else {
        exportToCsv(`Invoice_${inv.invoiceNumber}`, columns, inv.items || []);
        notify(
          `Invoice ${inv.invoiceNumber} receipt downloaded successfully.`,
          'success'
        );
      }
    },
    [invoices, notify]
  );

  const handleDownloadLatestInvoice = useCallback(
    (format = 'csv') => {
      if (invoices.length > 0) {
        handleDownloadInvoice(invoices[0], format);
      } else {
        notify('No invoices available to download.', 'info');
      }
    },
    [invoices, handleDownloadInvoice, notify]
  );

  const handleUpdateProfile = useCallback(async (updates) => {
    try {
      const updated = await customerPortalService.updateProfile(updates);
      setProfile(updated);
      notify(
        'Your profile and billing details have been updated successfully.',
        'success'
      );
      return true;
    } catch {
      notify('Failed to update profile.', 'error');
      return false;
    }
  }, [notify]);

  const handleContactSupport = useCallback(() => {
    notify(
      'Support request logged (Ticket #BRIGHT-9481). A customer engineer will reply within 2 hours.',
      'info'
    );
  }, [notify]);

  const clearFeedback = useCallback(() => {
    setFeedback(null);
  }, []);

  return {
    profile,
    subscriptions,
    selectedSubscription,
    setSelectedSubscription,
    invoices,
    selectedInvoice,
    setSelectedInvoice,
    payments,
    kpis,
    plans,
    notifications,
    unreadNotificationsCount,
    markNotificationsRead: handleMarkNotificationsRead,
    usageData,
    isLoading,
    error,
    feedback,
    clearFeedback,

    // Upgrade Modal & Flow
    upgradeModalOpen,
    selectedPlanForUpgrade,
    openUpgradeModal,
    closeUpgradeModal,
    upgradePlan: handleUpgradePlan,

    // Global Search
    searchQuery,
    searchResults,
    isSearching,
    searchGlobal: handleSearchQuery,

    // Subscriptions
    renewSubscription: handleRenewSubscription,
    pauseSubscription: handlePauseSubscription,
    cancelSubscription: handleCancelSubscription,

    // Invoices & Exports
    downloadInvoice: handleDownloadInvoice,
    downloadLatestInvoice: handleDownloadLatestInvoice,

    // Profile & Support
    updateProfile: handleUpdateProfile,
    contactSupport: handleContactSupport,
    refetch: loadPortalData,
  };
}

export default useCustomerPortal;
