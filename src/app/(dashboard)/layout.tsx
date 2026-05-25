import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { PendingPaymentWatcher } from "@/hooks/usePendingPayment";
import { createPrivatePageMetadata } from "@/lib/seo";
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
  }

  return (
    <div className="flex min-h-screen flex-col bg-background-primary text-text-primary md:flex-row">
      <PendingPaymentWatcher />
      <Sidebar profile={profile} fallbackEmail={userEmail} />
      <main className="relative flex-1 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(76,29,149,0.24)_0%,rgba(37,99,235,0.12)_38%,rgba(8,8,8,0.92)_100%)]" />
        <div className="pointer-events-none absolute left-[-12rem] top-[-5rem] h-[34rem] w-[34rem] rounded-full bg-violet-700/18 blur-[150px]" />
        <div className="pointer-events-none absolute right-[-10rem] top-24 h-[28rem] w-[28rem] rounded-full bg-cyan-500/10 blur-[130px]" />
        <div className="pointer-events-none absolute inset-x-[12%] top-0 h-32 bg-[linear-gradient(90deg,rgba(124,58,237,0.16),rgba(59,130,246,0.12),transparent)] blur-[90px]" />
        <div className="relative z-10 min-h-screen overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
