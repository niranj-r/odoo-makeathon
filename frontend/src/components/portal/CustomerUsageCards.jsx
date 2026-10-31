import React from 'react';
import { Users, Zap, HardDrive, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { formatNumber } from '../../utils/formatters';

/**
 * Animated SVG Radial Gauge Component
 */
const RadialGauge = ({
  percentage = 0,
  size = 52,
  strokeWidth = 4.5,
  color = '#2563EB',
  trackColor = '#E2E8F0',
}) => {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(percentage, 0), 100);
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center shrink-0">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Track circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          className="dark:opacity-20"
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {/* Center Percentage Display */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">
          {Math.round(clamped)}%
        </span>
      </div>
    </div>
  );
};

/**
 * CustomerUsageCards
 * Enterprise operational quota cards with both linear progress bars and SVG radial gauges.
 * Metrics: Team Seats, API Calls, Cloud Storage, Account Health / Billing Progress.
 */
export const CustomerUsageCards = ({ usage, loading = false }) => {
  if (!usage) return null;

  const { seats, apiCalls, storage, health } = usage;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none transition-colors duration-200">
      {/* Team Seats Widget */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Users size={16} />
            </div>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {seats.title}
            </span>
          </div>
          <RadialGauge
            percentage={seats.percentage}
            color="#2563EB"
            size={48}
          />
        </div>

        <div className="flex items-baseline gap-1 mb-2">
          <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {seats.used}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            / {seats.total} seats
          </span>
        </div>

        {/* Linear Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-700"
            style={{ width: `${seats.percentage}%` }}
          />
        </div>

        <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 block">
          {seats.percentage}% allocated &bull; {seats.total - seats.used} available seats
        </span>
      </div>

      {/* API Calls Widget */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-100 dark:border-teal-900 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <Zap size={16} />
            </div>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {apiCalls.title}
            </span>
          </div>
          <RadialGauge
            percentage={apiCalls.percentage}
            color="#0D9488"
            size={48}
          />
        </div>

        <div className="flex items-baseline gap-1 mb-2">
          <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {formatNumber(apiCalls.used)}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            / {formatNumber(apiCalls.total)}
          </span>
        </div>

        {/* Linear Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className="bg-teal-600 dark:bg-teal-500 h-full rounded-full transition-all duration-700"
            style={{ width: `${apiCalls.percentage}%` }}
          />
        </div>

        <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 block">
          {apiCalls.percentage}% quota used &bull; Resets on next billing cycle
        </span>
      </div>

      {/* Cloud Storage Widget */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 border border-purple-100 dark:border-purple-900 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <HardDrive size={16} />
            </div>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {storage.title}
            </span>
          </div>
          <RadialGauge
            percentage={storage.percentage}
            color="#9333EA"
            size={48}
          />
        </div>

        <div className="flex items-baseline gap-1 mb-2">
          <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {storage.used}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            / {storage.total} GB
          </span>
        </div>

        {/* Linear Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className="bg-purple-600 dark:bg-purple-500 h-full rounded-full transition-all duration-700"
            style={{ width: `${storage.percentage}%` }}
          />
        </div>

        <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 block">
          {storage.percentage}% utilized &bull; High performance SSD
        </span>
      </div>

      {/* Account Standing & Billing Health */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <ShieldCheck size={16} />
            </div>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Account Health
            </span>
          </div>
          <RadialGauge
            percentage={health.score}
            color="#10B981"
            size={48}
          />
        </div>

        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {health.score}/100
          </span>
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-400">
            {health.status}
          </span>
        </div>

        {/* Auto Renewal Details */}
        <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300 mt-1">
          <div className="flex items-center gap-1.5 text-[11px]">
            <CheckCircle2 size={13} className="text-emerald-500" />
            <span>Auto-Renewal: <strong className="text-slate-800 dark:text-slate-200">Active</strong></span>
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 pl-4">
            Next renewal: {health.nextRenewal}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerUsageCards;
