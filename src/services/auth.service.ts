import { createClient } from "@/lib/supabase/client";
import { withTimeout } from "@/lib/with-timeout";
import type { UserProfile } from "@/types";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ??
  (typeof window !== "undefined" ? window.location.origin : "");

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
      emailRedirectTo: `${APP_URL}/api/auth/callback`,
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
      redirectTo: `${APP_URL}/api/auth/callback`,
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
    redirectTo: `${APP_URL}/api/auth/callback?next=/settings`,
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
