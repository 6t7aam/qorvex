import { cookies } from "next/headers";
import {
  createServerClient as createSupabaseServerClient,
  type CookieOptions,
} from "@supabase/ssr";
import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function createClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();

  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set(name, value, options);
          } catch {
            // set() can throw in a Server Component — the middleware refresh
            // path handles cookie persistence in that case.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set(name, "", { ...options, maxAge: 0 });
          } catch {
            // ignored — see comment in set()
          }
        },
      },
    },
  );
}

/**
 * Service-role client that bypasses RLS. Server-side only — never import this
 * from a Client Component or expose its results to the browser.
 */
export function createAdminClient(): SupabaseClient {
  return createSupabaseJsClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

// Keep the previous export name working so any earlier imports still resolve.
export const createServerClient = createClient;
