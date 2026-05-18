import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripeInstance, type StripePlanKey } from "@/lib/stripe/config";
import { syncSubscriptionToSupabase } from "@/lib/stripe/sync";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface SyncBody {
  sessionId?: string;
}

export async function POST(request: NextRequest) {
  const stripe = getStripeInstance();
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe is not configured." },
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

  let body: SyncBody;
  try {
    body = (await request.json()) as SyncBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const sessionId = body.sessionId?.trim();
  if (!sessionId) {
    return NextResponse.json(
      { error: "Missing sessionId" },
      { status: 400 },
    );
  }

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription", "customer"],
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load checkout session";
    console.error("[stripe sync-session] retrieve failed:", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const metadataUserId = session.metadata?.userId;
  if (metadataUserId && metadataUserId !== user.id) {
    console.error(
      `[stripe sync-session] user mismatch: session ${sessionId} belongs to ${metadataUserId}, requester is ${user.id}`,
    );
    return NextResponse.json(
      { error: "This checkout session does not belong to your account." },
      { status: 403 },
    );
  }

  if (session.payment_status !== "paid" && session.status !== "complete") {
    return NextResponse.json(
      {
        synced: false,
        status: session.payment_status ?? session.status ?? "pending",
        message:
          "Checkout session is not paid yet. Stripe has not confirmed payment.",
      },
      { status: 200 },
    );
  }

  const subscription =
    typeof session.subscription === "object" && session.subscription
      ? (session.subscription as Stripe.Subscription)
      : typeof session.subscription === "string"
        ? await stripe.subscriptions.retrieve(session.subscription)
        : null;

  if (!subscription) {
    return NextResponse.json(
      { error: "Checkout session has no attached subscription." },
      { status: 400 },
    );
  }

  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : (session.customer as Stripe.Customer | null)?.id ?? "";

  if (!customerId) {
    return NextResponse.json(
      { error: "Checkout session has no Stripe customer id." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  try {
    const result = await syncSubscriptionToSupabase({
      admin,
      userId: user.id,
      subscription,
      customerId,
      fallbackPlan: session.metadata?.plan as StripePlanKey | undefined,
    });

    return NextResponse.json({
      synced: true,
      plan: result.plan,
      status: result.status,
      current_period_end: result.current_period_end,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Sync failed";
    console.error("[stripe sync-session] sync failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
