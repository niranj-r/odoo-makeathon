import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase.js';
import {
  validateEmail,
  validatePhone,
  sanitizeString,
  isValidUUID,
  parsePagination
} from '../utils/validators.js';

/**
 * Customer Management Controller (Member 2 - Phase 02)
 * Manages customer registration, listing, search, updates, and archival.
 */

// Helper to check Supabase configuration
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
 * Task 2.1 – Create Customer API
 * POST /api/customers
 */
export const createCustomer = async (req, res, next) => {
  try {
    if (!ensureSupabase(res)) return;

    const {
      name,
      email,
      phone,
      company_name,
      billing_address,
      tax_id,
      notes,
      profile_id
    } = req.body;

    // 1. Mandatory field validation
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Customer name is required and cannot be empty.'
      });
    }

    if (!email || !validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'A valid email address is required.'
      });
    }

    // 2. Phone format validation
    if (phone && !validatePhone(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format. Allowed: 7-25 digits with optional +, spaces, dashes.'
      });
    }

    // 3. Optional profile_id validation
    if (profile_id && !isValidUUID(profile_id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid profile_id UUID format.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = sanitizeString(name, 150);
    const cleanPhone = sanitizeString(phone, 30);
    const cleanCompany = sanitizeString(company_name, 150);
    const cleanAddress = sanitizeString(billing_address, 500);
    const cleanTaxId = sanitizeString(tax_id, 50);
    const cleanNotes = sanitizeString(notes, 1000);

    // 4. Duplicate check on active customers with same email
    const { data: existingCustomer } = await supabaseAdmin
      .from('customers')
      .select('id, customer_number, status')
      .eq('email', cleanEmail)
      .eq('status', 'ACTIVE')
      .maybeSingle();

    if (existingCustomer) {
      return res.status(409).json({
        success: false,
        message: `An active customer with email '${cleanEmail}' already exists (${existingCustomer.customer_number}).`
      });
    }

    // 5. Insert new customer into database
    const customerPayload = {
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      company_name: cleanCompany,
      billing_address: cleanAddress,
      tax_id: cleanTaxId,
      notes: cleanNotes,
      status: 'ACTIVE'
    };

    if (profile_id) {
      customerPayload.profile_id = profile_id;
    }

    const { data: customer, error: insertError } = await supabaseAdmin
      .from('customers')
      .insert(customerPayload)
      .select('id, customer_number, profile_id, name, email, phone, company_name, billing_address, tax_id, notes, status, created_at, updated_at')
      .single();

    if (insertError) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create customer record.',
        error: insertError.message
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Customer created successfully.',
      customer
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Task 2.2 & 2.5 – Retrieve & Search Customers
 * GET /api/customers
 * Query Params: page, limit, sortBy, sortOrder, status, q
 */
export const listCustomers = async (req, res, next) => {
  try {
    if (!ensureSupabase(res)) return;

    const { page, limit, from, to } = parsePagination(req.query);
    const { sortBy = 'created_at', sortOrder = 'desc', status, q } = req.query;

    // Allowed sorting columns to prevent SQL injection (VULN-008)
    const allowedSortFields = ['created_at', 'name', 'customer_number', 'company_name', 'status'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const isAscending = String(sortOrder).toLowerCase() === 'asc';

    let query = supabaseAdmin
      .from('customers')
      .select('id, customer_number, profile_id, name, email, phone, company_name, billing_address, tax_id, status, created_at, updated_at', { count: 'exact' });

    // Status filter
    if (status && ['ACTIVE', 'INACTIVE', 'ARCHIVED'].includes(status.toUpperCase())) {
      query = query.eq('status', status.toUpperCase());
    }

    // Search functionality (Task 2.5) across name, email, phone, company_name
    if (q && typeof q === 'string' && q.trim()) {
      const sanitizedQ = q.trim().replace(/[%_]/g, ''); // escape LIKE wildcards
      if (sanitizedQ.length > 0) {
        query = query.or(
          `name.ilike.%${sanitizedQ}%,email.ilike.%${sanitizedQ}%,phone.ilike.%${sanitizedQ}%,company_name.ilike.%${sanitizedQ}%,customer_number.ilike.%${sanitizedQ}%`
        );
      }
    }

    // Apply sorting and pagination
    query = query
      .order(safeSortBy, { ascending: isAscending })
      .range(from, to);

    const { data: customers, count, error } = await query;

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve customers.',
        error: error.message
      });
    }

    const totalRecords = count || 0;
    const totalPages = Math.ceil(totalRecords / limit);

    return res.status(200).json({
      success: true,
      customers: customers || [],
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
 * Task 2.3 – Retrieve Individual Customer
 * GET /api/customers/:id
 */
export const getCustomer = async (req, res, next) => {
  try {
    if (!ensureSupabase(res)) return;

    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid customer ID format. Must be a valid UUID.'
      });
    }

    // Retrieve customer record
    const { data: customer, error: customerError } = await supabaseAdmin
      .from('customers')
      .select('id, customer_number, profile_id, name, email, phone, company_name, billing_address, tax_id, notes, status, created_at, updated_at')
      .eq('id', id)
      .single();

    if (customerError || !customer) {
      return res.status(404).json({
        success: false,
        message: `Customer with ID '${id}' was not found.`
      });
    }

    // Fetch related quotation and subscription summary counts
    const [quotesRes, subsRes] = await Promise.all([
      supabaseAdmin
        .from('quotations')
        .select('id, status', { count: 'exact', head: false })
        .eq('customer_id', id)
        .order('created_at', { ascending: false })
        .limit(5),
      supabaseAdmin
        .from('subscriptions')
        .select('id, status, plan_name_snapshot, start_date, end_date', { count: 'exact', head: false })
        .eq('customer_id', id)
        .order('created_at', { ascending: false })
        .limit(5)
    ]);

    const stats = {
      totalQuotations: quotesRes.count || 0,
      totalSubscriptions: subsRes.count || 0,
      recentQuotations: quotesRes.data || [],
      recentSubscriptions: subsRes.data || []
    };

    return res.status(200).json({
      success: true,
      customer,
      stats
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Task 2.4 – Update Customer
 * PUT /api/customers/:id
 */
export const updateCustomer = async (req, res, next) => {
  try {
    if (!ensureSupabase(res)) return;

    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid customer ID format. Must be a valid UUID.'
      });
    }

    // 1. Verify customer exists
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('customers')
      .select('id, email, status')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({
        success: false,
        message: `Customer with ID '${id}' was not found.`
      });
    }

    const {
      name,
      email,
      phone,
      company_name,
      billing_address,
      tax_id,
      notes
    } = req.body;

    const updatePayload = {};

    // Validate and sanitize updated fields
    if (name !== undefined) {
      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Customer name cannot be empty.'
        });
      }
      updatePayload.name = sanitizeString(name, 150);
    }

    if (email !== undefined) {
      if (!validateEmail(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email address format.'
        });
      }
      const cleanEmail = email.trim().toLowerCase();
      // If email is changing, check uniqueness among active customers
      if (cleanEmail !== existing.email) {
        const { data: conflict } = await supabaseAdmin
          .from('customers')
          .select('id')
          .eq('email', cleanEmail)
          .eq('status', 'ACTIVE')
          .neq('id', id)
          .maybeSingle();

        if (conflict) {
          return res.status(409).json({
            success: false,
            message: `Another active customer is already registered with email '${cleanEmail}'.`
          });
        }
      }
      updatePayload.email = cleanEmail;
    }

    if (phone !== undefined) {
      if (phone && !validatePhone(phone)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid phone number format.'
        });
      }
      updatePayload.phone = sanitizeString(phone, 30);
    }

    if (company_name !== undefined) {
      updatePayload.company_name = sanitizeString(company_name, 150);
    }

    if (billing_address !== undefined) {
      updatePayload.billing_address = sanitizeString(billing_address, 500);
    }

    if (tax_id !== undefined) {
      updatePayload.tax_id = sanitizeString(tax_id, 50);
    }

    if (notes !== undefined) {
      updatePayload.notes = sanitizeString(notes, 1000);
    }

    if (Object.keys(updatePayload).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid customer fields provided for update.'
      });
    }

    updatePayload.updated_at = new Date().toISOString();

    const { data: updatedCustomer, error: updateError } = await supabaseAdmin
      .from('customers')
      .update(updatePayload)
      .eq('id', id)
      .select('id, customer_number, profile_id, name, email, phone, company_name, billing_address, tax_id, notes, status, created_at, updated_at')
      .single();

    if (updateError) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update customer record.',
        error: updateError.message
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Customer updated successfully.',
      customer: updatedCustomer
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Task 2.6 – Customer Deactivation / Status Management
 * PATCH /api/customers/:id/status
 */
export const updateCustomerStatus = async (req, res, next) => {
  try {
    if (!ensureSupabase(res)) return;

    const { id } = req.params;
    const { status } = req.body;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid customer ID format. Must be a valid UUID.'
      });
    }

    const permittedStatuses = ['ACTIVE', 'INACTIVE', 'ARCHIVED'];
    if (!status || !permittedStatuses.includes(status.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Permitted values: ${permittedStatuses.join(', ')}`
      });
    }

    const newStatus = status.toUpperCase();

    // 1. Verify customer exists
    const { data: customer, error: fetchError } = await supabaseAdmin
      .from('customers')
      .select('id, customer_number, name, status')
      .eq('id', id)
      .single();

    if (fetchError || !customer) {
      return res.status(404).json({
        success: false,
        message: `Customer with ID '${id}' was not found.`
      });
    }

    // 2. Prevent deactivation if active subscriptions exist (Task 2.6 & VULN-006)
    if (newStatus !== 'ACTIVE') {
      const { data: activeSubs, error: subsError } = await supabaseAdmin
        .from('subscriptions')
        .select('id, subscription_number, status')
        .eq('customer_id', id)
        .in('status', ['ACTIVE', 'CONFIRMED', 'PAUSED'])
        .limit(1);

      if (activeSubs && activeSubs.length > 0) {
        return res.status(409).json({
          success: false,
          message: `Cannot change customer to ${newStatus}. Customer has active or paused subscription ${activeSubs[0].subscription_number}. Please close or cancel active subscriptions before deactivating customer.`,
          blockingSubscription: activeSubs[0]
        });
      }
    }

    // 3. Update customer status
    const { data: updatedCustomer, error: updateError } = await supabaseAdmin
      .from('customers')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('id, customer_number, name, email, status, updated_at')
      .single();

    if (updateError) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update customer status.',
        error: updateError.message
      });
    }

    return res.status(200).json({
      success: true,
      message: `Customer status updated to ${newStatus}.`,
      customer: updatedCustomer
    });
  } catch (err) {
    next(err);
  }
};
