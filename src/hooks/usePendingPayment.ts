"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { PLANS } from "@/lib/constants";
import type { ManualPayment } from "@/types";

const POLL_INTERVAL_MS = 30_000;
const LOOKBACK_HOURS = 24;
const SHOWN_KEY = "qorvex.shown_payment_notifications";

function loadShown(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(SHOWN_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) return new Set(parsed as string[]);
  } catch {
    // fall through
  }
  return new Set();
}

function saveShown(shown: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SHOWN_KEY, JSON.stringify(Array.from(shown)));
  } catch {
    // ignore — storage full or denied
  }
}

function planLabel(plan: "pro" | "max") {
  return plan === "max" ? PLANS.MAX.name : PLANS.PRO.name;
}

export function usePendingPayment() {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inFlightRef = useRef(false);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function tick() {
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (cancelled || !user) return;

        const since = new Date(
          Date.now() - LOOKBACK_HOURS * 60 * 60 * 1000,
        ).toISOString();

        const { data, error } = await supabase
          .from("manual_payments")
          .select("id, plan, status, confirmed_at, rejected_at, admin_note, updated_at")
          .eq("user_id", user.id)
          .in("status", ["confirmed", "rejected"])
          .gte("updated_at", since)
          .order("updated_at", { ascending: false })
          .limit(5);

        if (cancelled || error || !data) return;

        const shown = loadShown();
        let anyNew = false;
        for (const row of data as Pick<
          ManualPayment,
          "id" | "plan" | "status" | "confirmed_at" | "rejected_at" | "admin_note"
        >[]) {
          if (shown.has(row.id)) continue;
          if (row.status === "confirmed") {
            toast.success(
              `🎉 Your payment has been confirmed! Welcome to ${planLabel(row.plan)}!`,
            );
            anyNew = true;
          } else if (row.status === "rejected") {
            toast.error(
              row.admin_note
                ? `Your payment was not confirmed: ${row.admin_note}`
                : "Your payment was not confirmed. Please contact support.",
            );
            anyNew = true;
          }
          shown.add(row.id);
        }
        if (anyNew) {
          saveShown(shown);
          router.refresh();
        }
      } catch {
        // network/auth hiccup — try again next tick
      } finally {
        inFlightRef.current = false;
      }
    }

    tick();
    timerRef.current = setInterval(tick, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [router]);
}

export function PendingPaymentWatcher() {
  usePendingPayment();
  return null;
}
