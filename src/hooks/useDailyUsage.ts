"use client";

import { useEffect, useMemo, useState } from "react";
import { formatResetCountdown, type DailyCreditSnapshot } from "@/lib/ai-credits";

export const USAGE_UPDATED_EVENT = "qorvex:usage-updated";

interface UseDailyUsageOptions {
  initialUsage?: DailyCreditSnapshot | null;
  enabled?: boolean;
}

interface UseDailyUsageResult {
  usage: DailyCreditSnapshot | null;
  isLoading: boolean;
  error: string | null;
  resetCountdown: string;
}

export function useDailyUsage(
  options: UseDailyUsageOptions = {},
): UseDailyUsageResult {
  const { initialUsage = null, enabled = true } = options;
  const [usage, setUsage] = useState<DailyCreditSnapshot | null>(initialUsage);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(Boolean(initialUsage));
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!enabled) return;
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
            setHasFetched(true);
          }
        })
        .catch((fetchError) => {
          if (!cancelled) {
            setError(
              fetchError instanceof Error
                ? fetchError.message
                : "Could not load daily AI usage",
            );
            setHasFetched(true);
          }
        });
    }

    loadUsage();
    window.addEventListener(USAGE_UPDATED_EVENT, loadUsage);

    return () => {
      cancelled = true;
      window.removeEventListener(USAGE_UPDATED_EVENT, loadUsage);
    };
  }, [enabled]);

  const resetCountdown = useMemo(
    () => (usage ? formatResetCountdown(usage.resetAt, now) : "--"),
    [usage, now],
  );

  const isLoading = enabled && !hasFetched;

  return {
    usage,
    isLoading,
    error,
    resetCountdown,
  };
}
