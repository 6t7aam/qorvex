import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { REFERRAL_COOKIE_NAME } from "@/lib/referrals";
import { claimReferralSignup, ensureReferralCode } from "@/lib/referrals.server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getClientIP, hashIP } from "@/lib/ip-hash";
import { isDisposableEmail } from "@/lib/email-validation";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  const cookieStore = await cookies();

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
  }

  // Check for disposable email
  if (data.user?.email && isDisposableEmail(data.user.email)) {
    // Delete the user account that was just created
    const admin = createAdminClient();
    await admin.auth.admin.deleteUser(data.user.id);

    return NextResponse.redirect(
      `${origin}/signup?error=disposable_email`
    );
  }

  // If this is a new user signup, capture IP hash for anti-abuse tracking
  if (data.user) {
    const admin = createAdminClient();
    const clientIP = getClientIP(request.headers);
    if (clientIP) {
      const ipHash = hashIP(clientIP);

      // Update user metadata with IP hash so the trigger can use it
      await admin.auth.admin.updateUserById(data.user.id, {
        user_metadata: {
          ...data.user.user_metadata,
          ip_hash: ipHash,
        },
      });

      // Update the user_profiles table with IP hash if not already set
      await admin
        .from("user_profiles")
        .update({ ip_hash: ipHash })
        .eq("id", data.user.id)
        .is("ip_hash", null);
    }

    try {
      await ensureReferralCode(admin, data.user.id);
      const pendingReferralCode = cookieStore.get(REFERRAL_COOKIE_NAME)?.value;
      if (pendingReferralCode) {
        const claimResult = await claimReferralSignup(admin, {
          referredUserId: data.user.id,
          referralCode: pendingReferralCode,
        });
        if (!claimResult.success) {
          console.warn("[auth callback] referral claim skipped:", claimResult.error);
        }
        cookieStore.delete(REFERRAL_COOKIE_NAME);
      }
    } catch (referralError) {
      console.error("[auth callback] referral handling failed:", referralError);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
