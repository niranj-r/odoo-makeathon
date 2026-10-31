"use client";
import React, { useState } from "react";
import { BentoCard } from "@/components/common/BentoCard";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { ChangePlanModal } from "./ChangePlanModal";
import { CancelSubscriptionModal } from "./CancelSubscriptionModal";
import { useChangePlanMutation, useCancelSubscriptionMutation, usePauseSubscriptionMutation } from "@/hooks/useSubscriptions";
import { Calendar, CheckCircle2, PauseCircle, ArrowUpRight, Ban } from "lucide-react";
export function SubscriptionList({ subscriptions }) {
    const [selectedForChange, setSelectedForChange] = useState(null);
    const [selectedForCancel, setSelectedForCancel] = useState(null);
    const [toastMessage, setToastMessage] = useState(null);
    const changePlanMutation = useChangePlanMutation();
    const cancelMutation = useCancelSubscriptionMutation();
    const pauseMutation = usePauseSubscriptionMutation();
    const handleConfirmPlanChange = (newPlanId) => {
        if (!selectedForChange)
            return;
        changePlanMutation.mutate({ subscriptionId: selectedForChange.id, newPlanId, immediate: true }, {
            onSuccess: (res) => {
                setSelectedForChange(null);
                showToast(res.message);
            },
        });
    };
    const handleConfirmCancel = (reason, comments) => {
        if (!selectedForCancel)
            return;
        cancelMutation.mutate({ subscriptionId: selectedForCancel.id, reason, comments, immediate: false }, {
            onSuccess: (res) => {
                setSelectedForCancel(null);
                showToast(res.message);
            },
        });
    };
    const handlePause = (sub) => {
        pauseMutation.mutate({ subscriptionId: sub.id, resumeDate: "2026-12-01" }, {
            onSuccess: (res) => {
                showToast(res.message);
            },
        });
    };
    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3500);
    };
    return (<div className="space-y-4">
      {/* Toast alert banner */}
      {toastMessage && (<div className="rounded-xl border border-emerald-200 bg-emerald-50/90 p-4 text-xs font-medium text-emerald-800 shadow-xs flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600"/>
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-700 hover:text-emerald-900 font-bold">
            ×
          </button>
        </div>)}

      <div className="space-y-4">
        {subscriptions.map((sub) => {
            const isActive = sub.status === "active";
            return (<BentoCard key={sub.id} className="border border-slate-200/90" headerClassName="bg-slate-50/40" title={`${sub.planName} · ${sub.subscriptionNumber}`} description={`Started ${formatDate(sub.startDate)} · Renews ${formatDate(sub.currentPeriodEnd)}`} action={<div className="flex items-center gap-2">
                  <StatusBadge status={sub.status}/>
                </div>}>
              <div className="space-y-4">
                {/* Line Items breakdown */}
                <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-4 space-y-2">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Included Products & Line Variants
                  </span>
                  <div className="divide-y divide-slate-100 text-xs">
                    {sub.items.map((it) => (<div key={it.id} className="py-2 flex items-center justify-between first:pt-0 last:pb-0">
                        <div>
                          <span className="font-semibold text-slate-800">{it.productName}</span>
                          {it.variantName && (<span className="ml-2 rounded bg-slate-200/60 px-1.5 py-0.5 text-[10px] text-slate-600 font-medium">
                              {it.variantName}
                            </span>)}
                        </div>
                        <span className="font-mono font-medium text-slate-900">
                          {formatCurrency(it.lineTotal, "USD", 2)}
                        </span>
                      </div>))}
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs border-y border-slate-100 py-3">
                  <div>
                    <span className="text-slate-400">Subtotal</span>
                    <div className="font-mono font-semibold text-slate-800">
                      {formatCurrency(sub.subtotal, "USD", 2)}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Taxes ({sub.items[0]?.taxRate || 8.25}%)</span>
                    <div className="font-mono font-semibold text-slate-800">
                      +{formatCurrency(sub.taxTotal, "USD", 2)}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Discounts Applied</span>
                    <div className="font-mono font-semibold text-amber-600">
                      {sub.discountTotal > 0 ? `-${formatCurrency(sub.discountTotal, "USD", 2)}` : "None"}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold text-slate-900">Total Billed</span>
                    <div className="font-mono font-bold text-slate-900 text-sm">
                      {formatCurrency(sub.totalAmount, "USD", 2)}/{sub.billingInterval === "monthly" ? "mo" : "yr"}
                    </div>
                  </div>
                </div>

                {/* Lifecycle Management Actions */}
                {isActive && (<div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Calendar className="h-3.5 w-3.5 text-slate-400"/>
                      <span>Current cycle ends: <strong>{formatDate(sub.currentPeriodEnd)}</strong></span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setSelectedForChange(sub)} className="gap-1.5 text-xs">
                        <ArrowUpRight className="h-3.5 w-3.5 text-slate-600"/>
                        <span>Change Plan</span>
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handlePause(sub)} className="gap-1.5 text-xs text-amber-700 hover:text-amber-800 hover:bg-amber-50">
                        <PauseCircle className="h-3.5 w-3.5"/>
                        <span>Pause</span>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedForCancel(sub)} className="gap-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50">
                        <Ban className="h-3.5 w-3.5"/>
                        <span>Cancel</span>
                      </Button>
                    </div>
                  </div>)}
              </div>
            </BentoCard>);
        })}
      </div>

      {/* Plan Change Modal */}
      {selectedForChange && (<ChangePlanModal isOpen={!!selectedForChange} onClose={() => setSelectedForChange(null)} currentPlanId={selectedForChange.planId} onConfirmChange={handleConfirmPlanChange} isSubmitting={changePlanMutation.isPending}/>)}

      {/* Cancel Modal */}
      {selectedForCancel && (<CancelSubscriptionModal isOpen={!!selectedForCancel} onClose={() => setSelectedForCancel(null)} subscriptionNumber={selectedForCancel.subscriptionNumber} onConfirmCancel={handleConfirmCancel} isSubmitting={cancelMutation.isPending}/>)}
    </div>);
}
