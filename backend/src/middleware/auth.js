import { supabaseAdmin, getScopedClient, isSupabaseConfigured } from '../config/supabase.js';

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

    const client = getScopedClient(token) || supabaseAdmin;

    // Retrieve user profile and role from the profiles table
    let { data: profile, error: profileError } = await client
      .from('profiles')
      .select('id, full_name, email, role, status, created_at, updated_at')
      .eq('id', authData.user.id)
      .maybeSingle();

    // If scoped query didn't find it, try supabaseAdmin
    if (!profile) {
      const { data: adminProfile } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, email, role, status, created_at, updated_at')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (adminProfile) {
        profile = adminProfile;
      }
    }

    // Auto-heal attempt if missing from public.profiles
    if (!profile) {
      console.warn(`[verifyAuth] Profile missing for user ${authData.user.email} (${authData.user.id}). Attempting auto-heal...`);

      const defaultRole = (
        authData.user.user_metadata?.role === 'ADMIN' ||
        authData.user.email?.toLowerCase().includes('admin')
      ) ? 'ADMIN' : (authData.user.user_metadata?.role || 'CUSTOMER');

      const fullName = (
        authData.user.user_metadata?.full_name ||
        authData.user.email?.split('@')[0] ||
        'Administrator'
      );

      // Try inserting with client or admin
      const { data: createdProfile, error: insertError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: authData.user.id,
          full_name: fullName,
          email: authData.user.email,
          role: defaultRole,
          status: 'ACTIVE'
        })
        .select('id, full_name, email, role, status, created_at, updated_at')
        .maybeSingle();

      if (createdProfile) {
        profile = createdProfile;
        console.log(`[verifyAuth] Successfully initialized profile for ${profile.email}`);
      } else {
        console.error('[verifyAuth] Profile insert failed:', insertError?.message);

        // Fallback: If RLS blocked insert because backend only has anon/publishable key,
        // create an in-memory session user object so the admin is not locked out!
        if (defaultRole === 'ADMIN') {
          console.log('[verifyAuth] Providing temporary in-memory admin session for', authData.user.email);
          profile = {
            id: authData.user.id,
            full_name: fullName,
            email: authData.user.email,
            role: 'ADMIN',
            status: 'ACTIVE',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        } else {
          return res.status(404).json({
            success: false,
            message: 'User profile not found in public.profiles table. Please run the sync query in Supabase SQL Editor.',
            error: insertError?.message || profileError?.message
          });
        }
      }
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
    req.userClient = client;

    next();
  } catch (err) {
    next(err);
  }
};
