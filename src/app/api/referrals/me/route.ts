import { NextResponse } from "next/server";
import { getReferralOverview } from "@/lib/referrals.server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import type { UserProfile } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const admin = createAdminClient();
    const { data: profile, error: profileError } = await admin
      .from("user_profiles")
      .select("*")
      .eq("id", user.id)
      .single<UserProfile>();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: profileError?.message ?? "Profile missing" },
        { status: 404 },
      );
    }

    const overview = await getReferralOverview(admin, profile);
    return NextResponse.json({
      success: true,
      ...overview,
    });
  } catch (error) {
    console.error("[referrals/me] failed:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load referrals.",
      },
      { status: 500 },
    );
  }
}
