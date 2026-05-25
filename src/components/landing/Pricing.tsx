"use client";

import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { PLANS } from "@/lib/constants";
import { FadeIn } from "@/components/shared/FadeIn";

interface PricingTier {
  id: "free" | "pro" | "max";
  name: string;
  price: number;
  description: string;
  features: readonly string[];
  cta: string;
  ctaHref: string;
  highlight?: boolean;
}

const TIERS: PricingTier[] = [
  {
    id: PLANS.FREE.id,
    name: PLANS.FREE.name,
    price: PLANS.FREE.price,
    description: PLANS.FREE.dailyCreditsLabel,
    features: PLANS.FREE.features,
    cta: "Get started free",
    ctaHref: "/signup",
  },
  {
    id: PLANS.PRO.id,
    name: PLANS.PRO.name,
    price: PLANS.PRO.price,
    description: PLANS.PRO.dailyCreditsLabel,
    features: PLANS.PRO.features,
    cta: "Start Pro",
    ctaHref: "/signup?plan=pro",
    highlight: true,
  },
  {
    id: PLANS.MAX.id,
    name: PLANS.MAX.name,
    price: PLANS.MAX.price,
    description: PLANS.MAX.dailyCreditsLabel,
    features: PLANS.MAX.features,
    cta: "Go Max",
    ctaHref: "/signup?plan=max",
  },
];

interface PricingProps {
  showHeader?: boolean;
}

export function Pricing({ showHeader = true }: PricingProps) {
  return (
    <section id="pricing" className="relative py-24 sm:py-32">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-32 -z-10 mx-auto h-72 w-2/3 rounded-full bg-cyan-500/10 blur-[120px]"
      />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {showHeader && (
          <FadeIn className="mx-auto max-w-2xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-text-secondary">
              <Sparkles className="h-3 w-3 text-violet-400" />
              Pricing
            </div>
            <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Simple, <span className="gradient-text">transparent</span> pricing
            </h2>
            <p className="mt-4 text-lg text-text-secondary">
              Start free, upgrade when you&apos;re ready to scale.
            </p>
          </FadeIn>
        )}

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {TIERS.map((tier, idx) => (
            <FadeIn key={tier.id} delay={idx * 0.08}>
              <PricingCard tier={tier} />
            </FadeIn>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-text-muted">
          All plans include a 7-day free trial. No credit card required to start.
        </p>
      </div>
    </section>
  );
}

function PricingCard({ tier }: { tier: PricingTier }) {
  const isFree = tier.price === 0;

  return (
    <div className="group relative h-full">
      {tier.highlight && (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-2 rounded-3xl opacity-50 blur-2xl transition-opacity duration-500 group-hover:opacity-80"
            style={{
              background:
                "linear-gradient(135deg, rgba(124,58,237,0.55) 0%, rgba(6,182,212,0.45) 100%)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-px rounded-2xl opacity-80 [background:linear-gradient(135deg,#7c3aed,#06b6d4,#7c3aed)] [background-size:200%_200%] animate-gradient-shift"
          />
        </>
      )}
      <div
        className={`relative flex h-full flex-col rounded-2xl p-8 transition-transform duration-500 hover:-translate-y-1 ${
          tier.highlight
            ? "border border-violet-500/40 bg-background-secondary shadow-[0_24px_80px_rgba(76,29,149,0.35)]"
            : "card-surface card-hover"
        }`}
      >
        {tier.highlight && (
          <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white shadow-lg shadow-violet-500/40">
            <Sparkles className="h-3 w-3" />
            Most popular
          </span>
        )}

        <div>
          <h3 className="text-lg font-semibold text-white">{tier.name}</h3>
          <p className="mt-1 text-sm text-text-secondary">{tier.description}</p>
        </div>

        <div className="mt-6">
          <div className="flex items-baseline gap-1">
            <span
              className={`text-5xl font-bold tracking-tight tabular-nums ${
                tier.highlight ? "text-gradient-soft" : "text-white"
              }`}
            >
              ${isFree ? "0" : tier.price.toFixed(2)}
            </span>
            <span className="text-sm text-text-secondary">/ month</span>
          </div>
        </div>

        <ul className="mt-8 flex-1 space-y-3">
          {tier.features.map((feature, i) => (
            <li
              key={feature}
              className="flex items-start gap-3 text-sm opacity-0 animate-fade-in-up"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <span
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                  tier.highlight
                    ? "bg-violet-500/20 text-violet-300"
                    : "bg-cyan-500/15 text-cyan-300"
                }`}
              >
                <Check className="h-3 w-3" />
              </span>
              <span className="text-text-secondary">{feature}</span>
            </li>
          ))}
        </ul>

        <Link
          href={tier.ctaHref}
          className={`group/cta relative mt-8 inline-flex items-center justify-center overflow-hidden rounded-xl px-4 py-3 text-sm font-medium transition ${
            tier.highlight
              ? "text-white hover:opacity-95"
              : "glass-border bg-white/[0.02] text-white hover:bg-white/[0.06]"
          }`}
        >
          {tier.highlight && (
            <span className="absolute inset-0 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 bg-[length:200%_100%] animate-gradient-shift" />
          )}
          <span className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover/cta:translate-x-[100%]" />
          <span className="relative inline-flex items-center gap-1.5">
            {tier.cta}
            <span className="transition-transform duration-300 group-hover/cta:translate-x-0.5">
              →
            </span>
          </span>
        </Link>
      </div>
    </div>
  );
}
