import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Shield } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import { getAdminEmail, requireAdmin } from "@/lib/admin";
import { createPrivatePageMetadata } from "@/lib/seo";
import { AdminPaymentsClient } from "./AdminPaymentsClient";
import type { ManualPayment } from "@/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = createPrivatePageMetadata({
  title: "Admin",
  description:
    "Review Qorvex payments, users, plans, and system activity.",
  path: "/admin",
});

interface AdminPaymentRow extends ManualPayment {
  user_email: string | null;
  user_full_name: string | null;
}

export default async function AdminPage() {
  const adminEmail = getAdminEmail();
  if (!adminEmail) {
    redirect("/dashboard");
  }

  const check = await requireAdmin();
  if (!check.ok) {
    redirect("/dashboard");
  }

  const sb = createAdminClient();
  const [
    { data: pendingRaw },
    { data: allRaw },
    { data: revenueRows },
    { count: pendingCount },
    { count: confirmedCount },
    { count: rejectedCount },
  ] = await Promise.all([
    sb
      .from("manual_payments")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
    sb
      .from("manual_payments")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50),
    sb
      .from("manual_payments")
      .select("amount")
      .eq("status", "confirmed"),
    sb
      .from("manual_payments")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    sb
      .from("manual_payments")
      .select("*", { count: "exact", head: true })
      .eq("status", "confirmed"),
    sb
      .from("manual_payments")
      .select("*", { count: "exact", head: true })
      .eq("status", "rejected"),
  ]);

  const pendingList = (pendingRaw ?? []) as ManualPayment[];
  const allList = (allRaw ?? []) as ManualPayment[];
  const revenueList = (revenueRows ?? []) as { amount: number }[];

  const totalRevenue = revenueList.reduce(
    (sum, row) => sum + Number(row.amount ?? 0),
    0,
  );

  const userIds = Array.from(
    new Set([...pendingList, ...allList].map((p) => p.user_id)),
  );

  let profileLookup = new Map<
    string,
    { email: string | null; full_name: string | null }
  >();
  if (userIds.length > 0) {
    const { data: profiles } = await sb
      .from("user_profiles")
      .select("id, email, full_name")
      .in("id", userIds);
    profileLookup = new Map(
      (profiles ?? []).map((p) => [
        p.id as string,
        {
          email: (p.email as string | null) ?? null,
          full_name: (p.full_name as string | null) ?? null,
        },
      ]),
    );
  }

  function enrich(rows: ManualPayment[]): AdminPaymentRow[] {
    return rows.map((row) => {
      const lookup = profileLookup.get(row.user_id);
      return {
        ...row,
        user_email: lookup?.email ?? null,
        user_full_name: lookup?.full_name ?? null,
      };
    });
  }

  const pendingRows = enrich(pendingList);
  const allRows = enrich(allList);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30">
          <Shield className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="mt-0.5 text-sm text-text-secondary">
            Verify manual payments and manage subscriptions.
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total revenue"
          value={`$${totalRevenue.toFixed(2)}`}
          tone="emerald"
        />
        <StatCard
          label="Pending"
          value={String(pendingCount ?? pendingList.length)}
          tone="amber"
        />
        <StatCard
          label="Confirmed"
          value={String(confirmedCount ?? 0)}
          tone="violet"
        />
        <StatCard
          label="Rejected"
          value={String(rejectedCount ?? 0)}
          tone="red"
        />
      </div>

      <AdminPaymentsClient pending={pendingRows} all={allRows} />
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "emerald" | "amber" | "violet" | "red";
}) {
  const tones: Record<typeof tone, string> = {
    emerald: "text-emerald-300",
    amber: "text-amber-300",
    violet: "text-violet-300",
    red: "text-red-300",
  };

  return (
    <div className="glass-border rounded-2xl bg-background-secondary/40 p-5">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
        {label}
      </div>
      <div className={`mt-2 text-2xl font-bold ${tones[tone]}`}>{value}</div>
    </div>
  );
}

export type { AdminPaymentRow };
