import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase.js';

/**
 * Validate UUID format
 */
const isValidUUID = (id) => {
  if (typeof id !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
};

/**
 * Reusable backend price calculator:
 * calculateVariantPrice(productId, variantId, db, options)
 *
 * Final Price = Product Sales Price + Variant Additional Price
 *
 * Retrieves actual base product price and variant additional price from database.
 * Rejects:
 * - Inactive products (if checkActive: true)
 * - Inactive variants (if checkActive: true)
 * - Negative additional prices
 * - Variants belonging to another product
 */
export const calculateVariantPrice = async (
  productId,
  variantId,
  db = supabaseAdmin,
  options = { checkActive: true }
) => {
  if (!isValidUUID(productId)) {
    throw new Error('Invalid product ID format. Expected a standard UUID.');
  }

  if (!isValidUUID(variantId)) {
    throw new Error('Invalid variant ID format. Expected a standard UUID.');
  }

  // 1. Fetch base product
  const { data: product, error: productErr } = await db
    .from('products')
    .select('id, name, sales_price, is_active')
    .eq('id', productId)
    .maybeSingle();

  if (productErr) {
    throw new Error(`Database error fetching product: ${productErr.message}`);
  }

  if (!product) {
    throw new Error(`Product with ID ${productId} was not found.`);
  }

  if (options.checkActive && !product.is_active) {
    throw new Error(`Cannot calculate price for an archived or inactive product ("${product.name}").`);
  }

  // 2. Fetch variant
  const { data: variant, error: variantErr } = await db
    .from('product_variants')
    .select('id, product_id, variant_name, attribute_name, attribute_value, price_extra, sku, is_active')
    .eq('id', variantId)
    .maybeSingle();

  if (variantErr) {
    throw new Error(`Database error fetching variant: ${variantErr.message}`);
  }

  if (!variant) {
    throw new Error(`Variant with ID ${variantId} was not found.`);
  }

  // 3. Security: Prevent cross-product variant access
  if (variant.product_id !== productId) {
    throw new Error(
      `Variant mismatch: Variant "${variant.variant_name}" (${variantId}) does not belong to product "${product.name}" (${productId}).`
    );
  }

  // 4. Inactive variant validation
  const variantIsActive = variant.is_active !== false;
  if (options.checkActive && !variantIsActive) {
    throw new Error(`Variant "${variant.variant_name}" is currently deactivated.`);
  }

  // 5. Price calculations
  const basePrice = Number(product.sales_price) || 0;
  const priceExtra = Number(variant.price_extra) || 0;

  if (priceExtra < 0) {
    throw new Error(`Invalid negative variant additional price (${priceExtra}).`);
  }

  const finalPrice = Number((basePrice + priceExtra).toFixed(2));

  return {
    productId: product.id,
    productName: product.name,
    productActive: product.is_active,
    basePrice,
    variantId: variant.id,
    variantName: variant.variant_name,
    attributeName: variant.attribute_name,
    attributeValue: variant.attribute_value,
    sku: variant.sku || null,
    variantActive: variantIsActive,
    priceExtra,
    finalPrice
  };
};

/**
 * Format variant record with calculated price
 */
const formatVariant = (variant, basePrice = 0) => {
  const priceExtra = Number(variant.price_extra) || 0;
  const numBase = Number(basePrice) || 0;
  const finalPrice = Number((numBase + priceExtra).toFixed(2));

  return {
    ...variant,
    price_extra: priceExtra,
    base_price: numBase,
    final_price: finalPrice,
    is_active: variant.is_active !== false
  };
};

/**
 * GET /api/products/:id/variants
 * List all variants for a specific product.
 * Accessible by ADMIN and STAFF.
 */
export const listVariants = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
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

    // Check if parent product exists
    const { data: product, error: productErr } = await db
      .from('products')
      .select('id, name, sales_price, is_active')
      .eq('id', id)
      .maybeSingle();

    if (productErr) {
      console.error('[listVariants] Product query error:', productErr.message);
      return res.status(500).json({
        success: false,
        message: 'Error verifying parent product.',
        error: productErr.message
      });
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product with ID ${id} was not found.`
      });
    }

    const { status = 'ALL', search = '', sortBy = 'created_at', sortOrder = 'asc' } = req.query;

    let query = db
      .from('product_variants')
      .select('*')
      .eq('product_id', id);

    // Filter by active status
    if (status && status !== 'ALL') {
      if (status.toLowerCase() === 'active') {
        query = query.eq('is_active', true);
      } else if (status.toLowerCase() === 'inactive' || status.toLowerCase() === 'archived') {
        query = query.eq('is_active', false);
      }
    }

    // Search filter across variant_name, attribute_name, attribute_value, or sku
    if (search.trim()) {
      query = query.ilike('variant_name', `%${search.trim()}%`);
    }

    // Sort order
    const allowedSort = ['variant_name', 'price_extra', 'created_at', 'sku'];
    const safeSortBy = allowedSort.includes(sortBy) ? sortBy : 'created_at';
    query = query.order(safeSortBy, { ascending: sortOrder.toLowerCase() === 'asc' });

    const { data: variants, error: variantsErr } = await query;

    if (variantsErr) {
      console.error('[listVariants] Query error:', variantsErr.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve product variants.',
        error: variantsErr.message
      });
    }

    const formattedVariants = (variants || []).map((v) =>
      formatVariant(v, product.sales_price)
    );

    return res.status(200).json({
      success: true,
      product: {
        id: product.id,
        name: product.name,
        sales_price: Number(product.sales_price),
        is_active: product.is_active
      },
      variants: formattedVariants,
      total: formattedVariants.length
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/products/:id/variants/:variantId
 * Retrieve single variant details with price calculation.
 * Accessible by ADMIN and STAFF.
 */
export const getVariantById = async (req, res, next) => {
  try {
    const { id, variantId } = req.params;

    if (!isValidUUID(id) || !isValidUUID(variantId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product or variant ID format. Expected standard UUIDs.'
      });
    }

    if (!isSupabaseConfigured() || !supabaseAdmin) {
      return res.status(503).json({
        success: false,
        message: 'Backend Supabase connection is not configured in .env'
      });
    }

    const db = req.userClient || supabaseAdmin;

    // Use calculateVariantPrice with checkActive: false to retrieve existing record even if inactive
    try {
      const calculation = await calculateVariantPrice(id, variantId, db, { checkActive: false });

      // Fetch the full variant record
      const { data: variant, error: varErr } = await db
        .from('product_variants')
        .select('*')
        .eq('id', variantId)
        .maybeSingle();

      if (varErr || !variant) {
        return res.status(404).json({
          success: false,
          message: 'Variant not found.'
        });
      }

      return res.status(200).json({
        success: true,
        variant: {
          ...formatVariant(variant, calculation.basePrice),
          calculation
        }
      });
    } catch (calcErr) {
      if (calcErr.message.includes('not be found') || calcErr.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: calcErr.message
        });
      }
      if (calcErr.message.includes('Variant mismatch')) {
        return res.status(400).json({
          success: false,
          message: calcErr.message
        });
      }
      throw calcErr;
    }
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/products/:id/variants
 * Create a new variant for a product.
 * Restricted to ADMIN role only.
 */
export const createVariant = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
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

    // Verify parent product exists and is ACTIVE
    const { data: product, error: productErr } = await db
      .from('products')
      .select('id, name, sales_price, is_active')
      .eq('id', id)
      .maybeSingle();

    if (productErr) {
      return res.status(500).json({
        success: false,
        message: 'Error verifying parent product.',
        error: productErr.message
      });
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product with ID ${id} does not exist.`
      });
    }

    if (!product.is_active) {
      return res.status(400).json({
        success: false,
        message: `Cannot create variants for inactive or archived product "${product.name}". Please reactivate the product first.`
      });
    }

    const {
      variant_name,
      attribute_name,
      attribute_value,
      price_extra = 0,
      sku,
      is_active = true
    } = req.body;

    // Validation: Variant Name
    if (!variant_name || typeof variant_name !== 'string' || !variant_name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Variant name is required.'
      });
    }

    if (variant_name.trim().length > 255) {
      return res.status(400).json({
        success: false,
        message: 'Variant name cannot exceed 255 characters.'
      });
    }

    // Validation: Attribute Name
    if (!attribute_name || typeof attribute_name !== 'string' || !attribute_name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Attribute name is required (e.g. "Brand", "Color", "Storage").'
      });
    }

    // Validation: Attribute Value
    if (!attribute_value || typeof attribute_value !== 'string' || !attribute_value.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Attribute value is required (e.g. "Standard", "Odoo", "SAP").'
      });
    }

    // Validation: Additional Price (non-negative)
    const numPriceExtra = price_extra === '' || price_extra === undefined ? 0 : Number(price_extra);
    if (isNaN(numPriceExtra) || !isFinite(numPriceExtra) || numPriceExtra < 0) {
      return res.status(400).json({
        success: false,
        message: 'Variant additional price must be a valid non-negative number.'
      });
    }

    // Validation & Uniqueness: SKU
    let sanitizedSku = null;
    if (sku !== undefined && sku !== null && String(sku).trim()) {
      sanitizedSku = String(sku).trim().toUpperCase();

      // Check for duplicate SKU
      const { data: existingSku, error: skuErr } = await db
        .from('product_variants')
        .select('id, sku, variant_name')
        .eq('sku', sanitizedSku)
        .maybeSingle();

      if (existingSku) {
        return res.status(409).json({
          success: false,
          message: `SKU "${sanitizedSku}" already exists in the catalog (assigned to variant "${existingSku.variant_name}"). SKUs must be unique.`
        });
      }
    }

    const newVariantData = {
      product_id: id,
      variant_name: variant_name.trim(),
      attribute_name: attribute_name.trim(),
      attribute_value: attribute_value.trim(),
      price_extra: Number(numPriceExtra.toFixed(2)),
      sku: sanitizedSku,
      is_active: is_active !== false
    };

    const { data: createdVariant, error: insertErr } = await db
      .from('product_variants')
      .insert(newVariantData)
      .select('*')
      .single();

    if (insertErr) {
      console.error('[createVariant] Insert error:', insertErr.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to create product variant in database.',
        error: insertErr.message
      });
    }

    const formatted = formatVariant(createdVariant, product.sales_price);

    return res.status(201).json({
      success: true,
      message: `Variant "${createdVariant.variant_name}" created successfully.`,
      variant: formatted
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/products/:id/variants/:variantId
 * Update an existing variant.
 * Restricted to ADMIN role only.
 */
export const updateVariant = async (req, res, next) => {
  try {
    const { id, variantId } = req.params;

    if (!isValidUUID(id) || !isValidUUID(variantId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product or variant ID format. Expected standard UUIDs.'
      });
    }

    if (!isSupabaseConfigured() || !supabaseAdmin) {
      return res.status(503).json({
        success: false,
        message: 'Backend Supabase connection is not configured in .env'
      });
    }

    const db = req.userClient || supabaseAdmin;

    // Check parent product
    const { data: product, error: productErr } = await db
      .from('products')
      .select('id, name, sales_price, is_active')
      .eq('id', id)
      .maybeSingle();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product with ID ${id} was not found.`
      });
    }

    // Check existing variant and cross-product association
    const { data: existingVariant, error: fetchErr } = await db
      .from('product_variants')
      .select('*')
      .eq('id', variantId)
      .maybeSingle();

    if (fetchErr || !existingVariant) {
      return res.status(404).json({
        success: false,
        message: `Variant with ID ${variantId} does not exist.`
      });
    }

    if (existingVariant.product_id !== id) {
      return res.status(400).json({
        success: false,
        message: `Variant mismatch: Variant "${existingVariant.variant_name}" does not belong to product "${product.name}".`
      });
    }

    const {
      variant_name,
      attribute_name,
      attribute_value,
      price_extra,
      sku,
      is_active
    } = req.body;

    // Validation: Variant Name
    if (!variant_name || typeof variant_name !== 'string' || !variant_name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Variant name is required.'
      });
    }

    // Validation: Attribute Name
    if (!attribute_name || typeof attribute_name !== 'string' || !attribute_name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Attribute name is required.'
      });
    }

    // Validation: Attribute Value
    if (!attribute_value || typeof attribute_value !== 'string' || !attribute_value.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Attribute value is required.'
      });
    }

    // Validation: Additional Price
    if (price_extra === undefined || price_extra === null || price_extra === '') {
      return res.status(400).json({
        success: false,
        message: 'Variant additional price is required.'
      });
    }

    const numPriceExtra = Number(price_extra);
    if (isNaN(numPriceExtra) || !isFinite(numPriceExtra) || numPriceExtra < 0) {
      return res.status(400).json({
        success: false,
        message: 'Variant additional price must be a valid non-negative number.'
      });
    }

    // Validation & Uniqueness: SKU (excluding current variant)
    let sanitizedSku = null;
    if (sku !== undefined && sku !== null && String(sku).trim()) {
      sanitizedSku = String(sku).trim().toUpperCase();

      const { data: existingSku } = await db
        .from('product_variants')
        .select('id, sku, variant_name')
        .eq('sku', sanitizedSku)
        .neq('id', variantId)
        .maybeSingle();

      if (existingSku) {
        return res.status(409).json({
          success: false,
          message: `SKU "${sanitizedSku}" is already used by another variant ("${existingSku.variant_name}"). SKUs must be unique.`
        });
      }
    }

    const updateData = {
      variant_name: variant_name.trim(),
      attribute_name: attribute_name.trim(),
      attribute_value: attribute_value.trim(),
      price_extra: Number(numPriceExtra.toFixed(2)),
      sku: sanitizedSku,
      updated_at: new Date().toISOString()
    };

    if (is_active !== undefined) {
      updateData.is_active = Boolean(is_active);
    }

    const { data: updatedVariant, error: updateErr } = await db
      .from('product_variants')
      .update(updateData)
      .eq('id', variantId)
      .select('*')
      .single();

    if (updateErr) {
      console.error('[updateVariant] Update error:', updateErr.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to update variant in database.',
        error: updateErr.message
      });
    }

    return res.status(200).json({
      success: true,
      message: `Variant "${updatedVariant.variant_name}" updated successfully.`,
      variant: formatVariant(updatedVariant, product.sales_price)
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/products/:id/variants/:variantId/status
 * Activate or Deactivate a variant.
 * Restricted to ADMIN role only.
 */
export const updateVariantStatus = async (req, res, next) => {
  try {
    const { id, variantId } = req.params;

    if (!isValidUUID(id) || !isValidUUID(variantId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product or variant ID format. Expected standard UUIDs.'
      });
    }

    if (!isSupabaseConfigured() || !supabaseAdmin) {
      return res.status(503).json({
        success: false,
        message: 'Backend Supabase connection is not configured in .env'
      });
    }

    const db = req.userClient || supabaseAdmin;

    // Check parent product
    const { data: product } = await db
      .from('products')
      .select('id, name, sales_price')
      .eq('id', id)
      .maybeSingle();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product with ID ${id} was not found.`
      });
    }

    // Check variant
    const { data: variant, error: fetchErr } = await db
      .from('product_variants')
      .select('*')
      .eq('id', variantId)
      .maybeSingle();

    if (fetchErr || !variant) {
      return res.status(404).json({
        success: false,
        message: `Variant with ID ${variantId} was not found.`
      });
    }

    if (variant.product_id !== id) {
      return res.status(400).json({
        success: false,
        message: `Variant mismatch: Variant "${variant.variant_name}" does not belong to product "${product.name}".`
      });
    }

    // Determine target active status
    let targetStatus;
    if (req.body.is_active !== undefined) {
      if (typeof req.body.is_active !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'is_active field must be a boolean (true or false).'
        });
      }
      targetStatus = req.body.is_active;
    } else {
      // Toggle
      targetStatus = variant.is_active === false ? true : false;
    }

    const { data: updatedVariant, error: updateErr } = await db
      .from('product_variants')
      .update({
        is_active: targetStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', variantId)
      .select('*')
      .single();

    if (updateErr) {
      console.error('[updateVariantStatus] Status update error:', updateErr.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to update variant status.',
        error: updateErr.message
      });
    }

    const actionText = targetStatus ? 'activated' : 'deactivated';

    return res.status(200).json({
      success: true,
      message: `Variant "${variant.variant_name}" has been ${actionText} successfully.`,
      variant: formatVariant(updatedVariant, product.sales_price)
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/variants
 * List all variants across all products.
 * Accessible by ADMIN and STAFF.
 */
export const listAllVariants = async (req, res, next) => {
  try {
    if (!isSupabaseConfigured() || !supabaseAdmin) {
      return res.status(503).json({
        success: false,
        message: 'Backend Supabase connection is not configured in .env'
      });
    }

    const { status = 'ALL', search = '', page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'desc' } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    const db = req.userClient || supabaseAdmin;

    let query = db
      .from('product_variants')
      .select('*, products(id, name, sales_price, is_active)', { count: 'exact' });

    if (status && status !== 'ALL') {
      if (status.toLowerCase() === 'active') {
        query = query.eq('is_active', true);
      } else if (status.toLowerCase() === 'inactive') {
        query = query.eq('is_active', false);
      }
    }

    if (search.trim()) {
      query = query.ilike('variant_name', `%${search.trim()}%`);
    }

    const allowedSort = ['variant_name', 'price_extra', 'created_at', 'sku'];
    const safeSortBy = allowedSort.includes(sortBy) ? sortBy : 'created_at';
    query = query.order(safeSortBy, { ascending: sortOrder.toLowerCase() === 'asc' });

    query = query.range(offset, offset + limitNum - 1);

    const { data: variants, count, error } = await query;

    if (error) {
      console.error('[listAllVariants] Query error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve catalog variants.',
        error: error.message
      });
    }

    const formattedVariants = (variants || []).map((v) => {
      const parentSalesPrice = v.products ? Number(v.products.sales_price) : 0;
      const formatted = formatVariant(v, parentSalesPrice);
      formatted.product_name = v.products?.name || 'Unknown Product';
      formatted.product_is_active = v.products?.is_active !== false;
      return formatted;
    });

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limitNum) || 1;

    return res.status(200).json({
      success: true,
      variants: formattedVariants,
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


export const getVariantsByProductId = listVariants;
