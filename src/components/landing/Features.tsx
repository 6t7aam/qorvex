"use client";

import { useRef, type CSSProperties } from "react";
import {
  Globe,
  MessageSquare,
  Smartphone,
  Sparkles,
  Upload,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { FadeIn } from "@/components/shared/FadeIn";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  accent: string;
}

const FEATURES: Feature[] = [
  {
    icon: Sparkles,
    title: "AI-Powered Generation",
    description:
      "Describe your app in plain English. Our AI engine generates complete React Native code with screens, navigation, and logic.",
    accent: "#a78bfa",
  },
  {
    icon: Smartphone,
    title: "Live Mobile Preview",
    description:
      "See your app instantly in a realistic phone frame. Preview on iOS or Android layout before you export.",
    accent: "#22d3ee",
  },
  {
    icon: MessageSquare,
    title: "AI Chat Editor",
    description:
      "Refine your app through conversation. Say 'add dark mode' or 'add a profile screen' and watch it update in real time.",
    accent: "#f472b6",
  },
  {
    icon: Upload,
    title: "GitHub Integration",
    description:
      "Auto-create repositories and push your generated code directly to GitHub with one click.",
    accent: "#34d399",
  },
  {
    icon: Zap,
    title: "Instant Export",
    description:
      "Export your complete Expo project ready to run. All dependencies configured, all files structured correctly.",
    accent: "#fbbf24",
  },
  {
    icon: Globe,
    title: "10 Languages",
    description:
      "Build apps for global audiences. Interface available in English, Spanish, French, German, Japanese and 5 more languages.",
    accent: "#60a5fa",
  },
];

export function Features() {
  return (
    <>
      <section id="features" className="relative py-24 sm:py-32">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-1/3 -z-10 mx-auto h-72 w-3/4 rounded-full bg-violet-500/10 blur-[120px]"
        />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn className="mx-auto max-w-2xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-text-secondary">
              <span className="h-1 w-1 rounded-full bg-violet-400 animate-pulse" />
              Features
            </div>
            <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Everything you need to{" "}
              <span className="gradient-text">ship</span>
            </h2>
            <p className="mt-4 text-lg text-text-secondary">
              From idea to App Store in minutes, not months.
            </p>
          </FadeIn>

          <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, idx) => (
              <FadeIn key={feature.title} delay={idx * 0.05}>
                <FeatureCard feature={feature} />
              </FadeIn>
            ))}
          </div>
        </div>
      </section>
      <HowItWorks />
    </>
  );
}

function FeatureCard({ feature }: { feature: Feature }) {
  const Icon = feature.icon;
  const cardRef = useRef<HTMLDivElement | null>(null);

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    el.style.setProperty("--mx", `${x}%`);
    el.style.setProperty("--my", `${y}%`);
  }

  return (
    <div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      className="group card-surface card-hover sheen relative h-full overflow-hidden rounded-2xl p-6"
      style={
        {
          "--mx": "50%",
          "--my": "50%",
          "--accent": feature.accent,
        } as CSSProperties
      }
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(320px circle at var(--mx) var(--my), color-mix(in srgb, var(--accent) 20%, transparent), transparent 70%)",
        }}
      />
      <div
        className="relative flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-[6deg]"
        style={{
          background: `color-mix(in srgb, ${feature.accent} 14%, transparent)`,
          boxShadow: `0 0 0 1px color-mix(in srgb, ${feature.accent} 30%, transparent) inset, 0 12px 30px color-mix(in srgb, ${feature.accent} 18%, transparent)`,
        }}
      >
        <Icon
          className="h-5 w-5 transition-transform duration-500 group-hover:scale-110"
          style={{ color: feature.accent }}
        />
      </div>
      <h3 className="mt-5 text-lg font-semibold text-white">{feature.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-text-secondary">
        {feature.description}
      </p>
    </div>
  );
}

const STEPS = [
  {
    num: "01",
    title: "Describe your app",
    description:
      "Type your app idea, choose a template, pick your colors and features. No technical knowledge required.",
  },
  {
    num: "02",
    title: "AI generates everything",
    description:
      "Our AI engine writes the complete React Native app — screens, navigation, Supabase backend, auth flow, and business logic.",
  },
  {
    num: "03",
    title: "Preview, edit, and export",
    description:
      "See your app instantly in a phone frame. Chat with AI to make changes. Export to GitHub or download the Expo project.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-text-secondary">
            <span className="h-1 w-1 rounded-full bg-cyan-400 animate-pulse" />
            Workflow
          </div>
          <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            How Qorvex works
          </h2>
          <p className="mt-4 text-lg text-text-secondary">
            Three steps from idea to working app.
          </p>
        </FadeIn>

        <div className="relative mt-16 grid gap-12 md:grid-cols-3 md:gap-6">
          <div
            aria-hidden
            className="absolute left-[16%] right-[16%] top-12 hidden h-px md:block"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(168,85,247,0.5) 30%, rgba(34,211,238,0.5) 70%, transparent 100%)",
            }}
          />
          {STEPS.map((step, idx) => (
            <FadeIn key={step.num} delay={idx * 0.1} className="relative">
              <div className="card-surface card-hover relative flex h-full flex-col rounded-2xl p-7">
                <div className="absolute right-4 top-4 h-2 w-2 rounded-full bg-gradient-to-br from-violet-400 to-cyan-400 shadow-[0_0_14px_rgba(168,85,247,0.7)]" />
                <div className="relative">
                  <span
                    aria-hidden
                    className="absolute -left-2 top-2 h-8 w-8 rounded-full bg-violet-500/20 blur-xl"
                  />
                  <div className="gradient-text relative text-6xl font-bold leading-none">
                    {step.num}
                  </div>
                </div>
                <h3 className="mt-6 text-xl font-semibold text-white">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                  {step.description}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
