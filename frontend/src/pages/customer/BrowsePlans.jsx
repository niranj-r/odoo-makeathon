import React, { useState, useMemo } from 'react';
import { Search, Filter, ArrowUpDown, SlidersHorizontal, Sparkles, ShieldCheck, Check } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { PlanCard } from '../../components/portal/PlanCard';
import { PlanDetailsModal } from '../../components/portal/PlanDetailsModal';
import { PurchasePlanModal } from '../../components/portal/PurchasePlanModal';
import { PortalFeedbackToast } from '../../components/portal/PortalFeedbackToast';
import { EmptyState } from '../../components/common/EmptyState';
import { useCustomerPortal } from '../../hooks/useCustomerPortal';

/**
 * BrowsePlans Page
 * Task 1: Complete Subscription Marketplace ("Browse Plans").
 * Full search, multi-parameter filters (Billing Cycle, Plan, Price Slider, Category),
 * sorting, Plan Details drawer/modal, and 4-step Buy Flow.
 */
export const BrowsePlans = () => {
  const [billingCycle, setBillingCycle] = useState('yearly'); // 'monthly' | 'yearly'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlanTier, setSelectedPlanTier] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [maxPrice, setMaxPrice] = useState(600);
  const [sortOption, setSortOption] = useState('popular'); // 'price_asc' | 'price_desc' | 'popular' | 'newest'

  // Modals
  const [detailsModalPlan, setDetailsModalPlan] = useState(null);
  const [purchaseModalPlan, setPurchaseModalPlan] = useState(null);

  const {
    plans,
    subscriptions,
    upgradePlan,
    feedback,
    clearFeedback,
  } = useCustomerPortal();

  const activePlanId = subscriptions[0]?.planId || null;

  // Filter & Sort Pipeline
  const filteredPlans = useMemo(() => {
    let list = [...plans];

    // Search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.tagline.toLowerCase().includes(q) ||
          p.features.some((f) => f.toLowerCase().includes(q))
      );
    }

    // Plan Filter (Starter, Professional, Business, Enterprise)
    if (selectedPlanTier !== 'All') {
      list = list.filter((p) => p.name.toLowerCase() === selectedPlanTier.toLowerCase());
    }

    // Category Filter (Popular, Newest, Best Value)
    if (categoryFilter === 'Popular') {
      list = list.filter((p) => p.popular);
    } else if (categoryFilter === 'Best Value') {
      list = list.filter((p) => p.name === 'Professional' || p.name === 'Business');
    } else if (categoryFilter === 'Newest') {
      list = list.filter((p) => p.name === 'Enterprise' || p.name === 'Business');
    }

    // Price Slider Filter
    list = list.filter((p) => {
      const price = billingCycle === 'yearly' ? p.yearlyMonthlyEquivalent : p.monthlyPrice;
      return price <= maxPrice;
    });

    // Sorting
    list.sort((a, b) => {
      const priceA = billingCycle === 'yearly' ? a.yearlyMonthlyEquivalent : a.monthlyPrice;
      const priceB = billingCycle === 'yearly' ? b.yearlyMonthlyEquivalent : b.monthlyPrice;

      if (sortOption === 'price_asc') return priceA - priceB;
      if (sortOption === 'price_desc') return priceB - priceA;
      if (sortOption === 'popular') return (b.popular ? 1 : 0) - (a.popular ? 1 : 0);
      if (sortOption === 'newest') return b.yearlyPrice - a.yearlyPrice;
      return 0;
    });

    return list;
  }, [plans, searchTerm, selectedPlanTier, categoryFilter, maxPrice, sortOption, billingCycle]);

  const handleOpenDetails = (plan) => {
    setDetailsModalPlan(plan);
  };

  const handleOpenPurchase = (plan) => {
    setPurchaseModalPlan(plan);
  };

  const handleCompletePurchase = async (planId, cadence) => {
    await upgradePlan(planId, cadence);
  };

  return (
    <div className="space-y-6 pb-12 select-none transition-colors duration-200">
      {/* Toast Alert */}
      <PortalFeedbackToast feedback={feedback} onClose={clearFeedback} />

      {/* Page Header */}
      <PageHeader
        title="Subscription Marketplace"
        subtitle="Explore and subscribe to enterprise SaaS plans. Scalable quotas, transparent pricing, and instant provisioning."
      />

      {/* Monthly / Yearly Billing Toggle Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 py-1">
        <div className="inline-flex items-center p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs">
          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              billingCycle === 'monthly'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            Monthly Billing
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle('yearly')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              billingCycle === 'yearly'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <span>Annual Billing</span>
            <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-emerald-100 text-emerald-800 font-extrabold">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* Marketplace Search & Multi-Filter Control Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Plans */}
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search plan name, storage, seats, or SLA..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Plan Tier Dropdown */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Filter size={13} />
              <span>Plan:</span>
            </div>
            <select
              value={selectedPlanTier}
              onChange={(e) => setSelectedPlanTier(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="All">All Plans</option>
              <option value="Starter">Starter</option>
              <option value="Professional">Professional</option>
              <option value="Business">Business</option>
              <option value="Enterprise">Enterprise</option>
            </select>

            {/* Category Dropdown */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="All">All Categories</option>
              <option value="Popular">Popular Choice</option>
              <option value="Best Value">Best Value</option>
              <option value="Newest">Newest Tiers</option>
            </select>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 ml-1">
              <ArrowUpDown size={13} />
              <span>Sort:</span>
            </div>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="popular">Popularity</option>
              <option value="price_asc">Price Low → High</option>
              <option value="price_desc">Price High → Low</option>
              <option value="newest">Newest</option>
            </select>
          </div>
        </div>

        {/* Price Slider Bar */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 flex-wrap text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={13} className="text-blue-600" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Max Monthly Budget: ${maxPrice} / mo
            </span>
          </div>
          <div className="flex items-center gap-3 flex-1 max-w-xs">
            <span className="text-[11px] text-slate-400">$10</span>
            <input
              type="range"
              min="15"
              max="600"
              step="10"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <span className="text-[11px] text-slate-400">$600+</span>
          </div>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      {filteredPlans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
          {filteredPlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              billingCycle={billingCycle}
              isCurrent={plan.id === activePlanId || plan.isCurrent}
              onViewDetails={handleOpenDetails}
              onBuyNow={handleOpenPurchase}
            />
          ))}
        </div>
      ) : (
        <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <EmptyState
            preset="search"
            title="No matching plans found"
            description="Adjust your price slider, billing cycle, or search query to view available subscription tiers."
            actionLabel="Reset Filters"
            onAction={() => {
              setSearchTerm('');
              setSelectedPlanTier('All');
              setCategoryFilter('All');
              setMaxPrice(600);
            }}
          />
        </div>
      )}

      {/* Trust & Enterprise Assurance Banner */}
      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-slate-100">
              Enterprise Grade SLA Guarantee
            </h4>
            <p className="text-slate-500 dark:text-slate-400 text-[11px]">
              All plans include 14-day risk-free proration, automated invoices, and SOC-2 compliance standards.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400 text-[11px]">
          <span className="flex items-center gap-1">
            <Check size={14} className="text-emerald-500 stroke-[3]" />
            Instant Activation
          </span>
          <span className="flex items-center gap-1">
            <Check size={14} className="text-emerald-500 stroke-[3]" />
            Cancel Anytime
          </span>
          <span className="flex items-center gap-1">
            <Check size={14} className="text-emerald-500 stroke-[3]" />
            Encrypted Checkout
          </span>
        </div>
      </div>

      {/* Task 2: Plan Details Deep-Dive Drawer/Modal */}
      <PlanDetailsModal
        plan={detailsModalPlan}
        billingCycle={billingCycle}
        isOpen={!!detailsModalPlan}
        onClose={() => setDetailsModalPlan(null)}
        onBuyNow={(plan, cycle) => {
          setDetailsModalPlan(null);
          setPurchaseModalPlan(plan);
        }}
      />

      {/* Task 3: Multi-Step Buy Flow Stepper Dialog */}
      <PurchasePlanModal
        plan={purchaseModalPlan}
        billingCycle={billingCycle}
        isOpen={!!purchaseModalPlan}
        onClose={() => setPurchaseModalPlan(null)}
        onCompletePurchase={handleCompletePurchase}
      />
    </div>
  );
};

export default BrowsePlans;
