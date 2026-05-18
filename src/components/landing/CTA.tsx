"use client";

import Link from "next/link";
import { Cloud, Database, Smartphone, Sparkles } from "lucide-react";
import { FadeIn } from "@/components/shared/FadeIn";

const BADGES = [
  { label: "React Native", Icon: Smartphone },
  { label: "Expo", Icon: Cloud },
  { label: "Supabase", Icon: Database },
  { label: "Claude AI", Icon: Sparkles },
];

export function CTA() {
  return (
    <section className="relative isolate overflow-hidden py-24 sm:py-32">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-full"
        style={{
          background:
            "radial-gradient(ellipse at top, rgba(124,58,237,0.18) 0%, transparent 60%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-1/2"
        style={{
          background:
            "radial-gradient(ellipse at bottom, rgba(6,182,212,0.12) 0%, transparent 60%)",
        }}
      />

      <FadeIn className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
          Ready to build your app?
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-text-secondary">
          Join thousands of builders turning ideas into real mobile apps. Start
          for free, no credit card required.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="gradient-bg inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-violet-600/20 transition hover:scale-[1.02] hover:shadow-violet-600/40"
          >
            Start building for free →
          </Link>
          <Link
            href="/pricing"
            className="glass-border inline-flex items-center gap-2 rounded-xl bg-white/[0.02] px-6 py-3.5 text-base font-medium text-white transition hover:bg-white/[0.06]"
          >
            View pricing
          </Link>
        </div>

        <div className="mt-14">
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">
            Built with
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            {BADGES.map(({ label, Icon }) => (
              <span
                key={label}
                className="glass-border inline-flex items-center gap-2 rounded-full bg-white/[0.02] px-4 py-2 text-sm text-text-secondary"
              >
                <Icon className="h-3.5 w-3.5 text-violet-300" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </FadeIn>
    </section>
  );
}
