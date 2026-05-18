import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SettingsClient, type InitialProfile } from "./SettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profileRow, error: profileError } = await supabase
    .from("user_profiles")
    .select("id, email, full_name, preferred_language")
    .eq("id", user.id)
    .maybeSingle<InitialProfile>();

  if (profileError) {
    console.error("[settings/page] profile fetch failed:", profileError);
  }
  console.log(
    "[settings/page] loaded preferred_language:",
    profileRow?.preferred_language,
  );

  const initialEmail =
    user.email ??
    (user.user_metadata?.email as string | undefined) ??
    profileRow?.email ??
    "";

  const fallbackName =
    (user.user_metadata?.full_name as string | undefined) ?? "";

  const initialProfile: InitialProfile = {
    id: user.id,
    email: profileRow?.email ?? initialEmail ?? null,
    full_name: profileRow?.full_name ?? fallbackName ?? null,
    preferred_language: profileRow?.preferred_language ?? "en",
  };

  return (
    <SettingsClient
      userId={user.id}
      email={initialEmail}
      initialProfile={initialProfile}
    />
  );
}
