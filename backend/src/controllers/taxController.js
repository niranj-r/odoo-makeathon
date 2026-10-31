import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase.js';
import { calculateTaxes } from '../services/taxService.js';

/**
 * Validate UUID format
 */
const isValidUUID = (id) => {
  if (typeof id !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
};

/**
 * Format tax record with typed numbers and formatted rate display
 */
export const formatTax = (tax) => {
  if (!tax) return null;
  const rate = Number(tax.rate_percentage) || 0;
  const isPercentage = (tax.computation_type || 'percentage').toLowerCase() === 'percentage';

  return {
    id: tax.id,
    name: tax.name,
    rate_percentage: rate,
    computation_type: tax.computation_type || 'percentage',
    rate_formatted: isPercentage ? `${rate}%` : `₹${rate.toFixed(2)}`,
    is_active: tax.is_active !== false,
    created_at: tax.created_at,
    updated_at: tax.updated_at
  };
};

/**
 * GET /api/taxes
 * List all taxes with search, computation_type filter, status filter, and pagination.
 * Accessible by ADMIN and STAFF.
 */
export const listTaxes = async (req, res, next) => {
  try {
    if (!isSupabaseConfigured() || !supabaseAdmin) {
      return res.status(503).json({
        success: false,
        message: 'Backend Supabase connection is not configured in .env'
      });
    }

    const {
      search = '',
      computation_type = '',
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

    let query = db.from('taxes').select('*', { count: 'exact' });

    // Search by tax name
    if (search && search.trim()) {
      query = query.ilike('name', `%${search.trim()}%`);
    }

    // Filter by computation type (percentage, fixed)
    if (computation_type) {
      const normType = computation_type.trim().toLowerCase();
      if (['percentage', 'fixed'].includes(normType)) {
        query = query.eq('computation_type', normType);
      }
    }

    // Filter by active status
    if (status) {
      const lowerStatus = status.trim().toLowerCase();
      if (lowerStatus === 'active' || lowerStatus === 'true') {
        query = query.eq('is_active', true);
      } else if (lowerStatus === 'inactive' || lowerStatus === 'false') {
        query = query.eq('is_active', false);
      }
    } else if (req.user?.role === 'CUSTOMER') {
      query = query.eq('is_active', true);
    }

    // Sorting
    const validSortFields = ['name', 'rate_percentage', 'computation_type', 'created_at'];
    const safeSortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const isAscending = sortOrder.toLowerCase() === 'asc';

    query = query.order(safeSortField, { ascending: isAscending }).range(offset, offset + limitNum - 1);

    const { data, count, error } = await query;

    if (error) {
      console.error('[listTaxes] Supabase query error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve taxes from database.',
        error: error.message
      });
    }

    const taxes = (data || []).map(formatTax);
    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limitNum) || 1;

    return res.status(200).json({
      success: true,
      taxes,
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
 * GET /api/taxes/:id
 * Retrieve details for a single tax by ID.
 * Accessible by ADMIN and STAFF.
 */
export const getTaxById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tax ID format. Expected a standard UUID.'
      });
    }

    if (!isSupabaseConfigured() || !supabaseAdmin) {
      return res.status(503).json({
        success: false,
        message: 'Backend Supabase connection is not configured in .env'
      });
    }

    const db = req.userClient || supabaseAdmin;

    const { data: tax, error } = await db
      .from('taxes')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('[getTaxById] Error fetching tax:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Database error fetching tax details.',
        error: error.message
      });
    }

    if (!tax) {
      return res.status(404).json({
        success: false,
        message: `Tax with ID "${id}" was not found.`
      });
    }

    // Query count of associated products using this tax
    const { count: productCount } = await db
      .from('product_taxes')
      .select('id', { count: 'exact', head: true })
      .eq('tax_id', id);

    return res.status(200).json({
      success: true,
      tax: {
        ...formatTax(tax),
        associated_product_count: productCount || 0
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/taxes
 * Create a new tax record.
 * Restricted to ADMIN role only.
 */
export const createTax = async (req, res, next) => {
  try {
    if (!isSupabaseConfigured() || !supabaseAdmin) {
      return res.status(503).json({
        success: false,
        message: 'Backend Supabase connection is not configured in .env'
      });
    }

    const {
      name,
      rate_percentage,
      computation_type = 'percentage',
      is_active = true
    } = req.body;

    // 1. Validation: Tax Name
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Tax name is required.'
      });
    }

    if (name.trim().length > 255) {
      return res.status(400).json({
        success: false,
        message: 'Tax name cannot exceed 255 characters.'
      });
    }

    // 2. Validation: Computation Type
    const normType = typeof computation_type === 'string'
      ? computation_type.trim().toLowerCase()
      : 'percentage';

    if (!['percentage', 'fixed'].includes(normType)) {
      return res.status(400).json({
        success: false,
        message: 'Computation type must be either "percentage" or "fixed".'
      });
    }

    // 3. Validation: Rate / Amount
    if (rate_percentage === undefined || rate_percentage === null || rate_percentage === '') {
      return res.status(400).json({
        success: false,
        message: normType === 'percentage'
          ? 'Tax percentage rate is required.'
          : 'Fixed tax amount is required.'
      });
    }

    const numRate = Number(rate_percentage);
    if (isNaN(numRate) || !isFinite(numRate) || numRate < 0) {
      return res.status(400).json({
        success: false,
        message: normType === 'percentage'
          ? 'Tax percentage rate must be a valid non-negative number.'
          : 'Fixed tax amount must be a valid non-negative number.'
      });
    }

    // If percentage, reasonable bounds check (e.g. 0% to 100%)
    if (normType === 'percentage' && numRate > 100) {
      return res.status(400).json({
        success: false,
        message: 'Percentage tax rate cannot exceed 100%.'
      });
    }

    const db = req.userClient || supabaseAdmin;

    const newTaxData = {
      name: name.trim(),
      rate_percentage: Number(numRate.toFixed(2)),
      computation_type: normType,
      is_active: is_active !== false
    };

    const { data: createdTax, error } = await db
      .from('taxes')
      .insert(newTaxData)
      .select('*')
      .single();

    if (error) {
      console.error('[createTax] Supabase insert error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to create tax in database.',
        error: error.message
      });
    }

    return res.status(201).json({
      success: true,
      message: `Tax "${createdTax.name}" created successfully.`,
      tax: formatTax(createdTax)
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/taxes/:id
 * Update an existing tax.
 * Restricted to ADMIN role only.
 */
export const updateTax = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tax ID format. Expected a standard UUID.'
      });
    }

    if (!isSupabaseConfigured() || !supabaseAdmin) {
      return res.status(503).json({
        success: false,
        message: 'Backend Supabase connection is not configured in .env'
      });
    }

    const db = req.userClient || supabaseAdmin;

    // Check tax exists
    const { data: existingTax, error: fetchErr } = await db
      .from('taxes')
      .select('id, name, computation_type, rate_percentage')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr) {
      return res.status(500).json({
        success: false,
        message: 'Error verifying tax in database.',
        error: fetchErr.message
      });
    }

    if (!existingTax) {
      return res.status(404).json({
        success: false,
        message: `Tax with ID "${id}" was not found.`
      });
    }

    const { name, rate_percentage, computation_type, is_active } = req.body;
    const updateData = {};

    // 1. Name
    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Tax name cannot be blank.'
        });
      }
      if (name.trim().length > 255) {
        return res.status(400).json({
          success: false,
          message: 'Tax name cannot exceed 255 characters.'
        });
      }
      updateData.name = name.trim();
    }

    // 2. Computation Type
    let targetType = existingTax.computation_type;
    if (computation_type !== undefined) {
      const normType = typeof computation_type === 'string'
        ? computation_type.trim().toLowerCase()
        : '';
      if (!['percentage', 'fixed'].includes(normType)) {
        return res.status(400).json({
          success: false,
          message: 'Computation type must be either "percentage" or "fixed".'
        });
      }
      updateData.computation_type = normType;
      targetType = normType;
    }

    // 3. Rate / Amount
    if (rate_percentage !== undefined) {
      const numRate = Number(rate_percentage);
      if (isNaN(numRate) || !isFinite(numRate) || numRate < 0) {
        return res.status(400).json({
          success: false,
          message: 'Tax rate or amount must be a valid non-negative number.'
        });
      }
      if (targetType === 'percentage' && numRate > 100) {
        return res.status(400).json({
          success: false,
          message: 'Percentage tax rate cannot exceed 100%.'
        });
      }
      updateData.rate_percentage = Number(numRate.toFixed(2));
    }

    // 4. Active Status
    if (is_active !== undefined) {
      updateData.is_active = Boolean(is_active);
    }

    updateData.updated_at = new Date().toISOString();

    const { data: updatedTax, error: updateErr } = await db
      .from('taxes')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (updateErr) {
      console.error('[updateTax] Supabase update error:', updateErr.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to update tax in database.',
        error: updateErr.message
      });
    }

    return res.status(200).json({
      success: true,
      message: `Tax "${updatedTax.name}" updated successfully.`,
      tax: formatTax(updatedTax)
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/taxes/:id/status
 * Toggle active standing of a tax (soft activate / deactivate).
 * Restricted to ADMIN role only.
 */
export const updateTaxStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tax ID format. Expected a standard UUID.'
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

    // Check tax exists
    const { data: existingTax, error: fetchErr } = await db
      .from('taxes')
      .select('id, name')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr) {
      return res.status(500).json({
        success: false,
        message: 'Error verifying tax in database.',
        error: fetchErr.message
      });
    }

    if (!existingTax) {
      return res.status(404).json({
        success: false,
        message: `Tax with ID "${id}" was not found.`
      });
    }

    const { data: updatedTax, error: updateErr } = await db
      .from('taxes')
      .update({
        is_active: targetActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .single();

    if (updateErr) {
      console.error('[updateTaxStatus] Supabase error:', updateErr.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to update tax status in database.',
        error: updateErr.message
      });
    }

    const actionText = targetActive ? 'activated' : 'deactivated';
    return res.status(200).json({
      success: true,
      message: `Tax "${updatedTax.name}" was ${actionText} successfully.`,
      tax: formatTax(updatedTax)
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/products/:productId/taxes
 * Get all taxes currently associated with a specific product.
 * Accessible by ADMIN and STAFF.
 */
export const getProductTaxes = async (req, res, next) => {
  try {
    const { productId } = req.params;

    if (!isValidUUID(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format. Expected a standard UUID.'
      });
    }

    if (!isSupabaseConfigured() || !supabaseAdmin) {
      return res.status(503).json({
        success: false,
        message: 'Backend Supabase connection is not configured in .env'
      });
    }

    const db = req.userClient || supabaseAdmin;

    // Verify product exists
    const { data: product, error: prodErr } = await db
      .from('products')
      .select('id, name, sales_price, is_active')
      .eq('id', productId)
      .maybeSingle();

    if (prodErr || !product) {
      return res.status(404).json({
        success: false,
        message: `Product with ID "${productId}" was not found.`
      });
    }

    // Query product_taxes joined with taxes
    const { data: mappedTaxes, error: ptErr } = await db
      .from('product_taxes')
      .select('id, created_at, taxes(*)')
      .eq('product_id', productId);

    if (ptErr) {
      console.error('[getProductTaxes] Error querying product taxes:', ptErr.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve associated product taxes.',
        error: ptErr.message
      });
    }

    const assignedTaxes = (mappedTaxes || [])
      .map((item) => item.taxes)
      .filter(Boolean)
      .map(formatTax);

    // Compute sample tax calculation for the product base price
    const sampleCalculation = calculateTaxes(product.sales_price, assignedTaxes);

    return res.status(200).json({
      success: true,
      product: {
        id: product.id,
        name: product.name,
        sales_price: Number(product.sales_price) || 0,
        is_active: product.is_active
      },
      taxes: assignedTaxes,
      sample_calculation: sampleCalculation
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/products/:productId/taxes
 * Assign multiple taxes to a product (replaces current mapping).
 * Restricted to ADMIN role only.
 */
export const assignProductTaxes = async (req, res, next) => {
  try {
    const { productId } = req.params;

    if (!isValidUUID(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format. Expected a standard UUID.'
      });
    }

    if (!isSupabaseConfigured() || !supabaseAdmin) {
      return res.status(503).json({
        success: false,
        message: 'Backend Supabase connection is not configured in .env'
      });
    }

    const { tax_ids = [] } = req.body;

    if (!Array.isArray(tax_ids)) {
      return res.status(400).json({
        success: false,
        message: 'tax_ids must be an array of tax UUIDs.'
      });
    }

    // Validate each tax ID format and eliminate duplicates
    const uniqueTaxIds = [...new Set(tax_ids)];
    for (const tid of uniqueTaxIds) {
      if (!isValidUUID(tid)) {
        return res.status(400).json({
          success: false,
          message: `Invalid tax ID "${tid}". Expected a standard UUID.`
        });
      }
    }

    const db = req.userClient || supabaseAdmin;

    // 1. Verify product exists and is active
    const { data: product, error: prodErr } = await db
      .from('products')
      .select('id, name, sales_price, is_active')
      .eq('id', productId)
      .maybeSingle();

    if (prodErr || !product) {
      return res.status(404).json({
        success: false,
        message: `Product with ID "${productId}" was not found.`
      });
    }

    if (!product.is_active) {
      return res.status(400).json({
        success: false,
        message: `Cannot assign taxes to archived or inactive product "${product.name}". Reactivate product first.`
      });
    }

    // 2. If tax_ids are provided, verify each tax exists and is ACTIVE
    let verifiedTaxes = [];
    if (uniqueTaxIds.length > 0) {
      const { data: taxesFound, error: taxQueryErr } = await db
        .from('taxes')
        .select('*')
        .in('id', uniqueTaxIds);

      if (taxQueryErr) {
        return res.status(500).json({
          success: false,
          message: 'Error verifying taxes in database.',
          error: taxQueryErr.message
        });
      }

      if (!taxesFound || taxesFound.length !== uniqueTaxIds.length) {
        return res.status(404).json({
          success: false,
          message: 'One or more selected taxes were not found in the database.'
        });
      }

      const inactiveTax = taxesFound.find((t) => !t.is_active);
      if (inactiveTax) {
        return res.status(400).json({
          success: false,
          message: `Cannot assign deactivated tax "${inactiveTax.name}" to product. Reactivate the tax first.`
        });
      }

      verifiedTaxes = taxesFound;
    }

    // 3. Atomically replace mappings: delete previous mappings for this product
    const { error: deleteErr } = await db
      .from('product_taxes')
      .delete()
      .eq('product_id', productId);

    if (deleteErr) {
      console.error('[assignProductTaxes] Error clearing previous mappings:', deleteErr.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to update product tax mapping in database.',
        error: deleteErr.message
      });
    }

    // 4. Insert new mappings if any
    if (uniqueTaxIds.length > 0) {
      const mappingRows = uniqueTaxIds.map((tid) => ({
        product_id: productId,
        tax_id: tid
      }));

      const { error: insertErr } = await db
        .from('product_taxes')
        .insert(mappingRows);

      if (insertErr) {
        console.error('[assignProductTaxes] Insert error:', insertErr.message);
        return res.status(500).json({
          success: false,
          message: 'Failed to assign taxes to product in database.',
          error: insertErr.message
        });
      }
    }

    const assignedFormatted = verifiedTaxes.map(formatTax);
    const sampleCalculation = calculateTaxes(product.sales_price, assignedFormatted);

    return res.status(200).json({
      success: true,
      message: uniqueTaxIds.length > 0
        ? `Successfully assigned ${uniqueTaxIds.length} tax(es) to "${product.name}".`
        : `All taxes removed from "${product.name}".`,
      product: {
        id: product.id,
        name: product.name,
        sales_price: Number(product.sales_price) || 0
      },
      taxes: assignedFormatted,
      sample_calculation: sampleCalculation
    });
  } catch (err) {
    next(err);
  }
};

