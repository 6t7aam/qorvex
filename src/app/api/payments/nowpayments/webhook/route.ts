import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { activateSubscriptionForNowPayments } from "@/lib/nowpayments/activate";
import { FAILED_STATUSES, PAID_STATUSES } from "@/lib/nowpayments/client";
import {
  NOWPAYMENTS_PLANS,
  isNowPaymentsPlan,
} from "@/lib/nowpayments/config";
import { verifyNowPaymentsSignature } from "@/lib/nowpayments/signature";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface IpnPayload {
  payment_id?: number | string;
  invoice_id?: number | string;
  order_id?: string;
  payment_status?: string;
  pay_currency?: string;
  price_amount?: number;
  price_currency?: string;
  pay_amount?: number;
  actually_paid?: number;
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-nowpayments-sig");

  const { valid, configured } = verifyNowPaymentsSignature(rawBody, signature);
  if (configured && !valid) {
    console.error("[nowpayments/webhook] signature verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  if (!configured) {
    // Loud warning so devs notice in logs — never silently accept in prod.
    console.warn(
      "[nowpayments/webhook] NOWPAYMENTS_IPN_SECRET is not set — accepting payload WITHOUT signature verification.",
    );
  }

  let payload: IpnPayload;
  try {
    payload = JSON.parse(rawBody) as IpnPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const orderId = payload.order_id;
  const status = payload.payment_status;
  if (!orderId || !status) {
    console.error("[nowpayments/webhook] missing order_id/payment_status", payload);
    return NextResponse.json(
      { error: "Missing order_id or payment_status" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const { data: paymentRow, error: findError } = await admin
    .from("payments")
    .select("id, user_id, subscription_plan, status, amount_usd")
    .eq("order_id", orderId)
    .maybeSingle<{
      id: string;
      user_id: string;
      subscription_plan: string;
      status: string;
      amount_usd: number;
    }>();

  if (findError) {
    console.error("[nowpayments/webhook] payments lookup failed:", findError);
    return NextResponse.json(
      { error: "Database error" },
      { status: 500 },
    );
  }
  if (!paymentRow) {
    console.error(`[nowpayments/webhook] no payment found for order_id=${orderId}`);
    return NextResponse.json(
      { error: "Order not found" },
      { status: 404 },
    );
  }

  const normalizedStatus = status.toLowerCase();
  const paid = PAID_STATUSES.has(normalizedStatus);
  const failed = FAILED_STATUSES.has(normalizedStatus);

  const { error: updateError } = await admin
    .from("payments")
    .update({
      payment_id: payload.payment_id?.toString() ?? null,
      status: paid ? "finished" : failed ? normalizedStatus : normalizedStatus,
      pay_currency: payload.pay_currency ?? null,
      raw_payload: payload as unknown as Record<string, unknown>,
    })
    .eq("id", paymentRow.id);

  if (updateError) {
    console.error("[nowpayments/webhook] payments update failed:", updateError);
    return NextResponse.json(
      { error: "Database update error" },
      { status: 500 },
    );
  }

  if (paid) {
    // Idempotency: if payment was already in a finished state we skip
    // reactivation. The activation function itself upserts on user_id so
    // double-firing the same event will not duplicate subscriptions either.
    if (paymentRow.status === "finished") {
      console.log(
        `[nowpayments/webhook] order ${orderId} already finished — skipping reactivation`,
      );
      return NextResponse.json({ ok: true, idempotent: true });
    }

    if (!isNowPaymentsPlan(paymentRow.subscription_plan)) {
      console.error(
        `[nowpayments/webhook] invalid stored plan: ${paymentRow.subscription_plan}`,
      );
      return NextResponse.json(
        { error: "Invalid plan in payment record" },
        { status: 500 },
      );
    }

    // Backend-only price check — never trust IPN price_amount blindly, but if
    // it is present and disagrees with our recorded amount we log loudly.
    if (
      typeof payload.price_amount === "number" &&
      Math.abs(payload.price_amount - paymentRow.amount_usd) > 0.01
    ) {
      console.warn(
        `[nowpayments/webhook] amount mismatch for order=${orderId}: stored=${paymentRow.amount_usd} ipn=${payload.price_amount}`,
      );
    }

    const plan = NOWPAYMENTS_PLANS[paymentRow.subscription_plan];
    try {
      await activateSubscriptionForNowPayments({
        admin,
        userId: paymentRow.user_id,
        plan: plan.key,
        paymentId: payload.payment_id?.toString() ?? "",
        orderId,
      });
    } catch (err) {
      console.error("[nowpayments/webhook] activation failed:", err);
      return NextResponse.json(
        { error: "Activation failed" },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ ok: true });
}

// NOWPayments occasionally pings the IPN URL with GET to confirm reachability
// before sending the first POST. Return 200 so the dashboard reports the
// callback as valid.
export async function GET() {
  return NextResponse.json({ ok: true });
}
