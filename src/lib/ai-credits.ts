import type { Plan } from "@/types";

export const AI_CREDIT_UNIT_USD = 0.0001;
export const MAX_ACTIVE_AI_REQUESTS = 1;
export const MIN_REQUEST_INTERVAL_MS = 2500;

export interface DailyCreditPlanConfig {
  dailyCredits: number;
  softReserveCredits: number;
  warningThresholdCredits: number;
  label: string;
}

export const DAILY_CREDIT_CONFIG: Record<Plan, DailyCreditPlanConfig> = {
  free: {
    dailyCredits: 3500,
    softReserveCredits: 500,
    warningThresholdCredits: 900,
    label: "Light daily credit pool for testing small app ideas",
  },
  pro: {
    dailyCredits: 18000,
    softReserveCredits: 1200,
    warningThresholdCredits: 2800,
    label: "Balanced daily credit pool for medium and larger app sessions",
  },
  max: {
    dailyCredits: 90000,
    softReserveCredits: 2400,
    warningThresholdCredits: 9000,
    label: "Large daily credit pool for long editing sessions and complex apps",
  },
};

export interface DailyUsageWindow {
  usageDate: string;
  resetAt: string;
}

export interface DailyCreditSnapshot {
  usageDate: string;
  resetAt: string;
  plan: Plan;
  limitCredits: number;
  usedCredits: number;
  remainingCredits: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  requestCount: number;
  activeRequests: number;
}

export function getPlanDailyCreditLimit(
  plan: Plan,
  abuseDetected: boolean = false,
) {
  if (plan === "free" && abuseDetected) {
    return Math.floor(DAILY_CREDIT_CONFIG.free.dailyCredits * 0.45);
  }

  return DAILY_CREDIT_CONFIG[plan].dailyCredits;
}

export function usdToCredits(costUsd: number) {
  return Math.max(0, Math.ceil(costUsd / AI_CREDIT_UNIT_USD));
}

export function creditsToUsd(credits: number) {
  return credits * AI_CREDIT_UNIT_USD;
}

export function getUtcUsageWindow(now = new Date()): DailyUsageWindow {
  const usageDate = now.toISOString().slice(0, 10);
  const resetAtDate = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0),
  );

  return {
    usageDate,
    resetAt: resetAtDate.toISOString(),
  };
}

export function formatResetCountdown(resetAt: string, now = new Date()) {
  const diffMs = Math.max(0, new Date(resetAt).getTime() - now.getTime());
  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) {
    return `${minutes}m`;
  }

  return `${hours}h ${minutes}m`;
}

export function estimateGenerationCredits(prompt: string, featureCount: number) {
  const normalizedPrompt = prompt.trim();
  const promptWeight = Math.ceil(normalizedPrompt.length / 6);
  const featureWeight = featureCount * 120;
  const base = 650;
  return base + promptWeight + featureWeight;
}

export function estimateGenerationCostUsd(prompt: string, featureCount: number) {
  return creditsToUsd(estimateGenerationCredits(prompt, featureCount));
}
