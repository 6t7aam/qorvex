"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";
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

const ROTATING_WORDS = ["mobile apps", "MVPs", "marketplaces", "prototypes", "side projects"];

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
  const heroRef = useRef<HTMLDivElement | null>(null);
  const [wordIndex, setWordIndex] = useState(0);
  const prefersReducedMotion = useReducedMotion();
  const orbitDelays = useMemo(
    () => Array.from({ length: 12 }, (_, i) => i * 0.6),
    [],
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      setWordIndex((prev) => (prev + 1) % ROTATING_WORDS.length);
    }, 2600);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const el = heroRef.current;
    if (!el) return;

    function onMove(event: PointerEvent) {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      el.style.setProperty("--mx", `${x}%`);
      el.style.setProperty("--my", `${y}%`);
    }

    el.addEventListener("pointermove", onMove);
    return () => el.removeEventListener("pointermove", onMove);
  }, [prefersReducedMotion]);

  return (
    <section
      ref={heroRef}
      className="relative isolate flex min-h-[calc(100vh-4rem)] items-center overflow-hidden"
      style={{ "--mx": "50%", "--my": "30%" } as React.CSSProperties}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 grid-bg" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-[background] duration-500"
        style={{
          background:
            "radial-gradient(600px circle at var(--mx) var(--my), rgba(124,58,237,0.16), transparent 65%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-32 h-[480px] w-[480px] rounded-full opacity-50 blur-3xl animate-pulse-slow"
        style={{ background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -right-24 h-[520px] w-[520px] rounded-full opacity-40 blur-3xl animate-pulse-slow [animation-delay:2s]"
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

      {/* Floating glyphs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 hidden lg:block">
        {orbitDelays.map((delay, i) => (
          <span
            key={i}
            className="absolute h-1.5 w-1.5 rounded-full bg-gradient-to-br from-violet-400 to-cyan-400 animate-float-slow"
            style={{
              top: `${10 + ((i * 71) % 80)}%`,
              left: `${5 + ((i * 53) % 90)}%`,
              opacity: 0.35,
              animationDelay: `${delay}s`,
              filter: "blur(0.3px)",
            }}
          />
        ))}
      </div>

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
                className="absolute inset-0 rounded-full opacity-90 [background:linear-gradient(120deg,#7c3aed,#06b6d4,#7c3aed)] [background-size:200%_200%] animate-gradient-shift"
              />
              <span className="relative inline-flex items-center gap-2 rounded-full bg-background-primary px-4 py-1.5 text-xs font-medium text-text-secondary">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-violet-400" />
                </span>
                <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                Powered by Gemini AI
              </span>
            </div>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="mt-8 text-balance text-5xl font-bold leading-[1.05] tracking-tight text-white sm:text-6xl md:text-7xl lg:text-8xl"
          >
            Turn ideas into
            <br />
            <span className="relative inline-block min-h-[1.1em]">
              <motion.span
                key={ROTATING_WORDS[wordIndex]}
                initial={{ y: 18, opacity: 0, filter: "blur(8px)" }}
                animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                exit={{ y: -18, opacity: 0, filter: "blur(8px)" }}
                transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                className="gradient-text inline-block"
              >
                {ROTATING_WORDS[wordIndex]}
              </motion.span>
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-2 -bottom-1 h-px bg-gradient-to-r from-transparent via-violet-400/60 to-transparent"
              />
            </span>
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
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-violet-600/20 transition-all duration-300 hover:scale-[1.03] hover:shadow-violet-600/50"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 bg-[length:200%_100%] animate-gradient-shift" />
              <span className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-[100%]" />
              <span className="relative inline-flex items-center gap-2">
                Start building for free
                <span className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </span>
            </Link>
            <button
              type="button"
              className="group glass-border relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-white/[0.02] px-6 py-3.5 text-base font-medium text-white transition hover:border-violet-400/40 hover:bg-white/[0.06]"
            >
              <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-violet-500/15 ring-1 ring-violet-400/30">
                <span className="absolute inset-0 rounded-full bg-violet-500/30 animate-ripple" />
                <Play className="relative h-3 w-3 text-violet-200" />
              </span>
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
                    className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background-primary text-[10px] font-semibold text-white transition-transform duration-300 hover:scale-110 hover:z-10"
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
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-10 -bottom-12 h-40 rounded-[50%] bg-violet-500/25 blur-3xl"
            />
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
    <motion.div
      initial={{ opacity: 0, y: 40, rotate: tilt * 1.4 }}
      whileInView={{ opacity: 1, y: translateY, rotate: tilt }}
      viewport={{ once: true }}
      transition={{ duration: 0.9, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: translateY - 8, rotate: tilt * 0.6, scale: 1.02 }}
      className="relative animate-float-slow"
      style={{ animationDelay: `${index * 0.5}s` }}
    >
      <div className="absolute -inset-3 rounded-[40px] bg-gradient-to-br from-violet-500/30 via-transparent to-cyan-400/30 opacity-50 blur-2xl" />
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
              <div className="h-2.5 w-20 animate-pulse rounded-full bg-white/30" />
              <div className="h-1.5 w-12 animate-pulse rounded-full bg-white/15 [animation-delay:0.4s]" />
            </div>
            <div
              className="relative h-24 overflow-hidden rounded-2xl"
              style={{
                background: `linear-gradient(135deg, ${accent} 0%, ${accent}66 100%)`,
              }}
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer-x" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 rounded-xl bg-white/[0.04] transition-all duration-300 hover:bg-white/[0.08]"
                />
              ))}
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
                className="h-2 w-2 rounded-full transition-all duration-300"
                style={{ backgroundColor: i === 0 ? accent : "rgba(255,255,255,0.2)" }}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
