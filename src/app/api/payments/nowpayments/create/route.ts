import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import {
  createNowPaymentsPayment,
  isNowPaymentsConfigured,
  NowPaymentsError,
} from "@/lib/nowpayments/client";
import {
  NOWPAYMENTS_PLANS,
  PAY_CURRENCIES,
  isNowPaymentsPlan,
  isSupportedPayCurrency,
  type NowPaymentsPlanKey,
} from "@/lib/nowpayments/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CreateBody {
  plan?: NowPaymentsPlanKey;
  pay_currency?: string;
}

export async function POST(request: NextRequest) {
  if (!isNowPaymentsConfigured()) {
    return NextResponse.json(
      { error: "NOWPayments is not configured. Set NOWPAYMENTS_API_KEY in .env.local." },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: CreateBody;
  try {
    body = (await request.json()) as CreateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isNowPaymentsPlan(body.plan)) {
    return NextResponse.json(
      { error: "plan must be 'pro' or 'max'" },
      { status: 400 },
    );
  }

  const payCurrency =
    body.pay_currency?.toLowerCase().trim() ?? PAY_CURRENCIES[0].code;
  if (!isSupportedPayCurrency(payCurrency)) {
    return NextResponse.json(
      { error: `Unsupported pay_currency: ${payCurrency}` },
      { status: 400 },
    );
  }

  const plan = NOWPAYMENTS_PLANS[body.plan];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const orderId = `qorvex-${user.id}-${Date.now()}-${randomUUID().slice(0, 8)}`;
  const ipnUrl = `${appUrl}/api/payments/nowpayments/webhook`;

  let payment;
  try {
    payment = await createNowPaymentsPayment({
      priceAmount: plan.priceUsd,
      priceCurrency: "usd",
      payCurrency,
      orderId,
      orderDescription: `Qorvex ${plan.name} subscription (${plan.durationDays} days)`,
      ipnCallbackUrl: ipnUrl,
    });
  } catch (err) {
    if (err instanceof NowPaymentsError) {
      console.error("[nowpayments/create] payment creation failed:", err.message, err.payload);
      return NextResponse.json(
        { error: err.message },
        { status: err.status >= 400 && err.status < 600 ? err.status : 502 },
      );
    }
    console.error("[nowpayments/create] unexpected error:", err);
    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 },
    );
  }

  const admin = createAdminClient();
  const { error: insertError } = await admin.from("payments").insert({
    user_id: user.id,
    provider: "nowpayments",
    order_id: orderId,
    payment_id: payment.payment_id?.toString() ?? null,
    subscription_plan: plan.key,
    amount_usd: plan.priceUsd,
    pay_currency: payCurrency,
    pay_address: payment.pay_address,
    pay_amount: payment.pay_amount,
    payment_status: payment.payment_status ?? "waiting",
    status: "pending",
    expires_at: payment.valid_until ?? payment.expiration_estimate_date ?? null,
    raw_payload: payment as unknown as Record<string, unknown>,
  });

  if (insertError) {
    console.error("[nowpayments/create] payments insert failed:", insertError);
    return NextResponse.json(
      { error: "Failed to persist payment record" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    order_id: orderId,
    payment_id: payment.payment_id?.toString() ?? null,
    pay_address: payment.pay_address,
    pay_amount: payment.pay_amount,
    pay_currency: payCurrency,
    amount_usd: plan.priceUsd,
    expires_at: payment.valid_until ?? payment.expiration_estimate_date ?? null,
  });
}
