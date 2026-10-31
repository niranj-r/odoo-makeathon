import React from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { PaymentHistoryTable, PortalFeedbackToast } from '../../components/portal';
import { useCustomerPortal } from '../../hooks/useCustomerPortal';

/**
 * Payments Page
 * Section 6: Payment transaction history ledger.
 */
export const Payments = () => {
  const { payments, feedback, clearFeedback } = useCustomerPortal();

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Alert */}
      <PortalFeedbackToast feedback={feedback} onClose={clearFeedback} />

      {/* Page Header */}
      <PageHeader
        title="Payment History"
        subtitle="Review processed charges, payment methods, gateway transaction IDs, and settlement logs."
      />

      {/* Section 6: Payment History Table */}
      <PaymentHistoryTable payments={payments} />
    </div>
  );
};

export default Payments;

