import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase.js';

/**
 * Get verified profile and role of currently authenticated user
 */
export const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user
  });
};

/**
 * List all users with search, role/status filtering, and pagination (Admin only)
 */
export const listUsers = async (req, res, next) => {
  try {
    if (!isSupabaseConfigured() || !supabaseAdmin) {
      return res.status(503).json({
        success: false,
        message: 'Backend Supabase connection is not configured in .env'
      });
    }

    const {
      search = '',
      role = '',
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
      .select('id, full_name, email, role, status, created_at, updated_at', { count: 'exact' });

    // Filter by role if specified
    if (role && role !== 'ALL') {
      query = query.eq('role', role);
    }

    // Filter by status if specified
    if (status && status !== 'ALL') {
      query = query.eq('status', status);
    }

    // Search by full_name or email (case-insensitive)
    if (search && search.trim() !== '') {
      const searchTerm = search.trim();
      query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
    }

    // Order and paginate
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    const { data: users, count, error } = await query;

    if (error) {
      console.warn('listUsers query returned error:', error.message);
    }

    let userResults = users || [];

    // Fallback: If DB table is empty but the admin is authenticated, include admin
    if (userResults.length === 0 && req.user) {
      userResults = [req.user];
    }

    const total = count || userResults.length;
    const totalPages = Math.max(1, Math.ceil(total / limitNum));

    return res.status(200).json({
      success: true,
      users: userResults,
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
 * List only STAFF users with search, status filtering, and pagination (Admin only)
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
      .select('id, full_name, email, role, status, created_at, updated_at', { count: 'exact' })
      .eq('role', 'STAFF');

    // Filter by status if specified
    if (status && status !== 'ALL') {
      query = query.eq('status', status);
    }

    // Search by full_name or email
    if (search && search.trim() !== '') {
      const searchTerm = search.trim();
      query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
    }

    // Order and paginate
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    const { data: staff, count, error } = await query;

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch staff members.',
        error: error.message
      });
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limitNum);

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
 * Get single user profile by ID (Admin only)
 */
export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required.'
      });
    }

    const db = req.userClient || supabaseAdmin;

    const { data: user, error } = await db
      .from('profiles')
      .select('id, full_name, email, role, status, created_at, updated_at')
      .eq('id', id)
      .single();

    if (error || !user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.'
      });
    }

    return res.status(200).json({
      success: true,
      user
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update permitted user details (full_name) (Admin only)
 */
export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { full_name } = req.body;

    if (!full_name || full_name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Full name is required.'
      });
    }

    const db = req.userClient || supabaseAdmin;

    // Update in profiles table
    const { data: updated, error } = await db
      .from('profiles')
      .update({
        full_name: full_name.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('id, full_name, email, role, status, updated_at')
      .single();

    if (error || !updated) {
      return res.status(500).json({
        success: false,
        message: error?.message || 'Failed to update user profile.'
      });
    }

    // Optionally update user_metadata in Supabase Auth
    try {
      await supabaseAdmin.auth.admin.updateUserById(id, {
        user_metadata: { full_name: full_name.trim() }
      });
    } catch (authErr) {
      console.warn('Could not update Auth user_metadata:', authErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'User profile updated successfully.',
      user: updated
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Create or invite a new Staff account (Admin only)
 * Supports method: 'invite' (email invitation) or 'password' (temporary password)
 */
export const createStaff = async (req, res, next) => {
  try {
    const { email, full_name, password, method = 'password' } = req.body;

    if (!email || !full_name) {
      return res.status(400).json({
        success: false,
        message: 'Email and full name are required.'
      });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = full_name.trim();

    // Check if email already exists in profiles
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
      // Approach A: Supabase Admin Auth Invitation
      const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        trimmedEmail,
        {
          data: {
            full_name: trimmedName,
            role: 'STAFF'
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
      // Approach B: Admin-generated temporary password
      if (!password) {
        return res.status(400).json({
          success: false,
          message: 'Temporary password is required for direct staff account creation.'
        });
      }

      // Password strength validation
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

      if (password.length <= 8 || !hasUpperCase || !hasLowerCase || !hasSpecialChar) {
        return res.status(400).json({
          success: false,
          message: 'Password must be longer than 8 characters and contain uppercase, lowercase, and a special character.'
        });
      }

      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: trimmedEmail,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: trimmedName,
          role: 'STAFF'
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

    // Explicitly guarantee the role in public.profiles is STAFF and status is ACTIVE
    const { data: updatedProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: authUserId,
        email: trimmedEmail,
        full_name: trimmedName,
        role: 'STAFF',
        status: 'ACTIVE',
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })
      .select('id, full_name, email, role, status, created_at, updated_at')
      .single();

    if (profileError) {
      console.error('Failed to set profile role:', profileError);
    }

    return res.status(201).json({
      success: true,
      message: method === 'invite'
        ? `Invitation successfully dispatched to ${trimmedEmail}.`
        : `Staff account created successfully for ${trimmedName}.`,
      user: updatedProfile || {
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
 * Update user status (ACTIVE / INACTIVE) (Admin only)
 */
export const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['ACTIVE', 'INACTIVE'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be ACTIVE or INACTIVE.'
      });
    }

    // Prevent admin from deactivating themselves
    if (req.user.id === id && status === 'INACTIVE') {
      return res.status(400).json({
        success: false,
        message: 'Administrators cannot deactivate their own account.'
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
      .select('id, full_name, email, role, status, updated_at')
      .single();

    if (error || !updated) {
      return res.status(500).json({
        success: false,
        message: error?.message || 'Failed to update user status.'
      });
    }

    return res.status(200).json({
      success: true,
      message: `User status successfully updated to ${status}.`,
      user: updated
    });
  } catch (err) {
    next(err);
  }
};
