import { redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { resolveActivePlan } from "@/lib/subscription.server";
import { CheckoutClient } from "@/components/billing/CheckoutClient";
import {
  NOWPAYMENTS_PLANS,
  isNowPaymentsPlan,
  type NowPaymentsPlanKey,
} from "@/lib/nowpayments/config";
import type { Plan } from "@/types";

export const dynamic = "force-dynamic";

interface CheckoutPageProps {
  searchParams: Promise<{ plan?: string }>;
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const { plan: planParam } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const target = `/login?redirectTo=${encodeURIComponent(
      `/checkout${planParam ? `?plan=${planParam}` : ""}`,
    )}`;
    redirect(target);
  }

  const { data: profileRow } = await supabase
    .from("user_profiles")
    .select("plan")
    .eq("id", user.id)
    .maybeSingle<{ plan: Plan | null }>();

  const admin = createAdminClient();
  const currentPlan = await resolveActivePlan(
    admin,
    user.id,
    (profileRow?.plan as Plan | null) ?? "free",
    { admin },
  );

  const initialPlan: NowPaymentsPlanKey = isNowPaymentsPlan(planParam)
    ? planParam
    : "pro";

  return (
    <CheckoutClient
      initialPlan={initialPlan}
      plans={NOWPAYMENTS_PLANS}
      userId={user.id}
      userEmail={user.email ?? null}
      currentPlan={currentPlan}
    />
  );
}
