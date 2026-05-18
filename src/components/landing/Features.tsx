"use client";

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
}

const FEATURES: Feature[] = [
  {
    icon: Sparkles,
    title: "AI-Powered Generation",
    description:
      "Describe your app in plain English. Claude AI generates complete React Native code with screens, navigation, and logic.",
  },
  {
    icon: Smartphone,
    title: "Live Mobile Preview",
    description:
      "See your app instantly in a realistic phone frame. Preview on iOS or Android layout before you export.",
  },
  {
    icon: MessageSquare,
    title: "AI Chat Editor",
    description:
      "Refine your app through conversation. Say 'add dark mode' or 'add a profile screen' and watch it update in real time.",
  },
  {
    icon: Upload,
    title: "GitHub Integration",
    description:
      "Auto-create repositories and push your generated code directly to GitHub with one click.",
  },
  {
    icon: Zap,
    title: "Instant Export",
    description:
      "Export your complete Expo project ready to run. All dependencies configured, all files structured correctly.",
  },
  {
    icon: Globe,
    title: "10 Languages",
    description:
      "Build apps for global audiences. Interface available in English, Spanish, French, German, Japanese and 5 more languages.",
  },
];

export function Features() {
  return (
    <>
      <section id="features" className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn className="mx-auto max-w-2xl text-center">
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
  return (
    <div className="glass group h-full rounded-2xl p-6 transition hover:bg-white/[0.05]">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 ring-1 ring-violet-500/20">
        <Icon className="h-5 w-5 text-violet-300" />
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
      "Claude AI writes the complete React Native app — screens, navigation, Supabase backend, auth flow, and business logic.",
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
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)",
            }}
          />
          {STEPS.map((step, idx) => (
            <FadeIn key={step.num} delay={idx * 0.1} className="relative">
              <div className="glass-border relative flex h-full flex-col rounded-2xl bg-background-secondary/40 p-7">
                <div className="gradient-text text-6xl font-bold leading-none">
                  {step.num}
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
