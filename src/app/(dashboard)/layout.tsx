import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { PendingPaymentWatcher } from "@/hooks/usePendingPayment";
import type { UserProfile } from "@/types";

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
      <main className="flex-1 overflow-x-hidden">{children}</main>
    </div>
  );
}
