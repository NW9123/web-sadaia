import { createBrowserClient } from "@supabase/ssr";
import { env, isSupabaseConfigured } from "@/config/env";

/**
 * Browser Supabase client. Returns null when Supabase isn't configured so the
 * app can run entirely on the local demo data layer. Callers must null-check.
 */
export function createSupabaseBrowserClient() {
  if (!isSupabaseConfigured) return null;
  return createBrowserClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}
