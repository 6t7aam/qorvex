import "server-only";
import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { grantReferralReward } from "@/lib/referrals.server";
import { planFromPriceId, type StripePlanKey } from "@/lib/stripe/config";

interface SubscriptionPeriodFields {
  current_period_start?: number;
  current_period_end?: number;
}

export function readSubscriptionPeriod(sub: Stripe.Subscription): {
  start: string;
  end: string;
} {
  const top = sub as unknown as SubscriptionPeriodFields;
  const item = sub.items?.data?.[0] as unknown as SubscriptionPeriodFields;
  const startUnix =
    top.current_period_start ??
    item?.current_period_start ??
    Math.floor(Date.now() / 1000);
  const endUnix =
    top.current_period_end ??
    item?.current_period_end ??
    Math.floor(Date.now() / 1000) + 30 * 24 * 3600;
  return {
    start: new Date(startUnix * 1000).toISOString(),
    end: new Date(endUnix * 1000).toISOString(),
  };
}

export function normalizeSubscriptionStatus(s: string): string {
  if (
    s === "active" ||
    s === "trialing" ||
    s === "past_due" ||
    s === "canceled"
  ) {
    return s;
  }
  return s === "incomplete" || s === "incomplete_expired" || s === "unpaid"
    ? "past_due"
    : "active";
}

interface SyncInput {
  admin: SupabaseClient;
  userId: string;
  subscription: Stripe.Subscription;
  customerId: string;
  fallbackPlan?: StripePlanKey;
}

export interface SyncResult {
  plan: StripePlanKey;
  status: string;
  current_period_start: string;
  current_period_end: string;
  stripe_price_id: string | null;
}

export async function syncSubscriptionToSupabase({
  admin,
  userId,
  subscription,
  customerId,
  fallbackPlan,
}: SyncInput): Promise<SyncResult> {
  const priceId = subscription.items?.data?.[0]?.price?.id ?? null;
  const derivedPlan = planFromPriceId(priceId);
  let plan: StripePlanKey;
  if (derivedPlan) {
    plan = derivedPlan;
  } else if (fallbackPlan) {
    plan = fallbackPlan;
  } else {
    console.warn(
      `[stripe sync] could not derive plan for subscription ${subscription.id} (price ${priceId}); defaulting to pro`,
    );
    plan = "pro";
  }

  const { start, end } = readSubscriptionPeriod(subscription);
  const status = normalizeSubscriptionStatus(subscription.status);

  const subRow = {
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    stripe_price_id: priceId,
    plan,
    status,
    current_period_start: start,
    current_period_end: end,
    cancel_at_period_end: subscription.cancel_at_period_end ?? false,
  };

  const { error: upsertError } = await admin
    .from("subscriptions")
    .upsert(subRow, { onConflict: "user_id" });

  if (upsertError) {
    console.error("[stripe sync] subscriptions upsert failed:", upsertError);
    throw upsertError;
  }

  // Reflect plan + customer on user_profiles so app code (RLS, daily credits)
  // can read it directly without joining subscriptions.
  const { error: profileError } = await admin
    .from("user_profiles")
    .update({
      plan,
      stripe_customer_id: customerId,
      subscription_status: status,
    })
    .eq("id", userId);

  if (profileError) {
    console.error("[stripe sync] user_profiles plan update failed:", profileError);
    throw profileError;
  }

  if (plan === "pro" || plan === "max") {
    try {
      await grantReferralReward(admin, {
        referredUserId: userId,
        plan,
      });
    } catch (referralError) {
      console.error("[stripe sync] referral reward failed:", referralError);
    }
  }

  console.log(
    `[stripe sync] user ${userId} → plan=${plan} status=${status} sub=${subscription.id}`,
  );

  return {
    plan,
    status,
    current_period_start: start,
    current_period_end: end,
    stripe_price_id: priceId,
  };
}
