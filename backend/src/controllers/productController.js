import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase.js';

/**
 * Helper to validate UUID format
 */
const isValidUUID = (id) => {
  if (typeof id !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
};

/**
 * Format product record and enforce security redactions.
 * If user is not ADMIN (e.g. STAFF), cost_price is strictly redacted.
 */
const formatProduct = (product, userRole) => {
  if (!product) return null;

  const formatted = {
    ...product,
    sales_price: Number(product.sales_price) || 0,
    variant_count: Array.isArray(product.product_variants)
      ? product.product_variants.length
      : (product.variant_count !== undefined ? Number(product.variant_count) : 0)
  };

  // Include cost_price ONLY for ADMIN users
  if (userRole === 'ADMIN') {
    formatted.cost_price = Number(product.cost_price) || 0;
  } else {
    delete formatted.cost_price;
  }

  return formatted;
};

/**
 * GET /api/products
 * List products with search, type filter, status filter, and pagination.
 * Accessible by ADMIN and STAFF (STAFF receives cost_price redacted).
 */
export const listProducts = async (req, res, next) => {
  try {
    if (!isSupabaseConfigured() || !supabaseAdmin) {
      return res.status(503).json({
        success: false,
        message: 'Backend Supabase connection is not configured in .env'
      });
    }

    const {
      search = '',
      type = '',
      status = '',
      page = 1,
      limit = 10,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    // Use user-scoped client if available, else admin
    const db = req.userClient || supabaseAdmin;

    // Build select query with product_variants relation to compute variant count
    let query = db
      .from('products')
      .select('id, name, type, sales_price, cost_price, notes, is_active, created_at, updated_at, product_variants(id)', { count: 'exact' });

    // Filter by search query (case-insensitive on name)
    if (search.trim()) {
      query = query.ilike('name', `%${search.trim()}%`);
    }

    // Filter by type
    if (type && type !== 'ALL') {
      const normalizedType = type.toLowerCase();
      if (['service', 'goods', 'digital'].includes(normalizedType)) {
        query = query.eq('type', normalizedType);
      }
    }

    // Filter by active / archived status
    if (status && status !== 'ALL') {
      if (status.toLowerCase() === 'active') {
        query = query.eq('is_active', true);
      } else if (status.toLowerCase() === 'archived' || status.toLowerCase() === 'inactive') {
        query = query.eq('is_active', false);
      }
    }

    // Sorting
    const allowedSortFields = ['created_at', 'updated_at', 'name', 'sales_price'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const isAscending = sortOrder.toLowerCase() === 'asc';
    query = query.order(safeSortBy, { ascending: isAscending });

    // Pagination
    query = query.range(offset, offset + limitNum - 1);

    const { data, count, error } = await query;

    if (error) {
      console.error('[listProducts] Supabase query error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve products from database.',
        error: error.message
      });
    }

    // Format products and redact cost_price for non-admin
    const products = (data || []).map((p) => formatProduct(p, req.user?.role));
    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limitNum) || 1;

    return res.status(200).json({
      success: true,
      products,
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
 * GET /api/products/:id
 * Retrieve a single product by ID with variant count and details.
 * Accessible by ADMIN and STAFF (cost_price redacted for STAFF).
 */
export const getProductById = async (req, res, next) => {
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

    const { data: product, error } = await db
      .from('products')
      .select('id, name, type, sales_price, cost_price, notes, is_active, created_at, updated_at, product_variants(id, variant_name, attribute_name, attribute_value, price_extra, sku)')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('[getProductById] Supabase query error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve product details.',
        error: error.message
      });
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product with ID ${id} was not found.`
      });
    }

    const formatted = formatProduct(product, req.user?.role);
    // Keep variants array in single product detail
    formatted.variants = product.product_variants || [];
    delete formatted.product_variants;

    return res.status(200).json({
      success: true,
      product: formatted
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/products
 * Create a new product.
 * Restricted to ADMIN role only.
 */
export const createProduct = async (req, res, next) => {
  try {
    if (!isSupabaseConfigured() || !supabaseAdmin) {
      return res.status(503).json({
        success: false,
        message: 'Backend Supabase connection is not configured in .env'
      });
    }

    const { name, type = 'service', sales_price, cost_price, notes } = req.body;

    // Validation: Product Name
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Product name is required and cannot be blank.'
      });
    }

    if (name.trim().length > 255) {
      return res.status(400).json({
        success: false,
        message: 'Product name cannot exceed 255 characters.'
      });
    }

    // Validation: Product Type
    const validTypes = ['service', 'goods', 'digital'];
    const normalizedType = typeof type === 'string' ? type.trim().toLowerCase() : 'service';
    if (!validTypes.includes(normalizedType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid product type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    // Validation: Sales Price
    if (sales_price === undefined || sales_price === null || sales_price === '') {
      return res.status(400).json({
        success: false,
        message: 'Sales price is required.'
      });
    }

    const numSalesPrice = Number(sales_price);
    if (isNaN(numSalesPrice) || !isFinite(numSalesPrice) || numSalesPrice < 0) {
      return res.status(400).json({
        success: false,
        message: 'Sales price must be a valid non-negative number.'
      });
    }

    // Validation: Cost Price
    if (cost_price === undefined || cost_price === null || cost_price === '') {
      return res.status(400).json({
        success: false,
        message: 'Cost price is required.'
      });
    }

    const numCostPrice = Number(cost_price);
    if (isNaN(numCostPrice) || !isFinite(numCostPrice) || numCostPrice < 0) {
      return res.status(400).json({
        success: false,
        message: 'Cost price must be a valid non-negative number.'
      });
    }

    // Validation: Notes
    let sanitizedNotes = null;
    if (notes !== undefined && notes !== null) {
      if (typeof notes !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Notes must be text.'
        });
      }
      sanitizedNotes = notes.trim() || null;
    }

    // Validation: Optional Initial Variants
    const { variants = [] } = req.body;
    const sanitizedVariants = [];
    if (variants !== undefined && variants !== null) {
      if (!Array.isArray(variants)) {
        return res.status(400).json({
          success: false,
          message: 'Variants must be an array of variant objects.'
        });
      }

      const seenSkus = new Set();
      for (let i = 0; i < variants.length; i++) {
        const v = variants[i];
        if (!v || typeof v !== 'object') {
          return res.status(400).json({
            success: false,
            message: `Variant at index ${i} must be a valid object.`
          });
        }

        if (!v.variant_name || typeof v.variant_name !== 'string' || !v.variant_name.trim()) {
          return res.status(400).json({
            success: false,
            message: `Variant at index ${i}: variant_name is required.`
          });
        }

        if (!v.attribute_name || typeof v.attribute_name !== 'string' || !v.attribute_name.trim()) {
          return res.status(400).json({
            success: false,
            message: `Variant "${v.variant_name}": attribute_name is required.`
          });
        }

        if (!v.attribute_value || typeof v.attribute_value !== 'string' || !v.attribute_value.trim()) {
          return res.status(400).json({
            success: false,
            message: `Variant "${v.variant_name}": attribute_value is required.`
          });
        }

        const numExtra = v.price_extra !== undefined && v.price_extra !== null && v.price_extra !== ''
          ? Number(v.price_extra)
          : 0;

        if (isNaN(numExtra) || !isFinite(numExtra) || numExtra < 0) {
          return res.status(400).json({
            success: false,
            message: `Variant "${v.variant_name}": price_extra must be a valid non-negative number.`
          });
        }

        let skuVal = null;
        if (v.sku !== undefined && v.sku !== null && String(v.sku).trim()) {
          skuVal = String(v.sku).trim().toUpperCase();
          if (seenSkus.has(skuVal)) {
            return res.status(409).json({
              success: false,
              message: `Duplicate SKU "${skuVal}" specified within product variants list.`
            });
          }
          seenSkus.add(skuVal);
        }

        sanitizedVariants.push({
          variant_name: v.variant_name.trim(),
          attribute_name: v.attribute_name.trim(),
          attribute_value: v.attribute_value.trim(),
          price_extra: Number(numExtra.toFixed(2)),
          sku: skuVal,
          is_active: v.is_active !== false
        });
      }
    }

    const db = req.userClient || supabaseAdmin;

    // Check SKU collisions in existing database catalog
    if (sanitizedVariants.length > 0) {
      const skuList = sanitizedVariants.map(v => v.sku).filter(Boolean);
      if (skuList.length > 0) {
        const { data: existingSkuRecords, error: skuCheckErr } = await db
          .from('product_variants')
          .select('sku, variant_name')
          .in('sku', skuList);

        if (skuCheckErr) {
          console.warn('[createProduct] SKU check warning:', skuCheckErr.message);
        } else if (existingSkuRecords && existingSkuRecords.length > 0) {
          return res.status(409).json({
            success: false,
            message: `SKU "${existingSkuRecords[0].sku}" already exists in the catalog (assigned to variant "${existingSkuRecords[0].variant_name}"). SKUs must be unique.`
          });
        }
      }
    }

    const newProductData = {
      name: name.trim(),
      type: normalizedType,
      sales_price: Number(numSalesPrice.toFixed(2)),
      cost_price: Number(numCostPrice.toFixed(2)),
      notes: sanitizedNotes,
      is_active: true
    };

    const { data: createdProduct, error } = await db
      .from('products')
      .insert(newProductData)
      .select('id, name, type, sales_price, cost_price, notes, is_active, created_at, updated_at')
      .single();

    if (error) {
      console.error('[createProduct] Supabase insert error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to create product in database.',
        error: error.message
      });
    }

    // Insert variants if provided
    let createdVariants = [];
    if (sanitizedVariants.length > 0) {
      const variantRows = sanitizedVariants.map(v => ({
        ...v,
        product_id: createdProduct.id
      }));

      const { data: insertedVariants, error: varInsertErr } = await db
        .from('product_variants')
        .insert(variantRows)
        .select('*');

      if (varInsertErr) {
        console.error('[createProduct] Failed creating initial variants:', varInsertErr.message);
        // Rollback created product to preserve integrity
        await db.from('products').delete().eq('id', createdProduct.id);
        return res.status(500).json({
          success: false,
          message: 'Failed to create initial product variants in database.',
          error: varInsertErr.message
        });
      }

      createdVariants = insertedVariants || [];
    }

    const formatted = formatProduct(createdProduct, req.user?.role);
    formatted.variants = createdVariants.map(v => ({
      ...v,
      final_price: Number((formatted.sales_price + Number(v.price_extra || 0)).toFixed(2))
    }));
    formatted.variant_count = createdVariants.length;

    return res.status(201).json({
      success: true,
      message: sanitizedVariants.length > 0
        ? `Product "${createdProduct.name}" and ${createdVariants.length} variant(s) created successfully.`
        : 'Product created successfully.',
      product: formatted
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/products/:id
 * Update an existing product.
 * Restricted to ADMIN role only.
 * Prevents accidental modifications to id, created_at, or is_active.
 */
export const updateProduct = async (req, res, next) => {
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

    // Check if product exists
    const { data: existingProduct, error: fetchError } = await db
      .from('products')
      .select('id, is_active')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) {
      console.error('[updateProduct] Fetch check error:', fetchError.message);
      return res.status(500).json({
        success: false,
        message: 'Error verifying existing product.',
        error: fetchError.message
      });
    }

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: `Product with ID ${id} does not exist.`
      });
    }

    const { name, type, sales_price, cost_price, notes } = req.body;

    // Validation: Product Name
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Product name is required and cannot be blank.'
      });
    }

    if (name.trim().length > 255) {
      return res.status(400).json({
        success: false,
        message: 'Product name cannot exceed 255 characters.'
      });
    }

    // Validation: Product Type
    const validTypes = ['service', 'goods', 'digital'];
    const normalizedType = typeof type === 'string' ? type.trim().toLowerCase() : 'service';
    if (!validTypes.includes(normalizedType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid product type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    // Validation: Sales Price
    if (sales_price === undefined || sales_price === null || sales_price === '') {
      return res.status(400).json({
        success: false,
        message: 'Sales price is required.'
      });
    }

    const numSalesPrice = Number(sales_price);
    if (isNaN(numSalesPrice) || !isFinite(numSalesPrice) || numSalesPrice < 0) {
      return res.status(400).json({
        success: false,
        message: 'Sales price must be a valid non-negative number.'
      });
    }

    // Validation: Cost Price
    if (cost_price === undefined || cost_price === null || cost_price === '') {
      return res.status(400).json({
        success: false,
        message: 'Cost price is required.'
      });
    }

    const numCostPrice = Number(cost_price);
    if (isNaN(numCostPrice) || !isFinite(numCostPrice) || numCostPrice < 0) {
      return res.status(400).json({
        success: false,
        message: 'Cost price must be a valid non-negative number.'
      });
    }

    // Validation: Notes
    let sanitizedNotes = null;
    if (notes !== undefined && notes !== null) {
      if (typeof notes !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Notes must be text.'
        });
      }
      sanitizedNotes = notes.trim() || null;
    }

    // Strictly update allowed fields (preserves id, created_at, is_active)
    const updateData = {
      name: name.trim(),
      type: normalizedType,
      sales_price: Number(numSalesPrice.toFixed(2)),
      cost_price: Number(numCostPrice.toFixed(2)),
      notes: sanitizedNotes,
      updated_at: new Date().toISOString()
    };

    const { data: updatedProduct, error: updateError } = await db
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select('id, name, type, sales_price, cost_price, notes, is_active, created_at, updated_at')
      .single();

    if (updateError) {
      console.error('[updateProduct] Update error:', updateError.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to update product.',
        error: updateError.message
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully.',
      product: formatProduct(updatedProduct, req.user?.role)
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/products/:id/status
 * Soft archive or reactivate a product using is_active field.
 * Restricted to ADMIN role only.
 */
export const updateProductStatus = async (req, res, next) => {
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

    // Check if product exists
    const { data: existingProduct, error: fetchError } = await db
      .from('products')
      .select('id, name, is_active')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) {
      console.error('[updateProductStatus] Fetch error:', fetchError.message);
      return res.status(500).json({
        success: false,
        message: 'Error verifying existing product.',
        error: fetchError.message
      });
    }

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: `Product with ID ${id} was not found.`
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
      // Toggle if not explicitly passed
      targetStatus = !existingProduct.is_active;
    }

    const { data: updatedProduct, error: updateError } = await db
      .from('products')
      .update({
        is_active: targetStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('id, name, type, sales_price, cost_price, notes, is_active, created_at, updated_at')
      .single();

    if (updateError) {
      console.error('[updateProductStatus] Status update error:', updateError.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to update product status.',
        error: updateError.message
      });
    }

    const actionText = targetStatus ? 'reactivated' : 'archived';

    return res.status(200).json({
      success: true,
      message: `Product "${existingProduct.name}" has been ${actionText} successfully.`,
      product: formatProduct(updatedProduct, req.user?.role)
    });
  } catch (err) {
    next(err);
  }
};

