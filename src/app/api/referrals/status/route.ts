import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { getReferralForReferredUser } from "@/lib/referrals.server";
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
    const referral = await getReferralForReferredUser(admin, user.id);
    const { data: profile } = await admin
      .from("user_profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle<UserProfile>();

    return NextResponse.json({
      success: true,
      wasReferred: !!referral,
      status: referral?.status ?? null,
      referredPlan: referral?.referred_plan ?? null,
      signupBonusGranted: referral?.signup_bonus_granted ?? false,
      rewardCredits: referral?.reward_credits ?? 0,
      currentPlan: profile?.plan ?? "free",
    });
  } catch (error) {
    console.error("[referrals/status] failed:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load referral status.",
      },
      { status: 500 },
    );
  }
}
