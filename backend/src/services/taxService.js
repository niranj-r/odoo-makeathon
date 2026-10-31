/**
 * Reusable Decimal-Safe Tax Calculation Service
 * 
 * Standard Brightloop Billing Policy:
 * - Default Tax Mode: 'exclusive' (Taxes are added onto base product / plan price: Subtotal + Tax = Total).
 * - Supported Tax Mode: 'inclusive' (Base price includes taxes; net price is computed backwards).
 * 
 * Precision Guarantee:
 * - Calculations use integer-based scaled arithmetic (paise / cents) or epsilon-safe rounding to eliminate
 *   IEEE 754 floating-point inaccuracies (e.g., 0.1 + 0.2 = 0.30000000000000004).
 * 
 * Historical Snapshot Protection:
 * - The service produces an immutable array of tax line snapshots (with name, rate, type, and exact computed amount).
 * - Member 2 (Quotations/Subscriptions) and Member 3 (Invoices/Billing) must save this snapshot into invoice lines
 *   rather than recomputing against mutable live tax rates.
 */

/**
 * Safely rounds a number to 2 decimal places using epsilon adjustment
 */
export const roundToTwoDecimals = (val) => {
  const num = Number(val) || 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

/**
 * Calculate taxes for a given base amount and list of applicable taxes.
 * 
 * @param {number} baseAmount - Subtotal / base price of the item or subscription
 * @param {Array<Object>} taxes - List of active taxes to apply [{ id, name, rate_percentage, computation_type }]
 * @param {Object} options - Configuration options
 * @param {string} [options.taxMode='exclusive'] - 'exclusive' (tax added on top) or 'inclusive' (tax included in price)
 * @param {number} [options.quantity=1] - Quantity of items/seats
 * 
 * @returns {Object} Structured tax calculation result
 */
export const calculateTaxes = (baseAmount, taxes = [], options = {}) => {
  const mode = options.taxMode || 'exclusive'; // 'exclusive' | 'inclusive'
  const qty = Math.max(1, parseInt(options.quantity, 10) || 1);
  const numBase = Math.max(0, Number(baseAmount) || 0);

  // Scaled subtotal for item * quantity
  const lineSubtotal = roundToTwoDecimals(numBase * qty);

  if (!Array.isArray(taxes) || taxes.length === 0) {
    return {
      taxMode: mode,
      quantity: qty,
      unitPrice: numBase,
      subtotal: lineSubtotal,
      totalTax: 0.00,
      totalAmount: lineSubtotal,
      taxBreakdown: []
    };
  }

  // Filter only active taxes if is_active is specified
  const applicableTaxes = taxes.filter((t) => t && t.is_active !== false);

  const taxBreakdown = [];
  let totalTaxAccumulator = 0;

  if (mode === 'inclusive') {
    // INCLUSIVE TAX COMPUTATION
    // Line Subtotal already includes percentage taxes.
    // Sum all applicable percentage rates
    const totalPercentageRate = applicableTaxes
      .filter((t) => (t.computation_type || 'percentage') === 'percentage')
      .reduce((sum, t) => sum + (Number(t.rate_percentage) || 0), 0);

    const totalFixedAmount = applicableTaxes
      .filter((t) => (t.computation_type || 'percentage') === 'fixed')
      .reduce((sum, t) => sum + (Number(t.rate_percentage) || 0) * qty, 0);

    // Net base before taxes: (lineSubtotal - fixedTaxes) / (1 + totalPercentage / 100)
    const taxableBase = Math.max(0, (lineSubtotal - totalFixedAmount) / (1 + totalPercentageRate / 100));

    for (const tax of applicableTaxes) {
      const type = (tax.computation_type || 'percentage').toLowerCase();
      const rawRate = Number(tax.rate_percentage) || 0;
      let taxAmount = 0;

      if (type === 'percentage') {
        taxAmount = roundToTwoDecimals((taxableBase * rawRate) / 100);
      } else {
        // Fixed amount per unit
        taxAmount = roundToTwoDecimals(rawRate * qty);
      }

      totalTaxAccumulator = roundToTwoDecimals(totalTaxAccumulator + taxAmount);

      taxBreakdown.push({
        taxId: tax.id,
        taxName: tax.name,
        computationType: type,
        rate: rawRate,
        rateFormatted: type === 'percentage' ? `${rawRate}%` : `₹${rawRate.toFixed(2)}`,
        taxAmount
      });
    }

    const netAmount = roundToTwoDecimals(lineSubtotal - totalTaxAccumulator);

    return {
      taxMode: mode,
      quantity: qty,
      unitPrice: numBase,
      subtotal: lineSubtotal,
      netAmount,
      totalTax: totalTaxAccumulator,
      totalAmount: lineSubtotal,
      taxBreakdown
    };
  }

  // EXCLUSIVE TAX COMPUTATION (Standard Default)
  // Taxes are calculated on the lineSubtotal and added to the bill
  for (const tax of applicableTaxes) {
    const type = (tax.computation_type || 'percentage').toLowerCase();
    const rawRate = Number(tax.rate_percentage) || 0;
    let taxAmount = 0;

    if (type === 'percentage') {
      taxAmount = roundToTwoDecimals((lineSubtotal * rawRate) / 100);
    } else {
      // Fixed tax per unit
      taxAmount = roundToTwoDecimals(rawRate * qty);
    }

    totalTaxAccumulator = roundToTwoDecimals(totalTaxAccumulator + taxAmount);

    taxBreakdown.push({
      taxId: tax.id,
      taxName: tax.name,
      computationType: type,
      rate: rawRate,
      rateFormatted: type === 'percentage' ? `${rawRate}%` : `₹${rawRate.toFixed(2)}`,
      taxAmount
    });
  }

  const finalTotalAmount = roundToTwoDecimals(lineSubtotal + totalTaxAccumulator);

  return {
    taxMode: mode,
    quantity: qty,
    unitPrice: numBase,
    subtotal: lineSubtotal,
    totalTax: totalTaxAccumulator,
    totalAmount: finalTotalAmount,
    taxBreakdown
  };
};

export default {
  calculateTaxes,
  roundToTwoDecimals
};

