"use client";

import Link from "next/link";
import { Check } from "lucide-react";
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
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {showHeader && (
          <FadeIn className="mx-auto max-w-2xl text-center">
            <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Simple, transparent pricing
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
    <div className="relative h-full">
      {tier.highlight && (
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-2 rounded-3xl opacity-30 blur-2xl"
          style={{
            background:
              "linear-gradient(135deg, rgba(124,58,237,0.5) 0%, rgba(6,182,212,0.4) 100%)",
          }}
        />
      )}
      <div
        className={`relative flex h-full flex-col rounded-2xl p-8 ${
          tier.highlight
            ? "border border-violet-500/40 bg-background-secondary"
            : "glass"
        }`}
      >
        {tier.highlight && (
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-violet-500 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white shadow-lg shadow-violet-500/30">
            Most popular
          </span>
        )}

        <div>
          <h3 className="text-lg font-semibold text-white">{tier.name}</h3>
          <p className="mt-1 text-sm text-text-secondary">{tier.description}</p>
        </div>

        <div className="mt-6">
          <div className="flex items-baseline gap-1">
            <span className="text-5xl font-bold tracking-tight text-white">
              ${isFree ? "0" : tier.price.toFixed(2)}
            </span>
            <span className="text-sm text-text-secondary">/ month</span>
          </div>
        </div>

        <ul className="mt-8 flex-1 space-y-3">
          {tier.features.map((feature) => (
            <li key={feature} className="flex items-start gap-3 text-sm">
              <Check
                className={`mt-0.5 h-4 w-4 shrink-0 ${
                  tier.highlight ? "text-violet-400" : "text-cyan-400"
                }`}
              />
              <span className="text-text-secondary">{feature}</span>
            </li>
          ))}
        </ul>

        <Link
          href={tier.ctaHref}
          className={`mt-8 inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-medium transition ${
            tier.highlight
              ? "gradient-bg text-white hover:opacity-90"
              : "glass-border bg-white/[0.02] text-white hover:bg-white/[0.06]"
          }`}
        >
          {tier.cta}
        </Link>
      </div>
    </div>
  );
}
