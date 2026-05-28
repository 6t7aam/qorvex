import type { Plan } from "@/types";

export const PAID_PLANS: ReadonlyArray<Plan> = ["pro", "max"];

export function isPaidPlan(plan: Plan | string | null | undefined): boolean {
  return plan === "pro" || plan === "max";
}

/**
 * Ordered tier of a plan, so upgrade/downgrade can be compared numerically:
 * free (0) < pro (1) < max (2).
 */
export function planRank(plan: Plan | string | null | undefined): number {
  if (plan === "max") return 2;
  if (plan === "pro") return 1;
  return 0;
}
