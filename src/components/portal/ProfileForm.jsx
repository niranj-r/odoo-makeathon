"use client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { BentoCard } from "@/components/common/BentoCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Loader2 } from "lucide-react";
const profileSchema = z.object({
    name: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().email("Valid work email is required"),
    phone: z.string().optional(),
    role: z.string().min(2, "Job title is required"),
    companyName: z.string().min(2, "Company name is required"),
    taxId: z.string().optional(),
    billingEmail: z.string().email("Valid billing email is required"),
    line1: z.string().min(5, "Address line 1 is required"),
    line2: z.string().optional(),
    city: z.string().min(2, "City is required"),
    state: z.string().min(2, "State/Province is required"),
    postalCode: z.string().min(3, "Postal code is required"),
    country: z.string().min(2, "Country is required"),
    emailInvoices: z.boolean(),
    renewalReminders: z.boolean(),
    paymentFailures: z.boolean(),
    productUpdates: z.boolean(),
});
export function ProfileForm({ initialProfile, onSave, isSaving = false, }) {
    const [successMessage, setSuccessMessage] = useState(null);
    const { register, handleSubmit, formState: { errors, isDirty }, } = useForm({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: initialProfile.name,
            email: initialProfile.email,
            phone: initialProfile.phone || "",
            role: initialProfile.role,
            companyName: initialProfile.billing.companyName,
            taxId: initialProfile.billing.taxId || "",
            billingEmail: initialProfile.billing.billingEmail,
            line1: initialProfile.billing.address.line1,
            line2: initialProfile.billing.address.line2 || "",
            city: initialProfile.billing.address.city,
            state: initialProfile.billing.address.state,
            postalCode: initialProfile.billing.address.postalCode,
            country: initialProfile.billing.address.country,
            emailInvoices: initialProfile.notificationPreferences.emailInvoices,
            renewalReminders: initialProfile.notificationPreferences.renewalReminders,
            paymentFailures: initialProfile.notificationPreferences.paymentFailures,
            productUpdates: initialProfile.notificationPreferences.productUpdates,
        },
    });
    const onSubmit = async (data) => {
        const payload = {
            name: data.name,
            email: data.email,
            phone: data.phone,
            role: data.role,
            billing: {
                companyName: data.companyName,
                taxId: data.taxId,
                billingEmail: data.billingEmail,
                address: {
                    line1: data.line1,
                    line2: data.line2,
                    city: data.city,
                    state: data.state,
                    postalCode: data.postalCode,
                    country: data.country,
                },
            },
            notificationPreferences: {
                emailInvoices: data.emailInvoices,
                renewalReminders: data.renewalReminders,
                paymentFailures: data.paymentFailures,
                productUpdates: data.productUpdates,
            },
        };
        await onSave(payload);
        setSuccessMessage("Profile and billing preferences updated successfully.");
        setTimeout(() => setSuccessMessage(null), 4000);
    };
    return (<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {successMessage && (<div className="rounded-xl border border-emerald-200 bg-emerald-50/90 p-4 text-xs font-medium text-emerald-800 shadow-xs flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600"/>
            <span>{successMessage}</span>
          </div>
          <button type="button" onClick={() => setSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900 font-bold">
            ×
          </button>
        </div>)}

      {/* 1. Personal Information */}
      <BentoCard title="Account Administrator Details" description="Primary billing contact authorized for subscription decisions">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Full Name</label>
            <Input {...register("name")} placeholder="e.g. Alex Morgan"/>
            {errors.name && (<p className="text-[11px] text-rose-600">{errors.name.message}</p>)}
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Work Email</label>
            <Input {...register("email")} type="email" placeholder="alex@company.com"/>
            {errors.email && (<p className="text-[11px] text-rose-600">{errors.email.message}</p>)}
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Phone Number</label>
            <Input {...register("phone")} placeholder="+1 (555) 000-0000"/>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Job Title / Role</label>
            <Input {...register("role")} placeholder="e.g. VP of Engineering"/>
            {errors.role && (<p className="text-[11px] text-rose-600">{errors.role.message}</p>)}
          </div>
        </div>
      </BentoCard>

      {/* 2. Company & Tax Details */}
      <BentoCard title="Company & Tax Identification" description="Legal entity details for invoice generation and automated tax calculation">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Legal Company Name</label>
            <Input {...register("companyName")} placeholder="Acme Technologies Inc."/>
            {errors.companyName && (<p className="text-[11px] text-rose-600">{errors.companyName.message}</p>)}
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Tax / VAT ID (Optional)</label>
            <Input {...register("taxId")} placeholder="US-EIN-948201948 or EU-VAT-..."/>
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="font-semibold text-slate-700">Billing Department Email</label>
            <Input {...register("billingEmail")} type="email" placeholder="invoices@acmetech.io"/>
            {errors.billingEmail && (<p className="text-[11px] text-rose-600">{errors.billingEmail.message}</p>)}
          </div>
        </div>
      </BentoCard>

      {/* 3. Billing Address */}
      <BentoCard title="Official Billing Address" description="Physical address printed on official tax invoices">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1 md:col-span-2">
            <label className="font-semibold text-slate-700">Address Line 1</label>
            <Input {...register("line1")} placeholder="450 Mission Street"/>
            {errors.line1 && (<p className="text-[11px] text-rose-600">{errors.line1.message}</p>)}
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="font-semibold text-slate-700">Address Line 2 (Suite, Floor)</label>
            <Input {...register("line2")} placeholder="Suite 1400"/>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">City</label>
            <Input {...register("city")} placeholder="San Francisco"/>
            {errors.city && (<p className="text-[11px] text-rose-600">{errors.city.message}</p>)}
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">State / Province</label>
            <Input {...register("state")} placeholder="CA"/>
            {errors.state && (<p className="text-[11px] text-rose-600">{errors.state.message}</p>)}
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Postal Code</label>
            <Input {...register("postalCode")} placeholder="94105"/>
            {errors.postalCode && (<p className="text-[11px] text-rose-600">{errors.postalCode.message}</p>)}
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Country</label>
            <Input {...register("country")} placeholder="United States"/>
            {errors.country && (<p className="text-[11px] text-rose-600">{errors.country.message}</p>)}
          </div>
        </div>
      </BentoCard>

      {/* 4. Notification Preferences */}
      <BentoCard title="Billing Notification Channels" description="Choose which automated alerts your team receives">
        <div className="space-y-3 text-xs">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" {...register("emailInvoices")} className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"/>
            <div>
              <span className="font-semibold text-slate-900">Email Monthly PDF Invoices</span>
              <p className="text-slate-500">Automatically attach PDF copy to billing email upon generation.</p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" {...register("renewalReminders")} className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"/>
            <div>
              <span className="font-semibold text-slate-900">Advance Renewal Reminders</span>
              <p className="text-slate-500">Receive 7-day advance notification before annual/monthly renewal charge.</p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" {...register("paymentFailures")} className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"/>
            <div>
              <span className="font-semibold text-slate-900">Payment Failure Alerts</span>
              <p className="text-slate-500">Instant notification if credit card charge fails, with retry grace period.</p>
            </div>
          </label>
        </div>
      </BentoCard>

      {/* Save Button Bar */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="submit" disabled={isSaving} className="gap-2">
          {isSaving && <Loader2 className="h-4 w-4 animate-spin"/>}
          <span>{isSaving ? "Saving Changes..." : "Save Profile & Billing Settings"}</span>
        </Button>
      </div>
    </form>);
}
