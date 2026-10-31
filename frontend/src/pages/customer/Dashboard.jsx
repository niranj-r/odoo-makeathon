import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CreditCard, FileText } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import {
  CustomerKpiGrid,
  CustomerUsageCards,
  CustomerSpendingChart,
  CustomerInvoiceStatusChart,
  CustomerQuickActions,
  SubscriptionCardList,
  SubscriptionDetailModal,
  InvoiceTable,
  InvoiceDetailModal,
  PortalFeedbackToast,
} from '../../components/portal';
import { useCustomerPortal } from '../../hooks/useCustomerPortal';
import { useAuth } from '../../context/AuthContext';

/**
 * CustomerDashboard Page
 * Upgraded Customer Self-Service Dashboard with live spending charts, quota usage progress bars,
 * interactive multi-filter invoice tables, and self-service lifecycle actions.
 */
export const CustomerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    profile,
    kpis,
    subscriptions,
    selectedSubscription,
    setSelectedSubscription,
    invoices,
    selectedInvoice,
    setSelectedInvoice,
    usageData,
    feedback,
    clearFeedback,
    renewSubscription,
    pauseSubscription,
    cancelSubscription,
    downloadInvoice,
    downloadLatestInvoice,
    contactSupport,
    isLoading,
  } = useCustomerPortal();

  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [isInvModalOpen, setIsInvModalOpen] = useState(false);

  const customerName = profile?.name || user?.email?.split('@')[0] || 'Valued Customer';
  const primarySubId = subscriptions[0]?.id || null;

  const handleViewSub = (sub) => {
    setSelectedSubscription(sub);
    setIsSubModalOpen(true);
  };

  const handleViewInv = (inv) => {
    setSelectedInvoice(inv);
    setIsInvModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Alert */}
      <PortalFeedbackToast feedback={feedback} onClose={clearFeedback} />

      {/* Header */}
      <PageHeader
        title={`Welcome back, ${customerName}`}
        subtitle="Manage your subscriptions, invoices and payments."
      />

      {/* Section 1: KPI Cards */}
      <CustomerKpiGrid kpis={kpis} loading={isLoading} />

      {/* Phase 8: Quota & Usage Progress Bars (Seats, API, Storage, Health) */}
      <CustomerUsageCards usage={usageData?.usageMetrics} loading={isLoading} />

      {/* Phase 8: Charts Grid (Spending Line Chart + Invoices Donut Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <CustomerSpendingChart data={usageData?.spendingHistory || []} />
        </div>
        <div className="lg:col-span-1">
          <CustomerInvoiceStatusChart data={usageData?.invoiceBreakdown || []} />
        </div>
      </div>

      {/* Section 8: Quick Actions */}
      <CustomerQuickActions
        primarySubscriptionId={primarySubId}
        onRenew={renewSubscription}
        onPause={pauseSubscription}
        onCancel={cancelSubscription}
        onDownloadLatestInvoice={downloadLatestInvoice}
        onContactSupport={contactSupport}
      />

      {/* Overview Section: Subscriptions Preview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CreditCard size={18} className="text-blue-600" />
            <h3 className="text-base font-semibold text-slate-900 tracking-tight">
              Active Subscription Plans
            </h3>
          </div>
          <button
            type="button"
            onClick={() => navigate('/customer/subscriptions')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            <span>View All Plans</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <SubscriptionCardList
          subscriptions={subscriptions}
          onView={handleViewSub}
          onRenew={renewSubscription}
          onPause={pauseSubscription}
          onCancel={cancelSubscription}
          showFilters={false}
        />
      </div>

      {/* Overview Section: Recent Invoices Preview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-blue-600" />
            <h3 className="text-base font-semibold text-slate-900 tracking-tight">
              Recent Billing Invoices
            </h3>
          </div>
          <button
            type="button"
            onClick={() => navigate('/customer/invoices')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            <span>View All Invoices</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <InvoiceTable
          invoices={invoices}
          onViewInvoice={handleViewInv}
          onDownloadInvoice={downloadInvoice}
        />
      </div>

      {/* Modals */}
      <SubscriptionDetailModal
        subscription={selectedSubscription}
        isOpen={isSubModalOpen}
        onClose={() => setIsSubModalOpen(false)}
        onRenew={renewSubscription}
        onPause={pauseSubscription}
        onCancel={cancelSubscription}
      />

      <InvoiceDetailModal
        invoice={selectedInvoice}
        isOpen={isInvModalOpen}
        onClose={() => setIsInvModalOpen(false)}
        onDownload={downloadInvoice}
      />
    </div>
  );
};

export default CustomerDashboard;
