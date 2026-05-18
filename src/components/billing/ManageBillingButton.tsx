"use client";

import { useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function ManageBillingButton({
  variant = "primary",
  children,
}: {
  variant?: "primary" | "link";
  children?: React.ReactNode;
}) {
  const [pending, setPending] = useState(false);

  async function open() {
    setPending(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const body = (await res.json().catch(() => null)) as {
        url?: string;
        error?: string;
      } | null;
      if (!res.ok || !body?.url) {
        toast.error(body?.error ?? `Portal request failed (${res.status})`);
        setPending(false);
        return;
      }
      window.location.href = body.url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Request failed");
      setPending(false);
    }
  }

  if (variant === "link") {
    return (
      <button
        type="button"
        onClick={open}
        disabled={pending}
        className="inline-flex items-center gap-1.5 text-sm text-violet-300 transition hover:text-violet-200 disabled:opacity-60"
      >
        {pending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <ExternalLink className="h-3.5 w-3.5" />
        )}
        {children ?? "Manage billing & invoices"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={open}
      disabled={pending}
      className="glass-border inline-flex items-center gap-2 rounded-xl bg-white/[0.04] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <ExternalLink className="h-4 w-4" />
      )}
      {children ?? "Manage subscription"}
    </button>
  );
}
