"use client";

import Link from "next/link";
import { Crown, Sparkles, Zap } from "lucide-react";
import { useDailyUsage } from "@/hooks/useDailyUsage";
import { useSubscription } from "@/hooks/useSubscription";

export function BillingStatus() {
  const { plan, isPro, isMax } = useSubscription();
  const { usage, resetCountdown } = useDailyUsage();

  if (!usage) {
    return null;
  }

  const percent =
    usage.limitCredits > 0
      ? Math.min(100, Math.round((usage.usedCredits / usage.limitCredits) * 100))
      : 0;
  const outOfRoom = usage.remainingCredits <= 0;

  if (isMax) {
    return (
      <div className="rounded-xl border border-cyan-500/25 bg-gradient-to-br from-violet-500/10 via-cyan-500/10 to-amber-500/10 px-3 py-2.5">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-cyan-200">
          <Crown className="h-3.5 w-3.5" />
          Max plan
        </div>
        <div className="mt-1 text-xs text-text-secondary">
          {usage.remainingCredits.toLocaleString()} daily credits left • resets in {resetCountdown}
        </div>
      </div>
    );
  }

  if (isPro) {
    return (
      <div className="rounded-xl border border-violet-500/25 bg-violet-500/[0.08] px-3 py-2.5">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-violet-200">
          <Sparkles className="h-3.5 w-3.5" />
          Pro plan
        </div>
        <div className="mt-1 text-xs text-text-secondary">
          {usage.remainingCredits.toLocaleString()} credits remaining today
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
        <Zap className="h-3.5 w-3.5" />
        Free plan
      </div>
      <div className="mt-1 flex items-baseline justify-between text-xs text-text-secondary">
        <span>
          {usage.usedCredits.toLocaleString()} / {usage.limitCredits.toLocaleString()} used
        </span>
        {outOfRoom && (
          <Link
            href="/billing"
            className="text-[10px] font-semibold uppercase tracking-wider text-amber-300 transition hover:text-amber-200"
          >
            Upgrade
          </Link>
        )}
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className={`h-full transition-all ${
            outOfRoom
              ? "bg-amber-400"
              : percent > 66
                ? "bg-violet-400"
                : "bg-emerald-400"
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {plan === "free" && !outOfRoom && (
        <Link
          href="/billing"
          className="mt-2 block text-[10px] font-semibold uppercase tracking-wider text-violet-300 transition hover:text-violet-200"
        >
          More daily credits →
        </Link>
      )}
    </div>
  );
}
