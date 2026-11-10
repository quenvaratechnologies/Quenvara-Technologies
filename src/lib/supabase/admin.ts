import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/env";

/**
 * Service-role client. Bypasses RLS. Use ONLY in trusted server code for:
 *  - public form submissions (contact / applications) after validation + rate limiting
 *  - signed URLs for private files after an authorization check
 *  - admin user provisioning
 * Never import from Client Components. Never return its raw results to the browser.
 */
export function createAdminSupabase() {
  const env = getServerEnv();
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
