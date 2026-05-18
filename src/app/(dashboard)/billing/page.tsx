import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Clock,
  CreditCard,
  Crown,
  Lock,
  Sparkles,
  Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PLANS } from "@/lib/constants";
import { PlanCTAButton } from "@/components/billing/PlanCTAButton";
import { ManageBillingButton } from "@/components/billing/ManageBillingButton";
import { CheckoutSuccessSync } from "@/components/billing/CheckoutSuccessSync";
import type {
  ManualPayment,
  Plan,
  Subscription,
  UserProfile,
} from "@/types";

export const dynamic = "force-dynamic";

interface BillingPageProps {
  searchParams: Promise<{
    success?: string;
    canceled?: string;
    plan?: string;
    session_id?: string;
    upgrade?: string;
  }>;
}

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const params = await searchParams;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let profile: UserProfile | null = null;
  let subscription: Subscription | null = null;
  let pendingPayment: ManualPayment | null = null;
  let wasReferred = false;
  let userId: string | null = null;

  if (supabaseUrl && supabaseAnonKey) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      userId = user.id;
      const [
        { data: profileRow },
        { data: subRow },
        { data: pendingRow },
        { data: referralRow },
      ] = await Promise.all([
        supabase
          .from("user_profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle<UserProfile>(),
        supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle<Subscription>(),
        supabase
          .from("manual_payments")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle<ManualPayment>(),
        supabase
          .from("referrals")
          .select("id")
          .eq("referred_user_id", user.id)
          .maybeSingle<{ id: string }>(),
      ]);
      profile = profileRow ?? null;
      subscription = subRow ?? null;
      pendingPayment = pendingRow ?? null;
      wasReferred = !!referralRow;
    }
  }

  const plan: Plan = profile?.plan ?? "free";
  const pendingPlan = (profile?.pending_plan ?? pendingPayment?.plan ?? null) as
    | "pro"
    | "max"
    | null;
  const paidPlanActive =
    plan !== "free" &&
    (subscription?.status === "active" ||
      subscription?.status === "trialing");
  const checkoutSucceeded = params.success === "true";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-text-secondary transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Dashboard
      </Link>

      <div className="mt-6">
        <h1 className="text-3xl font-bold text-white">Billing & Plans</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Manage your subscription and unlock more daily AI credits.
        </p>
      </div>

      {pendingPayment && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 text-sm text-amber-200">
          <Clock className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <div className="font-semibold text-amber-100">
              Payment pending verification
            </div>
            <p className="mt-0.5">
              We received your payment screenshot for{" "}
              <span className="font-semibold capitalize">{pendingPayment.plan}</span>{" "}
              (order{" "}
              <span className="font-mono text-amber-100">
                {pendingPayment.order_id}
              </span>
              ) and will confirm within 24 hours.
            </p>
          </div>
        </div>
      )}

      {params.upgrade === "github_export" && plan === "free" && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-violet-500/30 bg-violet-500/10 px-5 py-4 text-sm text-violet-100">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-violet-200" />
          <div>
            <div className="font-semibold text-white">
              GitHub export is available on Pro and Max
            </div>
            <p className="mt-0.5 text-violet-200">
              Upgrade to unlock one-click repo creation and direct push of the
              generated Expo files.
            </p>
          </div>
        </div>
      )}

      {wasReferred && plan === "free" && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-5 py-4 text-sm text-cyan-100">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
          Upgrade to Pro or Max to unlock more credits and support the person who invited you.
        </div>
      )}

      {checkoutSucceeded && params.session_id ? (
        <CheckoutSuccessSync
          sessionId={params.session_id}
          webhookSynced={paidPlanActive}
        />
      ) : null}
      {params.canceled && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 text-sm text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          Payment canceled. Your plan was not changed.
        </div>
      )}

      <CurrentPlanCard plan={plan} subscription={subscription} />

      <section id="choose-plan" className="mt-10">
        <h2 className="text-lg font-semibold text-white">Choose a plan</h2>
        <div className="mt-5 grid gap-5 md:grid-cols-3">
          <PricingCard
            plan="free"
            userPlan={plan}
            userId={userId}
            pendingPlan={pendingPlan}
          />
          <PricingCard
            plan="pro"
            userPlan={plan}
            userId={userId}
            pendingPlan={pendingPlan}
            spotlight={params.upgrade === "github_export"}
          />
          <PricingCard
            plan="max"
            userPlan={plan}
            userId={userId}
            pendingPlan={pendingPlan}
            spotlight={params.upgrade === "github_export"}
          />
        </div>
      </section>

      <BillingHistory subscription={subscription} />
    </div>
  );
}

function CurrentPlanCard({
  plan,
  subscription,
}: {
  plan: Plan;
  subscription: Subscription | null;
}) {
  const config =
    plan === "max"
      ? PLANS.MAX
      : plan === "pro"
        ? PLANS.PRO
        : PLANS.FREE;
  const accent = badgeStyles(plan);
  const Icon = plan === "max" ? Crown : plan === "pro" ? Sparkles : Zap;

  return (
    <section className="mt-8 grid gap-6 rounded-2xl border border-white/10 bg-background-secondary/40 p-6 md:grid-cols-[1.4fr_1fr]">
      <div>
        <div className="flex items-center gap-3">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl ${accent.tile}`}
          >
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-text-muted">
              Current plan
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-semibold text-white">
                {config.name}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${accent.badge}`}
              >
                {config.name}
              </span>
            </div>
          </div>
        </div>
        <ul className="mt-5 grid gap-2 text-sm text-text-secondary sm:grid-cols-2">
          {config.features.map((f) => (
            <li key={f} className="flex items-start gap-2">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-300" />
              {f}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col justify-between gap-4 rounded-xl border border-white/5 bg-black/20 p-5">
        {plan === "free" ? (
          <>
            <div>
              <div className="text-sm font-semibold text-white">
                Want more daily AI credits?
              </div>
              <p className="mt-1 text-xs text-text-secondary">
                Upgrade to Pro for a larger daily pool, or Max for high-volume AI work every day.
              </p>
            </div>
            <Link
              href="#choose-plan"
              className="gradient-bg inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Upgrade
            </Link>
          </>
        ) : (
          <>
            <div className="space-y-2 text-sm">
              {subscription?.current_period_end && (
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">
                    {subscription.cancel_at_period_end ? "Ends on" : "Next bill"}
                  </span>
                  <span className="text-white">
                    {formatDate(subscription.current_period_end)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Amount</span>
                <span className="text-white">
                  ${config.price.toFixed(2)} / month
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Status</span>
                <span className="capitalize text-white">
                  {subscription?.status ?? "active"}
                </span>
              </div>
            </div>
            {subscription?.cancel_at_period_end && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Your subscription will end on{" "}
                {formatDate(subscription.current_period_end)}.
              </div>
            )}
            <ManageBillingButton />
          </>
        )}
      </div>
    </section>
  );
}

function PricingCard({
  plan,
  userPlan,
  userId,
  pendingPlan,
  spotlight,
}: {
  plan: "free" | "pro" | "max";
  userPlan: Plan;
  userId: string | null;
  pendingPlan: "pro" | "max" | null;
  spotlight?: boolean;
}) {
  const config =
    plan === "max" ? PLANS.MAX : plan === "pro" ? PLANS.PRO : PLANS.FREE;
  const isCurrent = plan === userPlan;
  const isPro = plan === "pro";
  const isPaidCard = plan === "pro" || plan === "max";
  const isSpotlighted = !!spotlight && isPaidCard;
  const accent = badgeStyles(plan);

  return (
    <div
      className={`relative flex h-full flex-col rounded-2xl p-6 ${
        isPro
          ? "border border-violet-500/50 bg-violet-500/[0.06] shadow-xl shadow-violet-500/10"
          : "glass-border bg-background-secondary/40"
      } ${isSpotlighted ? "ring-2 ring-violet-400/60" : ""}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-white">{config.name}</span>
        <div className="flex items-center gap-1.5">
          {isCurrent && (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${accent.badge}`}
            >
              Current
            </span>
          )}
          {isPro && (
            <span className="rounded-full bg-violet-500 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
              Most Popular
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-4xl font-bold text-white">
          ${config.price.toFixed(2)}
        </span>
        <span className="text-sm text-text-muted">/ month</span>
      </div>

      <ul className="mt-6 flex-1 space-y-2 text-sm text-text-secondary">
        {config.features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Check
              className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${
                isPro ? "text-violet-300" : "text-cyan-300"
              }`}
            />
            {f}
          </li>
        ))}
      </ul>

      <PlanCTAButton
        cardPlan={plan}
        userPlan={userPlan}
        userId={userId}
        highlight={isPro}
        pendingPlan={pendingPlan}
      />
    </div>
  );
}

function BillingHistory({
  subscription,
}: {
  subscription: Subscription | null;
}) {
  return (
    <section className="mt-10 rounded-2xl border border-white/10 bg-background-secondary/30 p-6">
      <div className="flex items-center gap-2">
        <CreditCard className="h-4 w-4 text-violet-300" />
        <h2 className="text-lg font-semibold text-white">Billing History</h2>
      </div>

      {!subscription ? (
        <p className="mt-3 text-sm text-text-secondary">
          No billing history yet. Upgrade to Pro or Max to start your
          subscription.
        </p>
      ) : (
        <div className="mt-4 overflow-hidden rounded-xl border border-white/5">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.03] text-left text-xs uppercase tracking-wider text-text-muted">
              <tr>
                <th className="px-4 py-2.5 font-medium">Plan</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Period</th>
                <th className="px-4 py-2.5 font-medium">Auto-renew</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-white/5">
                <td className="px-4 py-3 capitalize text-white">
                  {subscription.plan}
                </td>
                <td className="px-4 py-3 capitalize text-text-secondary">
                  {subscription.status}
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  {formatDate(subscription.current_period_start)} →{" "}
                  {formatDate(subscription.current_period_end)}
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  {subscription.cancel_at_period_end ? "Off" : "On"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4">
        <ManageBillingButton variant="link" />
      </div>
    </section>
  );
}

function badgeStyles(plan: Plan): { tile: string; badge: string } {
  if (plan === "max") {
    return {
      tile: "bg-gradient-to-br from-cyan-500/30 to-amber-400/30 text-cyan-100 ring-1 ring-cyan-400/30",
      badge:
        "bg-gradient-to-r from-cyan-500/20 to-amber-400/20 text-cyan-100 ring-1 ring-cyan-400/30",
    };
  }
  if (plan === "pro") {
    return {
      tile: "bg-violet-500/15 text-violet-200 ring-1 ring-violet-500/30",
      badge: "bg-violet-500/15 text-violet-200 ring-1 ring-violet-500/30",
    };
  }
  return {
    tile: "bg-white/[0.06] text-text-secondary ring-1 ring-white/10",
    badge: "bg-white/[0.06] text-text-secondary ring-1 ring-white/10",
  };
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}
