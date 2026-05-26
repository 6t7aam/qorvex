import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, X } from "lucide-react";
import { createPrivatePageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = createPrivatePageMetadata({
  title: "Payment cancelled",
  description: "Your Qorvex checkout was cancelled.",
  path: "/billing/cancel",
});

interface CancelPageProps {
  searchParams: Promise<{ order_id?: string }>;
}

export default async function BillingCancelPage({
  searchParams,
}: CancelPageProps) {
  const { order_id } = await searchParams;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-background-secondary/50">
        <X className="h-10 w-10 text-text-secondary" />
      </div>

      <h1 className="mt-8 text-3xl font-bold tracking-tight text-white sm:text-4xl">
        Payment cancelled
      </h1>
      <p className="mt-3 max-w-md text-sm text-text-secondary">
        Your checkout was cancelled and your plan was not changed. No funds
        were collected.
      </p>

      {order_id && (
        <p className="mt-4 rounded-full border border-white/10 bg-background-secondary/50 px-4 py-1.5 font-mono text-xs text-text-secondary">
          Order {order_id}
        </p>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/checkout"
          className="gradient-bg inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Try again
        </Link>
        <Link
          href="/billing"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-background-secondary/40 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/20"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to billing
        </Link>
      </div>
    </div>
  );
}
