import { createClient } from "@/lib/supabase/server";

interface AdminCheck {
  ok: boolean;
  email: string | null;
  userId: string | null;
}

export function getAdminEmail(): string | null {
  return process.env.ADMIN_EMAIL ?? process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? null;
}

export async function requireAdmin(): Promise<AdminCheck> {
  const adminEmail = getAdminEmail();
  if (!adminEmail) return { ok: false, email: null, userId: null };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, email: null, userId: null };
  const normalized = (user.email ?? "").trim().toLowerCase();
  const expected = adminEmail.trim().toLowerCase();
  if (!normalized || normalized !== expected) {
    return { ok: false, email: user.email ?? null, userId: user.id };
  }
  return { ok: true, email: user.email ?? null, userId: user.id };
}
