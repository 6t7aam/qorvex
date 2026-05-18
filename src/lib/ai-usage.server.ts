import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DAILY_CREDIT_CONFIG,
  MAX_ACTIVE_AI_REQUESTS,
  MIN_REQUEST_INTERVAL_MS,
  getPlanDailyCreditLimit,
  getUtcUsageWindow,
  type DailyCreditSnapshot,
} from "@/lib/ai-credits";
import type { AIUsage } from "@/lib/ai/types";
import {
  consumeBonusCredits,
  getUserBonusCreditBalance,
} from "@/lib/referrals.server";
import type { DailyAIUsage, Plan } from "@/types";

interface UsageSessionOptions {
  admin: SupabaseClient;
  userId: string;
  plan: Plan;
  abuseDetected?: boolean;
  reserveCredits?: number;
}

type DailyUsageRecord = DailyAIUsage;

function toSnapshot(
  row: DailyUsageRecord,
  plan: Plan,
  abuseDetected: boolean,
  bonusCredits: number,
): DailyCreditSnapshot {
  const window = getUtcUsageWindow();
  const limitCredits = getPlanDailyCreditLimit(plan, abuseDetected);
  const usedCredits = row.credits_used ?? 0;
  const dailyRemainingCredits = Math.max(0, limitCredits - usedCredits);
  const totalAvailableCredits = dailyRemainingCredits + Math.max(0, bonusCredits);

  return {
    usageDate: row.usage_date,
    resetAt: window.resetAt,
    plan,
    limitCredits,
    usedCredits,
    dailyRemainingCredits,
    bonusCredits: Math.max(0, bonusCredits),
    totalAvailableCredits,
    remainingCredits: totalAvailableCredits,
    promptTokens: row.prompt_tokens ?? 0,
    completionTokens: row.completion_tokens ?? 0,
    totalTokens: row.total_tokens ?? 0,
    estimatedCostUsd: row.estimated_cost_usd ?? 0,
    requestCount: row.request_count ?? 0,
    activeRequests: row.active_requests ?? 0,
  };
}

async function getOrCreateDailyUsageRow(
  admin: SupabaseClient,
  userId: string,
  usageDate: string,
) {
  const { data, error } = await admin
    .from("daily_ai_usage")
    .select("*")
    .eq("user_id", userId)
    .eq("usage_date", usageDate)
    .maybeSingle<DailyUsageRecord>();

  if (error) {
    throw error;
  }

  if (data) {
    return data;
  }

  const { data: created, error: insertError } = await admin
    .from("daily_ai_usage")
    .insert({
      user_id: userId,
      usage_date: usageDate,
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
      estimated_cost_usd: 0,
      credits_used: 0,
      request_count: 0,
      active_requests: 0,
    })
    .select("*")
    .single<DailyUsageRecord>();

  if (insertError || !created) {
    throw insertError ?? new Error("Could not create daily_ai_usage row");
  }

  return created;
}

export async function getDailyCreditSnapshot(options: {
  admin: SupabaseClient;
  userId: string;
  plan: Plan;
  abuseDetected?: boolean;
}) {
  const window = getUtcUsageWindow();
  const row = await getOrCreateDailyUsageRow(
    options.admin,
    options.userId,
    window.usageDate,
  );
  const bonusCredits = await getUserBonusCreditBalance(options.admin, options.userId);

  return toSnapshot(row, options.plan, options.abuseDetected ?? false, bonusCredits);
}

export async function beginAIUsageSession({
  admin,
  userId,
  plan,
  abuseDetected = false,
  reserveCredits,
}: UsageSessionOptions) {
  const window = getUtcUsageWindow();
  let row = await getOrCreateDailyUsageRow(admin, userId, window.usageDate);
  const reserve =
    reserveCredits ?? DAILY_CREDIT_CONFIG[plan].softReserveCredits;
  const limitCredits = getPlanDailyCreditLimit(plan, abuseDetected);
  const now = new Date();
  const initialBonusCredits = await getUserBonusCreditBalance(admin, userId);
  const initialDailyRemaining = Math.max(0, limitCredits - (row.credits_used ?? 0));
  const initialTotalAvailable = initialDailyRemaining + Math.max(0, initialBonusCredits);

  if ((row.active_requests ?? 0) >= MAX_ACTIVE_AI_REQUESTS) {
    throw new Error(
      "Another AI request is still running for this account. Please wait for it to finish.",
    );
  }

  if (row.last_request_at) {
    const lastRequestMs = new Date(row.last_request_at).getTime();
    if (now.getTime() - lastRequestMs < MIN_REQUEST_INTERVAL_MS) {
      throw new Error(
        "You are sending AI requests too quickly. Please wait a moment and try again.",
      );
    }
  }

  if (initialTotalAvailable < reserve) {
    throw new Error(
      `Daily AI credits are nearly exhausted for your ${plan.toUpperCase()} plan. Please wait for the UTC reset or upgrade your plan.`,
    );
  }

  const { data: updated, error: updateError } = await admin
    .from("daily_ai_usage")
    .update({
      active_requests: (row.active_requests ?? 0) + 1,
      request_count: (row.request_count ?? 0) + 1,
      last_request_at: now.toISOString(),
    })
    .eq("id", row.id)
    .select("*")
    .single<DailyUsageRecord>();

  if (updateError || !updated) {
    throw updateError ?? new Error("Could not start AI usage session");
  }

  row = updated;

  return {
    snapshot: toSnapshot(row, plan, abuseDetected, initialBonusCredits),
    async ensureCreditsAvailable(estimatedCredits: number, stageLabel: string) {
      const latest = await getOrCreateDailyUsageRow(admin, userId, window.usageDate);
      const bonusCredits = await getUserBonusCreditBalance(admin, userId);
      const totalAvailableCredits =
        Math.max(0, limitCredits - (latest.credits_used ?? 0)) +
        Math.max(0, bonusCredits);
      if (totalAvailableCredits < estimatedCredits) {
        return {
          allowed: false,
          message: `Qorvex paused before ${stageLabel} because your remaining credits are too low to finish that stage safely.`,
        };
      }

      return { allowed: true };
    },
    async recordUsage(usage: AIUsage) {
      const latest = await getOrCreateDailyUsageRow(admin, userId, window.usageDate);
      const bonusCredits = await getUserBonusCreditBalance(admin, userId);
      const dailyRemainingCredits = Math.max(
        0,
        limitCredits - (latest.credits_used ?? 0),
      );
      const dailyCreditsToUse = Math.min(usage.creditsUsed, dailyRemainingCredits);
      const bonusCreditsToUse = Math.max(0, usage.creditsUsed - dailyCreditsToUse);

      if (bonusCreditsToUse > Math.max(0, bonusCredits)) {
        throw new Error(
          "Your remaining credits are too low to complete this AI request.",
        );
      }

      const { data: next, error } = await admin
        .from("daily_ai_usage")
        .update({
          prompt_tokens: (latest.prompt_tokens ?? 0) + usage.promptTokens,
          completion_tokens:
            (latest.completion_tokens ?? 0) + usage.completionTokens,
          total_tokens: (latest.total_tokens ?? 0) + usage.totalTokens,
          estimated_cost_usd:
            Number(latest.estimated_cost_usd ?? 0) + usage.estimatedCostUsd,
          credits_used: (latest.credits_used ?? 0) + dailyCreditsToUse,
        })
        .eq("id", latest.id)
        .select("*")
        .single<DailyUsageRecord>();

      if (error || !next) {
        throw error ?? new Error("Could not record AI usage");
      }

      if (bonusCreditsToUse > 0) {
        await consumeBonusCredits(admin, {
          userId,
          amount: bonusCreditsToUse,
          usageDate: window.usageDate,
          promptTokens: usage.promptTokens,
          completionTokens: usage.completionTokens,
          totalTokens: usage.totalTokens,
        });
      }

      const nextBonusCredits = Math.max(0, bonusCredits - bonusCreditsToUse);
      return toSnapshot(next, plan, abuseDetected, nextBonusCredits);
    },
    async release() {
      const latest = await getOrCreateDailyUsageRow(admin, userId, window.usageDate);
      const { error } = await admin
        .from("daily_ai_usage")
        .update({
          active_requests: Math.max(0, (latest.active_requests ?? 0) - 1),
          last_completed_at: new Date().toISOString(),
        })
        .eq("id", latest.id);

      if (error) {
        throw error;
      }
    },
  };
}
