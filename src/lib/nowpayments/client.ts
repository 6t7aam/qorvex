import "server-only";

const NOWPAYMENTS_API_BASE = "https://api.nowpayments.io/v1";

export class NowPaymentsError extends Error {
  status: number;
  payload: unknown;
  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "NowPaymentsError";
    this.status = status;
    this.payload = payload;
  }
}

function getApiKey(): string {
  const key = process.env.NOWPAYMENTS_API_KEY;
  if (!key) {
    throw new NowPaymentsError(
      "NOWPAYMENTS_API_KEY is not configured",
      503,
      null,
    );
  }
  return key;
}

export function isNowPaymentsConfigured(): boolean {
  return Boolean(process.env.NOWPAYMENTS_API_KEY);
}

export interface CreateInvoiceParams {
  priceAmount: number;
  priceCurrency: string;
  orderId: string;
  orderDescription: string;
  successUrl: string;
  cancelUrl: string;
  ipnCallbackUrl?: string;
  payCurrency?: string;
}

export interface NowPaymentsInvoice {
  id: string;
  order_id: string;
  invoice_url: string;
  price_amount: number;
  price_currency: string;
  pay_currency: string | null;
  ipn_callback_url: string | null;
  success_url: string;
  cancel_url: string;
  created_at: string;
}

/**
 * Creates a hosted NOWPayments invoice. Returns the redirectable invoice URL
 * and the upstream invoice ID we persist alongside our local payment row.
 */
export async function createNowPaymentsInvoice(
  params: CreateInvoiceParams,
): Promise<NowPaymentsInvoice> {
  const body = {
    price_amount: params.priceAmount,
    price_currency: params.priceCurrency,
    order_id: params.orderId,
    order_description: params.orderDescription,
    ipn_callback_url: params.ipnCallbackUrl,
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    pay_currency: params.payCurrency,
    is_fixed_rate: true,
    is_fee_paid_by_user: false,
  };

  const res = await fetch(`${NOWPAYMENTS_API_BASE}/invoice`, {
    method: "POST",
    headers: {
      "x-api-key": getApiKey(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    // Non-JSON response — leave payload as null
  }

  if (!res.ok) {
    const message =
      (payload as { message?: string } | null)?.message ??
      `NOWPayments invoice failed (HTTP ${res.status})`;
    throw new NowPaymentsError(message, res.status, payload);
  }

  return payload as NowPaymentsInvoice;
}

export interface CreatePaymentParams {
  priceAmount: number;
  priceCurrency: string;
  payCurrency: string;
  orderId: string;
  orderDescription: string;
  ipnCallbackUrl?: string;
}

export interface NowPaymentsPayment {
  payment_id: number | string;
  payment_status: string;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  pay_currency: string;
  order_id: string;
  expiration_estimate_date?: string;
  valid_until?: string;
  network?: string;
  network_precision?: number;
}

/**
 * Creates a direct NOWPayments payment (NOT an invoice). Returns the on-chain
 * pay address and the exact pay_amount in the chosen crypto so we can render
 * a fully custom checkout page instead of redirecting to NOWPayments' hosted
 * UI.
 */
export async function createNowPaymentsPayment(
  params: CreatePaymentParams,
): Promise<NowPaymentsPayment> {
  const body = {
    price_amount: params.priceAmount,
    price_currency: params.priceCurrency,
    pay_currency: params.payCurrency,
    order_id: params.orderId,
    order_description: params.orderDescription,
    ipn_callback_url: params.ipnCallbackUrl,
    is_fixed_rate: true,
    is_fee_paid_by_user: false,
  };

  const res = await fetch(`${NOWPAYMENTS_API_BASE}/payment`, {
    method: "POST",
    headers: {
      "x-api-key": getApiKey(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    /* ignore */
  }

  if (!res.ok) {
    const message =
      (payload as { message?: string } | null)?.message ??
      `NOWPayments payment creation failed (HTTP ${res.status})`;
    throw new NowPaymentsError(message, res.status, payload);
  }

  return payload as NowPaymentsPayment;
}

export interface NowPaymentsStatus {
  payment_id: number | string;
  payment_status: string;
  order_id: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  pay_currency: string;
  actually_paid?: number;
  outcome_amount?: number;
  outcome_currency?: string;
}

/**
 * Fetch the upstream status for an individual payment_id. Used by the webhook
 * to double-check the IPN payload against NOWPayments' own state.
 */
export async function getNowPaymentsPaymentStatus(
  paymentId: string,
): Promise<NowPaymentsStatus> {
  const res = await fetch(
    `${NOWPAYMENTS_API_BASE}/payment/${encodeURIComponent(paymentId)}`,
    {
      headers: { "x-api-key": getApiKey() },
      cache: "no-store",
    },
  );
  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    const message =
      (payload as { message?: string } | null)?.message ??
      `NOWPayments payment lookup failed (HTTP ${res.status})`;
    throw new NowPaymentsError(message, res.status, payload);
  }
  return payload as NowPaymentsStatus;
}

/**
 * Statuses that mean the payment cleared and the subscription should be
 * activated. NOWPayments uses both "confirmed" and "finished" — finished is
 * the terminal success state; "confirmed" means enough on-chain confirmations
 * have been observed for crypto funds. Both are safe to activate on.
 */
export const PAID_STATUSES: ReadonlySet<string> = new Set([
  "finished",
  "confirmed",
]);

export const FAILED_STATUSES: ReadonlySet<string> = new Set([
  "failed",
  "refunded",
  "expired",
]);
