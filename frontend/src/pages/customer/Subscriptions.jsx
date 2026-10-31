import React, { useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import {
  SubscriptionCardList,
  SubscriptionDetailModal,
  PortalFeedbackToast,
} from '../../components/portal';
import { useCustomerPortal } from '../../hooks/useCustomerPortal';

/**
 * Subscriptions Page
 * Section 2 & Section 3: My Subscriptions cards, lifecycle controls, and deep-dive modal.
 */
export const Subscriptions = () => {
  const {
    subscriptions,
    selectedSubscription,
    setSelectedSubscription,
    renewSubscription,
    pauseSubscription,
    cancelSubscription,
    feedback,
    clearFeedback,
  } = useCustomerPortal();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleView = (sub) => {
    setSelectedSubscription(sub);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Alert */}
      <PortalFeedbackToast feedback={feedback} onClose={clearFeedback} />

      {/* Page Header */}
      <PageHeader
        title="My Subscriptions"
        subtitle="Manage your active subscriptions, term renewals, license seats, and lifecycle controls."
      />

      {/* Section 2: Subscriptions Cards */}
      <SubscriptionCardList
        subscriptions={subscriptions}
        onView={handleView}
        onRenew={renewSubscription}
        onPause={pauseSubscription}
        onCancel={cancelSubscription}
      />

      {/* Section 3: Subscription Details Modal */}
      <SubscriptionDetailModal
        subscription={selectedSubscription}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRenew={renewSubscription}
        onPause={pauseSubscription}
        onCancel={cancelSubscription}
      />
    </div>
  );
};

export default Subscriptions;

