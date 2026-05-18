"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { Play, Sparkles, Star } from "lucide-react";

const AVATARS = [
  { initials: "JD", color: "#7c3aed" },
  { initials: "ML", color: "#06b6d4" },
  { initials: "AK", color: "#ec4899" },
  { initials: "RS", color: "#f59e0b" },
  { initials: "TN", color: "#10b981" },
];

const FAKE_APP_SCREENS = [
  { tilt: -8, translateY: 0, accent: "#7c3aed" },
  { tilt: 6, translateY: 32, accent: "#06b6d4" },
];

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" as const },
  },
};

export function Hero() {
  return (
    <section className="relative isolate flex min-h-[calc(100vh-4rem)] items-center overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.18) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-32 h-[480px] w-[480px] rounded-full opacity-50 blur-3xl"
        style={{ background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -right-24 h-[520px] w-[520px] rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, #06b6d4 0%, transparent 70%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(8,8,8,0) 0%, #080808 80%)",
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mx-auto flex max-w-4xl flex-col items-center text-center"
        >
          <motion.div variants={itemVariants}>
            <div className="relative inline-flex items-center gap-2 rounded-full p-[1px]">
              <div
                aria-hidden
                className="absolute inset-0 rounded-full opacity-80 [background:linear-gradient(120deg,#7c3aed,#06b6d4,#7c3aed)] [background-size:200%_200%] animate-gradient-shift"
              />
              <span className="relative inline-flex items-center gap-2 rounded-full bg-background-primary px-4 py-1.5 text-xs font-medium text-text-secondary">
                <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                Powered by Claude AI
              </span>
            </div>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="mt-8 text-balance text-5xl font-bold leading-[1.05] tracking-tight text-white sm:text-6xl md:text-7xl lg:text-8xl"
          >
            Turn ideas into
            <br />
            <span className="gradient-text">mobile apps</span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="mt-6 max-w-2xl text-balance text-lg text-text-secondary sm:text-xl"
          >
            Describe your app idea in plain English. Qorvex generates a complete
            React Native app with navigation, screens, and backend — ready to
            deploy in minutes.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="mt-10 flex flex-col items-center gap-3 sm:flex-row"
          >
            <Link
              href="/signup"
              className="gradient-bg group inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-violet-600/20 transition hover:scale-[1.02] hover:shadow-violet-600/40"
            >
              Start building for free
              <span className="transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </Link>
            <button
              type="button"
              className="glass-border inline-flex items-center gap-2 rounded-xl bg-white/[0.02] px-6 py-3.5 text-base font-medium text-white transition hover:bg-white/[0.06]"
            >
              <Play className="h-4 w-4" />
              Watch demo
            </button>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="mt-8 flex flex-col items-center gap-4 text-sm text-text-secondary sm:flex-row sm:gap-6"
          >
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {AVATARS.map((a) => (
                  <div
                    key={a.initials}
                    className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background-primary text-[10px] font-semibold text-white"
                    style={{ backgroundColor: a.color }}
                  >
                    {a.initials}
                  </div>
                ))}
              </div>
              <span>Join 2,400+ builders</span>
            </div>
            <div className="hidden h-4 w-px bg-white/10 sm:block" />
            <div className="flex items-center gap-1.5">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
                  />
                ))}
              </div>
              <span className="text-text-secondary">4.9/5 rating</span>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="relative mt-20 flex items-end justify-center gap-6 sm:gap-10"
          >
            {FAKE_APP_SCREENS.map((screen, idx) => (
              <PhoneMockup key={idx} index={idx} {...screen} />
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function PhoneMockup({
  tilt,
  translateY,
  accent,
  index,
}: {
  tilt: number;
  translateY: number;
  accent: string;
  index: number;
}) {
  return (
    <div
      className="relative animate-float"
      style={{
        transform: `translateY(${translateY}px) rotate(${tilt}deg)`,
        animationDelay: `${index * 0.5}s`,
      }}
    >
      <div className="relative h-[420px] w-[210px] rounded-[34px] border border-white/10 bg-background-secondary p-2.5 shadow-2xl shadow-black/60">
        <div className="relative h-full w-full overflow-hidden rounded-[26px] bg-background-tertiary">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-50"
            style={{
              background: `linear-gradient(180deg, ${accent}33 0%, transparent 50%)`,
            }}
          />
          <div className="absolute left-1/2 top-2 h-1.5 w-16 -translate-x-1/2 rounded-full bg-black/60" />
          <div className="relative space-y-3 px-3 pt-9">
            <div className="space-y-1">
              <div className="h-2.5 w-20 rounded-full bg-white/30" />
              <div className="h-1.5 w-12 rounded-full bg-white/15" />
            </div>
            <div
              className="h-24 rounded-2xl"
              style={{
                background: `linear-gradient(135deg, ${accent} 0%, ${accent}66 100%)`,
              }}
            />
            <div className="grid grid-cols-2 gap-2">
              <div className="h-16 rounded-xl bg-white/[0.04]" />
              <div className="h-16 rounded-xl bg-white/[0.04]" />
              <div className="h-16 rounded-xl bg-white/[0.04]" />
              <div className="h-16 rounded-xl bg-white/[0.04]" />
            </div>
            <div className="space-y-2">
              <div className="h-2 w-3/4 rounded-full bg-white/15" />
              <div className="h-2 w-1/2 rounded-full bg-white/10" />
            </div>
          </div>
          <div className="absolute inset-x-3 bottom-3 flex justify-between rounded-2xl border border-white/5 bg-black/40 px-4 py-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: i === 0 ? accent : "rgba(255,255,255,0.2)" }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
