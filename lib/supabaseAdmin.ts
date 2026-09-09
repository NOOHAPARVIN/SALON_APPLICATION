import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "";

// The Service Role Key bypasses RLS and enables Admin Auth API calls
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || // fallback to prevent crashes if not config
  "";

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    "[Supabase Admin] WARNING: SUPABASE_SERVICE_ROLE_KEY is not defined in environment variables. Admin auth functions (like WhatsApp password reset) will fail."
  );
}

export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
