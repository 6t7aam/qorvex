import { getPlanDailyCreditLimit } from "@/lib/ai-credits";
import type { UserProfile } from "@/types";

export interface GenerationLimitCheck {
  allowed: boolean;
  reason?: string;
  upgradeRequired?: boolean;
}

export function planLimit(
  plan: UserProfile["plan"],
  abuseDetected: boolean = false,
): number {
  return getPlanDailyCreditLimit(plan, abuseDetected);
}

export function checkGenerationLimit(profile: UserProfile): GenerationLimitCheck {
  return {
    allowed: Boolean(profile),
    reason:
      "Daily AI credit enforcement now runs server-side with token and cost tracking.",
  };
}

export function getGenerationsRemaining(profile: UserProfile): number {
  return profile.plan === "max" ? Infinity : 0;
}
