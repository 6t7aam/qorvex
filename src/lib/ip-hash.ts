import { createHash } from "crypto";

/**
 * Hash an IP address for privacy-preserving abuse detection.
 * Uses SHA-256 to create a one-way hash of the IP address.
 */
export function hashIP(ip: string): string {
  return createHash("sha256").update(ip).digest("hex");
}

/**
 * Extract the client IP address from Next.js request headers.
 * Checks common proxy headers in order of preference.
 */
export function getClientIP(headers: Headers): string | null {
  // Check common proxy headers
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(",")[0].trim();
  }

  const realIP = headers.get("x-real-ip");
  if (realIP) {
    return realIP.trim();
  }

  const cfConnectingIP = headers.get("cf-connecting-ip");
  if (cfConnectingIP) {
    return cfConnectingIP.trim();
  }

  // Fallback to other headers
  const forwarded = headers.get("forwarded");
  if (forwarded) {
    const match = forwarded.match(/for=([^;,\s]+)/);
    if (match) {
      return match[1].replace(/^"?(.*?)"?$/, "$1");
    }
  }

  return null;
}
