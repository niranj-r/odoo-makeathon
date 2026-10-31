import React, { useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import {
  CustomerProfileCard,
  EditProfileModal,
  SubscriptionTimelineCard,
  PortalFeedbackToast,
} from '../../components/portal';
import { useCustomerPortal } from '../../hooks/useCustomerPortal';

/**
 * Profile Page
 * Section 7 & Phase 8: Customer account profile, billing address, tax identification,
 * and visual subscription lifecycle stage stepper (Purchased ➔ Renewed ➔ Current ➔ Next Renewal).
 */
export const Profile = () => {
  const { profile, usageData, updateProfile, feedback, clearFeedback } = useCustomerPortal();
  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Alert */}
      <PortalFeedbackToast feedback={feedback} onClose={clearFeedback} />

      {/* Page Header */}
      <PageHeader
        title="Customer Profile & Organization"
        subtitle="Manage your company identity, registered billing address, and account preferences."
      />

      {/* Section 7: Profile Card (Cleaned, No fake tenant/security summaries) */}
      <CustomerProfileCard
        profile={profile}
        onEditProfile={() => setIsEditOpen(true)}
      />

      {/* Phase 8: Subscription Timeline (Purchased ➔ Renewed ➔ Current ➔ Next Renewal) */}
      <SubscriptionTimelineCard stages={usageData?.timelineStages || []} />

      {/* Edit Profile Modal */}
      <EditProfileModal
        profile={profile}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSave={updateProfile}
      />
    </div>
  );
};

export default Profile;
