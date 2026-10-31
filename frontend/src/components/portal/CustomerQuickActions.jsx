import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  ArrowUpCircle,
  RefreshCw,
  Download,
  Receipt,
  Headphones,
  Zap,
} from 'lucide-react';

/**
 * CustomerQuickActions
 * Task 10: Customer Dashboard Quick Actions with direct working navigation:
 * • Browse Plans -> /customer/browse-plans
 * • Upgrade Plan -> /customer/browse-plans (or trigger modal)
 * • Renew Subscription -> renews primary or navigates to /customer/subscriptions
 * • Download Latest Invoice -> downloads latest invoice receipt
 * • Billing History -> /customer/invoices
 * • Contact Support -> triggers support notification / ticket modal
 */
export const CustomerQuickActions = ({
  primarySubscriptionId = 'sub_01H1',
  onRenew,
  onUpgrade,
  onDownloadLatestInvoice,
  onContactSupport,
}) => {
  const navigate = useNavigate();

  const actions = [
    {
      id: 'browse_plans',
      label: 'Browse Plans',
      subtitle: 'Marketplace tiers',
      icon: ShoppingBag,
      iconColor: 'text-blue-600',
      onClick: () => navigate('/customer/browse-plans'),
    },
    {
      id: 'upgrade_plan',
      label: 'Upgrade Plan',
      subtitle: 'Scale quotas & seats',
      icon: ArrowUpCircle,
      iconColor: 'text-emerald-600',
      onClick: () => {
        if (onUpgrade) {
          onUpgrade();
        } else {
          navigate('/customer/browse-plans');
        }
      },
    },
    {
      id: 'renew_subscription',
      label: 'Renew Subscription',
      subtitle: 'Extend active cycle',
      icon: RefreshCw,
      iconColor: 'text-teal-600',
      onClick: () => {
        if (onRenew) {
          onRenew(primarySubscriptionId);
        } else {
          navigate('/customer/subscriptions');
        }
      },
    },
    {
      id: 'download_invoice',
      label: 'Download Invoice',
      subtitle: 'Latest tax receipt',
      icon: Download,
      iconColor: 'text-purple-600',
      onClick: () => {
        if (onDownloadLatestInvoice) {
          onDownloadLatestInvoice();
        } else {
          navigate('/customer/invoices');
        }
      },
    },
    {
      id: 'billing_history',
      label: 'Billing History',
      subtitle: 'Statements & ledger',
      icon: Receipt,
      iconColor: 'text-indigo-600',
      onClick: () => navigate('/customer/invoices'),
    },
    {
      id: 'contact_support',
      label: 'Contact Support',
      subtitle: '24/7 Priority SLA',
      icon: Headphones,
      iconColor: 'text-amber-600',
      onClick: () => {
        if (onContactSupport) {
          onContactSupport();
        }
      },
    },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs select-none transition-colors duration-200">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400">
          <Zap size={16} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Customer Self-Service Quick Actions
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Instant operations for plans, renewal cycles, statements, and priority engineering support
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.id}
              type="button"
              onClick={act.onClick}
              className="flex flex-col items-center justify-center p-3.5 bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50/70 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-700/80 hover:border-blue-200 dark:hover:border-blue-800 rounded-xl text-center transition-all group"
            >
              <div className="w-9 h-9 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform shadow-2xs">
                <Icon size={17} className={act.iconColor} />
              </div>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-700 dark:group-hover:text-blue-400">
                {act.label}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                {act.subtitle}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CustomerQuickActions;
