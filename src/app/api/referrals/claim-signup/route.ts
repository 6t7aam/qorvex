import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { REFERRAL_COOKIE_NAME } from "@/lib/referrals";
import {
  claimReferralSignup,
} from "@/lib/referrals.server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ClaimSignupBody {
  referralCode?: string;
}

export async function POST(request: Request) {
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

    let body: ClaimSignupBody = {};
    try {
      body = (await request.json()) as ClaimSignupBody;
    } catch {
      body = {};
    }

    const cookieStore = await cookies();
    const referralCode =
      body.referralCode?.trim() || cookieStore.get(REFERRAL_COOKIE_NAME)?.value || "";

    if (!referralCode) {
      return NextResponse.json(
        { success: false, error: "Referral code is missing." },
        { status: 400 },
      );
    }

    const result = await claimReferralSignup(createAdminClient(), {
      referredUserId: user.id,
      referralCode,
    });
    cookieStore.delete(REFERRAL_COOKIE_NAME);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error ?? "Referral claim failed." },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true, referral: result.referral });
  } catch (error) {
    console.error("[referrals/claim-signup] failed:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Referral claim failed.",
      },
      { status: 500 },
    );
  }
}
