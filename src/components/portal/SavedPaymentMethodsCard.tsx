"use client";

import React, { useState } from "react";
import { PaymentMethodDetails } from "@/types/payment";
import { BentoCard } from "@/components/common/BentoCard";
import { Button } from "@/components/ui/button";
import { CreditCard, Plus, Check, ShieldCheck } from "lucide-react";
import { cn } from "@/utils/cn";

interface SavedPaymentMethodsCardProps {
  paymentMethods: PaymentMethodDetails[];
  onSetDefault: (id: string) => void;
}

export function SavedPaymentMethodsCard({
  paymentMethods,
  onSetDefault,
}: SavedPaymentMethodsCardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const handleMockAdd = () => {
    setIsAdding(true);
    setTimeout(() => {
      setIsAdding(false);
      setSuccessToast("New payment card tokenized and verified securely via Supabase vault.");
      setTimeout(() => setSuccessToast(null), 3000);
    }, 600);
  };

  return (
    <BentoCard
      title="Saved Payment Methods"
      description="Manage payment credentials on file for automated recurring billing"
      action={
        <Button
          variant="outline"
          size="sm"
          onClick={handleMockAdd}
          disabled={isAdding}
          className="h-8 gap-1.5 text-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>{isAdding ? "Verifying..." : "Add Method"}</span>
        </Button>
      }
    >
      {successToast && (
        <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-800 flex items-center gap-2">
          <Check className="h-3.5 w-3.5 text-emerald-600" />
          <span>{successToast}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {paymentMethods.map((pm) => (
          <div
            key={pm.id}
            className={cn(
              "rounded-xl border p-4 transition-all flex flex-col justify-between",
              pm.isDefault
                ? "border-slate-900 bg-slate-50/70 shadow-xs"
                : "border-slate-200 bg-white hover:border-slate-300"
            )}
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-slate-700" />
                  <span className="font-semibold text-xs text-slate-900">
                    {pm.brand || pm.bankName || "Payment Method"}
                  </span>
                </div>
                {pm.isDefault ? (
                  <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold text-white">
                    Default
                  </span>
                ) : (
                  <button
                    onClick={() => onSetDefault(pm.id)}
                    className="text-[11px] font-medium text-slate-500 hover:text-slate-900 underline-offset-2 hover:underline"
                  >
                    Make Default
                  </button>
                )}
              </div>

              <div className="mt-3 font-mono text-sm tracking-wider text-slate-800">
                •••• •••• •••• {pm.last4 || pm.accountLast4}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-400">
              <span>Expires {pm.expMonth}/{pm.expYear}</span>
              <span className="flex items-center gap-1 text-slate-500">
                <ShieldCheck className="h-3 w-3 text-emerald-600" />
                Encrypted
              </span>
            </div>
          </div>
        ))}
      </div>
    </BentoCard>
  );
}

