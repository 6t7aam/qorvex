"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";

interface CheckoutSuccessSyncProps {
  sessionId: string;
  webhookSynced: boolean;
}

interface SyncResponse {
  synced?: boolean;
  status?: string;
  plan?: string;
  message?: string;
  error?: string;
}

type SyncState =
  | { kind: "syncing" }
  | { kind: "synced"; plan: string }
  | { kind: "pending"; message: string }
  | { kind: "error"; message: string };

export function CheckoutSuccessSync({
  sessionId,
  webhookSynced,
}: CheckoutSuccessSyncProps) {
  const router = useRouter();
  const [state, setState] = useState<SyncState>(
    webhookSynced ? { kind: "synced", plan: "" } : { kind: "syncing" },
  );
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (webhookSynced) return;
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/stripe/sync-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        const payload = (await response
          .json()
          .catch(() => null)) as SyncResponse | null;

        if (cancelled) return;

        if (!response.ok) {
          setState({
            kind: "error",
            message:
              payload?.error ??
              "We couldn't sync your subscription. Please refresh in a moment.",
          });
          return;
        }

        if (payload?.synced) {
          setState({ kind: "synced", plan: payload.plan ?? "" });
          router.refresh();
          return;
        }

        setState({
          kind: "pending",
          message:
            payload?.message ??
            "Payment completed, waiting for Stripe webhook sync.",
        });
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof Error
            ? err.message
            : "We couldn't sync your subscription. Please refresh in a moment.";
        setState({ kind: "error", message });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionId, webhookSynced, router]);

  if (state.kind === "syncing") {
    return (
      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-violet-500/30 bg-violet-500/10 px-5 py-4 text-sm text-violet-200">
        <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
        Payment received. Syncing your subscription...
      </div>
    );
  }

  if (state.kind === "synced") {
    return (
      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-200">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
        Payment successful! Your plan
        {state.plan ? ` is now ${state.plan.toUpperCase()}` : " has been upgraded"}
        .
      </div>
    );
  }

  if (state.kind === "pending") {
    return (
      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 text-sm text-amber-200">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        {state.message}
      </div>
    );
  }

  return (
    <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 text-sm text-amber-200">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      {state.message}
    </div>
  );
}
