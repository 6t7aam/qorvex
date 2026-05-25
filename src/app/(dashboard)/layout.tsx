import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { PendingPaymentWatcher } from "@/hooks/usePendingPayment";
import { createPrivatePageMetadata } from "@/lib/seo";
import { getDailyCreditSnapshot } from "@/lib/ai-usage.server";
import type { DailyCreditSnapshot } from "@/lib/ai-credits";
import type { UserProfile } from "@/types";

export const metadata: Metadata = createPrivatePageMetadata({
  title: "Dashboard",
  description:
    "Manage your Qorvex projects, app generations, usage, and subscription from your dashboard.",
  path: "/dashboard",
});

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let profile: UserProfile | null = null;
  let userEmail: string | null = null;
  let initialUsage: DailyCreditSnapshot | null = null;

  if (supabaseUrl && supabaseAnonKey) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    userEmail = user.email ?? null;

    const { data: profileData } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", user.id)
      .single<UserProfile>();

    profile = profileData ?? null;

    if (profile) {
      try {
        const admin = createAdminClient();
        initialUsage = await getDailyCreditSnapshot({
          admin,
          userId: user.id,
          plan: profile.plan,
          abuseDetected: profile.abuse_detected ?? false,
        });
      } catch (error) {
        console.error(
          "[dashboard-layout] failed to load initial daily usage:",
          error,
        );
        initialUsage = null;
      }
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background-primary text-text-primary md:flex-row">
      <PendingPaymentWatcher />
      <Sidebar
        profile={profile}
        fallbackEmail={userEmail}
        initialUsage={initialUsage}
      />
      <main className="relative flex-1 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(76,29,149,0.24)_0%,rgba(37,99,235,0.12)_38%,rgba(8,8,8,0.92)_100%)]" />
        <div className="pointer-events-none absolute left-[-12rem] top-[-5rem] h-[34rem] w-[34rem] rounded-full bg-violet-700/18 blur-[150px] animate-pulse-slow" />
        <div className="pointer-events-none absolute right-[-10rem] top-24 h-[28rem] w-[28rem] rounded-full bg-cyan-500/10 blur-[130px] animate-pulse-slow [animation-delay:1.5s]" />
        <div className="pointer-events-none absolute inset-x-[12%] top-0 h-32 bg-[linear-gradient(90deg,rgba(124,58,237,0.16),rgba(59,130,246,0.12),transparent)] blur-[90px]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:radial-gradient(rgba(255,255,255,0.6)_1px,transparent_1px)] [background-size:32px_32px]" />
        <div className="relative z-10 min-h-screen overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
