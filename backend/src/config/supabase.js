import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

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
  console.log(' [Supabase] Admin client initialized with Service Role Key.');
} else {
  console.warn(
    '⚠️  [Supabase] Service Role Key or Supabase URL is missing or set to placeholder.\n' +
    '    Backend will start in unconfigured state. Configure backend/.env to enable authenticated API functions.'
  );
}

export { supabaseAdmin };

