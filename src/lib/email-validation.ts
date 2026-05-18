/**
 * List of known disposable/temporary email domains
 */
const DISPOSABLE_EMAIL_DOMAINS = [
  "mailinator.com",
  "tempmail.com",
  "guerrillamail.com",
  "10minutemail.com",
  "throwam.com",
  "trashmail.com",
  "temp-mail.org",
  "fakeinbox.com",
  "throwaway.email",
  "getnada.com",
  "maildrop.cc",
  "yopmail.com",
  "sharklasers.com",
  "guerrillamailblock.com",
  "grr.la",
  "spam4.me",
  "mintemail.com",
  "emailondeck.com",
  "dispostable.com",
  "mailnesia.com",
];

/**
 * Check if an email address uses a disposable/temporary email domain
 */
export function isDisposableEmail(email: string): boolean {
  const normalizedEmail = email.toLowerCase().trim();
  const domain = normalizedEmail.split("@")[1];

  if (!domain) {
    return false;
  }

  return DISPOSABLE_EMAIL_DOMAINS.includes(domain);
}

/**
 * Validate email format and check for disposable domains
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  const normalizedEmail = email.toLowerCase().trim();

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    return { valid: false, error: "Invalid email format" };
  }

  // Check for disposable email
  if (isDisposableEmail(normalizedEmail)) {
    return { valid: false, error: "Please use a permanent email address" };
  }

  return { valid: true };
}
