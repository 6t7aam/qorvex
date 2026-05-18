"use client";

import { useEffect, useState } from "react";
import { getPlanDailyCreditLimit } from "@/lib/ai-credits";
import { useDailyUsage } from "@/hooks/useDailyUsage";
import { useAppStore } from "@/stores/useAppStore";
import { createClient } from "@/lib/supabase/client";
import type { Plan, Subscription } from "@/types";

export interface UseSubscriptionResult {
  subscription: Subscription | null;
  plan: Plan;
  isLoading: boolean;
  isFree: boolean;
  isPro: boolean;
  isMax: boolean;
  dailyCreditsLimit: number;
  dailyCreditsUsed: number;
  dailyCreditsRemaining: number;
}

export function useSubscription(): UseSubscriptionResult {
  const user = useAppStore((s) => s.user);
  const storeSubscription = useAppStore((s) => s.subscription);
  const setSubscription = useAppStore((s) => s.setSubscription);
  const [isFetching, setIsFetching] = useState(false);
  const { usage, isLoading: usageLoading } = useDailyUsage();

  useEffect(() => {
    if (!user) {
      return;
    }
    if (storeSubscription) {
      return;
    }
    let cancelled = false;
    const supabase = createClient();
    Promise.resolve().then(() => {
      if (cancelled) return;
      setIsFetching(true);
      Promise.resolve(
        supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle<Subscription>(),
      )
        .then(({ data }) => {
          if (cancelled) return;
          setSubscription(data ?? null);
          setIsFetching(false);
        })
        .catch(() => {
          if (cancelled) return;
          setIsFetching(false);
        });
      });
    return () => {
      cancelled = true;
    };
  }, [user, storeSubscription, setSubscription]);

  const plan: Plan = user?.plan ?? "free";
  const dailyCreditsLimit = usage?.limitCredits ?? getPlanDailyCreditLimit(plan);
  const dailyCreditsUsed = usage?.usedCredits ?? 0;
  const dailyCreditsRemaining = usage?.remainingCredits ?? dailyCreditsLimit;

  return {
    subscription: storeSubscription,
    plan,
    isLoading: Boolean(user && !storeSubscription && isFetching) || usageLoading,
    isFree: plan === "free",
    isPro: plan === "pro",
    isMax: plan === "max",
    dailyCreditsLimit,
    dailyCreditsUsed,
    dailyCreditsRemaining,
  };
}
