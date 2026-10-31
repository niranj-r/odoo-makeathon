/**
 * BRIGHTLOOP - DISCOUNT MANAGEMENT CONTROLLER
 * REST API handlers for managing promo codes, discounts, and validation.
 */

import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase.js';
import {
  calculateDiscount,
  roundToTwoDecimals,
  normalizeDiscountCode
} from '../services/discountService.js';

// UUID validation regex (v4 standard)
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isValidUUID = (id) => typeof id === 'string' && UUID_REGEX.test(id);

/**
 * Format a database discount row for client responses
 */
const formatDiscount = (d) => {
  const numVal = parseFloat(d.value) || 0;
  return {
    id: d.id,
    code: d.code,
    type: d.type,
    value: numVal,
    display_value: d.type === 'percentage' ? `${numVal}%` : `₹${numVal.toFixed(2)}`,
    min_quantity: d.min_quantity !== null && d.min_quantity !== undefined ? d.min_quantity : 1,
    min_amount: parseFloat(d.min_amount) || 0,
    start_date: d.start_date || null,
    end_date: d.end_date || null,
    max_usage: d.max_usage !== null && d.max_usage !== undefined ? d.max_usage : null,
    current_usage: d.current_usage || 0,
    applies_to: d.applies_to || 'all',
    target_id: d.target_id || null,
    is_active: d.is_active !== false,
    created_at: d.created_at,
    updated_at: d.updated_at
  };
};

/**
 * GET /api/discounts
 * List discounts with search, filters (type, applicability, status), and pagination.
 */
export const listDiscounts = async (req, res, next) => {
  try {
    if (!isSupabaseConfigured() || !supabaseAdmin) {
      return res.status(503).json({
        success: false,
        message: 'Backend Supabase connection is not configured in .env'
      });
    }

    const {
      search,
      type,
      applies_to,
      status,
      page = 1,
      limit = 10,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    const db = req.userClient || supabaseAdmin;

    let query = db.from('discounts').select('*', { count: 'exact' });

    // Search by discount code
    if (search && search.trim()) {
      const cleanSearch = search.trim();
      query = query.ilike('code', `%${cleanSearch}%`);
    }

    // Filter by type (percentage, fixed)
    if (type) {
      const normType = type.trim().toLowerCase();
      if (['percentage', 'fixed'].includes(normType)) {
        query = query.eq('type', normType);
      }
    }

    // Filter by applicability (all, product, plan)
    if (applies_to) {
      const normApplies = applies_to.trim().toLowerCase();
      if (['all', 'product', 'products', 'plan', 'plans', 'subscription'].includes(normApplies)) {
        if (normApplies === 'product' || normApplies === 'products') {
          query = query.in('applies_to', ['product', 'products']);
        } else if (normApplies === 'plan' || normApplies === 'plans') {
          query = query.in('applies_to', ['plan', 'plans']);
        } else {
          query = query.eq('applies_to', normApplies);
        }
      }
    }

    // Filter by status (active, inactive)
    if (status) {
      const lowerStatus = status.trim().toLowerCase();
      if (lowerStatus === 'active' || lowerStatus === 'true') {
        query = query.eq('is_active', true);
      } else if (lowerStatus === 'inactive' || lowerStatus === 'false') {
        query = query.eq('is_active', false);
      }
    } else if (req.user?.role === 'CUSTOMER') {
      // Customers should only view active discounts
      query = query.eq('is_active', true);
    }

    // Sorting
    const validSortFields = ['code', 'type', 'value', 'current_usage', 'created_at', 'start_date', 'end_date'];
    const safeSortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const isAscending = sortOrder.toLowerCase() === 'asc';

    query = query.order(safeSortField, { ascending: isAscending }).range(offset, offset + limitNum - 1);

    const { data, count, error } = await query;

    if (error) {
      console.error('[listDiscounts] Database error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve discounts from database.',
        error: error.message
      });
    }

    const discounts = (data || []).map(formatDiscount);
    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limitNum) || 1;

    return res.status(200).json({
      success: true,
      discounts,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/discounts/:id
 * Retrieve details for a single discount with associated products and plan targets.
 */
export const getDiscountById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid discount ID format. Expected a standard UUID.'
      });
    }

    if (!isSupabaseConfigured() || !supabaseAdmin) {
      return res.status(503).json({
        success: false,
        message: 'Backend Supabase connection is not configured in .env'
      });
    }

    const db = req.userClient || supabaseAdmin;

    const { data: discount, error } = await db
      .from('discounts')
      .select(`
        *,
        discount_products (
          id,
          product_id,
          products (
            id,
            name,
            sales_price,
            is_active
          )
        )
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('[getDiscountById] Error fetching discount:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Database error fetching discount details.',
        error: error.message
      });
    }

    if (!discount) {
      return res.status(404).json({
        success: false,
        message: `Discount with ID "${id}" was not found.`
      });
    }

    // If target_id exists and discount applies to plan, optionally fetch plan details
    let targetPlan = null;
    let targetProduct = null;

    if (discount.target_id) {
      if (['plan', 'plans'].includes(discount.applies_to)) {
        const { data: plan } = await db
          .from('subscription_plans')
          .select('id, name, billing_interval, price, is_active')
          .eq('id', discount.target_id)
          .maybeSingle();
        targetPlan = plan;
      } else if (['product', 'products'].includes(discount.applies_to)) {
        const { data: prod } = await db
          .from('products')
          .select('id, name, sales_price, is_active')
          .eq('id', discount.target_id)
          .maybeSingle();
        targetProduct = prod;
      }
    }

    const associatedProducts = (discount.discount_products || []).map((dp) => ({
      mapping_id: dp.id,
      product_id: dp.product_id,
      product_name: dp.products?.name || 'Unknown Product',
      sales_price: dp.products?.sales_price || 0,
      is_active: dp.products?.is_active !== false
    }));

    return res.status(200).json({
      success: true,
      discount: {
        ...formatDiscount(discount),
        associated_products: associatedProducts,
        target_plan: targetPlan,
        target_product: targetProduct
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/discounts
 * Create a new discount code.
 * Restricted to ADMIN role only.
 */
export const createDiscount = async (req, res, next) => {
  try {
    if (!isSupabaseConfigured() || !supabaseAdmin) {
      return res.status(503).json({
        success: false,
        message: 'Backend Supabase connection is not configured in .env'
      });
    }

    const {
      code,
      type,
      value,
      min_quantity = 1,
      min_amount = 0.0,
      start_date,
      end_date,
      max_usage,
      applies_to = 'all',
      target_id,
      product_ids,
      is_active = true
    } = req.body;

    // 1. Validate Code
    if (!code || typeof code !== 'string' || !code.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Discount code is required.'
      });
    }

    const normalizedCode = normalizeDiscountCode(code);
    if (normalizedCode.length < 2 || normalizedCode.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Discount code must be between 2 and 50 characters.'
      });
    }

    // Disallow whitespace or punctuation characters other than hyphen/underscore
    if (!/^[A-Z0-9_-]+$/.test(normalizedCode)) {
      return res.status(400).json({
        success: false,
        message: 'Discount code can only contain letters, numbers, hyphens, and underscores.'
      });
    }

    // 2. Validate Type
    if (!type || !['percentage', 'fixed'].includes(type.trim().toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Discount type must be either "percentage" or "fixed".'
      });
    }
    const cleanType = type.trim().toLowerCase();

    // 3. Validate Value
    if (value === undefined || value === null || isNaN(Number(value))) {
      return res.status(400).json({
        success: false,
        message: 'Discount value is required and must be a valid number.'
      });
    }

    const numValue = parseFloat(value);
    if (numValue <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Discount value must be greater than zero.'
      });
    }

    if (cleanType === 'percentage' && numValue > 100) {
      return res.status(400).json({
        success: false,
        message: 'Percentage discount cannot exceed 100%.'
      });
    }

    // 4. Validate Min Quantity & Min Amount
    const numMinQty = min_quantity !== undefined && min_quantity !== null ? parseInt(min_quantity, 10) : 1;
    if (isNaN(numMinQty) || numMinQty < 1) {
      return res.status(400).json({
        success: false,
        message: 'Minimum quantity must be an integer greater than or equal to 1.'
      });
    }

    const numMinAmt = min_amount !== undefined && min_amount !== null ? parseFloat(min_amount) : 0;
    if (isNaN(numMinAmt) || numMinAmt < 0) {
      return res.status(400).json({
        success: false,
        message: 'Minimum transaction amount cannot be negative.'
      });
    }

    // 5. Validate Dates
    let cleanStartDate = null;
    let cleanEndDate = null;

    if (start_date) {
      if (isNaN(Date.parse(start_date))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid start date format. Expected YYYY-MM-DD.'
        });
      }
      cleanStartDate = new Date(start_date).toISOString().split('T')[0];
    }

    if (end_date) {
      if (isNaN(Date.parse(end_date))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid end date format. Expected YYYY-MM-DD.'
        });
      }
      cleanEndDate = new Date(end_date).toISOString().split('T')[0];
    }

    if (cleanStartDate && cleanEndDate && cleanEndDate < cleanStartDate) {
      return res.status(400).json({
        success: false,
        message: 'End date cannot be earlier than start date.'
      });
    }

    // 6. Validate Max Usage
    let cleanMaxUsage = null;
    if (max_usage !== undefined && max_usage !== null && max_usage !== '') {
      const parsedMax = parseInt(max_usage, 10);
      if (isNaN(parsedMax) || parsedMax <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Maximum usage limit must be a positive integer greater than 0.'
        });
      }
      cleanMaxUsage = parsedMax;
    }

    // 7. Validate Applicability
    const normApplies = applies_to ? applies_to.trim().toLowerCase() : 'all';
    if (!['all', 'product', 'products', 'plan', 'plans', 'subscription'].includes(normApplies)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid applies_to value. Supported values: all, product, plan.'
      });
    }

    // Map to DB-safe singular values ('all', 'product', 'plan')
    const dbAppliesTo = ['product', 'products'].includes(normApplies)
      ? 'product'
      : ['plan', 'plans', 'subscription'].includes(normApplies)
      ? 'plan'
      : 'all';

    let cleanTargetId = null;
    if (target_id) {
      if (!isValidUUID(target_id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid target_id format. Expected a standard UUID.'
        });
      }
      cleanTargetId = target_id;
    }

    const db = req.userClient || supabaseAdmin;

    // 8. Check for Code Uniqueness
    const { data: existing, error: checkErr } = await db
      .from('discounts')
      .select('id')
      .ilike('code', normalizedCode)
      .maybeSingle();

    if (checkErr) {
      console.error('[createDiscount] Error checking code uniqueness:', checkErr.message);
      return res.status(500).json({
        success: false,
        message: 'Database error checking discount code availability.'
      });
    }

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Discount code "${normalizedCode}" already exists. Please choose a unique code.`
      });
    }

    // 9. Insert Discount Record
    const insertPayload = {
      code: normalizedCode,
      type: cleanType,
      value: roundToTwoDecimals(numValue),
      min_quantity: numMinQty,
      min_amount: roundToTwoDecimals(numMinAmt),
      start_date: cleanStartDate,
      end_date: cleanEndDate,
      max_usage: cleanMaxUsage,
      current_usage: 0,
      applies_to: dbAppliesTo,
      target_id: cleanTargetId,
      is_active: is_active !== false
    };

    const { data: newDiscount, error: insertErr } = await db
      .from('discounts')
      .insert(insertPayload)
      .select('*')
      .single();

    if (insertErr) {
      console.error('[createDiscount] Database insert error:', insertErr.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to create discount record in database.',
        error: insertErr.message
      });
    }

    // 10. Associate Multiple Products if provided
    if (dbAppliesTo === 'product' && Array.isArray(product_ids) && product_ids.length > 0) {
      const validProductIds = [...new Set(product_ids.filter(isValidUUID))];
      if (validProductIds.length > 0) {
        const mappings = validProductIds.map((pId) => ({
          discount_id: newDiscount.id,
          product_id: pId
        }));

        const { error: mapErr } = await db.from('discount_products').insert(mappings);
        if (mapErr) {
          console.warn('[createDiscount] Warning saving discount_products mappings:', mapErr.message);
        }
      }
    }

    return res.status(201).json({
      success: true,
      message: `Discount "${normalizedCode}" created successfully.`,
      discount: formatDiscount(newDiscount)
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/discounts/:id
 * Update an existing discount record.
 * Restricted to ADMIN role only.
 */
export const updateDiscount = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid discount ID format. Expected a standard UUID.'
      });
    }

    if (!isSupabaseConfigured() || !supabaseAdmin) {
      return res.status(503).json({
        success: false,
        message: 'Backend Supabase connection is not configured in .env'
      });
    }

    const db = req.userClient || supabaseAdmin;

    // Check discount existence
    const { data: existingDiscount, error: fetchErr } = await db
      .from('discounts')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr) {
      return res.status(500).json({
        success: false,
        message: 'Error retrieving discount to update.'
      });
    }

    if (!existingDiscount) {
      return res.status(404).json({
        success: false,
        message: `Discount with ID "${id}" does not exist.`
      });
    }

    const {
      code,
      type,
      value,
      min_quantity,
      min_amount,
      start_date,
      end_date,
      max_usage,
      applies_to,
      target_id,
      product_ids,
      is_active
    } = req.body;

    const updatePayload = {
      updated_at: new Date().toISOString()
    };

    // 1. Code update
    if (code !== undefined) {
      if (typeof code !== 'string' || !code.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Discount code cannot be empty.'
        });
      }
      const normalizedCode = normalizeDiscountCode(code);
      if (normalizedCode.length < 2 || normalizedCode.length > 50 || !/^[A-Z0-9_-]+$/.test(normalizedCode)) {
        return res.status(400).json({
          success: false,
          message: 'Discount code must be 2-50 alphanumeric characters (hyphen/underscore allowed).'
        });
      }

      // Check duplicate code if changed
      if (normalizedCode !== existingDiscount.code) {
        const { data: dupCheck } = await db
          .from('discounts')
          .select('id')
          .ilike('code', normalizedCode)
          .neq('id', id)
          .maybeSingle();

        if (dupCheck) {
          return res.status(409).json({
            success: false,
            message: `Discount code "${normalizedCode}" is already in use by another discount.`
          });
        }
      }
      updatePayload.code = normalizedCode;
    }

    // 2. Type update
    const currentType = type !== undefined ? type.trim().toLowerCase() : existingDiscount.type;
    if (type !== undefined) {
      if (!['percentage', 'fixed'].includes(currentType)) {
        return res.status(400).json({
          success: false,
          message: 'Discount type must be either "percentage" or "fixed".'
        });
      }
      updatePayload.type = currentType;
    }

    // 3. Value update
    if (value !== undefined) {
      const numVal = parseFloat(value);
      if (isNaN(numVal) || numVal <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Discount value must be a valid positive number.'
        });
      }
      if (currentType === 'percentage' && numVal > 100) {
        return res.status(400).json({
          success: false,
          message: 'Percentage discount cannot exceed 100%.'
        });
      }
      updatePayload.value = roundToTwoDecimals(numVal);
    }

    // 4. Min Quantity & Amount
    if (min_quantity !== undefined) {
      const numMinQty = min_quantity !== null && min_quantity !== '' ? parseInt(min_quantity, 10) : 1;
      if (isNaN(numMinQty) || numMinQty < 1) {
        return res.status(400).json({
          success: false,
          message: 'Minimum quantity must be an integer >= 1.'
        });
      }
      updatePayload.min_quantity = numMinQty;
    }

    if (min_amount !== undefined) {
      const numMinAmt = min_amount !== null && min_amount !== '' ? parseFloat(min_amount) : 0;
      if (isNaN(numMinAmt) || numMinAmt < 0) {
        return res.status(400).json({
          success: false,
          message: 'Minimum amount cannot be negative.'
        });
      }
      updatePayload.min_amount = roundToTwoDecimals(numMinAmt);
    }

    // 5. Dates
    let effStartDate = existingDiscount.start_date;
    let effEndDate = existingDiscount.end_date;

    if (start_date !== undefined) {
      effStartDate = start_date ? new Date(start_date).toISOString().split('T')[0] : null;
      updatePayload.start_date = effStartDate;
    }

    if (end_date !== undefined) {
      effEndDate = end_date ? new Date(end_date).toISOString().split('T')[0] : null;
      updatePayload.end_date = effEndDate;
    }

    if (effStartDate && effEndDate && effEndDate < effStartDate) {
      return res.status(400).json({
        success: false,
        message: 'End date cannot be earlier than start date.'
      });
    }

    // 6. Max Usage
    if (max_usage !== undefined) {
      if (max_usage === null || max_usage === '') {
        updatePayload.max_usage = null;
      } else {
        const parsedMax = parseInt(max_usage, 10);
        if (isNaN(parsedMax) || parsedMax <= 0) {
          return res.status(400).json({
            success: false,
            message: 'Max usage must be greater than 0.'
          });
        }
        updatePayload.max_usage = parsedMax;
      }
    }

    // 7. Applicability & Target
    if (applies_to !== undefined) {
      const normApplies = applies_to.trim().toLowerCase();
      if (!['all', 'product', 'products', 'plan', 'plans', 'subscription'].includes(normApplies)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid applicability type.'
        });
      }
      updatePayload.applies_to = ['product', 'products'].includes(normApplies)
        ? 'product'
        : ['plan', 'plans', 'subscription'].includes(normApplies)
        ? 'plan'
        : 'all';
    }

    if (target_id !== undefined) {
      if (target_id && !isValidUUID(target_id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid target_id UUID format.'
        });
      }
      updatePayload.target_id = target_id || null;
    }

    if (is_active !== undefined) {
      updatePayload.is_active = Boolean(is_active);
    }

    // 8. Execute Update
    const { data: updatedDiscount, error: updateErr } = await db
      .from('discounts')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single();

    if (updateErr) {
      console.error('[updateDiscount] Database update error:', updateErr.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to update discount.',
        error: updateErr.message
      });
    }

    // 9. Sync product_ids if provided
    if (Array.isArray(product_ids)) {
      // Clear existing and re-insert
      await db.from('discount_products').delete().eq('discount_id', id);

      const validPIds = [...new Set(product_ids.filter(isValidUUID))];
      if (validPIds.length > 0) {
        const mappings = validPIds.map((pId) => ({
          discount_id: id,
          product_id: pId
        }));
        await db.from('discount_products').insert(mappings);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Discount "${updatedDiscount.code}" updated successfully.`,
      discount: formatDiscount(updatedDiscount)
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/discounts/:id/status
 * Soft activate or deactivate a discount code.
 * Restricted to ADMIN role only.
 */
export const updateDiscountStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid discount ID format. Expected a standard UUID.'
      });
    }

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Request body must include a boolean "is_active" property.'
      });
    }

    if (!isSupabaseConfigured() || !supabaseAdmin) {
      return res.status(503).json({
        success: false,
        message: 'Backend Supabase connection is not configured in .env'
      });
    }

    const db = req.userClient || supabaseAdmin;

    const { data: updated, error } = await db
      .from('discounts')
      .update({
        is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('[updateDiscountStatus] Database error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to update discount status.',
        error: error.message
      });
    }

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: `Discount with ID "${id}" was not found.`
      });
    }

    return res.status(200).json({
      success: true,
      message: `Discount "${updated.code}" was ${is_active ? 'activated' : 'deactivated'} successfully.`,
      discount: formatDiscount(updated)
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/discounts/validate
 * Validate a discount code against transaction parameters and return calculated amounts.
 * Accessible by customers, staff, and admins during quotation or checkout flows.
 *
 * NOTE: This endpoint ONLY validates and computes. It does NOT increment the usage counter.
 */
export const validateDiscountCode = async (req, res, next) => {
  try {
    const {
      code,
      items,
      totalAmount,
      totalQuantity,
      productId,
      planId
    } = req.body;

    if (!code || typeof code !== 'string' || !code.trim()) {
      return res.status(400).json({
        success: false,
        isValid: false,
        message: 'Discount code is required.'
      });
    }

    if (!isSupabaseConfigured() || !supabaseAdmin) {
      return res.status(503).json({
        success: false,
        isValid: false,
        message: 'Backend Supabase connection is not configured in .env'
      });
    }

    const normalizedCode = normalizeDiscountCode(code);
    const db = req.userClient || supabaseAdmin;

    // Fetch discount by code (case-insensitive)
    const { data: discount, error } = await db
      .from('discounts')
      .select(`
        *,
        discount_products ( product_id )
      `)
      .ilike('code', normalizedCode)
      .maybeSingle();

    if (error) {
      console.error('[validateDiscountCode] Database error:', error.message);
      return res.status(500).json({
        success: false,
        isValid: false,
        message: 'Database error validating discount code.'
      });
    }

    if (!discount) {
      return res.status(404).json({
        success: false,
        isValid: false,
        message: `Discount code "${normalizedCode}" is invalid.`
      });
    }

    // Execute server-side calculation service
    const calculation = await calculateDiscount(
      discount,
      {
        items,
        totalAmount,
        totalQuantity,
        productId,
        planId
      },
      { dbClient: db }
    );

    if (!calculation.isValid) {
      return res.status(422).json({
        success: false,
        isValid: false,
        message: calculation.error,
        originalAmount: calculation.originalAmount,
        eligibleAmount: calculation.eligibleAmount,
        discountAmount: 0,
        finalAmount: calculation.finalAmount,
        discount: calculation.discount
      });
    }

    return res.status(200).json({
      success: true,
      isValid: true,
      message: `Discount "${discount.code}" applied successfully!`,
      originalAmount: calculation.originalAmount,
      eligibleAmount: calculation.eligibleAmount,
      discountAmount: calculation.discountAmount,
      finalAmount: calculation.finalAmount,
      discount: calculation.discount
    });
  } catch (err) {
    next(err);
  }
};

