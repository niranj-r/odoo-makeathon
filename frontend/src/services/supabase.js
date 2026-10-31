import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = () => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('your-project-ref') &&
    !supabaseAnonKey.includes('your-supabase-anon')
  );
};

// Fallback dummy client in case environment variables have not yet been populated
const createFallbackClient = () => {
  const notConfiguredError = () => {
    return Promise.resolve({
      data: null,
      error: {
        message: 'Supabase credentials are not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend/.env'
      }
    });
  };

  return {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: notConfiguredError,
      signUp: notConfiguredError,
      signOut: () => Promise.resolve({ error: null }),
      resetPasswordForEmail: notConfiguredError,
      updateUser: notConfiguredError
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: notConfiguredError
        })
      })
    })
  };
};

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : createFallbackClient();

