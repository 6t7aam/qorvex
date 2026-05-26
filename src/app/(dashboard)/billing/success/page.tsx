import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Sparkles } from "lucide-react";
import { createPrivatePageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = createPrivatePageMetadata({
  title: "Payment received",
  description: "Your Qorvex subscription is being activated.",
  path: "/billing/success",
});

interface SuccessPageProps {
  searchParams: Promise<{ order_id?: string }>;
}

export default async function BillingSuccessPage({
  searchParams,
}: SuccessPageProps) {
  const { order_id } = await searchParams;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
      <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-600 to-cyan-500 shadow-lg shadow-violet-500/30">
        <CheckCircle2 className="h-10 w-10 text-white" />
        <span className="absolute -inset-1 -z-10 rounded-3xl bg-gradient-to-br from-violet-600/40 to-cyan-500/40 blur-xl" />
      </div>

      <h1 className="mt-8 text-3xl font-bold tracking-tight text-white sm:text-4xl">
        Payment received
      </h1>
      <p className="mt-3 max-w-md text-sm text-text-secondary">
        Your subscription will be activated automatically once the payment is
        confirmed on-chain. This usually takes a few minutes — you can close
        this page safely.
      </p>

      {order_id && (
        <p className="mt-4 rounded-full border border-white/10 bg-background-secondary/50 px-4 py-1.5 font-mono text-xs text-text-secondary">
          Order {order_id}
        </p>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/dashboard"
          className="gradient-bg inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
        >
          <Sparkles className="h-4 w-4" />
          Go to dashboard
        </Link>
        <Link
          href="/billing"
          className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-background-secondary/40 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/20"
        >
          View billing
        </Link>
      </div>

      <p className="mt-10 max-w-md text-xs text-text-muted">
        Subscription activation depends on payment confirmation from
        NOWPayments. If your plan does not update within 30 minutes please
        contact support with your order ID.
      </p>
    </div>
  );
}
