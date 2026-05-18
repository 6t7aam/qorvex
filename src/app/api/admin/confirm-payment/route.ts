import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { grantReferralReward } from "@/lib/referrals.server";
import { withTimeout } from "@/lib/with-timeout";
import { requireAdmin } from "@/lib/admin";
import type { ManualPayment } from "@/types";

export const dynamic = "force-dynamic";

interface ConfirmBody {
  paymentId?: string;
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    let body: ConfirmBody;
    try {
      body = (await request.json()) as ConfirmBody;
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 },
      );
    }

    const paymentId = body.paymentId;
    if (!paymentId || typeof paymentId !== "string") {
      return NextResponse.json(
        { success: false, error: "paymentId is required" },
        { status: 400 },
      );
    }

    const sb = createAdminClient();
    const { data: payment, error: fetchError } = await withTimeout(
      sb
        .from("manual_payments")
        .select("*")
        .eq("id", paymentId)
        .maybeSingle<ManualPayment>(),
      10000,
      "Fetching payment timed out.",
    );

    if (fetchError) {
      console.error("[admin/confirm-payment] fetch failed:", fetchError);
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 },
      );
    }

    if (!payment) {
      return NextResponse.json(
        { success: false, error: "Payment not found" },
        { status: 404 },
      );
    }

    if (payment.status !== "pending") {
      return NextResponse.json(
        {
          success: false,
          error: `Payment is already ${payment.status}`,
        },
        { status: 409 },
      );
    }

    const nowIso = new Date().toISOString();

    const { error: updatePaymentError } = await withTimeout(
      sb
        .from("manual_payments")
        .update({
          status: "confirmed",
          confirmed_at: nowIso,
        })
        .eq("id", paymentId),
      10000,
      "Confirming payment timed out.",
    );

    if (updatePaymentError) {
      console.error("[admin/confirm-payment] update failed:", updatePaymentError);
      return NextResponse.json(
        { success: false, error: updatePaymentError.message },
        { status: 500 },
      );
    }

    const { error: profileError } = await withTimeout(
      sb
        .from("user_profiles")
        .update({
          plan: payment.plan,
          pending_plan: null,
        })
        .eq("id", payment.user_id),
      10000,
      "Updating user profile timed out.",
    );

    if (profileError) {
      console.error("[admin/confirm-payment] profile update failed:", profileError);
    }

    const periodStart = nowIso;
    const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    await sb.from("subscriptions").upsert(
      {
        user_id: payment.user_id,
        stripe_customer_id: `manual_${payment.user_id}`,
        stripe_subscription_id: `manual_${payment.order_id}`,
        plan: payment.plan,
        status: "active",
        current_period_start: periodStart,
        current_period_end: periodEnd,
        cancel_at_period_end: false,
        updated_at: nowIso,
      },
      { onConflict: "user_id" },
    );

    try {
      await grantReferralReward(sb, {
        referredUserId: payment.user_id,
        plan: payment.plan,
      });
    } catch (referralError) {
      console.error("[admin/confirm-payment] referral reward failed:", referralError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to confirm payment";
    console.error("[admin/confirm-payment] threw:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
