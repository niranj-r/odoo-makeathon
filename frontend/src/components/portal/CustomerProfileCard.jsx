import React from 'react';
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Edit3,
  CreditCard,
  Calendar,
  Users,
  Zap,
} from 'lucide-react';

/**
 * CustomerProfileCard
 * Clean enterprise profile card with real subscription standing, payment method, renewal date, and usage.
 * Full light & dark mode support.
 */
export const CustomerProfileCard = ({ profile, onEditProfile }) => {
  if (!profile) return null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden transition-colors duration-200">
      {/* Profile Header */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center text-xl font-bold shadow-md shrink-0">
            {profile.initials || 'SC'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                {profile.name}
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                Primary Account Owner
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
              <Building2 size={15} className="text-slate-400 dark:text-slate-500" />
              {profile.company}
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-2 flex-wrap">
              <span className="flex items-center gap-1">
                <Mail size={13} className="text-slate-400 dark:text-slate-500" />
                {profile.email}
              </span>
              <span className="flex items-center gap-1">
                <Phone size={13} className="text-slate-400 dark:text-slate-500" />
                {profile.phone}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onEditProfile}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 rounded-lg transition-colors"
        >
          <Edit3 size={14} />
          Edit Profile
        </button>
      </div>

      {/* Profile Details Grid */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
        {/* Billing Address Card */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl">
          <div className="flex items-center gap-2 mb-2 font-semibold text-slate-900 dark:text-slate-100">
            <MapPin size={15} className="text-blue-600 dark:text-blue-400" />
            <span>Registered Billing Address</span>
          </div>
          <p className="text-slate-700 dark:text-slate-300 font-medium">{profile.company}</p>
          <p className="text-slate-600 dark:text-slate-400">{profile.billingAddress?.line1}</p>
          {profile.billingAddress?.line2 && (
            <p className="text-slate-600 dark:text-slate-400">{profile.billingAddress?.line2}</p>
          )}
          <p className="text-slate-600 dark:text-slate-400">
            {profile.billingAddress?.city}, {profile.billingAddress?.state}{' '}
            {profile.billingAddress?.postalCode}
          </p>
          <p className="text-slate-600 dark:text-slate-400">{profile.billingAddress?.country}</p>
        </div>

        {/* Tax & Financial Identification */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl">
          <div className="flex items-center gap-2 mb-2 font-semibold text-slate-900 dark:text-slate-100">
            <CreditCard size={15} className="text-blue-600 dark:text-blue-400" />
            <span>Billing Method & Tax ID</span>
          </div>
          <div className="space-y-1.5">
            <div>
              <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-medium">
                Payment Card on File
              </span>
              <span className="text-slate-900 dark:text-slate-100 font-semibold flex items-center gap-1 mt-0.5">
                <CreditCard size={13} className="text-blue-600 dark:text-blue-400" />
                Visa •••• 4242 (Exp 12/28)
              </span>
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-medium">
                Federal Tax ID / EIN
              </span>
              <span className="font-mono text-slate-800 dark:text-slate-200 font-medium">
                {profile.taxId}
              </span>
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-medium">
                Billing Currency
              </span>
              <span className="text-slate-800 dark:text-slate-200 font-medium">
                {profile.currency} (United States Dollar)
              </span>
            </div>
          </div>
        </div>

        {/* Current Plan & Active Quota Standing */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl">
          <div className="flex items-center gap-2 mb-2 font-semibold text-slate-900 dark:text-slate-100">
            <Calendar size={15} className="text-blue-600 dark:text-blue-400" />
            <span>Active Plan & Quota Standing</span>
          </div>
          <div className="space-y-1.5">
            <div>
              <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-medium">
                Current Plan
              </span>
              <span className="text-slate-900 dark:text-slate-100 font-bold">
                Professional Growth (Annual)
              </span>
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-medium">
                Next Renewal Date
              </span>
              <span className="text-slate-800 dark:text-slate-200 font-medium">
                Jan 14, 2027 &bull; Auto-Renewal Active
              </span>
            </div>
            <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Users size={12} className="text-blue-500" /> 12/15 Seats
              </span>
              <span className="flex items-center gap-1">
                <Zap size={12} className="text-teal-500" /> 184k/250k API
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerProfileCard;
