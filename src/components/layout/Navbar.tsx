"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/pricing" },
  { label: "Templates", href: "/#templates" },
  { label: "FAQ", href: "/#faq" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 12);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-white/5 bg-background-primary/70 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-lg font-bold tracking-tight"
        >
          {/* Site logo — swap the file at public/qorvex-logo.svg to change everywhere. */}
          <Image
            src="/qorvex-logo.svg"
            alt="Qorvex"
            width={28}
            height={28}
            priority
            className="h-7 w-7 rounded-md"
          />
          <span className="gradient-text">Qorvex</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm text-text-secondary transition hover:text-white"
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
            className="gradient-bg rounded-lg px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            Start for free
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg p-2 text-white md:hidden"
          aria-label="Toggle navigation"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/5 bg-background-primary/95 backdrop-blur-xl md:hidden">
          <nav className="flex flex-col gap-2 px-4 py-4 sm:px-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm text-text-secondary transition hover:bg-white/5 hover:text-white"
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
                className="gradient-bg rounded-lg px-3 py-2 text-center text-sm font-medium text-white"
              >
                Start for free
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

