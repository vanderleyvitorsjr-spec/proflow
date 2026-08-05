import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig } from "./config";

export function createSupabaseAdminClient() {
  const { url } = getSupabasePublicConfig();
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("SUPABASE_SERVICE_ROLE_KEY não foi configurada.");
  return createClient(url, secret, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
