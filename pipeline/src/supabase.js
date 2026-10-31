import { createClient } from '@supabase/supabase-js';
import {
  SUPABASE_ADMIN_KEY_MESSAGE,
  resolveSupabaseConfig,
} from './supabaseKeyGuard.js';

const refusedByBuild = import.meta.env.VITE_SUPABASE_KEY_REFUSED === '1';
const resolved = resolveSupabaseConfig(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY,
);

export const supabaseConfigError = refusedByBuild
  ? SUPABASE_ADMIN_KEY_MESSAGE
  : resolved.error;

// One browser client. After sign-in, supabase-js attaches that user's access
// token to every request made with this client (reads, inserts, updates, deletes).
// The publishable key stays the apikey; it is not an admin credential.
export const supabase = supabaseConfigError
  ? null
  : createClient(resolved.url, resolved.key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'implicit',
      },
    });
