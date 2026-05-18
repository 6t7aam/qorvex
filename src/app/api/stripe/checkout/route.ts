import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getStripeInstance,
  STRIPE_PLANS,
  type StripePlanKey,
} from "@/lib/stripe/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CheckoutBody {
  plan?: StripePlanKey;
}

export async function POST(request: NextRequest) {
  const stripe = getStripeInstance();
  if (!stripe) {
    return NextResponse.json(
      {
        error:
          "Stripe is not configured yet. Set STRIPE_SECRET_KEY in .env.local.",
      },
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

  let body: CheckoutBody;
  try {
    body = (await request.json()) as CheckoutBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const planKey = body.plan;
  if (planKey !== "pro" && planKey !== "max") {
    return NextResponse.json(
      { error: "Plan must be 'pro' or 'max'" },
      { status: 400 },
    );
  }

  const planConfig = STRIPE_PLANS[planKey];
  if (!planConfig.priceId) {
    return NextResponse.json(
      {
        error: `Stripe price ID for ${planKey} is not configured (STRIPE_${planKey.toUpperCase()}_PRICE_ID).`,
      },
      { status: 503 },
    );
  }

  let stripeCustomerId: string;
  const { data: subRow } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle<{ stripe_customer_id: string }>();

  if (subRow?.stripe_customer_id) {
    stripeCustomerId = subRow.stripe_customer_id;
  } else {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { userId: user.id },
    });
    stripeCustomerId = customer.id;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: planConfig.priceId, quantity: 1 }],
      success_url: `${appUrl}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/billing?canceled=true`,
      customer: stripeCustomerId,
      metadata: { userId: user.id, plan: planKey },
      subscription_data: {
        metadata: { userId: user.id, plan: planKey },
      },
      allow_promotion_codes: true,
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create checkout session";
    console.error("[stripe checkout] failed:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
