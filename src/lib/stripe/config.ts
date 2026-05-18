import Stripe from "stripe";

let cached: Stripe | null = null;

export function getStripeInstance(): Stripe | null {
  if (cached) return cached;
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return null;
  cached = new Stripe(secret, {
    apiVersion: "2026-04-22.dahlia",
    typescript: true,
  });
  return cached;
}

export const stripe = getStripeInstance();

export const STRIPE_PLANS = {
  pro: {
    priceId: process.env.STRIPE_PRO_PRICE_ID ?? "",
    name: "Pro",
    price: 9.99,
    generations: 25,
  },
  max: {
    priceId: process.env.STRIPE_MAX_PRICE_ID ?? "",
    name: "Max",
    price: 29.99,
    generations: -1,
  },
} as const;

export type StripePlanKey = keyof typeof STRIPE_PLANS;

export function isStripeConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
      process.env.STRIPE_PRO_PRICE_ID &&
      process.env.STRIPE_MAX_PRICE_ID,
  );
}

export function planFromPriceId(priceId: string | null | undefined):
  | StripePlanKey
  | null {
  if (!priceId) return null;
  if (priceId === STRIPE_PLANS.pro.priceId) return "pro";
  if (priceId === STRIPE_PLANS.max.priceId) return "max";
  return null;
}
