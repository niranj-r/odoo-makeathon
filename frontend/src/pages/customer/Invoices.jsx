import React, { useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import {
  InvoiceTable,
  InvoiceDetailModal,
  PortalFeedbackToast,
} from '../../components/portal';
import { useCustomerPortal } from '../../hooks/useCustomerPortal';

/**
 * Invoices Page
 * Section 4 & Section 5: My Invoices table, statement receipts, and tax breakdown modal.
 */
export const Invoices = () => {
  const {
    invoices,
    selectedInvoice,
    setSelectedInvoice,
    downloadInvoice,
    feedback,
    clearFeedback,
  } = useCustomerPortal();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleView = (inv) => {
    setSelectedInvoice(inv);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Alert */}
      <PortalFeedbackToast feedback={feedback} onClose={clearFeedback} />

      {/* Page Header */}
      <PageHeader
        title="My Invoices"
        subtitle="View, inspect, and download official billing statements and tax receipts."
      />

      {/* Section 4: Invoices Table */}
      <InvoiceTable
        invoices={invoices}
        onViewInvoice={handleView}
        onDownloadInvoice={downloadInvoice}
      />

      {/* Section 5: Invoice Detail Modal */}
      <InvoiceDetailModal
        invoice={selectedInvoice}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onDownload={downloadInvoice}
      />
    </div>
  );
};

export default Invoices;

