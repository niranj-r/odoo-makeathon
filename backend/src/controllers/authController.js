import { supabaseAdmin } from '../config/supabase.js';

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
 * Create a new Staff account (Admin only)
 */
export const createStaff = async (req, res, next) => {
  try {
    const { email, password, full_name } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and full name are required.'
      });
    }

    // Password strength check
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    if (password.length <= 8 || !hasUpperCase || !hasLowerCase || !hasSpecialChar) {
      return res.status(400).json({
        success: false,
        message: 'Password must be longer than 8 characters and contain uppercase, lowercase, and a special character.'
      });
    }

    // Create user in Supabase Auth via Admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        role: 'STAFF'
      }
    });

    if (authError || !authData?.user) {
      return res.status(400).json({
        success: false,
        message: authError?.message || 'Failed to create staff user account.'
      });
    }

    // Explicitly update role to STAFF in profiles table (as extra safety guarantee)
    const { data: updatedProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ role: 'STAFF', full_name, status: 'ACTIVE' })
      .eq('id', authData.user.id)
      .select()
      .single();

    if (profileError) {
      console.error('Failed to set profile role:', profileError);
    }

    return res.status(201).json({
      success: true,
      message: 'Staff user created successfully.',
      user: updatedProfile || {
        id: authData.user.id,
        email,
        full_name,
        role: 'STAFF',
        status: 'ACTIVE'
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * List all users with optional filtering (Admin only)
 */
export const listUsers = async (req, res, next) => {
  try {
    const { role, status } = req.query;

    let query = supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, role, status, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (role) {
      query = query.eq('role', role);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data: users, error } = await query;

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch user profiles.',
        error: error.message
      });
    }

    return res.status(200).json({
      success: true,
      count: users.length,
      users
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

    const { data: updated, error } = await supabaseAdmin
      .from('profiles')
      .update({ status })
      .eq('id', id)
      .select('id, full_name, email, role, status, updated_at')
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update user status.',
        error: error.message
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

