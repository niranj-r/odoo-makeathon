/**
 * Financial Calculation Engine (VULN-001 Prevention)
 * Guarantees zero-trust on client calculations.
 * All subtotals, tax rates, discounts, and grand totals are computed server-side.
 */

// Round to 2 decimal places safely without floating point inaccuracies
export const roundToTwo = (num) => {
  return +(Math.round(Number(num) + 'e+2') + 'e-2');
};

/**
 * Calculate totals for a single line item
 * @param {number} quantity - Quantity of items (>= 1)
 * @param {number} unitPrice - Authoritative unit price
 * @param {number} taxRate - Tax percentage (e.g. 18 for 18%)
 */
export const calculateLineItem = (quantity, unitPrice, taxRate = 0) => {
  const qty = Math.max(1, parseInt(quantity, 10) || 1);
  const price = Math.max(0, parseFloat(unitPrice) || 0);
  const tax = Math.max(0, parseFloat(taxRate) || 0);

  const lineSubtotal = roundToTwo(qty * price);
  const lineTax = roundToTwo(lineSubtotal * (tax / 100));
  const lineTotal = roundToTwo(lineSubtotal + lineTax);

  return {
    quantity: qty,
    unitPrice: price,
    taxRate: tax,
    lineSubtotal,
    lineTax,
    lineTotal
  };
};

/**
 * Aggregate multiple line items into quotation totals
 * @param {Array} calculatedLines - Array of results from calculateLineItem
 * @param {number} discountInput - Optional flat discount amount
 */
export const calculateQuotationTotals = (calculatedLines = [], discountInput = 0) => {
  let subtotal = 0;
  let taxAmount = 0;

  for (const line of calculatedLines) {
    subtotal = roundToTwo(subtotal + line.lineSubtotal);
    taxAmount = roundToTwo(taxAmount + line.lineTax);
  }

  const rawDiscount = Math.max(0, parseFloat(discountInput) || 0);
  // Discount cannot exceed subtotal
  const discountAmount = roundToTwo(Math.min(subtotal, rawDiscount));

  const grandTotal = roundToTwo(Math.max(0, subtotal - discountAmount + taxAmount));

  return {
    subtotal,
    discountAmount,
    taxAmount,
    grandTotal
  };
};

