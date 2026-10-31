import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase.js';
import {
  sanitizeString,
  isValidUUID,
  parsePagination
} from '../utils/validators.js';

/**
 * Quotation Template Management Controller (Member 2 - Phase 03)
 * Manages reusable quotation templates, default terms, validity periods, and preset lines.
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
 * Task 3.1 – Create Template API
 * POST /api/quotation-templates
 */
export const createTemplate = async (req, res, next) => {
  try {
    if (!ensureSupabase(res)) return;

    const {
      name,
      description,
      default_validity_days = 30,
      default_payment_terms,
      default_terms_and_conditions,
      lines
    } = req.body;

    // 1. Mandatory name validation
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Template name is required and cannot be empty.'
      });
    }

    // 2. Validity days validation
    const validityDays = parseInt(default_validity_days, 10);
    if (isNaN(validityDays) || validityDays <= 0 || validityDays > 365) {
      return res.status(400).json({
        success: false,
        message: 'Default validity period must be a positive integer between 1 and 365 days.'
      });
    }

    // 3. Optional lines validation
    if (lines !== undefined && !Array.isArray(lines)) {
      return res.status(400).json({
        success: false,
        message: 'Lines must be an array of preset product items.'
      });
    }

    if (Array.isArray(lines)) {
      for (let i = 0; i < lines.length; i++) {
        const item = lines[i];
        if (!item.product_id || !isValidUUID(item.product_id)) {
          return res.status(400).json({
            success: false,
            message: `Line ${i + 1}: product_id must be a valid UUID.`
          });
        }
        const qty = parseInt(item.quantity, 10);
        if (isNaN(qty) || qty < 1) {
          return res.status(400).json({
            success: false,
            message: `Line ${i + 1}: quantity must be at least 1.`
          });
        }
      }
    }

    const cleanName = sanitizeString(name, 150);
    const cleanDesc = sanitizeString(description, 500);
    const cleanPaymentTerms = sanitizeString(default_payment_terms, 255) || 'Payment due within 30 days';
    const cleanTermsConditions = sanitizeString(default_terms_and_conditions, 2000);

    // 4. Insert quotation template
    const { data: template, error: insertError } = await supabaseAdmin
      .from('quotation_templates')
      .insert({
        name: cleanName,
        description: cleanDesc,
        default_validity_days: validityDays,
        default_payment_terms: cleanPaymentTerms,
        default_terms_and_conditions: cleanTermsConditions,
        is_active: true
      })
      .select()
      .single();

    if (insertError) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create quotation template.',
        error: insertError.message
      });
    }

    // 5. Insert preset line items if provided
    let insertedLines = [];
    if (Array.isArray(lines) && lines.length > 0) {
      const linePayloads = lines.map((item) => ({
        template_id: template.id,
        product_id: item.product_id,
        quantity: parseInt(item.quantity, 10) || 1
      }));

      const { data: createdLines, error: linesError } = await supabaseAdmin
        .from('quotation_template_lines')
        .insert(linePayloads)
        .select('id, template_id, product_id, quantity, created_at');

      if (linesError) {
        console.error('Warning: Failed to insert some template lines:', linesError);
      } else {
        insertedLines = createdLines || [];
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Quotation template created successfully.',
      template: {
        ...template,
        lines: insertedLines
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Task 3.2 – Retrieve Templates
 * GET /api/quotation-templates
 * Query Params: page, limit, q, includeInactive
 */
export const listTemplates = async (req, res, next) => {
  try {
    if (!ensureSupabase(res)) return;

    const { page, limit, from, to } = parsePagination(req.query);
    const { q, includeInactive } = req.query;

    let query = supabaseAdmin
      .from('quotation_templates')
      .select('id, name, description, default_validity_days, default_payment_terms, default_terms_and_conditions, is_active, created_at, updated_at', { count: 'exact' });

    // Active filter by default unless includeInactive=true
    if (String(includeInactive).toLowerCase() !== 'true') {
      query = query.eq('is_active', true);
    }

    // Search query on name and description
    if (q && typeof q === 'string' && q.trim()) {
      const sanitizedQ = q.trim().replace(/[%_]/g, '');
      if (sanitizedQ.length > 0) {
        query = query.or(`name.ilike.%${sanitizedQ}%,description.ilike.%${sanitizedQ}%`);
      }
    }

    query = query
      .order('name', { ascending: true })
      .range(from, to);

    const { data: templates, count, error } = await query;

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve quotation templates.',
        error: error.message
      });
    }

    const totalRecords = count || 0;
    const totalPages = Math.ceil(totalRecords / limit);

    return res.status(200).json({
      success: true,
      templates: templates || [],
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
 * Task 3.3 – Retrieve Individual Template
 * GET /api/quotation-templates/:id
 */
export const getTemplate = async (req, res, next) => {
  try {
    if (!ensureSupabase(res)) return;

    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid template ID format. Must be a valid UUID.'
      });
    }

    // Retrieve template header
    const { data: template, error: templateError } = await supabaseAdmin
      .from('quotation_templates')
      .select('id, name, description, default_validity_days, default_payment_terms, default_terms_and_conditions, is_active, created_at, updated_at')
      .eq('id', id)
      .single();

    if (templateError || !template) {
      return res.status(404).json({
        success: false,
        message: `Quotation template with ID '${id}' was not found.`
      });
    }

    // Retrieve associated preset line items with product details
    const { data: lines, error: linesError } = await supabaseAdmin
      .from('quotation_template_lines')
      .select(`
        id,
        quantity,
        product:products (
          id,
          name,
          sales_price,
          type
        )
      `)
      .eq('template_id', id);

    if (linesError) {
      console.warn('Could not load line items for template:', linesError);
    }

    return res.status(200).json({
      success: true,
      template: {
        ...template,
        lines: lines || []
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Task 3.4 – Update Template
 * PUT /api/quotation-templates/:id
 */
export const updateTemplate = async (req, res, next) => {
  try {
    if (!ensureSupabase(res)) return;

    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid template ID format. Must be a valid UUID.'
      });
    }

    // Verify template exists
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('quotation_templates')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({
        success: false,
        message: `Quotation template with ID '${id}' was not found.`
      });
    }

    const {
      name,
      description,
      default_validity_days,
      default_payment_terms,
      default_terms_and_conditions,
      is_active,
      lines
    } = req.body;

    const updatePayload = {};

    if (name !== undefined) {
      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Template name cannot be empty.'
        });
      }
      updatePayload.name = sanitizeString(name, 150);
    }

    if (description !== undefined) {
      updatePayload.description = sanitizeString(description, 500);
    }

    if (default_validity_days !== undefined) {
      const validityDays = parseInt(default_validity_days, 10);
      if (isNaN(validityDays) || validityDays <= 0 || validityDays > 365) {
        return res.status(400).json({
          success: false,
          message: 'Default validity period must be between 1 and 365 days.'
        });
      }
      updatePayload.default_validity_days = validityDays;
    }

    if (default_payment_terms !== undefined) {
      updatePayload.default_payment_terms = sanitizeString(default_payment_terms, 255);
    }

    if (default_terms_and_conditions !== undefined) {
      updatePayload.default_terms_and_conditions = sanitizeString(default_terms_and_conditions, 2000);
    }

    if (is_active !== undefined) {
      updatePayload.is_active = Boolean(is_active);
    }

    updatePayload.updated_at = new Date().toISOString();

    const { data: updatedTemplate, error: updateError } = await supabaseAdmin
      .from('quotation_templates')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update quotation template.',
        error: updateError.message
      });
    }

    // If lines array is provided, replace existing template lines
    if (Array.isArray(lines)) {
      await supabaseAdmin
        .from('quotation_template_lines')
        .delete()
        .eq('template_id', id);

      if (lines.length > 0) {
        const linePayloads = lines.map((item) => ({
          template_id: id,
          product_id: item.product_id,
          quantity: Math.max(1, parseInt(item.quantity, 10) || 1)
        }));

        await supabaseAdmin
          .from('quotation_template_lines')
          .insert(linePayloads);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Quotation template updated successfully.',
      template: updatedTemplate
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Task 3.5 – Delete / Archive Template
 * DELETE /api/quotation-templates/:id
 */
export const deleteTemplate = async (req, res, next) => {
  try {
    if (!ensureSupabase(res)) return;

    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid template ID format. Must be a valid UUID.'
      });
    }

    const { data: template, error: fetchError } = await supabaseAdmin
      .from('quotation_templates')
      .select('id, name')
      .eq('id', id)
      .single();

    if (fetchError || !template) {
      return res.status(404).json({
        success: false,
        message: `Quotation template with ID '${id}' was not found.`
      });
    }

    // Soft-archive template (Task 3.5 & VULN-006: preserve existing quotations)
    const { data: archived, error: archiveError } = await supabaseAdmin
      .from('quotation_templates')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('id, name, is_active, updated_at')
      .single();

    if (archiveError) {
      return res.status(500).json({
        success: false,
        message: 'Failed to archive quotation template.',
        error: archiveError.message
      });
    }

    return res.status(200).json({
      success: true,
      message: `Quotation template '${template.name}' archived successfully. Existing quotations using this template remain intact.`,
      template: archived
    });
  } catch (err) {
    next(err);
  }
};
