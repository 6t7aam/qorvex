"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

const NAV_LINKS = [
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/pricing" },
  { label: "Templates", href: "/#templates" },
  { label: "FAQ", href: "/#faq" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function onScroll() {
      const y = window.scrollY;
      setScrolled(y > 12);
      const max =
        document.documentElement.scrollHeight - window.innerHeight || 1;
      setProgress(Math.min(100, Math.max(0, (y / max) * 100)));
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "border-b border-white/[0.07] bg-background-primary/65 backdrop-blur-2xl shadow-[0_8px_30px_rgba(0,0,0,0.35)]"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo href="/" size="md" priority />

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="link-underline relative rounded-lg px-3 py-1.5 text-sm text-text-secondary transition hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-text-secondary transition hover:text-white"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="group relative inline-flex items-center gap-1.5 overflow-hidden rounded-lg px-4 py-2 text-sm font-medium text-white transition hover:shadow-[0_10px_30px_rgba(124,58,237,0.45)]"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 bg-[length:200%_100%] animate-gradient-shift" />
            <span className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-[100%]" />
            <span className="relative">Start for free</span>
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="relative rounded-lg p-2 text-white transition hover:bg-white/[0.04] md:hidden"
          aria-label="Toggle navigation"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {scrolled && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(168,85,247,0.45) 50%, transparent 100%)",
          }}
        />
      )}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] origin-left bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400 transition-transform"
        style={{ transform: `scaleX(${progress / 100})` }}
      />

      {open ? (
        <div className="animate-fade-in border-t border-white/5 bg-background-primary/95 backdrop-blur-xl md:hidden">
          <nav className="flex flex-col gap-2 px-4 py-4 sm:px-6">
            {NAV_LINKS.map((link, i) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className="opacity-0 animate-fade-in-up rounded-lg px-3 py-2 text-sm text-text-secondary transition hover:bg-white/5 hover:text-white"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-white/5 pt-3">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-text-secondary transition hover:bg-white/5 hover:text-white"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                onClick={() => setOpen(false)}
                className="relative overflow-hidden rounded-lg px-3 py-2 text-center text-sm font-medium text-white"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 bg-[length:200%_100%] animate-gradient-shift" />
                <span className="relative">Start for free</span>
              </Link>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
