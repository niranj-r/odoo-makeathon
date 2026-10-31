/**
 * Financial Engine Calculator & Billing Period Mathematics
 * Member 3: Invoices, Billing Scheduler & Payment Engine
 */

/**
 * Rounds a numeric value strictly to 2 decimal places with currency precision.
 */
export const roundToTwo = (num) => {
  return Math.round((Number(num) + Number.EPSILON) * 100) / 100;
};

/**
 * Normalizes any date input to ISO 'YYYY-MM-DD' format.
 */
export const formatDateOnly = (dateInput) => {
  const d = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(d.getTime())) {
    throw new Error(`Invalid date string: ${dateInput}`);
  }
  return d.toISOString().split('T')[0];
};

/**
 * Advances a date by a given billing frequency.
 * Supported frequencies: 'daily', 'weekly', 'monthly', 'yearly'.
 */
export const advanceDateByFrequency = (dateInput, frequency, count = 1) => {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid base date: ${dateInput}`);
  }

  const d = new Date(date.getTime());
  const freq = (frequency || '').toLowerCase().trim();

  switch (freq) {
    case 'daily':
      d.setDate(d.getDate() + count);
      break;
    case 'weekly':
      d.setDate(d.getDate() + (7 * count));
      break;
    case 'monthly': {
      const targetMonth = d.getMonth() + count;
      const originalDay = d.getDate();
      d.setMonth(targetMonth);
      // Handle month rollover (e.g., Jan 31 + 1 month -> Feb 28/29)
      if (d.getDate() !== originalDay) {
        d.setDate(0); // set to last day of previous month
      }
      break;
    }
    case 'yearly': {
      const originalMonth = d.getMonth();
      const targetYear = d.getFullYear() + count;
      d.setFullYear(targetYear);
      // Handle leap year rollover
      if (d.getMonth() !== originalMonth) {
        d.setDate(0);
      }
      break;
    }
    default:
      throw new Error(`Unsupported billing frequency: "${frequency}". Expected 'daily', 'weekly', 'monthly', or 'yearly'.`);
  }

  return formatDateOnly(d);
};

/**
 * Calculates the exact billing cycle start and end dates based on frequency.
 * - daily: [start, start]
 * - weekly: [start, start + 6 days]
 * - monthly: [start, (start + 1 month) - 1 day]
 * - yearly: [start, (start + 1 year) - 1 day]
 * 
 * Also calculates next_billing_date = end_date + 1 day
 */
export const calculateBillingPeriod = (frequency, startDateInput) => {
  const startDateStr = formatDateOnly(startDateInput || new Date());
  const startDate = new Date(startDateStr);

  const freq = (frequency || 'monthly').toLowerCase().trim();
  let endDateStr;
  let nextBillingDateStr;

  switch (freq) {
    case 'daily': {
      endDateStr = startDateStr;
      const nextDate = new Date(startDate);
      nextDate.setDate(nextDate.getDate() + 1);
      nextBillingDateStr = formatDateOnly(nextDate);
      break;
    }
    case 'weekly': {
      const endD = new Date(startDate);
      endD.setDate(endD.getDate() + 6);
      endDateStr = formatDateOnly(endD);

      const nextD = new Date(startDate);
      nextD.setDate(nextD.getDate() + 7);
      nextBillingDateStr = formatDateOnly(nextD);
      break;
    }
    case 'monthly': {
      const nextD = new Date(startDate);
      const originalDay = startDate.getDate();
      nextD.setMonth(nextD.getMonth() + 1);
      if (nextD.getDate() !== originalDay) {
        nextD.setDate(0);
      }
      nextBillingDateStr = formatDateOnly(nextD);

      // End date is 1 day before the next billing date
      const endD = new Date(nextBillingDateStr);
      endD.setDate(endD.getDate() - 1);
      endDateStr = formatDateOnly(endD);
      break;
    }
    case 'yearly': {
      const nextD = new Date(startDate);
      const originalMonth = startDate.getMonth();
      nextD.setFullYear(nextD.getFullYear() + 1);
      if (nextD.getMonth() !== originalMonth) {
        nextD.setDate(0);
      }
      nextBillingDateStr = formatDateOnly(nextD);

      // End date is 1 day before the next billing date
      const endD = new Date(nextBillingDateStr);
      endD.setDate(endD.getDate() - 1);
      endDateStr = formatDateOnly(endD);
      break;
    }
    default:
      throw new Error(`Unsupported billing frequency: "${frequency}"`);
  }

  return {
    periodStart: startDateStr,
    periodEnd: endDateStr,
    nextBillingDate: nextBillingDateStr
  };
};

/**
 * Calculates Line Item Financials
 */
export const calculateInvoiceLine = (quantity, unitPrice, taxPercentage = 0) => {
  const qty = parseInt(quantity, 10);
  if (isNaN(qty) || qty <= 0) {
    throw new Error('Quantity must be an integer >= 1');
  }

  const price = roundToTwo(unitPrice);
  if (price < 0) {
    throw new Error('Unit price must be >= 0');
  }

  const taxPct = roundToTwo(taxPercentage || 0);
  if (taxPct < 0) {
    throw new Error('Tax percentage must be >= 0');
  }

  const lineSubtotal = roundToTwo(qty * price);
  const lineTax = roundToTwo(lineSubtotal * (taxPct / 100));
  const lineTotal = roundToTwo(lineSubtotal + lineTax);

  return {
    quantity: qty,
    unitPrice: price,
    taxPercentage: taxPct,
    lineSubtotal,
    lineTax,
    lineTotal
  };
};

/**
 * Calculates Grand Totals from Line Items
 */
export const calculateInvoiceTotals = (lines = [], discountAmount = 0) => {
  if (!Array.isArray(lines) || lines.length === 0) {
    throw new Error('Invoice must contain at least one line item.');
  }

  let subtotal = 0;
  let taxAmount = 0;

  const calculatedLines = lines.map((line, index) => {
    const calc = calculateInvoiceLine(
      line.quantity,
      line.unit_price ?? line.unitPrice ?? 0,
      line.tax_percentage_snapshot ?? line.taxPercentage ?? 0
    );
    subtotal += calc.lineSubtotal;
    taxAmount += calc.lineTax;

    return {
      ...line,
      line_subtotal: calc.lineSubtotal,
      line_tax: calc.lineTax,
      line_total: calc.lineTotal
    };
  });

  subtotal = roundToTwo(subtotal);
  taxAmount = roundToTwo(taxAmount);

  const discount = Math.min(roundToTwo(discountAmount || 0), subtotal);
  const taxableBase = Math.max(0, subtotal - discount);
  const grandTotal = roundToTwo(taxableBase + taxAmount);

  return {
    subtotal,
    discountAmount: discount,
    taxAmount,
    grandTotal,
    lines: calculatedLines
  };
};

/**
 * Payment Allocation & Status Machine Logic
 * Calculates new amount paid, outstanding balance, and resulting statuses.
 */
export const calculatePaymentAllocation = (grandTotal, currentAmountPaid, newPaymentAmount) => {
  const total = roundToTwo(grandTotal || 0);
  const alreadyPaid = roundToTwo(currentAmountPaid || 0);
  const payment = roundToTwo(newPaymentAmount || 0);

  if (payment <= 0) {
    throw new Error('Payment amount must be greater than zero.');
  }

  const currentOutstanding = roundToTwo(Math.max(0, total - alreadyPaid));

  if (payment > currentOutstanding + 0.001) {
    throw new Error(
      `Payment amount ($${payment.toFixed(2)}) exceeds outstanding balance ($${currentOutstanding.toFixed(2)}).`
    );
  }

  const newAmountPaid = roundToTwo(alreadyPaid + payment);
  const newOutstanding = roundToTwo(Math.max(0, total - newAmountPaid));

  let paymentStatus = 'UNPAID';
  let invoiceStatus = 'CONFIRMED';

  if (newOutstanding <= 0.009) {
    paymentStatus = 'PAID';
    invoiceStatus = 'PAID';
  } else if (newAmountPaid > 0) {
    paymentStatus = 'PARTIALLY_PAID';
    invoiceStatus = 'CONFIRMED';
  }

  return {
    total,
    alreadyPaid,
    paymentAmount: payment,
    newAmountPaid,
    newOutstanding,
    paymentStatus,
    invoiceStatus
  };
};

