"use client";

import React from "react";
import {
  usePaymentTransactions,
  useSavedPaymentMethods,
  useSetDefaultPaymentMethod,
} from "@/hooks/usePayments";
import { SavedPaymentMethodsCard } from "@/components/portal/SavedPaymentMethodsCard";
import { PaymentHistoryList } from "@/components/portal/PaymentHistoryList";
import { TableSkeleton } from "@/components/common/LoadingSkeleton";

export default function PaymentHistoryPage() {
  const { data: transactions, isLoading: isTxnLoading } = usePaymentTransactions();
  const { data: paymentMethods, isLoading: isPmLoading } = useSavedPaymentMethods();
  const setDefaultMutation = useSetDefaultPaymentMethod();

  const handleSetDefault = (id: string) => {
    setDefaultMutation.mutate(id);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Payment History & Billing Methods
        </h1>
        <p className="text-xs text-slate-500">
          Review automated transactions, manage saved credit cards, and download payment receipts.
        </p>
      </div>

      {/* Saved Payment Methods */}
      {isPmLoading || !paymentMethods ? (
        <TableSkeleton rows={2} cols={3} />
      ) : (
        <SavedPaymentMethodsCard
          paymentMethods={paymentMethods}
          onSetDefault={handleSetDefault}
        />
      )}

      {/* Transaction History */}
      {isTxnLoading || !transactions ? (
        <TableSkeleton rows={4} cols={7} />
      ) : (
        <PaymentHistoryList transactions={transactions} isLoading={isTxnLoading} />
      )}
    </div>
  );
}

