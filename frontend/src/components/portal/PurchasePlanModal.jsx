import React, { useState } from 'react';
import {
  X,
  Check,
  CreditCard,
  Building,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  QrCode,
  FileText,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

const STEPS = [
  { id: 1, title: 'Billing Address' },
  { id: 2, title: 'Payment Method' },
  { id: 3, title: 'Review Order' },
  { id: 4, title: 'Confirmation' },
];

/**
 * PurchasePlanModal
 * Task 3: Modern 4-Step Purchase Flow Stepper (Billing -> Payment -> Review -> Confirmation).
 * Does not instantly subscribe; provides a structured enterprise checkout experience.
 */
export const PurchasePlanModal = ({
  plan,
  billingCycle = 'yearly',
  isOpen = false,
  onClose,
  onCompletePurchase,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [paymentType, setPaymentType] = useState('card'); // 'card' | 'upi'

  // Step 1: Billing Info State
  const [billingInfo, setBillingInfo] = useState({
    fullName: 'Vedha Mahadevan',
    companyName: 'BrightLoop Dynamics Inc.',
    email: 'admin@brightloop.io',
    address: '452 Innovation Blvd, Suite 400',
    city: 'San Francisco',
    postalCode: '94107',
    country: 'United States',
  });

  // Step 2: Payment Details State
  const [cardInfo, setCardInfo] = useState({
    cardNumber: '•••• •••• •••• 4242',
    cardExpiry: '12/28',
    cardCvc: '•••',
  });
  const [upiId, setUpiId] = useState('billing@okhdfcbank');

  // Step 3: Terms agreement
  const [agreedTerms, setAgreedTerms] = useState(true);

  // Step 4: Confirmation payload
  const [confirmationData, setConfirmationData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !plan) return null;

  const isYearly = billingCycle === 'yearly';
  const subtotal = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
  const taxRate = 0.18; // 18% standard business tax/VAT
  const taxAmount = Math.round(subtotal * taxRate);
  const totalAmount = subtotal + taxAmount;

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1 && currentStep < 4) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleConfirmOrder = async () => {
    if (!agreedTerms) return;
    setIsSubmitting(true);

    try {
      const orderRef = `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const invoiceNumber = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;

      if (onCompletePurchase) {
        await onCompletePurchase(plan.id, isYearly ? 'Yearly' : 'Monthly');
      }

      setConfirmationData({
        orderRef,
        invoiceNumber,
        planName: plan.name,
        amount: totalAmount,
        cadence: isYearly ? 'Yearly' : 'Monthly',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      });

      setCurrentStep(4);
    } catch {
      // handled gracefully
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setCurrentStep(1);
    setConfirmationData(null);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 select-none animate-in fade-in duration-150"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 transition-all duration-200">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Subscription Purchase Flow
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {currentStep === 4 ? 'Purchase Confirmed' : `Subscribe to ${plan.name} Tier`}
            </h3>
          </div>

          <button
            type="button"
            onClick={resetAndClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Stepper Progress Bar */}
        <div className="px-6 py-3.5 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between relative">
            {STEPS.map((step, idx) => {
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;

              return (
                <div key={step.id} className="flex flex-col items-center flex-1 relative z-10">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isCompleted
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-blue-600 text-white ring-4 ring-blue-500/20'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {isCompleted ? <Check size={14} className="stroke-[3]" /> : step.id}
                  </div>
                  <span
                    className={`text-[10px] font-medium mt-1 text-center whitespace-nowrap ${
                      isCurrent
                        ? 'text-blue-600 dark:text-blue-400 font-bold'
                        : isCompleted
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* STEP 1: Billing Address */}
          {currentStep === 1 && (
            <div className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Contact Full Name
                  </label>
                  <input
                    type="text"
                    value={billingInfo.fullName}
                    onChange={(e) => setBillingInfo({ ...billingInfo, fullName: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Company Legal Entity
                  </label>
                  <input
                    type="text"
                    value={billingInfo.companyName}
                    onChange={(e) => setBillingInfo({ ...billingInfo, companyName: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Billing Email
                </label>
                <input
                  type="email"
                  value={billingInfo.email}
                  onChange={(e) => setBillingInfo({ ...billingInfo, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Street Address
                </label>
                <input
                  type="text"
                  value={billingInfo.address}
                  onChange={(e) => setBillingInfo({ ...billingInfo, address: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={billingInfo.city}
                    onChange={(e) => setBillingInfo({ ...billingInfo, city: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    value={billingInfo.postalCode}
                    onChange={(e) => setBillingInfo({ ...billingInfo, postalCode: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={billingInfo.country}
                    onChange={(e) => setBillingInfo({ ...billingInfo, country: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Payment Method (Mock: Credit Card vs UPI) */}
          {currentStep === 2 && (
            <div className="space-y-4">
              {/* Payment Selector Tabs */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentType('card')}
                  className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all ${
                    paymentType === 'card'
                      ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <CreditCard size={18} className="text-blue-600 shrink-0" />
                  <div>
                    <span className="font-bold block">Credit / Debit Card</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Visa, Mastercard, Amex</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentType('upi')}
                  className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all ${
                    paymentType === 'upi'
                      ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <QrCode size={18} className="text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold block">Instant UPI (Mock)</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">GPay, PhonePe, Paytm</span>
                  </div>
                </button>
              </div>

              {/* Card Inputs */}
              {paymentType === 'card' ? (
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 space-y-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Card Number
                    </label>
                    <input
                      type="text"
                      value={cardInfo.cardNumber}
                      onChange={(e) => setCardInfo({ ...cardInfo, cardNumber: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                        Expires End
                      </label>
                      <input
                        type="text"
                        value={cardInfo.cardExpiry}
                        onChange={(e) => setCardInfo({ ...cardInfo, cardExpiry: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                        CVC / CVV
                      </label>
                      <input
                        type="text"
                        value={cardInfo.cardCvc}
                        onChange={(e) => setCardInfo({ ...cardInfo, cardCvc: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 space-y-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Virtual Payment Address (VPA / UPI ID)
                    </label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="user@upi"
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    A test verification request will be simulated on your registered handle.
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
                <span>Simulated mock checkout sandbox &bull; 256-bit encryption</span>
              </div>
            </div>
          )}

          {/* STEP 3: Review Order & Pricing Summary */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50 space-y-3">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-slate-700">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      {plan.name} Tier Subscription
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      Billed {billingCycle} &bull; Auto-renewal active
                    </span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    {formatCurrency(subtotal)}
                  </span>
                </div>

                <div className="space-y-1.5 text-slate-600 dark:text-slate-300 text-xs">
                  <div className="flex items-center justify-between">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Applicable Tax & VAT (18%)</span>
                    <span>{formatCurrency(taxAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100 text-sm">
                    <span>Total Due Now</span>
                    <span className="text-blue-600 dark:text-blue-400">{formatCurrency(totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Billed To / Payment Method brief */}
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Billed Entity:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{billingInfo.companyName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Payment:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {paymentType === 'card' ? `Card ${cardInfo.cardNumber}` : `UPI ${upiId}`}
                  </span>
                </div>
              </div>

              {/* Terms checkbox */}
              <label className="flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-300 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                />
                <span>
                  I agree to the BrightLoop SaaS Terms of Service, Master Subscription Agreement, and recurring billing policies.
                </span>
              </label>
            </div>
          )}

          {/* STEP 4: Confirmation */}
          {currentStep === 4 && confirmationData && (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 size={32} className="stroke-[2.5]" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Subscription Active!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Thank you! Your account has been upgraded to {confirmationData.planName}.
                </p>
              </div>

              {/* Order summary box */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Order Reference:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {confirmationData.orderRef}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Tax Invoice #:</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                    {confirmationData.invoiceNumber}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Amount Settled:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrency(confirmationData.amount)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Cadence:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {confirmationData.cadence} Recurring
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400">
                A receipt and onboarding instructions have been dispatched to {billingInfo.email}.
              </p>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          {currentStep === 4 ? (
            <button
              type="button"
              onClick={resetAndClose}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs shadow-xs transition-colors"
            >
              Done &bull; View Subscriptions
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={currentStep === 1 ? resetAndClose : handleBack}
                className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium"
              >
                {currentStep === 1 ? 'Cancel' : 'Back'}
              </button>

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs shadow-xs transition-colors"
                >
                  <span>Continue</span>
                  <ArrowRight size={13} />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!agreedTerms || isSubmitting}
                  onClick={handleConfirmOrder}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white font-semibold rounded-lg text-xs shadow-xs transition-colors"
                >
                  <span>{isSubmitting ? 'Authorizing...' : `Authorize & Pay ${formatCurrency(totalAmount)}`}</span>
                  <Check size={14} className="stroke-[2.5]" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PurchasePlanModal;

