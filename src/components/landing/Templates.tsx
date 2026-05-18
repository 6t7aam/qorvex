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
          <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Start with a template
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
                <div className="glass group relative h-full overflow-hidden rounded-2xl p-5 transition-all duration-200 hover:scale-[1.02] hover:bg-white/[0.06]">
                  {tpl.isPremium && (
                    <span className="absolute right-3 top-3 rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-violet-300 ring-1 ring-violet-500/30">
                      Premium
                    </span>
                  )}
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: `${accent}1f`,
                      boxShadow: `0 0 0 1px ${accent}33 inset`,
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
                        className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[10px] uppercase tracking-wider text-text-secondary"
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
            className="glass-border inline-flex items-center gap-2 rounded-xl bg-white/[0.02] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/[0.06]"
          >
            Browse all templates →
          </Link>
        </div>
      </div>
    </section>
  );
}
