import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { activateSubscriptionForNowPayments } from "@/lib/nowpayments/activate";
import {
  FAILED_STATUSES,
  PAID_STATUSES,
  getNowPaymentsPaymentStatus,
  isNowPaymentsConfigured,
  NowPaymentsError,
} from "@/lib/nowpayments/client";
import { isNowPaymentsPlan } from "@/lib/nowpayments/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PaymentRow {
  id: string;
  order_id: string;
  user_id: string;
  status: string;
  payment_status: string | null;
  payment_id: string | null;
  subscription_plan: string;
  amount_usd: number;
  pay_currency: string | null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;
  if (!orderId) {
    return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: row, error } = await supabase
    .from("payments")
    .select(
      "id, order_id, user_id, status, payment_status, payment_id, subscription_plan, amount_usd, pay_currency",
    )
    .eq("order_id", orderId)
    .eq("user_id", user.id)
    .maybeSingle<PaymentRow>();

  if (error) {
    console.error("[nowpayments/status] lookup failed:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let current = row;

  // Fallback reconciliation: if our DB still shows the payment as pending but
  // NOWPayments upstream says it cleared, activate the subscription right
  // here. This makes the page work even if the webhook never reached us
  // (e.g. local dev, brief outage, IPN delivery failure).
  if (
    current.status !== "finished" &&
    current.payment_id &&
    isNowPaymentsConfigured()
  ) {
    try {
      const upstream = await getNowPaymentsPaymentStatus(current.payment_id);
      const upstreamStatus = upstream.payment_status?.toLowerCase() ?? "";
      const paid = PAID_STATUSES.has(upstreamStatus);
      const failed = FAILED_STATUSES.has(upstreamStatus);

      if (paid || failed || upstreamStatus !== current.payment_status) {
        const admin = createAdminClient();
        await admin
          .from("payments")
          .update({
            payment_status: upstreamStatus,
            status: paid
              ? "finished"
              : failed
                ? upstreamStatus
                : upstreamStatus || current.status,
          })
          .eq("id", current.id);

        current = {
          ...current,
          payment_status: upstreamStatus,
          status: paid ? "finished" : failed ? upstreamStatus : current.status,
        };

        if (paid && isNowPaymentsPlan(current.subscription_plan)) {
          try {
            await activateSubscriptionForNowPayments({
              admin,
              userId: current.user_id,
              plan: current.subscription_plan,
              paymentId: current.payment_id ?? "",
              orderId: current.order_id,
            });
          } catch (activationErr) {
            console.error(
              "[nowpayments/status] activation fallback failed:",
              activationErr,
            );
          }
        }
      }
    } catch (err) {
      if (err instanceof NowPaymentsError) {
        console.warn(
          "[nowpayments/status] upstream check failed:",
          err.status,
          err.message,
        );
      } else {
        console.error("[nowpayments/status] upstream check threw:", err);
      }
    }
  }

  return NextResponse.json({
    order_id: current.order_id,
    status: current.status,
    payment_status: current.payment_status,
    plan: current.subscription_plan,
    amount_usd: current.amount_usd,
    pay_currency: current.pay_currency,
    paid: current.status === "finished",
  });
}
