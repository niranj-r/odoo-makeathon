import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase.js';

export const verifyAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authorization token missing or malformed. Provide Bearer token.'
      });
    }

    if (!isSupabaseConfigured() || !supabaseAdmin) {
      return res.status(503).json({
        success: false,
        message: 'Backend Supabase connection is not configured in .env'
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token with Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !authData?.user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired authentication token.',
        error: authError?.message
      });
    }

    // Retrieve user profile and role from the profiles table
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, role, status, created_at, updated_at')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found in database.',
        error: profileError?.message
      });
    }

    // Check account standing
    if (profile.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive. Please contact your system administrator.'
      });
    }

    // Attach verified user and profile to request object
    req.user = profile;
    req.authUser = authData.user;

    next();
  } catch (err) {
    next(err);
  }
};

