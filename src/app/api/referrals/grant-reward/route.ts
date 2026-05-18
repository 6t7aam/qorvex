import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { grantReferralReward } from "@/lib/referrals.server";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface GrantRewardBody {
  referredUserId?: string;
  plan?: "pro" | "max";
}

export async function POST(request: Request) {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.ok) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    let body: GrantRewardBody;
    try {
      body = (await request.json()) as GrantRewardBody;
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 },
      );
    }

    if (
      typeof body.referredUserId !== "string" ||
      (body.plan !== "pro" && body.plan !== "max")
    ) {
      return NextResponse.json(
        { success: false, error: "referredUserId and plan are required." },
        { status: 400 },
      );
    }

    const result = await grantReferralReward(createAdminClient(), {
      referredUserId: body.referredUserId,
      plan: body.plan,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[referrals/grant-reward] failed:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to grant referral reward.",
      },
      { status: 500 },
    );
  }
}
