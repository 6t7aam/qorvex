export type NowPaymentsPlanKey = "pro" | "max";

export interface NowPaymentsPlan {
  key: NowPaymentsPlanKey;
  name: string;
  priceUsd: number;
  billing: "monthly";
  durationDays: number;
  description: string;
  highlights: string[];
}

/**
 * Source of truth for crypto checkout pricing. NEVER trust prices passed from
 * the client — every backend route must look up the plan by key here.
 */
export const NOWPAYMENTS_PLANS: Record<NowPaymentsPlanKey, NowPaymentsPlan> = {
  pro: {
    key: "pro",
    name: "Pro",
    priceUsd: 9.99,
    billing: "monthly",
    durationDays: 30,
    description: "Built for serious daily AI generation work.",
    highlights: [
      "18,000 AI credits refreshed daily",
      "Full export with no watermark",
      "GitHub integration",
      "Premium templates and AI editing",
    ],
  },
  max: {
    key: "max",
    name: "Max",
    priceUsd: 29.99,
    billing: "monthly",
    durationDays: 30,
    description: "Highest priority and the largest daily credit pool.",
    highlights: [
      "90,000 AI credits refreshed daily",
      "Advanced AI editing for long sessions",
      "App Store export tools",
      "Highest priority generation",
    ],
  },
};

export interface PayCurrency {
  code: string;
  label: string;
  sublabel: string;
}

export const PAY_CURRENCIES: PayCurrency[] = [
  { code: "ltc", label: "LTC", sublabel: "Litecoin" },
  { code: "sol", label: "SOL", sublabel: "Solana" },
  { code: "usdttrc20", label: "USDT", sublabel: "USDT (TRC20)" },
  { code: "usdtbsc", label: "USDT", sublabel: "USDT (BSC)" },
];

export function isSupportedPayCurrency(code: string | null | undefined): boolean {
  if (!code) return false;
  return PAY_CURRENCIES.some((c) => c.code === code);
}

export function isNowPaymentsPlan(key: string | null | undefined): key is NowPaymentsPlanKey {
  return key === "pro" || key === "max";
}
