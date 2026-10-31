import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Robust env loading: check backend/.env first, then fallback to cwd
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const rawUrl = process.env.SUPABASE_URL || '';

const getCleanSupabaseUrl = (input) => {
  if (!input) return '';
  try {
    const parsed = new URL(input);
    return parsed.origin;
  } catch {
    return input.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
  }
};

const supabaseUrl = getCleanSupabaseUrl(rawUrl);
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseConfigured = () => {
  return Boolean(
    supabaseUrl &&
    supabaseServiceRoleKey &&
    !supabaseUrl.includes('your-project-ref') &&
    !supabaseServiceRoleKey.includes('your-supabase-service-role-key')
  );
};

let supabaseAdmin = null;

if (isSupabaseConfigured()) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  if (supabaseServiceRoleKey.startsWith('sb_publishable_')) {
    console.warn(
      '⚠️  [Supabase Warning] SUPABASE_SERVICE_ROLE_KEY starts with "sb_publishable_".\n' +
      '    This is a public/anon key, not the secret service_role key.\n' +
      '    Admin functions (creating staff, bypassing RLS) require the "service_role" secret\n' +
      '    from Supabase Dashboard -> Project Settings -> API -> service_role.'
    );
  } else {
    console.log(' [Supabase] Admin client initialized with Service Role Key.');
  }
} else {
  console.warn(
    '⚠️  [Supabase] Service Role Key or Supabase URL is missing or set to placeholder.\n' +
    '    Backend will start in unconfigured state. Configure backend/.env to enable authenticated API functions.'
  );
}

/**
 * Creates a client scoped to the authenticated user's JWT token
 */
export const getScopedClient = (token) => {
  if (!isSupabaseConfigured()) return null;
  if (!token) return supabaseAdmin;

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
};

export { supabaseAdmin, supabaseUrl, supabaseServiceRoleKey };
