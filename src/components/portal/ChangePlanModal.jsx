"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { AVAILABLE_PLANS } from "@/constants/plans";
import { formatCurrency } from "@/utils/formatters";
import { Check, X, ArrowRight } from "lucide-react";
import { cn } from "@/utils/cn";
export function ChangePlanModal({ isOpen, onClose, currentPlanId, onConfirmChange, isSubmitting, }) {
    const [selectedPlanId, setSelectedPlanId] = useState(currentPlanId);
    if (!isOpen)
        return null;
    return (<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Upgrade or Change Subscription Plan
            </h2>
            <p className="text-xs text-slate-500">
              Select a tier that fits your expanding team requirements.
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <X className="h-5 w-5"/>
          </button>
        </div>

        {/* Plan comparison cards */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          {AVAILABLE_PLANS.map((plan) => {
            const isSelected = selectedPlanId === plan.id;
            const isCurrent = currentPlanId === plan.id;
            return (<div key={plan.id} onClick={() => setSelectedPlanId(plan.id)} className={cn("cursor-pointer rounded-xl border p-4 transition-all flex flex-col justify-between", isSelected
                    ? "border-slate-900 ring-2 ring-slate-900/10 bg-slate-50/50"
                    : "border-slate-200 hover:border-slate-300 bg-white")}>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-900">
                      {plan.name}
                    </span>
                    {isCurrent && (<span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-700">
                        Current
                      </span>)}
                  </div>
                  <div className="mt-2 text-xl font-bold text-slate-900">
                    {formatCurrency(plan.monthlyPrice)}
                    <span className="text-xs font-normal text-slate-500">/mo</span>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-500 leading-snug">
                    {plan.description}
                  </p>
                </div>

                <ul className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 text-[11px] text-slate-600">
                  {plan.features.slice(0, 3).map((f, i) => (<li key={i} className="flex items-center gap-1.5">
                      <Check className="h-3 w-3 text-emerald-600 shrink-0"/>
                      <span className="truncate">{f}</span>
                    </li>))}
                </ul>
              </div>);
        })}
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button size="sm" disabled={isSubmitting || selectedPlanId === currentPlanId} onClick={() => onConfirmChange(selectedPlanId)} className="gap-1.5">
            <span>Confirm Plan Change</span>
            <ArrowRight className="h-3.5 w-3.5"/>
          </Button>
        </div>
      </div>
    </div>);
}
