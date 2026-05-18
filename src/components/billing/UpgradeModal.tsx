"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, Lock, X } from "lucide-react";
import { toast } from "sonner";
import { PLANS } from "@/lib/constants";
import { useUIStore } from "@/stores/useUIStore";

type CheckoutPlan = "pro" | "max";

export function UpgradeModal() {
  const open = useUIStore((s) => s.upgradeModalOpen);
  const setOpen = useUIStore((s) => s.setUpgradeModal);
  const [pending, setPending] = useState<CheckoutPlan | null>(null);

  async function startCheckout(plan: CheckoutPlan) {
    setPending(plan);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const body = (await res.json().catch(() => null)) as {
        url?: string;
        error?: string;
      } | null;
      if (!res.ok || !body?.url) {
        toast.error(body?.error ?? `Checkout failed (${res.status})`);
        setPending(null);
        return;
      }
      window.location.href = body.url;
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Checkout request failed",
      );
      setPending(null);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="glass-border relative w-full max-w-2xl rounded-2xl bg-background-secondary p-8 shadow-2xl shadow-black/60"
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-text-secondary transition hover:bg-white/[0.06] hover:text-white"
              aria-label="Close upgrade dialog"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 ring-1 ring-amber-500/30">
              <Lock className="h-5 w-5 text-amber-300" />
            </div>
            <h2 className="mt-4 text-2xl font-semibold text-white">
              You&apos;ve reached your daily AI credit limit
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              Your daily credit pool is nearly empty. Upgrade for a larger pool
              that resets every 24 hours.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <PlanCard
                name={PLANS.PRO.name}
                price={PLANS.PRO.price}
                features={PLANS.PRO.features.slice(0, 5)}
                cta={`Upgrade to Pro — $${PLANS.PRO.price.toFixed(2)}/mo`}
                highlight
                pending={pending === "pro"}
                disabled={pending !== null}
                onClick={() => startCheckout("pro")}
              />
              <PlanCard
                name={PLANS.MAX.name}
                price={PLANS.MAX.price}
                features={PLANS.MAX.features.slice(0, 5)}
                cta={`Go Max — $${PLANS.MAX.price.toFixed(2)}/mo`}
                pending={pending === "max"}
                disabled={pending !== null}
                onClick={() => startCheckout("max")}
              />
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-6 block w-full text-center text-xs text-text-muted transition hover:text-white"
            >
              Maybe later
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function PlanCard({
  name,
  price,
  features,
  cta,
  onClick,
  highlight,
  pending,
  disabled,
}: {
  name: string;
  price: number;
  features: readonly string[];
  cta: string;
  onClick: () => void;
  highlight?: boolean;
  pending?: boolean;
  disabled?: boolean;
}) {
  return (
    <div
      className={`flex h-full flex-col rounded-2xl p-5 ${
        highlight
          ? "border border-violet-500/40 bg-violet-500/[0.08]"
          : "glass-border bg-background-tertiary/40"
      }`}
    >
      <div className="text-sm font-semibold text-white">{name}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-3xl font-bold text-white">
          ${price.toFixed(2)}
        </span>
        <span className="text-xs text-text-muted">/ mo</span>
      </div>
      <ul className="mt-4 flex-1 space-y-2 text-xs text-text-secondary">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <Check
              className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${
                highlight ? "text-violet-300" : "text-cyan-300"
              }`}
            />
            {feature}
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`mt-5 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
          highlight
            ? "gradient-bg text-white hover:opacity-90"
            : "glass-border bg-white/[0.02] text-white hover:bg-white/[0.06]"
        }`}
      >
        {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {pending ? "Redirecting…" : cta}
      </button>
    </div>
  );
}
