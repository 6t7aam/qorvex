"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { FadeIn } from "@/components/shared/FadeIn";

interface FaqEntry {
  q: string;
  a: string;
}

const FAQS: FaqEntry[] = [
  {
    q: "Do I need to know how to code?",
    a: "No coding knowledge required. You describe your app in plain English and Qorvex generates everything. However, if you are a developer, you can export the clean React Native code and customize it further.",
  },
  {
    q: "What kind of apps can I build?",
    a: "Qorvex is great for mobile apps like fitness trackers, habit apps, social platforms, booking systems, marketplaces, finance tools, meditation apps, and much more. If you can describe it, Qorvex can build it.",
  },
  {
    q: "How does the generation limit work?",
    a: "Qorvex uses daily AI credits instead of counting projects. Free includes a small daily pool for lightweight testing, Pro includes a larger pool for multiple medium and large app sessions, and Max includes a high-capacity daily pool for long editing days. Credits reset every 24 hours at 00:00 UTC.",
  },
  {
    q: "Can I edit the generated code?",
    a: "Yes. You can use the AI chat editor inside Qorvex to make changes by describing them. You can also export the complete project to GitHub and edit it directly in your code editor.",
  },
  {
    q: "What technology does the generated app use?",
    a: "Generated apps use React Native with Expo Router, which means they work on both iOS and Android. They include Supabase for backend and authentication, and NativeWind for styling.",
  },
  {
    q: "Can I publish to the App Store?",
    a: "Yes. Qorvex generates all the files needed for App Store submission including app.json, icons, and splash screens. You use Expo's build service (EAS) to create the final binary.",
  },
  {
    q: "What AI model powers Qorvex?",
    a: "Qorvex uses Claude by Anthropic — one of the most capable AI models for code generation. This ensures high-quality, production-ready output.",
  },
  {
    q: "Is there a free trial?",
    a: "The Free plan is permanently free with a small daily AI credit pool — no credit card required. Paid plans include a 7-day free trial.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="text-center">
          <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Frequently asked questions
          </h2>
        </FadeIn>

        <div className="mt-12 space-y-3">
          {FAQS.map((faq, idx) => {
            const open = openIndex === idx;
            return (
              <FadeIn key={faq.q} delay={idx * 0.03}>
                <div className="glass overflow-hidden rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setOpenIndex(open ? null : idx)}
                    aria-expanded={open}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  >
                    <span className="text-base font-medium text-white">
                      {faq.q}
                    </span>
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors ${
                        open ? "bg-violet-500/15 text-violet-300" : "bg-white/[0.04] text-text-secondary"
                      }`}
                    >
                      {open ? (
                        <Minus className="h-3.5 w-3.5" />
                      ) : (
                        <Plus className="h-3.5 w-3.5" />
                      )}
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="overflow-hidden"
                      >
                        <p className="px-6 pb-5 text-sm leading-relaxed text-text-secondary">
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}
