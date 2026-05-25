"use client";

import { useState } from "react";
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
  Zap,
} from "lucide-react";
import { useDailyUsage } from "@/hooks/useDailyUsage";
import { Logo } from "@/components/brand/Logo";
import { withTimeout } from "@/lib/with-timeout";
import type { DailyCreditSnapshot } from "@/lib/ai-credits";
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
  initialUsage?: DailyCreditSnapshot | null;
}

function initialsFromName(profile: UserProfile | null, fallback?: string | null) {
  const source = profile?.full_name?.trim() || profile?.email || fallback || "U";
  const parts = source.split(/[\s@]+/).filter(Boolean);
  const head = parts[0]?.[0] ?? "U";
  const tail = parts.length > 1 ? parts[1][0] : "";
  return (head + tail).toUpperCase();
}

export function Sidebar({ profile, fallbackEmail, initialUsage = null }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const { usage, isLoading, error, resetCountdown } = useDailyUsage({
    initialUsage,
  });

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
    } catch (signOutError) {
      console.error("Sign out error:", signOutError);
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

  const limit = usage?.limitCredits ?? 0;
  const used = usage?.usedCredits ?? 0;
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const barColor =
    pct >= 92
      ? "from-rose-500 to-red-500"
      : pct >= 70
      ? "from-amber-400 to-orange-400"
      : "from-violet-400 to-cyan-400";

  const sidebarBody = (
    <div className="relative flex h-full flex-col gap-6 p-5">
      <div className="pointer-events-none absolute inset-x-4 top-2 h-32 rounded-full bg-violet-500/12 blur-3xl animate-pulse-slow" />
      <div className="pointer-events-none absolute bottom-28 left-10 h-32 w-32 rounded-full bg-cyan-500/10 blur-3xl animate-pulse-slow [animation-delay:1s]" />

      <div className="relative rounded-[28px] border border-white/10 bg-black/20 p-4 shadow-[0_24px_80px_rgba(25,8,48,0.45)] backdrop-blur-2xl">
        <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(168,85,247,0.8),rgba(34,211,238,0.65),transparent)] animate-shimmer-x" />
        <Logo
          href="/dashboard"
          size="md"
          priority
          className="group text-lg font-bold tracking-tight transition-transform duration-300 hover:scale-[1.02]"
          iconClassName="transition-transform duration-500 group-hover:rotate-[14deg]"
          onClick={() => setMobileOpen(false)}
        />
        <div className="mt-4 rounded-2xl border border-violet-400/15 bg-violet-500/10 px-3 py-2.5">
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-violet-200/80">
            Workspace
          </div>
          <div className="mt-1 text-sm text-white">
            Build, edit, and ship better app concepts faster.
          </div>
        </div>
      </div>

      <nav className="relative rounded-[28px] border border-white/10 bg-black/20 p-3 shadow-[0_20px_60px_rgba(8,12,28,0.35)] backdrop-blur-2xl">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`group relative mb-1 flex items-center gap-3 overflow-hidden rounded-2xl px-3.5 py-3 text-sm transition-all duration-300 ${
                active
                  ? "bg-[linear-gradient(135deg,rgba(124,58,237,0.3),rgba(14,165,233,0.16))] text-white ring-1 ring-violet-400/30 shadow-[0_12px_30px_rgba(76,29,149,0.28)]"
                  : "text-text-secondary hover:translate-x-0.5 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-violet-300 to-cyan-300 shadow-[0_0_12px_rgba(168,85,247,0.7)]" />
              )}
              <span
                className={`pointer-events-none absolute inset-y-0 left-[-30%] w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent transition-transform duration-700 ${
                  active ? "" : "group-hover:translate-x-[260%]"
                }`}
              />
              <Icon
                className={`h-4 w-4 transition-transform duration-300 ${
                  active
                    ? "text-violet-200"
                    : "text-text-muted group-hover:scale-110 group-hover:text-white"
                }`}
              />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}

        {isAdmin && (
          <Link
            href="/admin"
            onClick={() => setMobileOpen(false)}
            className={`mt-2 flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm transition ${
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

      <div className="mt-auto space-y-3">
        <div className="relative rounded-[28px] border border-white/10 bg-black/20 p-4 shadow-[0_20px_60px_rgba(8,12,28,0.35)] backdrop-blur-2xl">
          <Link
            href="/billing"
            className="group block overflow-hidden rounded-2xl border border-white/8 bg-white/[0.03] px-3.5 py-3.5 transition-all duration-300 hover:border-violet-400/30 hover:bg-white/[0.06]"
          >
            <div className="flex items-center justify-between">
              <div className="text-[10px] uppercase tracking-wider text-text-muted">
                AI Credits
              </div>
              <Zap className="h-3.5 w-3.5 text-violet-300/80 transition-transform duration-500 group-hover:rotate-12 group-hover:text-violet-200" />
            </div>

            {usage ? (
              <>
                <div className="mt-1 text-base font-semibold text-white tabular-nums">
                  {usage.totalAvailableCredits.toLocaleString()}{" "}
                  <span className="text-[11px] font-normal text-text-secondary">
                    / {usage.limitCredits.toLocaleString()}
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-700 shadow-[0_0_12px_rgba(168,85,247,0.45)]`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-2 text-[11px] text-text-secondary tabular-nums">
                  <span>{used.toLocaleString()} used today</span>
                  <span className="text-text-muted">•</span>
                  <span>resets in {resetCountdown}</span>
                </div>
                <div className="mt-1 text-[11px] text-text-muted">
                  {usage.dailyRemainingCredits.toLocaleString()} daily +{" "}
                  {usage.bonusCredits.toLocaleString()} bonus
                </div>
              </>
            ) : isLoading ? (
              <>
                <div className="mt-2 h-5 w-2/3 animate-pulse rounded-md bg-white/[0.06]" />
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                  <div className="h-full w-1/3 animate-shimmer-x rounded-full bg-gradient-to-r from-transparent via-violet-400/60 to-transparent bg-[length:200%_100%]" />
                </div>
                <div className="mt-3 h-3 w-1/2 animate-pulse rounded-md bg-white/[0.04]" />
              </>
            ) : (
              <div className="mt-2 text-[11px] text-amber-300/80">
                {error ?? "Usage unavailable right now."}
              </div>
            )}
          </Link>

          <div className="mt-4 flex items-center gap-3">
            <div className="group relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 text-xs font-semibold text-white shadow-[0_10px_26px_rgba(76,29,149,0.35)] transition-transform duration-300 hover:scale-[1.04]">
              <span className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/30 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
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
              className="group relative mt-4 block overflow-hidden rounded-2xl px-3 py-2.5 text-center text-xs font-semibold text-white transition-all duration-300 hover:shadow-[0_12px_30px_rgba(124,58,237,0.5)]"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 bg-[length:200%_100%] animate-gradient-shift" />
              <span className="relative inline-flex items-center justify-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 transition-transform duration-500 group-hover:rotate-180" />
                Upgrade
              </span>
            </Link>
          )}

          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="mt-3 flex w-full items-center gap-2 rounded-2xl px-3 py-2.5 text-xs font-medium text-text-secondary transition hover:bg-white/[0.04] hover:text-white disabled:opacity-60"
          >
            <LogOut className="h-3.5 w-3.5" />
            {signingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-2 border-b border-white/5 bg-background-primary/75 px-4 backdrop-blur-2xl md:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-2 text-white"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Logo href="/dashboard" size="sm" priority className="text-sm font-bold tracking-tight" />
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 text-[10px] font-semibold text-white">
          {initialsFromName(profile, fallbackEmail)}
        </div>
      </header>

      <aside className="sticky top-0 hidden h-screen w-[268px] shrink-0 border-r border-white/5 bg-background-secondary/20 md:block">
        {sidebarBody}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 animate-fade-in bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-72 max-w-[80vw] animate-slide-in-left border-r border-white/10 bg-background-primary/95 backdrop-blur-2xl">
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
