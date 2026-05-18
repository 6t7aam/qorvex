import type { Plan } from "@/types";

export const PAID_PLANS: ReadonlyArray<Plan> = ["pro", "max"];

export function isPaidPlan(plan: Plan | string | null | undefined): boolean {
  return plan === "pro" || plan === "max";
}
