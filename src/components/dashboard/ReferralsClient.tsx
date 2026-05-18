"use client";

import { useEffect, useState } from "react";
import { Copy, Gift, Loader2, Share2, Sparkles, UserPlus } from "lucide-react";
import { toast } from "sonner";
import {
  REFERRAL_MAX_REWARD_CREDITS,
  REFERRAL_PRO_REWARD_CREDITS,
  REFERRAL_SIGNUP_BONUS_CREDITS,
} from "@/lib/referrals";

interface ReferralStats {
  totalInvitedUsers: number;
  paidUpgrades: number;
  pendingReferrals: number;
  bonusCreditsEarned: number;
}

interface ReferralRecentRow {
  id: string;
  maskedUser: string;
  status: "signed_up" | "upgraded" | "rewarded";
  plan: "pro" | "max" | null;
  rewardCredits: number;
  createdAt: string;
  upgradedAt: string | null;
  rewardGrantedAt: string | null;
}

interface ReferralResponse {
  success?: boolean;
  referralCode?: string;
  referralLink?: string;
  stats?: ReferralStats;
  recentReferrals?: ReferralRecentRow[];
  wasReferred?: boolean;
  referralStatus?: "signed_up" | "upgraded" | "rewarded" | null;
  signupBonusGranted?: boolean;
  error?: string;
}

function formatStatus(status: ReferralRecentRow["status"]) {
  if (status === "rewarded") return "Rewarded";
  if (status === "upgraded") return "Upgraded";
  return "Signed up";
}

function statusBadgeClass(status: ReferralRecentRow["status"]) {
  if (status === "rewarded") {
    return "border-emerald-400/20 bg-emerald-500/10 text-emerald-200";
  }
  if (status === "upgraded") {
    return "border-cyan-400/20 bg-cyan-500/10 text-cyan-200";
  }
  return "border-amber-400/20 bg-amber-500/10 text-amber-200";
}

export function ReferralsClient() {
  const [data, setData] = useState<ReferralResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/referrals/me", { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as
          | ReferralResponse
          | null;

        if (!response.ok || !payload?.success) {
          throw new Error(payload?.error ?? "Could not load referrals.");
        }

        if (!cancelled) {
          setData(payload);
          setIsLoading(false);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          toast.error(
            error instanceof Error ? error.message : "Could not load referrals.",
          );
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function copyReferralLink() {
    if (!data?.referralLink || copying) return;

    setCopying(true);
    try {
      await navigator.clipboard.writeText(data.referralLink);
      toast.success("Referral link copied.");
    } catch {
      toast.error("Could not copy the referral link.");
    } finally {
      setCopying(false);
    }
  }

  const stats = data?.stats;
  const recentReferrals = data?.recentReferrals ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-bold text-white">
          Invite builders. Earn AI credits.
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Share Qorvex with friends. When they upgrade, you get bonus credits
          for more app generations.
        </p>
      </div>

      {data?.wasReferred && (
        <div className="mt-6 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-5 py-4 text-sm text-cyan-100">
          You joined Qorvex through a referral.
          {data.signupBonusGranted
            ? ` Your ${REFERRAL_SIGNUP_BONUS_CREDITS.toLocaleString()} signup bonus credits have already been added.`
            : " Upgrade to Pro or Max to support the person who invited you."}
        </div>
      )}

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <HowItWorksCard
          icon={Share2}
          title="Share your referral link"
          description="Send your unique Qorvex invite link to builders who want to launch apps faster."
        />
        <HowItWorksCard
          icon={UserPlus}
          title="Your friend signs up"
          description="They create a Qorvex account through your referral link and get guided into the product."
        />
        <HowItWorksCard
          icon={Gift}
          title="When they upgrade, you earn credits"
          description="Referral rewards are granted only after a confirmed Pro or Max upgrade."
        />
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <RewardCard
          title="Pro upgrade reward"
          credits={REFERRAL_PRO_REWARD_CREDITS}
          accent="from-cyan-500/25 to-violet-500/10"
        />
        <RewardCard
          title="Max upgrade reward"
          credits={REFERRAL_MAX_REWARD_CREDITS}
          accent="from-violet-500/30 to-fuchsia-500/10"
        />
      </div>

      <div className="mt-8 grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <section className="glass-border rounded-2xl bg-background-secondary/40 p-5">
          <div className="text-xs uppercase tracking-wider text-text-muted">
            Your referral link
          </div>
          {isLoading ? (
            <div className="mt-4 flex items-center gap-2 text-sm text-text-secondary">
              <Loader2 className="h-4 w-4 animate-spin" />
              Preparing your referral link...
            </div>
          ) : (
            <>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <input
                  readOnly
                  value={data?.referralLink ?? ""}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none"
                />
                <button
                  type="button"
                  onClick={copyReferralLink}
                  disabled={!data?.referralLink || copying}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:opacity-50"
                >
                  <Copy className="h-4 w-4" />
                  {copying ? "Copying..." : "Copy"}
                </button>
              </div>
              <div className="mt-3 text-xs text-text-muted">
                Code: <span className="font-mono text-text-secondary">{data?.referralCode}</span>
              </div>
            </>
          )}
        </section>

        <section className="glass-border rounded-2xl bg-background-secondary/40 p-5">
          <div className="text-xs uppercase tracking-wider text-text-muted">
            Referral stats
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <StatLine
              label="Total invited users"
              value={stats?.totalInvitedUsers ?? 0}
            />
            <StatLine label="Paid upgrades" value={stats?.paidUpgrades ?? 0} />
            <StatLine
              label="Bonus credits earned"
              value={(stats?.bonusCreditsEarned ?? 0).toLocaleString()}
            />
            <StatLine label="Pending referrals" value={stats?.pendingReferrals ?? 0} />
          </div>
        </section>
      </div>

      <section className="glass-border mt-8 rounded-2xl bg-background-secondary/40 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Recent referrals</h2>
            <p className="mt-1 text-sm text-text-secondary">
              Rewards are granted only after a confirmed paid upgrade. Self-referrals and duplicate accounts are not eligible.
            </p>
          </div>
          <div className="hidden rounded-full bg-white/[0.04] px-3 py-1 text-xs uppercase tracking-wider text-text-muted sm:block">
            Referrals
          </div>
        </div>

        {isLoading ? (
          <div className="mt-8 flex items-center gap-2 text-sm text-text-secondary">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading referral activity...
          </div>
        ) : recentReferrals.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-white/10 bg-black/20 px-6 py-12 text-center">
            <Sparkles className="mx-auto h-8 w-8 text-violet-300" />
            <div className="mt-4 text-lg font-semibold text-white">
              No referrals yet
            </div>
            <p className="mt-2 text-sm text-text-secondary">
              Share your link to start earning bonus credits.
            </p>
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-2xl border border-white/5">
            <div className="hidden grid-cols-[1.3fr_0.8fr_0.6fr_0.8fr_0.9fr] gap-3 bg-white/[0.03] px-4 py-3 text-xs uppercase tracking-wider text-text-muted md:grid">
              <span>User</span>
              <span>Status</span>
              <span>Plan</span>
              <span>Reward</span>
              <span>Date</span>
            </div>
            <div className="divide-y divide-white/5">
              {recentReferrals.map((row) => (
                <div
                  key={row.id}
                  className="grid gap-3 px-4 py-4 md:grid-cols-[1.3fr_0.8fr_0.6fr_0.8fr_0.9fr] md:items-center"
                >
                  <div>
                    <div className="text-sm font-medium text-white">{row.maskedUser}</div>
                    <div className="mt-1 text-xs text-text-muted md:hidden">
                      {new Date(row.rewardGrantedAt ?? row.upgradedAt ?? row.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${statusBadgeClass(row.status)}`}
                    >
                      {formatStatus(row.status)}
                    </span>
                  </div>
                  <div className="text-sm text-text-secondary">
                    {row.plan ? row.plan.toUpperCase() : "—"}
                  </div>
                  <div className="text-sm font-medium text-white">
                    {row.rewardCredits > 0
                      ? `+${row.rewardCredits.toLocaleString()}`
                      : "—"}
                  </div>
                  <div className="text-sm text-text-secondary">
                    {new Date(row.rewardGrantedAt ?? row.upgradedAt ?? row.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function HowItWorksCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="glass-border rounded-2xl bg-background-secondary/40 p-5">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500/10 ring-1 ring-violet-500/20">
        <Icon className="h-5 w-5 text-violet-300" />
      </div>
      <h2 className="mt-4 text-base font-semibold text-white">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-text-secondary">
        {description}
      </p>
    </div>
  );
}

function RewardCard({
  title,
  credits,
  accent,
}: {
  title: string;
  credits: number;
  accent: string;
}) {
  return (
    <div className={`glass-border rounded-2xl bg-gradient-to-br ${accent} p-5`}>
      <div className="text-xs uppercase tracking-wider text-text-muted">
        Reward
      </div>
      <div className="mt-3 text-xl font-semibold text-white">{title}</div>
      <div className="mt-2 text-sm text-text-secondary">
        {credits.toLocaleString()} AI credits
      </div>
    </div>
  );
}

function StatLine({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-white/8 bg-black/20 px-4 py-3">
      <div className="text-xs uppercase tracking-wider text-text-muted">
        {label}
      </div>
      <div className="mt-2 text-xl font-semibold text-white">{value}</div>
    </div>
  );
}
