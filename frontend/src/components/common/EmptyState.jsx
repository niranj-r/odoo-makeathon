import React from 'react';
import { Inbox, Package, FileText, CreditCard, Search, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PRESET_CONFIGS = {
  subscriptions: {
    icon: Package,
    title: 'No active subscriptions found',
    description: 'You do not have any active subscriptions yet. Browse our tiers to choose the best plan for your organization.',
    actionLabel: 'Browse Plans',
    actionRoute: '/customer/browse-plans',
  },
  invoices: {
    icon: FileText,
    title: 'No invoices available',
    description: 'No billing invoices have been issued for this period yet. Receipts are generated automatically upon billing renewal.',
    actionLabel: 'View Reports',
    actionRoute: '/admin/reports',
  },
  payments: {
    icon: CreditCard,
    title: 'No payment transactions recorded',
    description: 'Settled credit card transactions and bank wire transfers will appear here in your audit ledger.',
    actionLabel: 'Make a Payment',
    actionRoute: '/customer/invoices',
  },
  search: {
    icon: Search,
    title: 'No matching records found',
    description: 'We could not find any results matching your search criteria. Try modifying your search term or clearing filters.',
    actionLabel: 'Clear Filters',
  },
};

/**
 * EmptyState
 * Actionable empty state component with pre-configured presets (Browse Plans, Create Subscription, View Reports)
 * and full customizability.
 *
 * @param {Object} props
 * @param {'subscriptions'|'invoices'|'payments'|'search'} [props.preset]
 * @param {React.ComponentType} [props.icon]
 * @param {string} [props.title]
 * @param {string} [props.description]
 * @param {string} [props.actionLabel]
 * @param {() => void} [props.onAction]
 * @param {string} [props.secondaryActionLabel]
 * @param {() => void} [props.onSecondaryAction]
 * @param {string} [props.className]
 */
export const EmptyState = ({
  preset,
  icon: CustomIcon,
  title: customTitle,
  description: customDesc,
  actionLabel: customActionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = '',
}) => {
  const navigate = useNavigate();
  const config = preset && PRESET_CONFIGS[preset] ? PRESET_CONFIGS[preset] : {};

  const Icon = CustomIcon || config.icon || Inbox;
  const title = customTitle || config.title || 'No data available';
  const description = customDesc || config.description || 'There is currently no information to display here.';
  const actionLabel = customActionLabel || config.actionLabel;

  const handlePrimaryAction = () => {
    if (onAction) {
      onAction();
    } else if (config.actionRoute) {
      navigate(config.actionRoute);
    }
  };

  return (
    <div
      className={`py-12 px-4 text-center max-w-sm mx-auto flex flex-col items-center justify-center select-none transition-colors duration-200 ${className}`}
    >
      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mb-4 border border-slate-200/80 dark:border-slate-700">
        <Icon size={22} className="stroke-[1.75]" />
      </div>

      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
        {title}
      </h3>

      {description && (
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
          {description}
        </p>
      )}

      {(actionLabel || secondaryActionLabel) && (
        <div className="mt-5 flex items-center gap-2.5">
          {actionLabel && (
            <button
              type="button"
              onClick={handlePrimaryAction}
              className="inline-flex items-center gap-1.5 justify-center px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <span>{actionLabel}</span>
              <ArrowRight size={13} />
            </button>
          )}

          {secondaryActionLabel && (
            <button
              type="button"
              onClick={onSecondaryAction}
              className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 active:bg-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400/20"
            >
              {secondaryActionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
