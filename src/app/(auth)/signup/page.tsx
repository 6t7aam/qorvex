"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import { REFERRAL_COOKIE_NAME } from "@/lib/referrals";
import { signInWithGoogle, signUpWithEmail } from "@/services/auth.service";
import { validateEmail } from "@/lib/email-validation";

export default function SignupPage() {
  return (
    <Suspense fallback={<SignupPageSkeleton />}>
      <SignupPageInner />
    </Suspense>
  );
}

function SignupPageInner() {
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");
  const referralCode = searchParams.get("ref")?.trim().toUpperCase() ?? null;

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    urlError === "disposable_email" ? "Please use a permanent email address" : null
  );
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!referralCode) {
      return;
    }

    try {
      window.localStorage.setItem(REFERRAL_COOKIE_NAME, referralCode);
    } catch {
      // ignore storage issues
    }

    document.cookie = `${REFERRAL_COOKIE_NAME}=${encodeURIComponent(referralCode)}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
  }, [referralCode]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!fullName.trim() || !email.trim() || !password) {
      setError("Please fill out every field to continue.");
      return;
    }

    // Validate email and check for disposable domains
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      setError(emailValidation.error ?? "Invalid email address");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsLoading(true);
    const { error: authError } = await signUpWithEmail(
      email,
      password,
      fullName,
    );
    setIsLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    setSuccess(true);
  }

  async function handleGoogle() {
    setError(null);
    setIsGoogleLoading(true);
    const { error: oauthError } = await signInWithGoogle();
    if (oauthError) {
      setError(oauthError.message);
      setIsGoogleLoading(false);
    }
  }

  return (
    <div className="relative z-10 flex w-full flex-col items-center px-4">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-2 text-2xl font-bold tracking-tight"
      >
        {/* Site logo — swap the file at public/qorvex-logo.svg to change everywhere. */}
        <Image
          src="/qorvex-logo.svg"
          alt="Qorvex"
          width={36}
          height={36}
          priority
          className="h-9 w-9 rounded-lg"
        />
        <span className="gradient-text">Qorvex</span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass w-full max-w-md rounded-2xl p-8"
      >
        {success ? (
          <div className="flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/15">
              <CheckCircle2 className="h-7 w-7 text-green-400" />
            </div>
            <h1 className="mt-4 text-2xl font-semibold text-white">
              Check your email!
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              We sent a confirmation link to{" "}
              <span className="font-medium text-white">{email}</span>. Click it
              to verify your account and get started.
            </p>
            <Link
              href="/login"
              className="mt-6 text-sm font-medium text-violet-400 hover:text-violet-300"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-semibold text-white">
              Start building for free
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Create your Qorvex account
            </p>

            {referralCode && (
              <div className="mt-4 rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
                You were invited to Qorvex. Create your account to continue.
                <div className="mt-1 text-xs text-cyan-200/80">
                  Upgrade to Pro or Max and your inviter will receive bonus credits.
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleGoogle}
              disabled={isGoogleLoading || isLoading}
              className="glass-border mt-6 flex w-full items-center justify-center gap-3 rounded-xl bg-white/[0.02] px-4 py-3 text-sm font-medium text-white transition hover:bg-white/[0.06] disabled:opacity-60"
            >
              {isGoogleLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              Continue with Google
            </button>

            <div className="my-6 flex items-center gap-3">
              <span className="h-px flex-1 bg-white/10" />
              <span className="text-xs uppercase tracking-wider text-text-muted">
                or continue with email
              </span>
              <span className="h-px flex-1 bg-white/10" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                required
                autoComplete="name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Your full name"
                className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white placeholder:text-text-muted focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
              />

              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white placeholder:text-text-muted focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
              />

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Min 8 characters"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 pr-12 text-sm text-white placeholder:text-text-muted focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-white"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              <p className="text-xs leading-relaxed text-text-muted">
                By signing up you agree to our{" "}
                <Link href="/terms" className="underline hover:text-text-secondary">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="underline hover:text-text-secondary">
                  Privacy Policy
                </Link>
                .
              </p>

              {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="gradient-bg flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Create account"
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-text-secondary">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-violet-400 hover:text-violet-300"
              >
                Sign in
              </Link>
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M17.64 9.205c0-.638-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.909c1.702-1.567 2.683-3.875 2.683-6.614Z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.957-2.181l-2.909-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.583-5.036-3.711H.957v2.332A9 9 0 0 0 9 18Z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A9 9 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.581C13.463.891 11.426 0 9 0A9 9 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
        fill="#EA4335"
      />
    </svg>
  );
}

function SignupPageSkeleton() {
  return (
    <div className="relative z-10 flex w-full flex-col items-center px-4">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-2 text-2xl font-bold tracking-tight"
      >
        {/* Site logo — swap the file at public/qorvex-logo.svg to change everywhere. */}
        <Image
          src="/qorvex-logo.svg"
          alt="Qorvex"
          width={36}
          height={36}
          priority
          className="h-9 w-9 rounded-lg"
        />
        <span className="gradient-text">Qorvex</span>
      </Link>

      <div className="glass w-full max-w-md rounded-2xl p-8">
        <div className="h-8 w-48 animate-pulse rounded bg-white/10" />
        <div className="mt-2 h-4 w-32 animate-pulse rounded bg-white/5" />
      </div>
    </div>
  );
}
