import "server-only";
import { createHmac } from "node:crypto";

/**
 * NOWPayments signs IPN payloads with HMAC-SHA512 over a JSON-stringified body
 * whose keys are sorted alphabetically. The signature is sent in the
 * `x-nowpayments-sig` header.
 *
 * Returns true only when the secret is configured AND the signature matches.
 * Caller decides whether to allow unsigned webhooks in dev — in production we
 * MUST set NOWPAYMENTS_IPN_SECRET and require valid signatures.
 */
export function verifyNowPaymentsSignature(
  rawBody: string,
  signatureHeader: string | null,
): { valid: boolean; configured: boolean } {
  const secret = process.env.NOWPAYMENTS_IPN_SECRET;
  if (!secret) {
    return { valid: false, configured: false };
  }
  if (!signatureHeader) {
    return { valid: false, configured: true };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return { valid: false, configured: true };
  }

  const sortedJson = stableStringify(parsed);
  const expected = createHmac("sha512", secret).update(sortedJson).digest("hex");

  return {
    valid: timingSafeEqual(expected, signatureHeader),
    configured: true,
  };
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((v) => stableStringify(v)).join(",")}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  const entries = keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`);
  return `{${entries.join(",")}}`;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
