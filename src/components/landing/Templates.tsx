"use client";

import Link from "next/link";
import {
  Brain,
  CheckSquare,
  Dumbbell,
  MessageSquare,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Users,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { APP_TEMPLATES } from "@/lib/constants";
import { FadeIn } from "@/components/shared/FadeIn";

const ICON_MAP: Record<string, LucideIcon> = {
  Dumbbell,
  CheckSquare,
  MessageSquare,
  Users,
  UtensilsCrossed,
  TrendingUp,
  Brain,
  ShoppingBag,
};

const ACCENT_BY_ID: Record<string, string> = {
  "fitness-tracker": "#10b981",
  "habit-tracker": "#7c3aed",
  "ai-chat": "#06b6d4",
  "social-app": "#ec4899",
  "restaurant-booking": "#f59e0b",
  "finance-tracker": "#3b82f6",
  "meditation-app": "#a78bfa",
  marketplace: "#ef4444",
};

export function Templates() {
  return (
    <section id="templates" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-text-secondary">
            <Sparkles className="h-3 w-3 text-cyan-400" />
            Templates
          </div>
          <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Start with a <span className="gradient-text">template</span>
          </h2>
          <p className="mt-4 text-lg text-text-secondary">
            8 professionally designed starting points, customized by AI for your
            needs.
          </p>
        </FadeIn>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {APP_TEMPLATES.map((tpl, idx) => {
            const Icon = ICON_MAP[tpl.icon] ?? Sparkles;
            const accent = ACCENT_BY_ID[tpl.id] ?? "#7c3aed";
            return (
              <FadeIn key={tpl.id} delay={idx * 0.04}>
                <div
                  className="group card-surface card-hover sheen relative h-full overflow-hidden rounded-2xl p-5"
                  style={{ "--accent": accent } as React.CSSProperties}
                >
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-60"
                    style={{ background: `${accent}66` }}
                  />
                  {tpl.isPremium && (
                    <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-violet-300 ring-1 ring-violet-500/30">
                      <Sparkles className="h-2.5 w-2.5" />
                      Premium
                    </span>
                  )}
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6"
                    style={{
                      backgroundColor: `${accent}1f`,
                      boxShadow: `0 0 0 1px ${accent}33 inset, 0 10px 24px ${accent}22`,
                    }}
                  >
                    <Icon className="h-5 w-5" style={{ color: accent }} />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-white">
                    {tpl.name}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
                    {tpl.description}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {tpl.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[10px] uppercase tracking-wider text-text-secondary transition-colors duration-300 group-hover:bg-white/[0.08] group-hover:text-text-primary"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </FadeIn>
            );
          })}
        </div>

        <div className="mt-12 flex justify-center">
          <Link
            href="/signup"
            className="group glass-border inline-flex items-center gap-2 rounded-xl bg-white/[0.02] px-5 py-2.5 text-sm font-medium text-white transition hover:border-violet-400/40 hover:bg-white/[0.06]"
          >
            Browse all templates
            <span className="transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
