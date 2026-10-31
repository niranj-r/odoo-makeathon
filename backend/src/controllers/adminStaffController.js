/**
 * BRIGHTLOOP - ADMIN STAFF CONTROLLER
 * Full management of internal staff accounts, invitations, profile updates, and status toggles.
 */

import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase.js';

// Helper to log staff actions safely
export const logActivity = async (db, staffId, action, entityType, entityId = null, details = {}) => {
  try {
    await db.from('staff_activity_logs').insert({
      staff_id: staffId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details
    });
  } catch (err) {
    // Graceful fallback if table not yet migrated
    console.warn('[logActivity] Warning: could not write to staff_activity_logs:', err.message);
  }
};

/**
 * List all staff accounts with search, status filtering, and pagination
 */
export const listStaff = async (req, res, next) => {
  try {
    if (!isSupabaseConfigured() || !supabaseAdmin) {
      return res.status(503).json({
        success: false,
        message: 'Backend Supabase connection is not configured in .env'
      });
    }

    const {
      search = '',
      status = '',
      page = 1,
      limit = 10
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    const db = req.userClient || supabaseAdmin;

    let query = db
      .from('profiles')
      .select('id, full_name, email, role, status, phone, created_at, updated_at', { count: 'exact' })
      .eq('role', 'STAFF');

    if (status && status !== 'ALL') {
      query = query.eq('status', status);
    }

    if (search && search.trim() !== '') {
      const searchTerm = search.trim();
      query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    const { data: staff, count, error } = await query;

    if (error) {
      // In case 'phone' column doesn't exist yet, retry without phone
      const fallback = await db
        .from('profiles')
        .select('id, full_name, email, role, status, created_at, updated_at', { count: 'exact' })
        .eq('role', 'STAFF')
        .order('created_at', { ascending: false })
        .range(offset, offset + limitNum - 1);

      if (fallback.error) {
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch staff directory.',
          error: fallback.error.message
        });
      }

      const total = fallback.count || 0;
      return res.status(200).json({
        success: true,
        staff: fallback.data || [],
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.max(1, Math.ceil(total / limitNum))
      });
    }

    const total = count || 0;
    const totalPages = Math.max(1, Math.ceil(total / limitNum));

    return res.status(200).json({
      success: true,
      staff: staff || [],
      total,
      page: pageNum,
      limit: limitNum,
      totalPages
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get staff details by ID
 */
export const getStaffById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Valid staff UUID is required.'
      });
    }

    const db = req.userClient || supabaseAdmin;

    let { data: staff, error } = await db
      .from('profiles')
      .select('id, full_name, email, role, status, phone, created_at, updated_at')
      .eq('id', id)
      .eq('role', 'STAFF')
      .single();

    if (error) {
      // Fallback without phone column
      const fallback = await db
        .from('profiles')
        .select('id, full_name, email, role, status, created_at, updated_at')
        .eq('id', id)
        .eq('role', 'STAFF')
        .single();
      staff = fallback.data;
    }

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found.'
      });
    }

    // Attempt to enrich with last login from Supabase Auth admin API
    try {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(id);
      if (authUser?.user) {
        staff.last_sign_in_at = authUser.user.last_sign_in_at || null;
      }
    } catch (_) {
      // Non-fatal if auth lookup is unpermitted
    }

    return res.status(200).json({
      success: true,
      staff
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Invite or create a new Staff account
 */
export const inviteOrAddStaff = async (req, res, next) => {
  try {
    const { email, full_name, phone = null, password, method = 'invite' } = req.body;

    if (!email || !full_name) {
      return res.status(400).json({
        success: false,
        message: 'Email and full name are required.'
      });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = full_name.trim();

    // Check duplicate account
    const { data: existingUser } = await supabaseAdmin
      .from('profiles')
      .select('id, email, role')
      .eq('email', trimmedEmail)
      .single();

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: `An account with email "${trimmedEmail}" already exists (Role: ${existingUser.role}).`
      });
    }

    let authUserId = null;

    if (method === 'invite') {
      const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        trimmedEmail,
        {
          data: {
            full_name: trimmedName,
            role: 'STAFF',
            phone: phone ? phone.trim() : null
          }
        }
      );

      if (inviteError || !inviteData?.user) {
        return res.status(400).json({
          success: false,
          message: inviteError?.message || 'Failed to dispatch staff invitation email. Try the temporary password method.',
          error: inviteError
        });
      }

      authUserId = inviteData.user.id;
    } else {
      if (!password) {
        return res.status(400).json({
          success: false,
          message: 'Temporary password is required for direct staff account creation.'
        });
      }

      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

      if (password.length <= 8 || !hasUpperCase || !hasLowerCase || !hasSpecialChar) {
        return res.status(400).json({
          success: false,
          message: 'Password must be longer than 8 characters, with uppercase, lowercase, and a special character.'
        });
      }

      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: trimmedEmail,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: trimmedName,
          role: 'STAFF',
          phone: phone ? phone.trim() : null
        }
      });

      if (authError || !authData?.user) {
        return res.status(400).json({
          success: false,
          message: authError?.message || 'Failed to create staff user account.'
        });
      }

      authUserId = authData.user.id;
    }

    // Upsert into public.profiles
    const profilePayload = {
      id: authUserId,
      email: trimmedEmail,
      full_name: trimmedName,
      role: 'STAFF',
      status: 'ACTIVE',
      updated_at: new Date().toISOString()
    };
    if (phone) profilePayload.phone = phone.trim();

    let { data: updatedProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert(profilePayload, { onConflict: 'id' })
      .select('id, full_name, email, role, status, created_at, updated_at')
      .single();

    if (profileError && profileError.message?.includes('phone')) {
      delete profilePayload.phone;
      const retry = await supabaseAdmin
        .from('profiles')
        .upsert(profilePayload, { onConflict: 'id' })
        .select('id, full_name, email, role, status, created_at, updated_at')
        .single();
      updatedProfile = retry.data;
    }

    // Log administrative action
    await logActivity(supabaseAdmin, req.user?.id, 'STAFF_CREATED', 'profile', authUserId, {
      method,
      email: trimmedEmail,
      full_name: trimmedName
    });

    return res.status(201).json({
      success: true,
      message: method === 'invite'
        ? `Invitation successfully dispatched to ${trimmedEmail}.`
        : `Staff account provisioned successfully for ${trimmedName}.`,
      staff: updatedProfile || {
        id: authUserId,
        email: trimmedEmail,
        full_name: trimmedName,
        role: 'STAFF',
        status: 'ACTIVE'
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update staff details (full_name, phone)
 */
export const updateStaff = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { full_name, phone } = req.body;

    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Valid staff UUID is required.'
      });
    }

    if (!full_name || full_name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Full name is required.'
      });
    }

    const db = req.userClient || supabaseAdmin;

    const updatePayload = {
      full_name: full_name.trim(),
      updated_at: new Date().toISOString()
    };
    if (phone !== undefined) updatePayload.phone = phone ? phone.trim() : null;

    let { data: updated, error } = await db
      .from('profiles')
      .update(updatePayload)
      .eq('id', id)
      .eq('role', 'STAFF')
      .select('id, full_name, email, role, status, updated_at')
      .single();

    if (error && error.message?.includes('phone')) {
      delete updatePayload.phone;
      const retry = await db
        .from('profiles')
        .update(updatePayload)
        .eq('id', id)
        .eq('role', 'STAFF')
        .select('id, full_name, email, role, status, updated_at')
        .single();
      updated = retry.data;
    }

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Staff profile not found.'
      });
    }

    // Sync Auth metadata
    try {
      await supabaseAdmin.auth.admin.updateUserById(id, {
        user_metadata: { full_name: full_name.trim() }
      });
    } catch (_) {}

    // Log update
    await logActivity(supabaseAdmin, req.user?.id, 'STAFF_UPDATED', 'profile', id, {
      full_name: full_name.trim()
    });

    return res.status(200).json({
      success: true,
      message: 'Staff profile updated successfully.',
      staff: updated
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Toggle staff status (ACTIVE / INACTIVE)
 */
export const updateStaffStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Valid staff UUID is required.'
      });
    }

    if (!['ACTIVE', 'INACTIVE'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be ACTIVE or INACTIVE.'
      });
    }

    // Prevent admin from deactivating themselves
    if (req.user.id === id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot alter the active status of your own account.'
      });
    }

    const db = req.userClient || supabaseAdmin;

    const { data: updated, error } = await db
      .from('profiles')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('role', 'STAFF')
      .select('id, full_name, email, role, status, updated_at')
      .single();

    if (error || !updated) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found.'
      });
    }

    // Log status change
    await logActivity(supabaseAdmin, req.user?.id, `STAFF_STATUS_${status}`, 'profile', id, {
      new_status: status
    });

    return res.status(200).json({
      success: true,
      message: `Staff status successfully changed to ${status}.`,
      staff: updated
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get activity logs for a staff member or all staff
 */
export const getStaffActivity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit = 20 } = req.query;

    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const db = req.userClient || supabaseAdmin;

    let query = db
      .from('staff_activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limitNum);

    if (id && id !== 'all') {
      query = query.eq('staff_id', id);
    }

    const { data: logs, error } = await query;

    return res.status(200).json({
      success: true,
      activities: logs || []
    });
  } catch (err) {
    next(err);
  }
};

