import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripeInstance, type StripePlanKey } from "@/lib/stripe/config";
import {
  normalizeSubscriptionStatus,
  readSubscriptionPeriod,
  syncSubscriptionToSupabase,
} from "@/lib/stripe/sync";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function findUserIdByCustomer(
  admin: ReturnType<typeof createAdminClient>,
  customerId: string,
): Promise<string | null> {
  const { data, error } = await admin
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle<{ user_id: string }>();
  if (error) {
    console.error("[stripe webhook] findUserIdByCustomer failed:", error);
    return null;
  }
  return data?.user_id ?? null;
}

export async function POST(request: NextRequest) {
  const stripe = getStripeInstance();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !webhookSecret) {
    return NextResponse.json(
      { error: "Stripe webhook is not configured" },
      { status: 503 },
    );
  }

  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Invalid signature";
    console.error("[stripe webhook] signature verification failed:", msg);
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const admin = createAdminClient();
  console.log(`[stripe webhook] received ${event.type} (${event.id})`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const fallbackPlan = session.metadata?.plan as
          | StripePlanKey
          | undefined;
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : (session.subscription as Stripe.Subscription | null)?.id;

        if (!userId || !subscriptionId) {
          console.error(
            "[stripe webhook] checkout.session.completed missing data",
            { userId, fallbackPlan, subscriptionId },
          );
          break;
        }

        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : (session.customer as Stripe.Customer | null)?.id ?? "";

        await syncSubscriptionToSupabase({
          admin,
          userId,
          subscription: sub,
          customerId,
          fallbackPlan,
        });
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId =
          typeof sub.customer === "string"
            ? sub.customer
            : (sub.customer as Stripe.Customer | null)?.id ?? "";
        const metadataUserId = sub.metadata?.userId;
        const fallbackPlan = sub.metadata?.plan as StripePlanKey | undefined;

        const userId =
          metadataUserId ?? (await findUserIdByCustomer(admin, customerId));

        if (!userId) {
          console.error(
            `[stripe webhook] ${event.type}: could not resolve user for sub=${sub.id} customer=${customerId}`,
          );
          break;
        }

        await syncSubscriptionToSupabase({
          admin,
          userId,
          subscription: sub,
          customerId,
          fallbackPlan,
        });
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const rawSubscription = (invoice as unknown as {
          subscription?: string | Stripe.Subscription | null;
        }).subscription;
        const subscriptionId =
          typeof rawSubscription === "string"
            ? rawSubscription
            : rawSubscription?.id ?? null;

        if (!subscriptionId) {
          console.log(
            `[stripe webhook] invoice.payment_succeeded without subscription (${invoice.id}) — skipping`,
          );
          break;
        }

        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const customerId =
          typeof sub.customer === "string"
            ? sub.customer
            : (sub.customer as Stripe.Customer | null)?.id ?? "";
        const userId =
          sub.metadata?.userId ??
          (await findUserIdByCustomer(admin, customerId));

        if (!userId) {
          console.error(
            `[stripe webhook] invoice.payment_succeeded: could not resolve user for sub=${sub.id}`,
          );
          break;
        }

        await syncSubscriptionToSupabase({
          admin,
          userId,
          subscription: sub,
          customerId,
          fallbackPlan: sub.metadata?.plan as StripePlanKey | undefined,
        });
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const { start, end } = readSubscriptionPeriod(sub);
        const status = normalizeSubscriptionStatus(sub.status) || "canceled";
        const { data: row, error: updateError } = await admin
          .from("subscriptions")
          .update({
            status: "canceled",
            current_period_start: start,
            current_period_end: end,
            cancel_at_period_end: sub.cancel_at_period_end ?? false,
          })
          .eq("stripe_subscription_id", sub.id)
          .select("user_id")
          .maybeSingle<{ user_id: string }>();
        if (updateError) {
          console.error(
            "[stripe webhook] subscription cancel update failed:",
            updateError,
          );
        }
        if (row?.user_id) {
          const { error: profileError } = await admin
            .from("user_profiles")
            .update({
              plan: "free",
              subscription_status: status,
            })
            .eq("id", row.user_id);
          if (profileError) {
            console.error(
              "[stripe webhook] user_profiles downgrade failed:",
              profileError,
            );
          }
        }
        console.log(`[stripe webhook] customer.subscription.deleted: ${sub.id}`);
        break;
      }

      default:
        console.log(`[stripe webhook] no handler for event type ${event.type}`);
        break;
    }
  } catch (err) {
    console.error(
      `[stripe webhook] handler error for ${event.type}:`,
      err instanceof Error ? err.message : err,
    );
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
