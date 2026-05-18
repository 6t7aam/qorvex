import { NextResponse } from "next/server";
import { getDailyCreditSnapshot } from "@/lib/ai-usage.server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import type { UserProfile } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single<UserProfile>();

  if (!profile) {
    return NextResponse.json({ error: "Profile missing" }, { status: 404 });
  }

  const snapshot = await getDailyCreditSnapshot({
    admin,
    userId: user.id,
    plan: profile.plan,
    abuseDetected: profile.abuse_detected ?? false,
  });

  return NextResponse.json({ usage: snapshot });
}
