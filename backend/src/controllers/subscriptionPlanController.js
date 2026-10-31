import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase.js';

/**
 * Validate UUID format
 */
const isValidUUID = (id) => {
  if (typeof id !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
};

/**
 * Validate date format (YYYY-MM-DD or ISO string)
 */
const isValidDateString = (dateStr) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return d instanceof Date && !isNaN(d.getTime());
};

/**
 * Valid billing intervals
 */
const VALID_INTERVALS = ['daily', 'weekly', 'monthly', 'yearly'];

/**
 * Format plan record with numeric price and linked product metadata
 */
export const formatPlan = (plan) => {
  if (!plan) return null;

  const productData = plan.products || null;

  return {
    id: plan.id,
    product_id: plan.product_id,
    name: plan.name,
    billing_interval: plan.billing_interval,
    price: Number(plan.price) || 0,
    min_quantity: Number(plan.min_quantity) || 1,
    start_date: plan.start_date || null,
    end_date: plan.end_date || null,
    auto_close: Boolean(plan.auto_close),
    allow_early_close: plan.allow_early_close !== false,
    allow_pause: Boolean(plan.allow_pause),
    allow_renewal: plan.allow_renewal !== false,
    is_active: plan.is_active !== false,
    created_at: plan.created_at,
    updated_at: plan.updated_at,
    product: productData
      ? {
          id: productData.id,
          name: productData.name,
          type: productData.type,
          sales_price: Number(productData.sales_price) || 0,
          is_active: productData.is_active
        }
      : null
  };
};

/**
 * GET /api/subscription-plans
 * List subscription plans with search, product, billing interval, and status filters.
 * Accessible by ADMIN and STAFF (and active plans by public/customers).
 */
export const listSubscriptionPlans = async (req, res, next) => {
  try {
    if (!isSupabaseConfigured() || !supabaseAdmin) {
      return res.status(503).json({
        success: false,
        message: 'Backend Supabase connection is not configured in .env'
      });
    }

    const {
      search = '',
      product_id = '',
      billing_interval = '',
      status = '',
      page = 1,
      limit = 10,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    const db = req.userClient || supabaseAdmin;

    let query = db
      .from('subscription_plans')
      .select('*, products(id, name, type, sales_price, is_active)', { count: 'exact' });

    // Filter by search (name)
    if (search && search.trim()) {
      query = query.ilike('name', `%${search.trim()}%`);
    }

    // Filter by product
    if (product_id && isValidUUID(product_id)) {
      query = query.eq('product_id', product_id);
    }

    // Filter by billing interval
    if (billing_interval && VALID_INTERVALS.includes(billing_interval.toLowerCase())) {
      query = query.eq('billing_interval', billing_interval.toLowerCase());
    }

    // Filter by active status
    if (status) {
      const lowerStatus = status.toLowerCase();
      if (lowerStatus === 'active' || lowerStatus === 'true') {
        query = query.eq('is_active', true);
      } else if (lowerStatus === 'inactive' || lowerStatus === 'false') {
        query = query.eq('is_active', false);
      }
    } else if (req.user?.role === 'CUSTOMER') {
      // Customers should only view active plans
      query = query.eq('is_active', true);
    }

    // Sorting
    const validSortFields = ['name', 'price', 'billing_interval', 'created_at', 'min_quantity'];
    const safeSortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const isAscending = sortOrder.toLowerCase() === 'asc';

    query = query.order(safeSortField, { ascending: isAscending }).range(offset, offset + limitNum - 1);

    const { data, count, error } = await query;

    if (error) {
      console.error('[listSubscriptionPlans] Database error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve subscription plans from database.',
        error: error.message
      });
    }

    const plans = (data || []).map(formatPlan);
    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limitNum) || 1;

    return res.status(200).json({
      success: true,
      plans,
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
 * GET /api/subscription-plans/:id
 * Retrieve single subscription plan details.
 * Accessible by ADMIN and STAFF (and CUSTOMER if active).
 */
export const getSubscriptionPlanById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription plan ID format. Expected a standard UUID.'
      });
    }

    if (!isSupabaseConfigured() || !supabaseAdmin) {
      return res.status(503).json({
        success: false,
        message: 'Backend Supabase connection is not configured in .env'
      });
    }

    const db = req.userClient || supabaseAdmin;

    const { data: plan, error } = await db
      .from('subscription_plans')
      .select('*, products(id, name, type, sales_price, is_active)')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('[getSubscriptionPlanById] Database query error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Database error fetching subscription plan.',
        error: error.message
      });
    }

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: `Subscription plan with ID "${id}" was not found.`
      });
    }

    // Role-based visibility check for customers
    if (req.user?.role === 'CUSTOMER' && !plan.is_active) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found or no longer active.'
      });
    }

    return res.status(200).json({
      success: true,
      plan: formatPlan(plan)
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/subscription-plans
 * Create a new subscription plan.
 * Restricted to ADMIN role only.
 */
export const createSubscriptionPlan = async (req, res, next) => {
  try {
    if (!isSupabaseConfigured() || !supabaseAdmin) {
      return res.status(503).json({
        success: false,
        message: 'Backend Supabase connection is not configured in .env'
      });
    }

    const {
      name,
      product_id,
      billing_interval,
      price,
      min_quantity = 1,
      start_date,
      end_date,
      auto_close = false,
      allow_early_close = true,
      allow_pause = false,
      allow_renewal = true,
      is_active = true
    } = req.body;

    // 1. Validation: Plan Name
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Plan name is required.'
      });
    }

    if (name.trim().length > 255) {
      return res.status(400).json({
        success: false,
        message: 'Plan name cannot exceed 255 characters.'
      });
    }

    // 2. Validation: Product ID
    if (!product_id || !isValidUUID(product_id)) {
      return res.status(400).json({
        success: false,
        message: 'A valid product ID (UUID) is required.'
      });
    }

    const db = req.userClient || supabaseAdmin;

    // Verify parent product exists and is ACTIVE
    const { data: product, error: productErr } = await db
      .from('products')
      .select('id, name, is_active, sales_price')
      .eq('id', product_id)
      .maybeSingle();

    if (productErr) {
      return res.status(500).json({
        success: false,
        message: 'Error verifying selected product in database.',
        error: productErr.message
      });
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Selected product with ID "${product_id}" does not exist.`
      });
    }

    if (!product.is_active) {
      return res.status(400).json({
        success: false,
        message: `Cannot attach plan to archived or inactive product "${product.name}". Please reactivate the product first.`
      });
    }

    // 3. Validation: Billing Interval
    if (!billing_interval || typeof billing_interval !== 'string') {
      return res.status(400).json({
        success: false,
        message: `Billing interval is required. Must be one of: ${VALID_INTERVALS.join(', ')}`
      });
    }

    const normalizedInterval = billing_interval.trim().toLowerCase();
    if (!VALID_INTERVALS.includes(normalizedInterval)) {
      return res.status(400).json({
        success: false,
        message: `Invalid billing interval "${billing_interval}". Must be one of: ${VALID_INTERVALS.join(', ')}`
      });
    }

    // 4. Validation: Price
    if (price === undefined || price === null || price === '') {
      return res.status(400).json({
        success: false,
        message: 'Plan price is required.'
      });
    }

    const numPrice = Number(price);
    if (isNaN(numPrice) || !isFinite(numPrice) || numPrice < 0) {
      return res.status(400).json({
        success: false,
        message: 'Plan price must be a valid non-negative number.'
      });
    }

    // 5. Validation: Minimum Quantity
    const numMinQty = Number(min_quantity);
    if (!Number.isInteger(numMinQty) || numMinQty < 1) {
      return res.status(400).json({
        success: false,
        message: 'Minimum quantity must be a positive integer of 1 or greater.'
      });
    }

    // 6. Validation: Dates
    let cleanStartDate = null;
    let cleanEndDate = null;

    if (start_date) {
      if (!isValidDateString(start_date)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid start date format.'
        });
      }
      cleanStartDate = new Date(start_date).toISOString().split('T')[0];
    }

    if (end_date) {
      if (!isValidDateString(end_date)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid end date format.'
        });
      }
      cleanEndDate = new Date(end_date).toISOString().split('T')[0];

      if (cleanStartDate && cleanEndDate < cleanStartDate) {
        return res.status(400).json({
          success: false,
          message: 'End date cannot be earlier than start date.'
        });
      }
    }

    // 7. Insert Plan Record
    const newPlanData = {
      product_id,
      name: name.trim(),
      billing_interval: normalizedInterval,
      price: Number(numPrice.toFixed(2)),
      min_quantity: numMinQty,
      start_date: cleanStartDate,
      end_date: cleanEndDate,
      auto_close: Boolean(auto_close),
      allow_early_close: allow_early_close !== false,
      allow_pause: Boolean(allow_pause),
      allow_renewal: allow_renewal !== false,
      is_active: is_active !== false
    };

    const { data: createdPlan, error: insertError } = await db
      .from('subscription_plans')
      .insert(newPlanData)
      .select('*, products(id, name, type, sales_price, is_active)')
      .single();

    if (insertError) {
      console.error('[createSubscriptionPlan] Insert error:', insertError.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to create subscription plan in database.',
        error: insertError.message
      });
    }

    return res.status(201).json({
      success: true,
      message: `Subscription plan "${createdPlan.name}" created successfully.`,
      plan: formatPlan(createdPlan)
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/subscription-plans/:id
 * Update an existing subscription plan.
 * Restricted to ADMIN role only.
 */
export const updateSubscriptionPlan = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription plan ID format. Expected a standard UUID.'
      });
    }

    if (!isSupabaseConfigured() || !supabaseAdmin) {
      return res.status(503).json({
        success: false,
        message: 'Backend Supabase connection is not configured in .env'
      });
    }

    const db = req.userClient || supabaseAdmin;

    // Check plan exists
    const { data: existingPlan, error: fetchErr } = await db
      .from('subscription_plans')
      .select('id, product_id, is_active')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr) {
      return res.status(500).json({
        success: false,
        message: 'Error verifying subscription plan.',
        error: fetchErr.message
      });
    }

    if (!existingPlan) {
      return res.status(404).json({
        success: false,
        message: `Subscription plan with ID "${id}" was not found.`
      });
    }

    const {
      name,
      product_id,
      billing_interval,
      price,
      min_quantity,
      start_date,
      end_date,
      auto_close,
      allow_early_close,
      allow_pause,
      allow_renewal,
      is_active
    } = req.body;

    const updateData = {};

    // 1. Name update
    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Plan name cannot be blank.'
        });
      }
      if (name.trim().length > 255) {
        return res.status(400).json({
          success: false,
          message: 'Plan name cannot exceed 255 characters.'
        });
      }
      updateData.name = name.trim();
    }

    // 2. Product update
    if (product_id !== undefined) {
      if (!isValidUUID(product_id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid product ID format. Expected a standard UUID.'
        });
      }

      const { data: product, error: productErr } = await db
        .from('products')
        .select('id, name, is_active')
        .eq('id', product_id)
        .maybeSingle();

      if (productErr || !product) {
        return res.status(404).json({
          success: false,
          message: `Product with ID "${product_id}" does not exist.`
        });
      }

      if (!product.is_active) {
        return res.status(400).json({
          success: false,
          message: `Cannot assign plan to inactive product "${product.name}".`
        });
      }

      updateData.product_id = product_id;
    }

    // 3. Billing Interval update
    if (billing_interval !== undefined) {
      const normalizedInterval = typeof billing_interval === 'string'
        ? billing_interval.trim().toLowerCase()
        : '';

      if (!VALID_INTERVALS.includes(normalizedInterval)) {
        return res.status(400).json({
          success: false,
          message: `Invalid billing interval. Must be one of: ${VALID_INTERVALS.join(', ')}`
        });
      }

      updateData.billing_interval = normalizedInterval;
    }

    // 4. Price update
    if (price !== undefined) {
      const numPrice = Number(price);
      if (isNaN(numPrice) || !isFinite(numPrice) || numPrice < 0) {
        return res.status(400).json({
          success: false,
          message: 'Plan price must be a valid non-negative number.'
        });
      }
      updateData.price = Number(numPrice.toFixed(2));
    }

    // 5. Min Quantity update
    if (min_quantity !== undefined) {
      const numMinQty = Number(min_quantity);
      if (!Number.isInteger(numMinQty) || numMinQty < 1) {
        return res.status(400).json({
          success: false,
          message: 'Minimum quantity must be a positive integer of 1 or greater.'
        });
      }
      updateData.min_quantity = numMinQty;
    }

    // 6. Dates update
    if (start_date !== undefined) {
      if (start_date === null || start_date === '') {
        updateData.start_date = null;
      } else {
        if (!isValidDateString(start_date)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid start date format.'
          });
        }
        updateData.start_date = new Date(start_date).toISOString().split('T')[0];
      }
    }

    if (end_date !== undefined) {
      if (end_date === null || end_date === '') {
        updateData.end_date = null;
      } else {
        if (!isValidDateString(end_date)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid end date format.'
          });
        }
        updateData.end_date = new Date(end_date).toISOString().split('T')[0];
      }
    }

    // Verify start <= end date ordering
    const finalStart = updateData.start_date !== undefined ? updateData.start_date : existingPlan.start_date;
    const finalEnd = updateData.end_date !== undefined ? updateData.end_date : existingPlan.end_date;
    if (finalStart && finalEnd && finalEnd < finalStart) {
      return res.status(400).json({
        success: false,
        message: 'End date cannot be earlier than start date.'
      });
    }

    // 7. Boolean toggles
    if (auto_close !== undefined) updateData.auto_close = Boolean(auto_close);
    if (allow_early_close !== undefined) updateData.allow_early_close = Boolean(allow_early_close);
    if (allow_pause !== undefined) updateData.allow_pause = Boolean(allow_pause);
    if (allow_renewal !== undefined) updateData.allow_renewal = Boolean(allow_renewal);
    if (is_active !== undefined) updateData.is_active = Boolean(is_active);

    updateData.updated_at = new Date().toISOString();

    const { data: updatedPlan, error: updateErr } = await db
      .from('subscription_plans')
      .update(updateData)
      .eq('id', id)
      .select('*, products(id, name, type, sales_price, is_active)')
      .single();

    if (updateErr) {
      console.error('[updateSubscriptionPlan] Update error:', updateErr.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to update subscription plan in database.',
        error: updateErr.message
      });
    }

    return res.status(200).json({
      success: true,
      message: `Subscription plan "${updatedPlan.name}" updated successfully.`,
      plan: formatPlan(updatedPlan)
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/subscription-plans/:id/status
 * Toggle active standing of a subscription plan (activate / deactivate).
 * Restricted to ADMIN role only.
 */
export const updateSubscriptionPlanStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription plan ID format. Expected a standard UUID.'
      });
    }

    if (!isSupabaseConfigured() || !supabaseAdmin) {
      return res.status(503).json({
        success: false,
        message: 'Backend Supabase connection is not configured in .env'
      });
    }

    const { is_active, status } = req.body;

    let targetActive;
    if (typeof is_active === 'boolean') {
      targetActive = is_active;
    } else if (typeof status === 'string') {
      const upper = status.trim().toUpperCase();
      if (upper === 'ACTIVE') targetActive = true;
      else if (upper === 'INACTIVE') targetActive = false;
      else {
        return res.status(400).json({
          success: false,
          message: 'Status must be "ACTIVE" or "INACTIVE".'
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Must provide boolean "is_active" or string "status" ("ACTIVE"/"INACTIVE").'
      });
    }

    const db = req.userClient || supabaseAdmin;

    // Check plan exists
    const { data: existingPlan, error: fetchErr } = await db
      .from('subscription_plans')
      .select('id, name, is_active')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr) {
      return res.status(500).json({
        success: false,
        message: 'Error verifying subscription plan.',
        error: fetchErr.message
      });
    }

    if (!existingPlan) {
      return res.status(404).json({
        success: false,
        message: `Subscription plan with ID "${id}" was not found.`
      });
    }

    const { data: updatedPlan, error: updateErr } = await db
      .from('subscription_plans')
      .update({
        is_active: targetActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*, products(id, name, type, sales_price, is_active)')
      .single();

    if (updateErr) {
      console.error('[updateSubscriptionPlanStatus] Update error:', updateErr.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to update subscription plan status in database.',
        error: updateErr.message
      });
    }

    const actionText = targetActive ? 'activated' : 'deactivated';
    return res.status(200).json({
      success: true,
      message: `Subscription plan "${updatedPlan.name}" was ${actionText} successfully.`,
      plan: formatPlan(updatedPlan)
    });
  } catch (err) {
    next(err);
  }
};

