import { createClient } from "@/lib/supabase/client";
import { withTimeout } from "@/lib/with-timeout";
import type { UserProfile } from "@/types";

/**
 * Resolve the canonical origin for OAuth `redirectTo` URLs.
 *
 * In the browser we always prefer the live origin so that dev / preview
 * deploys never accidentally bounce the user to production. Only when there
 * is no `window` (SSR / build) do we fall back to the `NEXT_PUBLIC_APP_URL`
 * env, and finally to an empty string.
 *
 * IMPORTANT: every origin we return here must be listed in
 * Supabase → Authentication → URL Configuration → Redirect URLs.
 */
function getOAuthOrigin(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_APP_URL ?? "";
}

export async function signUpWithEmail(
  email: string,
  password: string,
  fullName: string,
) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${getOAuthOrigin()}/api/auth/callback`,
    },
  });
  return { data, error };
}

export async function signInWithEmail(email: string, password: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

export async function signInWithGoogle() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${getOAuthOrigin()}/api/auth/callback`,
      // Helps Google show the right consent screen and lets returning users
      // skip the account picker when they already have a session.
      queryParams: {
        prompt: "select_account",
      },
    },
  });
  return { data, error };
}

export async function signOut() {
  const response = await withTimeout(
    fetch("/api/auth/signout", {
      method: "POST",
      cache: "no-store",
    }),
    10000,
    "Sign out timed out.",
  );
  const body = (await response.json().catch(() => null)) as
    | { success?: boolean; error?: string }
    | null;

  if (!response.ok || !body?.success) {
    return {
      error: new Error(body?.error ?? "Failed to sign out"),
    };
  }

  return { error: null };
}

export async function resetPassword(email: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getOAuthOrigin()}/api/auth/callback?next=/settings`,
  });
  return { data, error };
}

export async function getCurrentUser() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();
  return { user: data.user, error };
}

export async function getUserProfile(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", userId)
    .single<UserProfile>();
  return { profile: data, error };
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<UserProfile>,
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .single<UserProfile>();
  return { profile: data, error };
}
