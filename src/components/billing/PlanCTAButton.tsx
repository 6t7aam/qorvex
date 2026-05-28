"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { planRank } from "@/lib/plans";
import type { Plan } from "@/types";

type CardPlan = "free" | "pro" | "max";

interface PlanCTAButtonProps {
  cardPlan: CardPlan;
  userPlan: Plan;
  userId: string | null;
  highlight?: boolean;
  pendingPlan?: "pro" | "max" | null;
}

export function PlanCTAButton({
  cardPlan,
  userPlan,
  userId,
  highlight,
  pendingPlan,
}: PlanCTAButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const isCurrent = cardPlan === userPlan;
  const isDowngrade = planRank(cardPlan) < planRank(userPlan);
  const isPaidUpgrade = planRank(cardPlan) > planRank(userPlan);
  const hasPendingForThisCard =
    isPaidUpgrade && pendingPlan === cardPlan;

  function go() {
    if (isPaidUpgrade) {
      if (!userId) {
        toast.error("You need to be signed in to upgrade.");
        return;
      }
      setPending(true);
      router.push(`/checkout?plan=${cardPlan}`);
    }
  }

  if (isCurrent) {
    return (
      <button
        type="button"
        disabled
        className="mt-5 inline-flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-semibold text-text-secondary"
      >
        Current Plan
      </button>
    );
  }

  if (hasPendingForThisCard) {
    return (
      <button
        type="button"
        disabled
        className="mt-5 inline-flex w-full items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs font-semibold text-amber-200"
      >
        Verification pending
      </button>
    );
  }

  if (isDowngrade) {
    return (
      <button
        type="button"
        disabled
        title="Your paid plan stays active until it expires. Contact support to cancel early."
        className="mt-5 inline-flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-semibold text-text-secondary"
      >
        Contact support to cancel
      </button>
    );
  }

  let label: string;
  if (cardPlan === "pro") {
    label = "Upgrade to Pro";
  } else if (cardPlan === "max") {
    label = userPlan === "pro" ? "Upgrade to Max" : "Go Max";
  } else {
    label = "Continue";
  }

  const styling = highlight
    ? "gradient-bg text-white hover:opacity-90"
    : "glass-border bg-white/[0.02] text-white hover:bg-white/[0.06]";

  return (
    <button
      type="button"
      onClick={go}
      disabled={pending}
      className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${styling}`}
    >
      {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {pending ? "Redirecting…" : label}
    </button>
  );
}
