/**
 * BRIGHTLOOP - DISCOUNT CALCULATION & APPLICABILITY SERVICE
 * Decimal-safe arithmetic engine for promo codes and discounts.
 * Follows IEEE 754 epsilon rounding standard.
 */

import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase.js';

/**
 * Decimal-safe rounding to two decimal places.
 * Prevents floating-point representation anomalies (e.g. 19.999999999999996).
 *
 * @param {number} val
 * @returns {number}
 */
export const roundToTwoDecimals = (val) => {
  if (typeof val !== 'number' || isNaN(val)) return 0;
  return Math.round((val + Number.EPSILON) * 100) / 100;
};

/**
 * Normalizes a discount code string:
 * - Trims whitespace
 * - Converts to uppercase
 *
 * @param {string} code
 * @returns {string}
 */
export const normalizeDiscountCode = (code) => {
  if (!code || typeof code !== 'string') return '';
  return code.trim().toUpperCase();
};

/**
 * Reusable core calculation function.
 * Evaluates whether a discount is applicable to transaction details and computes amounts.
 *
 * @param {string|Object} discountOrId - Discount UUID or preloaded discount object
 * @param {Object} transactionDetails - Context for calculation
 * @param {Array<{product_id?: string, plan_id?: string, price: number, quantity: number}>} [transactionDetails.items] - Line items
 * @param {number} [transactionDetails.totalAmount] - Total transaction amount (optional if items provided)
 * @param {number} [transactionDetails.totalQuantity] - Total transaction quantity (optional if items provided)
 * @param {Object} [options] - Options (e.g. custom dbClient)
 * @returns {Promise<Object>} Calculation result
 */
export const calculateDiscount = async (discountOrId, transactionDetails = {}, options = {}) => {
  const db = options.dbClient || supabaseAdmin;

  let discount = null;

  // 1. Resolve discount record
  if (typeof discountOrId === 'string') {
    if (!isSupabaseConfigured() || !db) {
      throw new Error('Supabase client is not configured.');
    }

    const { data, error } = await db
      .from('discounts')
      .select(`
        *,
        discount_products ( product_id )
      `)
      .eq('id', discountOrId)
      .maybeSingle();

    if (error) {
      throw new Error(`Database error fetching discount: ${error.message}`);
    }
    if (!data) {
      return {
        isValid: false,
        error: 'Discount not found.',
        originalAmount: 0,
        eligibleAmount: 0,
        discountAmount: 0,
        finalAmount: 0
      };
    }
    discount = data;
  } else if (typeof discountOrId === 'object' && discountOrId !== null) {
    discount = discountOrId;
  } else {
    return {
      isValid: false,
      error: 'Invalid discount identifier provided.',
      originalAmount: 0,
      eligibleAmount: 0,
      discountAmount: 0,
      finalAmount: 0
    };
  }

  // 2. Validate Active Status
  if (!discount.is_active) {
    return {
      isValid: false,
      error: 'Discount is currently inactive or archived.',
      originalAmount: 0,
      eligibleAmount: 0,
      discountAmount: 0,
      finalAmount: 0,
      discount: formatDiscountSummary(discount)
    };
  }

  // 3. Date Validity (Start Date & End Date)
  const todayStr = new Date().toISOString().split('T')[0];

  if (discount.start_date && discount.start_date > todayStr) {
    return {
      isValid: false,
      error: `Discount is not active yet. Valid starting from ${discount.start_date}.`,
      originalAmount: 0,
      eligibleAmount: 0,
      discountAmount: 0,
      finalAmount: 0,
      discount: formatDiscountSummary(discount)
    };
  }

  if (discount.end_date && discount.end_date < todayStr) {
    return {
      isValid: false,
      error: `Discount expired on ${discount.end_date}.`,
      originalAmount: 0,
      eligibleAmount: 0,
      discountAmount: 0,
      finalAmount: 0,
      discount: formatDiscountSummary(discount)
    };
  }

  // 4. Maximum Usage Limit Check
  if (discount.max_usage !== null && discount.max_usage !== undefined) {
    if (discount.current_usage >= discount.max_usage) {
      return {
        isValid: false,
        error: 'Discount usage limit has been exhausted.',
        originalAmount: 0,
        eligibleAmount: 0,
        discountAmount: 0,
        finalAmount: 0,
        discount: formatDiscountSummary(discount)
      };
    }
  }

  // 5. Compute Transaction Totals from Items or explicit totals
  const items = Array.isArray(transactionDetails.items) ? transactionDetails.items : [];
  let originalAmount = 0;
  let totalQuantity = 0;

  if (items.length > 0) {
    for (const item of items) {
      const q = Math.max(1, parseInt(item.quantity, 10) || 1);
      const p = Math.max(0, parseFloat(item.price) || 0);
      originalAmount += p * q;
      totalQuantity += q;
    }
  } else {
    originalAmount = Math.max(0, parseFloat(transactionDetails.totalAmount) || 0);
    totalQuantity = Math.max(1, parseInt(transactionDetails.totalQuantity, 10) || 1);
  }

  originalAmount = roundToTwoDecimals(originalAmount);

  // 6. Minimum Quantity Check
  const minQty = discount.min_quantity || 1;
  if (totalQuantity < minQty) {
    return {
      isValid: false,
      error: `Order does not meet minimum quantity requirement of ${minQty} unit(s).`,
      originalAmount,
      eligibleAmount: 0,
      discountAmount: 0,
      finalAmount: originalAmount,
      discount: formatDiscountSummary(discount)
    };
  }

  // 7. Minimum Amount Check
  const minAmt = parseFloat(discount.min_amount) || 0;
  if (originalAmount < minAmt) {
    return {
      isValid: false,
      error: `Order total (₹${originalAmount.toFixed(2)}) is below the required minimum amount of ₹${minAmt.toFixed(2)}.`,
      originalAmount,
      eligibleAmount: 0,
      discountAmount: 0,
      finalAmount: originalAmount,
      discount: formatDiscountSummary(discount)
    };
  }

  // 8. Applicability & Eligible Amount Calculation
  // Allowed values in DB: 'all', 'product', 'products', 'plan', 'plans', 'subscription'
  const appliesTo = (discount.applies_to || 'all').toLowerCase();
  let eligibleAmount = 0;

  // Retrieve assigned product IDs from many-to-many relationship or target_id
  const assignedProductIds = new Set();
  if (discount.target_id) assignedProductIds.add(discount.target_id);
  if (Array.isArray(discount.discount_products)) {
    discount.discount_products.forEach((dp) => {
      if (dp.product_id) assignedProductIds.add(dp.product_id);
    });
  }

  if (appliesTo === 'all') {
    // Discount applies to entire transaction
    eligibleAmount = originalAmount;
  } else if (appliesTo === 'product' || appliesTo === 'products') {
    if (items.length === 0) {
      // Single transaction without items list, check if target_id matches context product_id
      if (transactionDetails.productId && assignedProductIds.has(transactionDetails.productId)) {
        eligibleAmount = originalAmount;
      } else {
        return {
          isValid: false,
          error: 'This discount only applies to specific selected products.',
          originalAmount,
          eligibleAmount: 0,
          discountAmount: 0,
          finalAmount: originalAmount,
          discount: formatDiscountSummary(discount)
        };
      }
    } else {
      // Calculate eligible portion only from matching items
      for (const item of items) {
        if (item.product_id && assignedProductIds.has(item.product_id)) {
          const q = Math.max(1, parseInt(item.quantity, 10) || 1);
          const p = Math.max(0, parseFloat(item.price) || 0);
          eligibleAmount += p * q;
        }
      }

      if (eligibleAmount === 0) {
        return {
          isValid: false,
          error: 'None of the items in your order are eligible for this product-specific discount.',
          originalAmount,
          eligibleAmount: 0,
          discountAmount: 0,
          finalAmount: originalAmount,
          discount: formatDiscountSummary(discount)
        };
      }
    }
  } else if (appliesTo === 'plan' || appliesTo === 'plans' || appliesTo === 'subscription') {
    if (items.length === 0) {
      if (transactionDetails.planId && discount.target_id === transactionDetails.planId) {
        eligibleAmount = originalAmount;
      } else if (!discount.target_id) {
        // Blanket subscription discount
        eligibleAmount = originalAmount;
      } else {
        return {
          isValid: false,
          error: 'This discount applies only to a specific subscription plan.',
          originalAmount,
          eligibleAmount: 0,
          discountAmount: 0,
          finalAmount: originalAmount,
          discount: formatDiscountSummary(discount)
        };
      }
    } else {
      for (const item of items) {
        if (!discount.target_id || (item.plan_id && item.plan_id === discount.target_id)) {
          const q = Math.max(1, parseInt(item.quantity, 10) || 1);
          const p = Math.max(0, parseFloat(item.price) || 0);
          eligibleAmount += p * q;
        }
      }

      if (eligibleAmount === 0) {
        return {
          isValid: false,
          error: 'No subscription plans in your order match this discount.',
          originalAmount,
          eligibleAmount: 0,
          discountAmount: 0,
          finalAmount: originalAmount,
          discount: formatDiscountSummary(discount)
        };
      }
    }
  }

  eligibleAmount = roundToTwoDecimals(eligibleAmount);

  // 9. Calculate Discount Deduction Amount
  let rawDiscountAmount = 0;
  const numValue = parseFloat(discount.value) || 0;

  if (discount.type === 'percentage') {
    rawDiscountAmount = (eligibleAmount * numValue) / 100;
  } else {
    // Fixed amount (₹)
    rawDiscountAmount = numValue;
  }

  // Cap discount deduction at eligible amount to prevent negative final pricing
  const discountAmount = Math.min(eligibleAmount, roundToTwoDecimals(rawDiscountAmount));
  const finalAmount = roundToTwoDecimals(Math.max(0, originalAmount - discountAmount));

  return {
    isValid: true,
    error: null,
    originalAmount,
    eligibleAmount,
    discountAmount,
    finalAmount,
    discount: formatDiscountSummary(discount)
  };
};

/**
 * Atomically increments the usage counter of a discount upon confirmed order/payment.
 * Employs row-level condition check to strictly prevent concurrent requests from exceeding max_usage.
 *
 * NOTE: Call this only when an order is finalized/confirmed, NOT merely during quotation code validation.
 *
 * @param {string} discountId
 * @param {Object} [options]
 * @returns {Promise<{success: boolean, current_usage?: number, error?: string}>}
 */
export const applyDiscountUsage = async (discountId, options = {}) => {
  const db = options.dbClient || supabaseAdmin;

  if (!isSupabaseConfigured() || !db) {
    throw new Error('Supabase client is not configured.');
  }

  // 1. Fetch current record to check constraints
  const { data: discount, error: fetchErr } = await db
    .from('discounts')
    .select('id, code, max_usage, current_usage, is_active, start_date, end_date')
    .eq('id', discountId)
    .single();

  if (fetchErr || !discount) {
    return { success: false, error: 'Discount not found.' };
  }

  if (!discount.is_active) {
    return { success: false, error: 'Discount is inactive.' };
  }

  const todayStr = new Date().toISOString().split('T')[0];
  if (discount.start_date && discount.start_date > todayStr) {
    return { success: false, error: 'Discount is not yet active.' };
  }
  if (discount.end_date && discount.end_date < todayStr) {
    return { success: false, error: 'Discount has expired.' };
  }

  if (discount.max_usage !== null && discount.current_usage >= discount.max_usage) {
    return { success: false, error: 'Discount usage limit reached.' };
  }

  // 2. Atomic Increment with conditional WHERE clause
  const nextUsage = discount.current_usage + 1;

  let query = db
    .from('discounts')
    .update({
      current_usage: nextUsage,
      updated_at: new Date().toISOString()
    })
    .eq('id', discountId)
    .eq('current_usage', discount.current_usage); // Optimistic concurrency check

  if (discount.max_usage !== null) {
    query = query.lt('current_usage', discount.max_usage);
  }

  const { data: updated, error: updateErr } = await query.select('current_usage').maybeSingle();

  if (updateErr) {
    console.error('[applyDiscountUsage] Error updating usage:', updateErr.message);
    return { success: false, error: 'Failed to record discount usage.' };
  }

  if (!updated) {
    return {
      success: false,
      error: 'Discount usage limit exceeded concurrently by another transaction.'
    };
  }

  return {
    success: true,
    current_usage: updated.current_usage
  };
};

/**
 * Clean snapshot formatter for client responses and invoice records.
 */
function formatDiscountSummary(discount) {
  const numValue = parseFloat(discount.value) || 0;
  return {
    id: discount.id,
    code: discount.code,
    type: discount.type,
    value: numValue,
    display_value: discount.type === 'percentage' ? `${numValue}%` : `₹${numValue.toFixed(2)}`,
    applies_to: discount.applies_to,
    target_id: discount.target_id || null,
    min_quantity: discount.min_quantity || 1,
    min_amount: parseFloat(discount.min_amount) || 0,
    start_date: discount.start_date || null,
    end_date: discount.end_date || null,
    max_usage: discount.max_usage || null,
    current_usage: discount.current_usage || 0,
    is_active: discount.is_active !== false
  };
}

