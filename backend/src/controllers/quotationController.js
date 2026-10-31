import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase.js';
import {
  sanitizeString,
  isValidUUID,
  parsePagination
} from '../utils/validators.js';
import {
  calculateLineItem,
  calculateQuotationTotals,
  roundToTwo
} from '../utils/calculator.js';

/**
 * Quotation Management Controller (Member 2 - Phase 04)
 * Handles quotation creation, line item snapshotting, server-side math,
 * retrieval, draft editing, and lifecycle state transitions.
 */

const ensureSupabase = (res) => {
  if (!isSupabaseConfigured() || !supabaseAdmin) {
    res.status(503).json({
      success: false,
      message: 'Database connection is not configured in backend/.env'
    });
    return false;
  }
  return true;
};

/**
 * Task 4.1, 4.2 & 4.3 – Create Quotation API
 * POST /api/quotations
 */
export const createQuotation = async (req, res, next) => {
  try {
    if (!ensureSupabase(res)) return;

    const {
      customer_id,
      template_id,
      validity_date,
      validity_days = 30,
      payment_terms = 'Due on receipt',
      terms_and_conditions,
      discount_amount = 0,
      lines
    } = req.body;

    // 1. Customer validation (Must exist and be ACTIVE)
    if (!customer_id || !isValidUUID(customer_id)) {
      return res.status(400).json({
        success: false,
        message: 'Valid customer_id UUID is required.'
      });
    }

    const { data: customer, error: customerError } = await supabaseAdmin
      .from('customers')
      .select('id, name, status')
      .eq('id', customer_id)
      .single();

    if (customerError || !customer) {
      return res.status(404).json({
        success: false,
        message: `Customer with ID '${customer_id}' does not exist.`
      });
    }

    if (customer.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: `Cannot generate quotation for customer in '${customer.status}' standing. Customer must be ACTIVE.`
      });
    }

    // 2. Validate template_id if provided
    if (template_id && !isValidUUID(template_id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid template_id UUID format.'
      });
    }

    // 3. Line items validation (At least one line item required)
    if (!Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'A quotation must have at least one valid line item.'
      });
    }

    // 4. Calculate validity date
    let targetValidityDate;
    if (validity_date) {
      const parsedDate = new Date(validity_date);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid validity_date format. Expected YYYY-MM-DD.'
        });
      }
      targetValidityDate = parsedDate.toISOString().split('T')[0];
    } else {
      const days = Math.max(1, parseInt(validity_days, 10) || 30);
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + days);
      targetValidityDate = expiry.toISOString().split('T')[0];
    }

    // 5. Query products and taxes to compute lines with zero client trust (VULN-001)
    const productIds = lines.map((l) => l.product_id).filter(Boolean);
    const taxIds = lines.map((l) => l.tax_id).filter(Boolean);

    const [productsRes, taxesRes] = await Promise.all([
      supabaseAdmin.from('products').select('id, name, sales_price, is_active').in('id', productIds),
      taxIds.length > 0
        ? supabaseAdmin.from('taxes').select('id, name, rate_percentage').in('id', taxIds)
        : Promise.resolve({ data: [] })
    ]);

    const productMap = new Map((productsRes.data || []).map((p) => [p.id, p]));
    const taxMap = new Map((taxesRes.data || []).map((t) => [t.id, t]));

    const calculatedLines = [];
    for (let i = 0; i < lines.length; i++) {
      const item = lines[i];
      if (!item.product_id || !isValidUUID(item.product_id)) {
        return res.status(400).json({
          success: false,
          message: `Line ${i + 1}: product_id must be a valid UUID.`
        });
      }

      const product = productMap.get(item.product_id);
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Line ${i + 1}: Product with ID '${item.product_id}' was not found in catalog.`
        });
      }

      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      // Staff can enter custom unit price if >= 0, otherwise default to product sales_price
      const unitPrice = item.unit_price !== undefined && parseFloat(item.unit_price) >= 0
        ? parseFloat(item.unit_price)
        : parseFloat(product.sales_price);

      let taxPercentage = 0;
      let validTaxId = null;
      if (item.tax_id && taxMap.has(item.tax_id)) {
        validTaxId = item.tax_id;
        taxPercentage = parseFloat(taxMap.get(item.tax_id).rate_percentage) || 0;
      }

      const lineCalculations = calculateLineItem(qty, unitPrice, taxPercentage);

      calculatedLines.push({
        product_id: product.id,
        product_name_snapshot: product.name,
        quantity: lineCalculations.quantity,
        unit_price: lineCalculations.unitPrice,
        tax_id: validTaxId,
        tax_percentage_snapshot: lineCalculations.taxRate,
        line_subtotal: lineCalculations.lineSubtotal,
        line_tax: lineCalculations.lineTax,
        line_total: lineCalculations.lineTotal
      });
    }

    // 6. Aggregate totals
    const totals = calculateQuotationTotals(calculatedLines, discount_amount);

    // 7. Insert quotation header
    const quotationPayload = {
      customer_id,
      template_id: template_id || null,
      quotation_date: new Date().toISOString().split('T')[0],
      validity_date: targetValidityDate,
      status: 'DRAFT',
      subtotal: totals.subtotal,
      discount_amount: totals.discountAmount,
      tax_amount: totals.taxAmount,
      grand_total: totals.grandTotal,
      payment_terms: sanitizeString(payment_terms, 255),
      terms_and_conditions: sanitizeString(terms_and_conditions, 2000),
      created_by: req.user?.id || null
    };

    const { data: quotation, error: quoteError } = await supabaseAdmin
      .from('quotations')
      .insert(quotationPayload)
      .select()
      .single();

    if (quoteError) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create quotation header.',
        error: quoteError.message
      });
    }

    // 8. Insert quotation lines with snapshots
    const linePayloads = calculatedLines.map((line) => ({
      ...line,
      quotation_id: quotation.id
    }));

    const { data: createdLines, error: linesError } = await supabaseAdmin
      .from('quotation_lines')
      .insert(linePayloads)
      .select();

    if (linesError) {
      console.error('Failed to insert lines for quotation:', linesError);
      return res.status(500).json({
        success: false,
        message: 'Quotation header created but failed to save line items.',
        error: linesError.message
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Quotation created successfully as Draft.',
      quotation: {
        ...quotation,
        lines: createdLines
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Task 4.4 – Retrieve Quotations
 * GET /api/quotations
 * Filters: page, limit, sortBy, sortOrder, status, customer_id, dateFrom, dateTo, q
 */
export const listQuotations = async (req, res, next) => {
  try {
    if (!ensureSupabase(res)) return;

    const { page, limit, from, to } = parsePagination(req.query);
    const {
      sortBy = 'created_at',
      sortOrder = 'desc',
      status,
      customer_id,
      dateFrom,
      dateTo,
      q
    } = req.query;

    const allowedSortFields = ['created_at', 'quotation_number', 'quotation_date', 'validity_date', 'grand_total', 'status'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const isAscending = String(sortOrder).toLowerCase() === 'asc';

    let query = supabaseAdmin
      .from('quotations')
      .select(`
        id,
        quotation_number,
        quotation_date,
        validity_date,
        status,
        subtotal,
        discount_amount,
        tax_amount,
        grand_total,
        payment_terms,
        created_at,
        customer:customers (
          id,
          customer_number,
          name,
          email,
          company_name
        )
      `, { count: 'exact' });

    // Status filter
    if (status && ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED'].includes(status.toUpperCase())) {
      query = query.eq('status', status.toUpperCase());
    }

    // Customer filter
    if (customer_id && isValidUUID(customer_id)) {
      query = query.eq('customer_id', customer_id);
    }

    // Date range filters
    if (dateFrom) {
      query = query.gte('quotation_date', dateFrom);
    }
    if (dateTo) {
      query = query.lte('quotation_date', dateTo);
    }

    // Search query on quotation_number
    if (q && typeof q === 'string' && q.trim()) {
      const sanitizedQ = q.trim().replace(/[%_]/g, '');
      if (sanitizedQ.length > 0) {
        query = query.ilike('quotation_number', `%${sanitizedQ}%`);
      }
    }

    query = query
      .order(safeSortBy, { ascending: isAscending })
      .range(from, to);

    const { data: quotations, count, error } = await query;

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve quotations.',
        error: error.message
      });
    }

    const totalRecords = count || 0;
    const totalPages = Math.ceil(totalRecords / limit);

    return res.status(200).json({
      success: true,
      quotations: quotations || [],
      pagination: {
        page,
        limit,
        totalRecords,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Task 4.5 – Retrieve Individual Quotation
 * GET /api/quotations/:id
 */
export const getQuotation = async (req, res, next) => {
  try {
    if (!ensureSupabase(res)) return;

    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid quotation ID format. Must be a valid UUID.'
      });
    }

    const { data: quotation, error: quoteError } = await supabaseAdmin
      .from('quotations')
      .select(`
        *,
        customer:customers (
          id,
          customer_number,
          name,
          email,
          phone,
          company_name,
          billing_address,
          tax_id
        ),
        template:quotation_templates (
          id,
          name
        )
      `)
      .eq('id', id)
      .single();

    if (quoteError || !quotation) {
      return res.status(404).json({
        success: false,
        message: `Quotation with ID '${id}' was not found.`
      });
    }

    // Retrieve quotation lines with product references
    const { data: lines, error: linesError } = await supabaseAdmin
      .from('quotation_lines')
      .select(`
        id,
        product_id,
        product_name_snapshot,
        quantity,
        unit_price,
        tax_id,
        tax_percentage_snapshot,
        line_subtotal,
        line_tax,
        line_total
      `)
      .eq('quotation_id', id);

    // Check if quotation has already been converted to a subscription
    const { data: linkedSub } = await supabaseAdmin
      .from('subscriptions')
      .select('id, subscription_number, status')
      .eq('source_quotation_id', id)
      .maybeSingle();

    return res.status(200).json({
      success: true,
      quotation: {
        ...quotation,
        lines: lines || [],
        convertedSubscription: linkedSub || null
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Task 4.6 – Edit Quotation (Only Draft Quotations Can Be Modified)
 * PUT /api/quotations/:id
 */
export const updateQuotation = async (req, res, next) => {
  try {
    if (!ensureSupabase(res)) return;

    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid quotation ID format. Must be a valid UUID.'
      });
    }

    // 1. Verify quotation exists and is in DRAFT status
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('quotations')
      .select('id, status, quotation_number')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({
        success: false,
        message: `Quotation with ID '${id}' was not found.`
      });
    }

    if (existing.status !== 'DRAFT') {
      return res.status(400).json({
        success: false,
        message: `Quotation ${existing.quotation_number} is in '${existing.status}' status and cannot be edited. Only DRAFT quotations can be modified.`
      });
    }

    const {
      validity_date,
      payment_terms,
      terms_and_conditions,
      discount_amount,
      lines
    } = req.body;

    const updatePayload = {
      updated_at: new Date().toISOString()
    };

    if (payment_terms !== undefined) updatePayload.payment_terms = sanitizeString(payment_terms, 255);
    if (terms_and_conditions !== undefined) updatePayload.terms_and_conditions = sanitizeString(terms_and_conditions, 2000);
    if (validity_date !== undefined) {
      const parsedDate = new Date(validity_date);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid validity_date format. Expected YYYY-MM-DD.'
        });
      }
      updatePayload.validity_date = parsedDate.toISOString().split('T')[0];
    }

    // If lines array is provided, recalculate all line items and quotation totals server-side
    if (Array.isArray(lines)) {
      if (lines.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'A quotation must have at least one valid line item.'
        });
      }

      const productIds = lines.map((l) => l.product_id).filter(Boolean);
      const taxIds = lines.map((l) => l.tax_id).filter(Boolean);

      const [productsRes, taxesRes] = await Promise.all([
        supabaseAdmin.from('products').select('id, name, sales_price').in('id', productIds),
        taxIds.length > 0
          ? supabaseAdmin.from('taxes').select('id, name, rate_percentage').in('id', taxIds)
          : Promise.resolve({ data: [] })
      ]);

      const productMap = new Map((productsRes.data || []).map((p) => [p.id, p]));
      const taxMap = new Map((taxesRes.data || []).map((t) => [t.id, t]));

      const calculatedLines = [];
      for (let i = 0; i < lines.length; i++) {
        const item = lines[i];
        const product = productMap.get(item.product_id);
        if (!product) {
          return res.status(400).json({
            success: false,
            message: `Line ${i + 1}: Product with ID '${item.product_id}' was not found.`
          });
        }

        const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
        const unitPrice = item.unit_price !== undefined && parseFloat(item.unit_price) >= 0
          ? parseFloat(item.unit_price)
          : parseFloat(product.sales_price);

        let taxPercentage = 0;
        let validTaxId = null;
        if (item.tax_id && taxMap.has(item.tax_id)) {
          validTaxId = item.tax_id;
          taxPercentage = parseFloat(taxMap.get(item.tax_id).rate_percentage) || 0;
        }

        const lineCalc = calculateLineItem(qty, unitPrice, taxPercentage);
        calculatedLines.push({
          quotation_id: id,
          product_id: product.id,
          product_name_snapshot: product.name,
          quantity: lineCalc.quantity,
          unit_price: lineCalc.unitPrice,
          tax_id: validTaxId,
          tax_percentage_snapshot: lineCalc.taxRate,
          line_subtotal: lineCalc.lineSubtotal,
          line_tax: lineCalc.lineTax,
          line_total: lineCalc.lineTotal
        });
      }

      const totals = calculateQuotationTotals(
        calculatedLines,
        discount_amount !== undefined ? discount_amount : 0
      );

      updatePayload.subtotal = totals.subtotal;
      updatePayload.discount_amount = totals.discountAmount;
      updatePayload.tax_amount = totals.taxAmount;
      updatePayload.grand_total = totals.grandTotal;

      // Replace existing lines
      await supabaseAdmin.from('quotation_lines').delete().eq('quotation_id', id);
      await supabaseAdmin.from('quotation_lines').insert(calculatedLines);
    }

    const { data: updatedQuotation, error: updateError } = await supabaseAdmin
      .from('quotations')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update quotation.',
        error: updateError.message
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Draft quotation updated successfully.',
      quotation: updatedQuotation
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Task 4.7 – Mark Quotation as Sent
 * POST /api/quotations/:id/send
 */
export const sendQuotation = async (req, res, next) => {
  try {
    if (!ensureSupabase(res)) return;

    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid quotation ID format.'
      });
    }

    const { data: quotation, error: fetchError } = await supabaseAdmin
      .from('quotations')
      .select('id, quotation_number, status, validity_date')
      .eq('id', id)
      .single();

    if (fetchError || !quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found.'
      });
    }

    if (quotation.status !== 'DRAFT') {
      return res.status(400).json({
        success: false,
        message: `Only DRAFT quotations can be marked as Sent. Current status is ${quotation.status}.`
      });
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('quotations')
      .update({
        status: 'SENT',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({
        success: false,
        message: 'Failed to mark quotation as Sent.',
        error: updateError.message
      });
    }

    return res.status(200).json({
      success: true,
      message: `Quotation ${quotation.quotation_number} status updated to SENT.`,
      quotation: updated
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Task 4.7 & 4.8 – Accept Quotation (Validates Expiry Date)
 * POST /api/quotations/:id/accept
 */
export const acceptQuotation = async (req, res, next) => {
  try {
    if (!ensureSupabase(res)) return;

    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid quotation ID format.'
      });
    }

    const { data: quotation, error: fetchError } = await supabaseAdmin
      .from('quotations')
      .select('id, quotation_number, status, validity_date')
      .eq('id', id)
      .single();

    if (fetchError || !quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found.'
      });
    }

    if (!['SENT', 'DRAFT'].includes(quotation.status)) {
      return res.status(400).json({
        success: false,
        message: `Quotation cannot be accepted in '${quotation.status}' status.`
      });
    }

    // Task 4.8 & VULN-004 Enforcement: Prevent acceptance of expired quotations
    const today = new Date().toISOString().split('T')[0];
    if (quotation.validity_date < today) {
      // Mark as EXPIRED automatically
      await supabaseAdmin
        .from('quotations')
        .update({ status: 'EXPIRED', updated_at: new Date().toISOString() })
        .eq('id', id);

      return res.status(400).json({
        success: false,
        message: `Quotation ${quotation.quotation_number} expired on ${quotation.validity_date} and cannot be accepted. Quotation has been marked as EXPIRED.`
      });
    }

    const { data: acceptedQuote, error: updateError } = await supabaseAdmin
      .from('quotations')
      .update({
        status: 'ACCEPTED',
        accepted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({
        success: false,
        message: 'Failed to accept quotation.',
        error: updateError.message
      });
    }

    return res.status(200).json({
      success: true,
      message: `Quotation ${quotation.quotation_number} accepted successfully. You can now generate a subscription from this quotation.`,
      quotation: acceptedQuote
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Task 4.7 – Reject Quotation
 * POST /api/quotations/:id/reject
 */
export const rejectQuotation = async (req, res, next) => {
  try {
    if (!ensureSupabase(res)) return;

    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid quotation ID format.'
      });
    }

    const { data: quotation, error: fetchError } = await supabaseAdmin
      .from('quotations')
      .select('id, quotation_number, status')
      .eq('id', id)
      .single();

    if (fetchError || !quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found.'
      });
    }

    if (['ACCEPTED', 'REJECTED'].includes(quotation.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot reject quotation already in '${quotation.status}' status.`
      });
    }

    const { data: rejectedQuote, error: updateError } = await supabaseAdmin
      .from('quotations')
      .update({
        status: 'REJECTED',
        rejected_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({
        success: false,
        message: 'Failed to reject quotation.',
        error: updateError.message
      });
    }

    return res.status(200).json({
      success: true,
      message: `Quotation ${quotation.quotation_number} has been rejected.`,
      quotation: rejectedQuote
    });
  } catch (err) {
    next(err);
  }
};
