import type { Metadata } from "next";
import Link from "next/link";
import {
  Crown,
  Folder,
  Sparkles,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { getDailyCreditSnapshot } from "@/lib/ai-usage.server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { UsageBar } from "@/components/dashboard/UsageBar";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { APP_TEMPLATES } from "@/lib/constants";
import { createPrivatePageMetadata } from "@/lib/seo";
import type { Project, UserProfile } from "@/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = createPrivatePageMetadata({
  title: "Dashboard",
  description:
    "Manage your Qorvex projects, app generations, usage, and subscription from your dashboard.",
  path: "/dashboard",
});

const TEMPLATE_ICON_NAMES = APP_TEMPLATES.slice(0, 4);

function describeError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object") {
    try {
      return JSON.stringify(
        err,
        Object.getOwnPropertyNames(err as Record<string, unknown>),
      );
    } catch {
      return String(err);
    }
  }
  return String(err);
}

function greeting(date: Date): string {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let profile: UserProfile | null = null;
  let recentProjects: Project[] = [];
  let totalProjects = 0;
  let totalGenerations = 0;
  let usage:
    | Awaited<ReturnType<typeof getDailyCreditSnapshot>>
    | null = null;
  let loadError: string | null = null;

  if (supabaseUrl && supabaseAnonKey) {
    try {
      const supabase = await createClient();
      const admin = createAdminClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const [profileRes, projectsRes, generationsCount] = await Promise.all([
          supabase
            .from("user_profiles")
            .select("*")
            .eq("id", user.id)
            .single<UserProfile>(),
          supabase
            .from("projects")
            .select("*", { count: "exact" })
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(5),
          supabase
            .from("generations")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id),
        ]);

        if (profileRes.error) {
          console.error("[dashboard] user_profiles query failed", profileRes.error);
        }
        if (projectsRes.error) {
          console.error("[dashboard] projects query failed", projectsRes.error);
        }
        if (generationsCount.error) {
          console.error(
            "[dashboard] generations count query failed",
            generationsCount.error,
          );
        }

        profile = profileRes.data ?? null;
        recentProjects = (projectsRes.data as Project[] | null) ?? [];
        totalProjects = projectsRes.count ?? recentProjects.length;
        totalGenerations = generationsCount.count ?? 0;

        if (profile) {
          try {
            usage = await getDailyCreditSnapshot({
              admin,
              userId: user.id,
              plan: profile.plan,
              abuseDetected: profile.abuse_detected ?? false,
            });
          } catch (usageError) {
            console.error(
              "[dashboard] getDailyCreditSnapshot failed — check that supabase/migration_daily_ai_credits.sql has been applied:",
              describeError(usageError),
            );
            usage = null;
            if (!loadError) {
              loadError =
                "Daily AI usage is unavailable right now. The admin needs to apply the latest Supabase migration.";
            }
          }
        }
      }
    } catch (err) {
      console.error("[dashboard] failed to load dashboard data:", describeError(err));
      loadError =
        "We couldn't load some of your dashboard data. Please refresh in a moment.";
    }
  }

  const firstName =
    profile?.full_name?.trim().split(/\s+/)[0] ??
    profile?.email?.split("@")[0] ??
    "there";

  const plan = profile?.plan ?? "free";
  const dailyRemainingCredits = usage?.dailyRemainingCredits ?? 0;
  const bonusCredits = usage?.bonusCredits ?? 0;
  const totalAvailableCredits = usage?.totalAvailableCredits ?? 0;

  const stats: {
    label: string;
    value: string;
    icon: LucideIcon;
    accent?: "violet" | "cyan";
  }[] = [
    {
      label: "Total Projects",
      value: String(totalProjects),
      icon: Folder,
      accent: "violet",
    },
    {
      label: "Daily Credits",
      value: usage ? dailyRemainingCredits.toLocaleString() : "--",
      icon: Zap,
      accent: "cyan",
    },
    {
      label: "Bonus Credits",
      value: usage ? bonusCredits.toLocaleString() : "--",
      icon: Sparkles,
      accent: "violet",
    },
    {
      label: "Total Available",
      value: usage ? totalAvailableCredits.toLocaleString() : "--",
      icon: Crown,
      accent: "cyan",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">
            {greeting(new Date())}, {firstName}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Pick up where you left off or start something new.
          </p>
        </div>
        <Link
          href="/generate"
          className="gradient-bg inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          <Sparkles className="h-4 w-4" />
          New App
        </Link>
      </div>

      {loadError ? (
        <div className="mt-6 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {loadError}
        </div>
      ) : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <StatsCard key={s.label} {...s} />
        ))}
      </div>

      {usage ? (
        <div className="mt-6">
          <UsageBar
            usedCredits={usage.usedCredits}
            limitCredits={usage.limitCredits}
            dailyRemainingCredits={usage.dailyRemainingCredits}
            bonusCredits={usage.bonusCredits}
            totalAvailableCredits={usage.totalAvailableCredits}
            estimatedCostUsd={usage.estimatedCostUsd}
            resetAt={usage.resetAt}
            plan={plan}
          />
        </div>
      ) : null}

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Recent Projects</h2>
          {recentProjects.length > 0 && (
            <Link
              href="/projects"
              className="text-sm text-violet-400 transition hover:text-violet-300"
            >
              View all →
            </Link>
          )}
        </div>

        {recentProjects.length === 0 ? (
          <EmptyState extraTotal={totalGenerations} />
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function EmptyState({ extraTotal }: { extraTotal: number }) {
  return (
    <>
      <div className="glass-border mt-5 flex flex-col items-center rounded-2xl bg-background-secondary/40 px-6 py-14 text-center">
        <div className="relative">
          <div className="absolute inset-0 -m-4 rounded-full bg-violet-500/15 blur-xl" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/30 to-cyan-500/30 ring-1 ring-white/10">
            <Sparkles className="h-7 w-7 text-violet-200" />
          </div>
        </div>
        <h3 className="mt-6 text-lg font-semibold text-white">No apps yet</h3>
        <p className="mt-1 max-w-sm text-sm text-text-secondary">
          Describe what you want to build and Qorvex will generate a complete
          React Native app for you.
        </p>
        <Link
          href="/generate"
          className="gradient-bg mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Generate your first app
        </Link>
        {extraTotal > 0 && (
          <p className="mt-3 text-xs text-text-muted">
            {extraTotal} previous generation{extraTotal === 1 ? "" : "s"} on
            this account.
          </p>
        )}
      </div>

      <div className="mt-10">
        <h3 className="text-base font-semibold text-white">
          Start with a template
        </h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TEMPLATE_ICON_NAMES.map((tpl) => (
            <Link
              key={tpl.id}
              href={`/generate?template=${tpl.id}`}
              className="glass-border rounded-xl bg-background-secondary/40 p-4 transition hover:bg-white/[0.04]"
            >
              <div className="text-sm font-semibold text-white">{tpl.name}</div>
              <p className="mt-1 text-xs text-text-secondary">
                {tpl.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
