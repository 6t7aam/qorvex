import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripeInstance } from "@/lib/stripe/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const stripe = getStripeInstance();
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe is not configured yet." },
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

  const { data: subRow } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle<{ stripe_customer_id: string }>();

  if (!subRow?.stripe_customer_id) {
    return NextResponse.json(
      { error: "No active subscription to manage." },
      { status: 404 },
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    const portal = await stripe.billingPortal.sessions.create({
      customer: subRow.stripe_customer_id,
      return_url: `${appUrl}/billing`,
    });
    return NextResponse.json({ url: portal.url });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create portal session";
    console.error("[stripe portal] failed:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
