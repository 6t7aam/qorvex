"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CreditCard,
  Folder,
  Gift,
  Home,
  LogOut,
  Menu,
  Settings,
  Shield,
  Sparkles,
  X,
} from "lucide-react";
import { useDailyUsage } from "@/hooks/useDailyUsage";
import { withTimeout } from "@/lib/with-timeout";
import type { UserProfile } from "@/types";

function clearSupabaseBrowserState() {
  for (const storage of [window.localStorage, window.sessionStorage]) {
    try {
      const keysToRemove: string[] = [];

      for (let index = 0; index < storage.length; index += 1) {
        const key = storage.key(index);
        if (key && (key.startsWith("sb-") || key.includes("supabase"))) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach((key) => storage.removeItem(key));
    } catch (error) {
      console.error("Failed to clear Supabase browser state:", error);
    }
  }
}

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/generate", label: "Generate App", icon: Sparkles },
  { href: "/projects", label: "My Projects", icon: Folder },
  { href: "/referrals", label: "Referrals", icon: Gift },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
];

const PLAN_BADGE: Record<
  "free" | "pro" | "max",
  { label: string; className: string }
> = {
  free: {
    label: "FREE",
    className: "bg-white/[0.06] text-text-secondary",
  },
  pro: {
    label: "PRO",
    className: "bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/30",
  },
  max: {
    label: "MAX",
    className:
      "bg-gradient-to-r from-violet-500/30 to-cyan-500/30 text-white ring-1 ring-violet-500/40",
  },
};

interface SidebarProps {
  profile: UserProfile | null;
  fallbackEmail?: string | null;
}

function initialsFromName(profile: UserProfile | null, fallback?: string | null) {
  const source = profile?.full_name?.trim() || profile?.email || fallback || "U";
  const parts = source.split(/[\s@]+/).filter(Boolean);
  const head = parts[0]?.[0] ?? "U";
  const tail = parts.length > 1 ? parts[1][0] : "";
  return (head + tail).toUpperCase();
}

export function Sidebar({ profile, fallbackEmail }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const { usage, resetCountdown } = useDailyUsage();

  const plan = profile?.plan ?? "free";
  const badge = PLAN_BADGE[plan];
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase().trim();
  const currentEmail = (profile?.email ?? fallbackEmail ?? "").toLowerCase().trim();
  const isAdmin = !!adminEmail && currentEmail === adminEmail;
  const displayName =
    profile?.full_name?.trim() ||
    profile?.email ||
    fallbackEmail ||
    "Account";

  async function handleSignOut() {
    setSigningOut(true);
    try {
      const response = await withTimeout(
        fetch("/api/auth/signout", {
          method: "POST",
          cache: "no-store",
        }),
        5000,
        "Sign out timed out.",
      );
      const body = (await response.json().catch(() => null)) as
        | { success?: boolean; error?: string }
        | null;

      if (!response.ok || !body?.success) {
        throw new Error(body?.error ?? "Failed to sign out");
      }
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      clearSupabaseBrowserState();
      setSigningOut(false);
      window.location.assign("/login");
    }
  }

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  const sidebarBody = (
    <div className="flex h-full flex-col gap-6 p-5">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-lg font-bold tracking-tight"
        onClick={() => setMobileOpen(false)}
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

      <nav className="flex flex-col gap-1">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                active
                  ? "bg-violet-500/15 text-white ring-1 ring-violet-500/30"
                  : "text-text-secondary hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <Icon
                className={`h-4 w-4 ${
                  active ? "text-violet-300" : "text-text-muted"
                }`}
              />
              {item.label}
            </Link>
          );
        })}

        {isAdmin && (
          <Link
            href="/admin"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
              isActive("/admin")
                ? "bg-amber-500/15 text-amber-200 ring-1 ring-amber-500/30"
                : "text-amber-300/80 hover:bg-amber-500/[0.06] hover:text-amber-200"
            }`}
          >
            <Shield className="h-4 w-4 text-amber-300" />
            Admin
          </Link>
        )}
      </nav>

      <div className="mt-auto space-y-3 border-t border-white/5 pt-4">
        {usage && (
          <Link
            href="/billing"
            className="block rounded-xl border border-white/8 bg-white/[0.03] px-3 py-3 transition hover:bg-white/[0.05]"
          >
            <div className="text-[10px] uppercase tracking-wider text-text-muted">
              Available AI Credits
            </div>
            <div className="mt-1 text-sm font-semibold text-white">
              {usage.totalAvailableCredits.toLocaleString()} available
            </div>
            <div className="mt-1 text-[11px] text-text-secondary">
              {usage.dailyRemainingCredits.toLocaleString()} daily +{" "}
              {usage.bonusCredits.toLocaleString()} bonus
            </div>
            <div className="mt-1 text-[11px] text-text-secondary">
              ${usage.estimatedCostUsd.toFixed(3)} used today • resets in {resetCountdown}
            </div>
          </Link>
        )}

        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 text-xs font-semibold text-white">
            {initialsFromName(profile, fallbackEmail)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">
              {displayName}
            </p>
            <span
              className={`mt-0.5 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wider ${badge.className}`}
            >
              {badge.label}
            </span>
          </div>
        </div>

        {plan === "free" && (
          <Link
            href="/billing"
            className="gradient-bg block rounded-lg px-3 py-2 text-center text-xs font-semibold text-white transition hover:opacity-90"
          >
            Upgrade
          </Link>
        )}

        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-text-secondary transition hover:bg-white/[0.04] hover:text-white disabled:opacity-60"
        >
          <LogOut className="h-3.5 w-3.5" />
          {signingOut ? "Signing out..." : "Sign out"}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-2 border-b border-white/5 bg-background-primary/80 px-4 backdrop-blur-xl md:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-2 text-white"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-bold tracking-tight"
        >
          {/* Site logo — swap the file at public/qorvex-logo.svg to change everywhere. */}
          <Image
            src="/qorvex-logo.svg"
            alt="Qorvex"
            width={24}
            height={24}
            priority
            className="h-6 w-6 rounded-md"
          />
          <span className="gradient-text">Qorvex</span>
        </Link>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 text-[10px] font-semibold text-white">
          {initialsFromName(profile, fallbackEmail)}
        </div>
      </header>

      <aside className="sticky top-0 hidden h-screen w-[240px] shrink-0 border-r border-white/5 bg-background-secondary/40 md:block">
        {sidebarBody}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-72 max-w-[80vw] border-r border-white/10 bg-background-primary">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 rounded-lg p-2 text-white"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebarBody}
          </div>
        </div>
      )}
    </>
  );
}
