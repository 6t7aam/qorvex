"use client";

import { useEffect, useMemo, useState } from "react";
import { formatResetCountdown, type DailyCreditSnapshot } from "@/lib/ai-credits";
import { useAppStore } from "@/stores/useAppStore";

export const USAGE_UPDATED_EVENT = "qorvex:usage-updated";

interface UseDailyUsageResult {
  usage: DailyCreditSnapshot | null;
  isLoading: boolean;
  error: string | null;
  resetCountdown: string;
}

export function useDailyUsage(): UseDailyUsageResult {
  const user = useAppStore((state) => state.user);
  const [usage, setUsage] = useState<DailyCreditSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    let cancelled = false;

    function loadUsage() {
      setError(null);
      fetch("/api/usage", { cache: "no-store" })
        .then(async (response) => {
          const payload = (await response.json().catch(() => null)) as
            | { usage?: DailyCreditSnapshot; error?: string }
            | null;

          if (!response.ok) {
            throw new Error(payload?.error ?? "Could not load daily AI usage");
          }

          if (!cancelled) {
            setUsage(payload?.usage ?? null);
          }
        })
        .catch((fetchError) => {
          if (!cancelled) {
            setError(
              fetchError instanceof Error
                ? fetchError.message
                : "Could not load daily AI usage",
            );
          }
        });
    }

    loadUsage();
    window.addEventListener(USAGE_UPDATED_EVENT, loadUsage);

    return () => {
      cancelled = true;
      window.removeEventListener(USAGE_UPDATED_EVENT, loadUsage);
    };
  }, [user]);

  const resetCountdown = useMemo(
    () => (usage ? formatResetCountdown(usage.resetAt, now) : "--"),
    [usage, now],
  );

  const isLoading = Boolean(user && !usage && !error);

  return {
    usage: user ? usage : null,
    isLoading: user ? isLoading : false,
    error,
    resetCountdown: user ? resetCountdown : "--",
  };
}
