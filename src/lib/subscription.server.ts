import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Plan } from "@/types";

interface ResolveOptions {
  /** Service-role client used to persist a downgrade when the plan expired. */
  admin?: SupabaseClient;
}

/**
 * Returns the plan the user is actually entitled to right now.
 *
 * Manual and crypto subscriptions are one-off activations with a hard end date
 * (subscriptions.current_period_end) and do NOT auto-renew, so once that date
 * passes the user must fall back to "free". When `admin` is supplied and an
 * expired paid plan is found, the downgrade is persisted so the billing UI,
 * admin views and plan badge stay consistent. The service-role write is allowed
 * past the user_profiles column-protection trigger.
 */
export async function resolveActivePlan(
  reader: SupabaseClient,
  userId: string,
  storedPlan: Plan,
  options: ResolveOptions = {},
): Promise<Plan> {
  if (storedPlan === "free") return "free";

  const { data: sub, error } = await reader
    .from("subscriptions")
    .select("status, current_period_end")
    .eq("user_id", userId)
    .maybeSingle<{ status: string | null; current_period_end: string | null }>();

  // No reliable expiry info (missing row / column) — leave the stored plan
  // untouched so manually granted plans are never dropped by accident.
  if (error || !sub || !sub.current_period_end) {
    return storedPlan;
  }

  const periodEnd = new Date(sub.current_period_end).getTime();
  if (Number.isNaN(periodEnd) || periodEnd >= Date.now()) {
    return storedPlan;
  }

  // Expired — fall back to free and persist the downgrade when we can.
  const admin = options.admin;
  if (admin) {
    await admin
      .from("user_profiles")
      .update({ plan: "free", subscription_status: "expired" })
      .eq("id", userId);
    if (sub.status === "active") {
      await admin
        .from("subscriptions")
        .update({ status: "canceled" })
        .eq("user_id", userId);
    }
  }

  return "free";
}
