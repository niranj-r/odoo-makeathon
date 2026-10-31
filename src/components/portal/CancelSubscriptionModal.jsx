"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, AlertTriangle } from "lucide-react";
export function CancelSubscriptionModal({ isOpen, onClose, subscriptionNumber, onConfirmCancel, isSubmitting, }) {
    const [reason, setReason] = useState("pricing");
    const [comments, setComments] = useState("");
    if (!isOpen)
        return null;
    return (<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fade-in">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 border border-rose-200 text-rose-600">
              <AlertTriangle className="h-4 w-4"/>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Cancel Subscription
              </h2>
              <span className="text-xs font-mono text-slate-500">
                {subscriptionNumber}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5"/>
          </button>
        </div>

        <div className="mt-4 space-y-4 text-xs">
          <p className="text-slate-600">
            We are sorry to see you go. Your subscription access will remain available
            until the end of your current billing period.
          </p>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">
              Please tell us the primary reason for canceling:
            </label>
            <select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900">
              <option value="pricing">Price is too high for our budget</option>
              <option value="missing_feature">Missing specific ERP integration or feature</option>
              <option value="competitor">Switched to another platform</option>
              <option value="temporary">Completed temporary project</option>
              <option value="other">Other reason</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">
              Additional comments (optional):
            </label>
            <textarea rows={3} value={comments} onChange={(e) => setComments(e.target.value)} placeholder="What could we have done better?" className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"/>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Keep Subscription
          </Button>
          <Button variant="destructive" size="sm" disabled={isSubmitting} onClick={() => onConfirmCancel(reason, comments)}>
            Confirm Cancellation
          </Button>
        </div>
      </div>
    </div>);
}
