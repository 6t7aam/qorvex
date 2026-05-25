"use client";

import Link from "next/link";
import { Cloud, Database, Smartphone, Sparkles } from "lucide-react";
import { FadeIn } from "@/components/shared/FadeIn";

const BADGES = [
  { label: "React Native", Icon: Smartphone },
  { label: "Expo", Icon: Cloud },
  { label: "Supabase", Icon: Database },
  { label: "Gemini AI", Icon: Sparkles },
];

export function CTA() {
  return (
    <section className="relative isolate overflow-hidden py-24 sm:py-32">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-full"
        style={{
          background:
            "radial-gradient(ellipse at top, rgba(124,58,237,0.22) 0%, transparent 60%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-1/2"
        style={{
          background:
            "radial-gradient(ellipse at bottom, rgba(6,182,212,0.18) 0%, transparent 60%)",
        }}
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 grid-bg opacity-50" />

      <FadeIn className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-x-10 -top-10 mx-auto h-40 bg-[linear-gradient(90deg,transparent,rgba(168,85,247,0.18),transparent)] blur-3xl"
        />

        <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
          Ready to build your <span className="gradient-text">app</span>?
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-text-secondary">
          Join thousands of builders turning ideas into real mobile apps. Start
          for free, no credit card required.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-violet-600/20 transition-all duration-300 hover:scale-[1.03] hover:shadow-violet-600/50"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 bg-[length:200%_100%] animate-gradient-shift" />
            <span className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-[100%]" />
            <span className="relative inline-flex items-center gap-2">
              Start building for free
              <span className="transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </span>
          </Link>
          <Link
            href="/pricing"
            className="glass-border inline-flex items-center gap-2 rounded-xl bg-white/[0.02] px-6 py-3.5 text-base font-medium text-white transition hover:border-violet-400/40 hover:bg-white/[0.06]"
          >
            View pricing
          </Link>
        </div>

        <div className="mt-14">
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">
            Built with
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            {BADGES.map(({ label, Icon }, idx) => (
              <span
                key={label}
                className="glass-border group inline-flex items-center gap-2 rounded-full bg-white/[0.02] px-4 py-2 text-sm text-text-secondary transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-400/40 hover:text-white"
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                <Icon className="h-3.5 w-3.5 text-violet-300 transition-transform duration-300 group-hover:rotate-12" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </FadeIn>
    </section>
  );
}
