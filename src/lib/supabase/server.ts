import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { env, isSupabaseConfigured } from "@/config/env";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

/**
 * Server Supabase client (RSC / route handlers). Returns null when Supabase
 * isn't configured. Reads/writes the auth cookie via next/headers.
 */
export async function createSupabaseServerClient() {
  if (!isSupabaseConfigured) return null;
  const cookieStore = await cookies();
  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component — safe to ignore when middleware refreshes sessions.
        }
      },
    },
  });
}
