const REQUIRED_PUBLIC_VARS = [
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_APP_NAME",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
] as const;

const REQUIRED_SERVER_VARS = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "ANTHROPIC_API_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
] as const;

export function validateEnv(): { missing: string[] } {
  const missing: string[] = [];

  for (const key of REQUIRED_PUBLIC_VARS) {
    if (!process.env[key]) missing.push(key);
  }

  if (typeof window === "undefined") {
    for (const key of REQUIRED_SERVER_VARS) {
      if (!process.env[key]) missing.push(key);
    }
  }

  if (missing.length > 0) {
    console.warn(
      `[qorvex/env] Missing env vars (dev OK, prod must set them): ${missing.join(", ")}`,
    );
  }

  return { missing };
}

export const env = {
  APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  APP_NAME: process.env.NEXT_PUBLIC_APP_NAME ?? "Qorvex",
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? "",
  ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL ?? "",
  ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5",
  STRIPE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ?? "",
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  STRIPE_PRICE_FREE: process.env.STRIPE_FREE_PRICE_ID ?? "",
  STRIPE_PRICE_PRO: process.env.STRIPE_PRO_PRICE_ID ?? "",
  STRIPE_PRICE_MAX: process.env.STRIPE_MAX_PRICE_ID ?? "",
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID ?? "",
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET ?? "",
  FREE_GENERATIONS_PER_WEEK: Number(
    process.env.NEXT_PUBLIC_FREE_GENERATIONS_PER_WEEK ?? 5,
  ),
  PRO_GENERATIONS_PER_WEEK: Number(
    process.env.NEXT_PUBLIC_PRO_GENERATIONS_PER_WEEK ?? 30,
  ),
  FREE_PRICE: Number(process.env.NEXT_PUBLIC_FREE_PRICE ?? 0),
  PRO_PRICE: Number(process.env.NEXT_PUBLIC_PRO_PRICE ?? 9.99),
  MAX_PRICE: Number(process.env.NEXT_PUBLIC_MAX_PRICE ?? 29.99),
} as const;

export type Env = typeof env;
