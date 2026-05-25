import type { Metadata } from "next";
import Link from "next/link";
import {
  Cloud,
  Code2,
  Compass,
  Cpu,
  Globe2,
  Lock,
  Rocket,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { FadeIn } from "@/components/shared/FadeIn";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  absoluteTitle: "About · Qorvex AI Mobile App Builder",
  description:
    "Qorvex is the AI mobile app builder for React Native and Expo — built so anyone can ship a real iOS or Android app from a single prompt.",
  path: "/about",
  keywords: [
    "about Qorvex",
    "Qorvex company",
    "AI mobile app builder team",
    "Qorvex mission",
  ],
});

interface Pillar {
  icon: LucideIcon;
  title: string;
  body: string;
}

const PILLARS: Pillar[] = [
  {
    icon: Cpu,
    title: "AI-native by default",
    body: "Every flow is designed around prompts and conversation. The AI is the product, not a sidebar feature.",
  },
  {
    icon: Code2,
    title: "Production-grade output",
    body: "Generated apps use proven stacks — React Native, Expo Router, Supabase, TypeScript — and ship with clean structure you can extend.",
  },
  {
    icon: Compass,
    title: "Owned by you",
    body: "No lock-in. Export to GitHub, download the Expo project, edit anywhere. We assign the generated code to your account.",
  },
  {
    icon: Lock,
    title: "Private by design",
    body: "Your prompts and code are yours. We do not use customer content to train third-party foundation models on your behalf.",
  },
];

const NUMBERS = [
  { label: "Apps generated", value: "12,000+" },
  { label: "Active builders", value: "2,400+" },
  { label: "Avg time to first preview", value: "< 60s" },
  { label: "Supported languages", value: "10" },
];

export default function AboutPage() {
  return (
    <div className="relative isolate overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[520px] w-[820px] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(124,58,237,0.4) 0%, transparent 70%)",
        }}
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 grid-bg opacity-40" />

      <section className="relative pt-20 sm:pt-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <FadeIn>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-text-secondary">
              <Sparkles className="h-3 w-3 text-violet-400" />
              About
            </div>
            <h1 className="text-balance text-5xl font-bold tracking-tight text-white sm:text-6xl">
              Mobile apps,{" "}
              <span className="gradient-text">at the speed of an idea.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-text-secondary">
              Qorvex is an AI mobile app builder for React Native and Expo. We
              believe shipping a real iOS or Android app should feel as fluid
              as writing a sentence.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="relative py-20">
        <div className="mx-auto grid max-w-5xl gap-6 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          {NUMBERS.map((stat) => (
            <FadeIn key={stat.label}>
              <div className="card-surface card-hover rounded-2xl p-5 text-center">
                <div className="gradient-text text-3xl font-bold tracking-tight tabular-nums">
                  {stat.value}
                </div>
                <div className="mt-2 text-xs uppercase tracking-wider text-text-muted">
                  {stat.label}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      <section className="relative py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Our <span className="gradient-text">mission</span>
            </h2>
          </FadeIn>
          <FadeIn>
            <div className="card-surface mt-10 space-y-4 rounded-2xl p-8 text-base leading-relaxed text-text-secondary">
              <p>
                The hardest part of mobile development isn&apos;t writing the
                feature you can describe in one sentence — it&apos;s the
                hundred small decisions, configurations, and integrations that
                surround it. Navigation patterns, auth flows, theme tokens,
                permissions, build pipelines.
              </p>
              <p>
                Qorvex automates that surrounding work. You describe the app
                you want; we generate a clean React Native project with
                screens, navigation, Supabase backend, and an editable design
                system. You preview live in a phone frame, refine by chat, and
                export to GitHub when you&apos;re ready to keep building.
              </p>
              <p>
                The goal isn&apos;t to replace developers — it&apos;s to
                compress the gap between idea and working prototype from
                weeks to minutes, for founders, designers, and engineers
                alike.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="relative py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-text-secondary">
              <span className="h-1 w-1 rounded-full bg-cyan-400 animate-pulse" />
              Principles
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              What we believe
            </h2>
          </FadeIn>

          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <FadeIn key={pillar.title}>
                  <div className="card-surface card-hover sheen group h-full rounded-2xl p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/15 ring-1 ring-violet-500/30 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6">
                      <Icon className="h-5 w-5 text-violet-300" />
                    </div>
                    <h3 className="mt-5 text-lg font-semibold text-white">
                      {pillar.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                      {pillar.body}
                    </p>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="card-surface rounded-2xl p-8 sm:p-10">
              <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    Built on a stack you can trust
                  </h2>
                  <p className="mt-2 text-sm text-text-secondary">
                    Generated apps use battle-tested, widely-supported tooling.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { label: "React Native", Icon: Rocket },
                    { label: "Expo", Icon: Cloud },
                    { label: "Supabase", Icon: Lock },
                    { label: "TypeScript", Icon: Code2 },
                    { label: "i18n", Icon: Globe2 },
                  ].map(({ label, Icon }) => (
                    <span
                      key={label}
                      className="glass-border inline-flex items-center gap-2 rounded-full bg-white/[0.02] px-3 py-1.5 text-xs text-text-secondary"
                    >
                      <Icon className="h-3.5 w-3.5 text-violet-300" />
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="relative py-20 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <FadeIn>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Have a question or partnership idea?
            </h2>
            <p className="mt-4 text-base text-text-secondary">
              Reach the team directly — we read every message.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="mailto:hello@qorvex.mov"
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-violet-600/50"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 bg-[length:200%_100%] animate-gradient-shift" />
                <span className="relative inline-flex items-center gap-2">
                  hello@qorvex.mov
                </span>
              </a>
              <Link
                href="/signup"
                className="glass-border inline-flex items-center gap-2 rounded-xl bg-white/[0.02] px-6 py-3 text-sm font-medium text-white transition hover:border-violet-400/40 hover:bg-white/[0.06]"
              >
                Start building →
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
