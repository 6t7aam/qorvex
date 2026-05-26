"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  Bitcoin,
  CheckCircle2,
  CreditCard,
  Lock,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { PaymentModal } from "@/components/billing/PaymentModal";
import {
  PAY_CURRENCIES,
  type NowPaymentsPlan,
  type NowPaymentsPlanKey,
} from "@/lib/nowpayments/config";

type Method = "crypto" | "card";

interface CheckoutClientProps {
  initialPlan: NowPaymentsPlanKey;
  plans: Record<NowPaymentsPlanKey, NowPaymentsPlan>;
  userId: string;
  userEmail: string | null;
}

export function CheckoutClient({
  initialPlan,
  plans,
  userId,
  userEmail,
}: CheckoutClientProps) {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<NowPaymentsPlanKey>(initialPlan);
  const [method, setMethod] = useState<Method>("crypto");
  const [currency, setCurrency] = useState<string>(PAY_CURRENCIES[0].code);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardModalOpen, setCardModalOpen] = useState(false);

  const plan = plans[selectedPlan];
  const selectedCurrency =
    PAY_CURRENCIES.find((c) => c.code === currency) ?? PAY_CURRENCIES[0];

  async function handlePay() {
    setError(null);

    if (method === "card") {
      setCardModalOpen(true);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/payments/nowpayments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: selectedPlan,
          pay_currency: currency,
        }),
      });
      const data = (await res.json()) as {
        order_id?: string;
        error?: string;
      };
      if (!res.ok || !data.order_id) {
        setError(data.error ?? "Failed to create payment");
        setSubmitting(false);
        return;
      }
      router.push(`/checkout/pay/${encodeURIComponent(data.order_id)}`);
    } catch (err) {
      console.error("[checkout] create payment failed:", err);
      setError("Network error — please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <header className="flex items-center justify-between">
        <Logo href="/dashboard" size="md" />
        <span className="hidden text-xs text-text-muted sm:inline">
          {userEmail ?? "Signed in"}
        </span>
      </header>

      <Link
        href="/billing"
        className="mt-8 inline-flex items-center gap-2 text-sm text-text-secondary transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to billing
      </Link>

      <div className="mt-6">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          COMPLETE YOUR{" "}
          <span className="gradient-text">PAYMENT</span>
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Pay with crypto for instant on-chain activation, or use a bank card
          and submit a payment screenshot for manual verification.
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <OrderSummary
          plans={plans}
          selectedPlan={selectedPlan}
          onSelectPlan={setSelectedPlan}
        />

        <div className="space-y-5">
          <PaymentMethodPicker method={method} onChange={setMethod} />

          {method === "crypto" ? (
            <CurrencyPicker selected={currency} onSelect={setCurrency} />
          ) : (
            <CardInfoCard amountUsd={plan.priceUsd} />
          )}

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <button
            type="button"
            disabled={submitting}
            onClick={handlePay}
            className="group relative flex h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 px-6 text-base font-bold tracking-wide text-white shadow-lg shadow-violet-500/25 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition group-hover:translate-x-full" />
            <span className="relative">
              {submitting
                ? "Creating payment..."
                : method === "crypto"
                  ? `PAY $${plan.priceUsd.toFixed(2)} WITH ${selectedCurrency.label}`
                  : `PAY $${plan.priceUsd.toFixed(2)} BY CARD`}
            </span>
          </button>

          <TrustBadges />
        </div>
      </div>

      <FooterStrip />

      {cardModalOpen && (
        <PaymentModal
          plan={selectedPlan}
          userId={userId}
          onClose={() => setCardModalOpen(false)}
          onSubmitted={() => {
            router.push("/billing");
          }}
        />
      )}
    </div>
  );
}

function CardInfoCard({ amountUsd }: { amountUsd: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-background-secondary/40 p-5">
      <div className="flex items-center gap-2">
        <CreditCard className="h-4 w-4 text-violet-300" />
        <span className="text-sm font-semibold text-white">
          Bank card — manual verification
        </span>
      </div>
      <p className="mt-2 text-xs text-text-secondary">
        Transfer{" "}
        <span className="font-semibold text-white">
          ${amountUsd.toFixed(2)}
        </span>{" "}
        to our bank card and upload the payment screenshot. We confirm manual
        payments within 24 hours and activate your subscription as soon as the
        transfer is verified.
      </p>
      <ul className="mt-3 space-y-1.5 text-xs text-text-secondary">
        <li className="flex items-start gap-2">
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-300" />
          Card number, recipient and bank shown after you press Pay
        </li>
        <li className="flex items-start gap-2">
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-300" />
          Upload your transfer screenshot (JPG, PNG, WebP or PDF)
        </li>
        <li className="flex items-start gap-2">
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-300" />
          Plan activates after the transfer is verified
        </li>
      </ul>
    </div>
  );
}

function OrderSummary({
  plans,
  selectedPlan,
  onSelectPlan,
}: {
  plans: Record<NowPaymentsPlanKey, NowPaymentsPlan>;
  selectedPlan: NowPaymentsPlanKey;
  onSelectPlan: (plan: NowPaymentsPlanKey) => void;
}) {
  const plan = plans[selectedPlan];

  return (
    <div className="rounded-2xl border border-violet-500/30 bg-background-secondary/50 p-6 shadow-lg shadow-violet-500/5">
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
        Order Summary
      </div>

      <div className="mt-5 space-y-2">
        {(Object.keys(plans) as NowPaymentsPlanKey[]).map((key) => {
          const p = plans[key];
          const active = key === selectedPlan;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectPlan(key)}
              className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                active
                  ? "border-violet-400/60 bg-violet-500/10 shadow-inner shadow-violet-500/10"
                  : "border-white/10 bg-black/20 hover:border-white/20"
              }`}
            >
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  {p.name} subscription
                  {active && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-violet-300" />
                  )}
                </div>
                <div className="mt-0.5 text-xs text-text-secondary">
                  Billed {p.billing} • {p.description}
                </div>
              </div>
              <div className="text-right">
                <div className="text-base font-bold text-white">
                  ${p.priceUsd.toFixed(2)}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-text-muted">
                  / month
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-5 rounded-xl border border-white/5 bg-black/20 p-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Includes
        </div>
        <ul className="mt-3 space-y-2 text-sm text-text-secondary">
          {plan.highlights.map((h) => (
            <li key={h} className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-300" />
              {h}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5 space-y-2 border-t border-white/5 pt-5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-muted">Subtotal</span>
          <span className="text-white">${plan.priceUsd.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-base font-semibold text-white">Total</span>
          <span className="gradient-text text-3xl font-bold">
            ${plan.priceUsd.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between rounded-xl border border-white/5 bg-black/20 px-4 py-2.5 text-xs text-text-secondary">
        <span className="inline-flex items-center gap-1.5">
          <Lock className="h-3.5 w-3.5 text-violet-300" />
          SSL Secured
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-cyan-300" />
          Instant activation
        </span>
      </div>
    </div>
  );
}

function PaymentMethodPicker({
  method,
  onChange,
}: {
  method: Method;
  onChange: (m: Method) => void;
}) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
        Select Payment Method
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <MethodTile
          active={method === "crypto"}
          onClick={() => onChange("crypto")}
          icon={<Bitcoin className="h-5 w-5" />}
          title="Crypto"
        />
        <MethodTile
          active={method === "card"}
          onClick={() => onChange("card")}
          icon={<CreditCard className="h-5 w-5" />}
          title="Card"
        />
      </div>
    </div>
  );
}

function MethodTile({
  active,
  onClick,
  icon,
  title,
  comingSoon,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  comingSoon?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex items-center justify-center gap-2 rounded-2xl border px-4 py-4 text-sm font-bold uppercase tracking-wide transition ${
        active
          ? "border-violet-400/60 bg-gradient-to-br from-violet-600 to-cyan-500 text-white shadow-lg shadow-violet-500/20"
          : "border-white/10 bg-background-secondary/40 text-text-secondary hover:border-white/20 hover:text-white"
      }`}
    >
      {icon}
      <span>{title}</span>
      {comingSoon && (
        <span className="absolute right-2 top-2 rounded-full bg-white/10 px-2 py-0.5 text-[9px] uppercase tracking-wider text-text-secondary">
          Soon
        </span>
      )}
    </button>
  );
}

function CurrencyPicker({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (code: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {PAY_CURRENCIES.map((c) => {
        const active = c.code === selected;
        return (
          <button
            key={c.code}
            type="button"
            onClick={() => onSelect(c.code)}
            className={`flex flex-col items-center justify-center gap-1 rounded-2xl border px-4 py-5 transition ${
              active
                ? "border-violet-400/60 bg-violet-500/10 shadow-inner shadow-violet-500/10"
                : "border-white/10 bg-background-secondary/40 hover:border-white/20"
            }`}
          >
            <span
              className={`text-lg font-bold tracking-wide ${
                active ? "text-white" : "text-text-primary"
              }`}
            >
              {c.label}
            </span>
            <span className="text-xs text-text-secondary">{c.sublabel}</span>
          </button>
        );
      })}
    </div>
  );
}

function TrustBadges() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/5 bg-background-secondary/30 px-4 py-3 text-xs text-text-secondary">
      <span className="inline-flex items-center gap-1.5">
        <Lock className="h-3.5 w-3.5 text-violet-300" />
        SSL Encrypted
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Zap className="h-3.5 w-3.5 text-cyan-300" />
        Instant activation
      </span>
      <span className="inline-flex items-center gap-1.5">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
        100% Safe
      </span>
      <span className="inline-flex items-center gap-1.5">
        <CheckCircle2 className="h-3.5 w-3.5 text-cyan-300" />
        Secure Payments
      </span>
    </div>
  );
}

function FooterStrip() {
  return (
    <footer className="mt-16 border-t border-white/5 pt-6 text-xs text-text-muted">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span>© Qorvex. All rights reserved.</span>
        <div className="flex gap-4">
          <Link href="/" className="hover:text-white">
            Home
          </Link>
          <Link href="/pricing" className="hover:text-white">
            Pricing
          </Link>
          <Link href="/billing" className="hover:text-white">
            Billing
          </Link>
        </div>
      </div>
    </footer>
  );
}
