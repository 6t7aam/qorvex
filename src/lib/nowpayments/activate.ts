import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { grantReferralReward } from "@/lib/referrals.server";
import {
  NOWPAYMENTS_PLANS,
  type NowPaymentsPlanKey,
} from "@/lib/nowpayments/config";

interface ActivateParams {
  admin: SupabaseClient;
  userId: string;
  plan: NowPaymentsPlanKey;
  paymentId: string;
  orderId: string;
}

/**
 * Idempotently activates a subscription for a NOWPayments-paid order.
 *
 * Safe to call twice for the same order_id: the unique (provider, order_id)
 * combination on subscriptions blocks duplicate inserts, and the upsert path
 * keys on user_id so re-running just refreshes period bounds.
 */
export async function activateSubscriptionForNowPayments(params: ActivateParams) {
  const { admin, userId, plan, paymentId, orderId } = params;
  const planConfig = NOWPAYMENTS_PLANS[plan];

  const now = new Date();
  const periodEnd = new Date(
    now.getTime() + planConfig.durationDays * 24 * 60 * 60 * 1000,
  );

  // Use a stable synthetic Stripe-shaped ID so the existing UNIQUE constraints
  // on subscriptions.stripe_customer_id / stripe_subscription_id keep holding
  // when the migration has not relaxed them yet. After the migration these
  // columns are nullable and the provider field carries the real meaning.
  const syntheticCustomer = `nowpayments:${userId}`;
  const syntheticSubscription = `nowpayments:${orderId}`;

  const { error: upsertError } = await admin
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        provider: "nowpayments",
        stripe_customer_id: syntheticCustomer,
        stripe_subscription_id: syntheticSubscription,
        stripe_price_id: null,
        plan,
        status: "active",
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        cancel_at_period_end: false,
      },
      { onConflict: "user_id" },
    );

  if (upsertError) {
    console.error(
      "[nowpayments/activate] subscriptions upsert failed:",
      upsertError,
    );
    throw upsertError;
  }

  const { error: profileError } = await admin
    .from("user_profiles")
    .update({
      plan,
      subscription_status: "active",
    })
    .eq("id", userId);

  if (profileError) {
    console.error(
      "[nowpayments/activate] user_profiles update failed:",
      profileError,
    );
    throw profileError;
  }

  try {
    await grantReferralReward(admin, {
      referredUserId: userId,
      plan,
    });
  } catch (referralError) {
    console.error(
      "[nowpayments/activate] referral reward failed:",
      referralError,
    );
  }

  console.log(
    `[nowpayments/activate] user=${userId} plan=${plan} payment=${paymentId} order=${orderId}`,
  );
}
