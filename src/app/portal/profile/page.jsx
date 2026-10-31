"use client";
import React from "react";
import { useCustomerProfile, useUpdateCustomerProfile } from "@/hooks/useCustomerPortal";
import { ProfileForm } from "@/components/portal/ProfileForm";
import { TableSkeleton } from "@/components/common/LoadingSkeleton";
export default function CustomerProfilePage() {
    const { data: profile, isLoading } = useCustomerProfile();
    const updateMutation = useUpdateCustomerProfile();
    const handleSave = async (data) => {
        if (!profile)
            return;
        await updateMutation.mutateAsync({
            customerId: profile.id,
            data,
        });
    };
    return (<div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Organization Profile & Preferences
        </h1>
        <p className="text-xs text-slate-500">
          Update administrator details, corporate tax information, billing address, and notification alerts.
        </p>
      </div>

      {isLoading || !profile ? (<TableSkeleton rows={4} cols={2}/>) : (<ProfileForm initialProfile={profile} onSave={handleSave} isSaving={updateMutation.isPending}/>)}
    </div>);
}
