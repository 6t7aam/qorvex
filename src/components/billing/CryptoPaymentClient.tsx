"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Loader2,
  Lock,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/brand/Logo";

interface CryptoPaymentClientProps {
  orderId: string;
  planName: string;
  amountUsd: number;
  payAddress: string;
  payAmount: number;
  payCurrency: string;
  payCurrencyLabel: string;
  payCurrencySublabel: string | null;
  expiresAt: string | null;
  initialStatus: string;
}

type Stage = "waiting" | "confirming" | "finished" | "expired" | "failed";

const POLL_INTERVAL_MS = 8_000;

export function CryptoPaymentClient(props: CryptoPaymentClientProps) {
  const {
    orderId,
    planName,
    amountUsd,
    payAddress,
    payAmount,
    payCurrency,
    payCurrencyLabel,
    payCurrencySublabel,
    expiresAt,
    initialStatus,
  } = props;
  const router = useRouter();

  const [stage, setStage] = useState<Stage>(() => mapStage(initialStatus, null));
  const [paymentStatusLabel, setPaymentStatusLabel] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const stoppedRef = useRef(false);

  const qrUrl = useMemo(() => {
    const data = encodeURIComponent(payAddress);
    return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=0&bgcolor=0f0f12&color=ffffff&data=${data}`;
  }, [payAddress]);

  const expiryMs = useMemo(() => {
    if (!expiresAt) return null;
    const t = Date.parse(expiresAt);
    return Number.isFinite(t) ? t : null;
  }, [expiresAt]);

  // Local clock for the countdown
  useEffect(() => {
    if (!expiryMs) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [expiryMs]);

  // Poll status
  useEffect(() => {
    if (stoppedRef.current) return;

    let cancelled = false;
    async function tick() {
      try {
        const res = await fetch(
          `/api/payments/nowpayments/status/${encodeURIComponent(orderId)}`,
          { cache: "no-store" },
        );
        if (!res.ok) return;
        const data = (await res.json()) as {
          status: string;
          payment_status: string | null;
          paid: boolean;
        };
        if (cancelled) return;

        setPaymentStatusLabel(data.payment_status);
        const next = mapStage(data.status, data.payment_status);
        setStage(next);

        if (data.paid) {
          stoppedRef.current = true;
          toast.success("Payment confirmed — activating your subscription.");
          setTimeout(() => {
            router.replace(`/billing/success?order_id=${encodeURIComponent(orderId)}`);
          }, 800);
        }
      } catch (err) {
        console.error("[crypto-pay] poll failed:", err);
      }
    }

    tick();
    const id = window.setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [orderId, router]);

  function copy(value: string, field: string) {
    if (!value) return;
    navigator.clipboard
      .writeText(value)
      .then(() => {
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 1200);
      })
      .catch(() => toast.error("Could not copy to clipboard"));
  }

  const timeLeft = expiryMs
    ? formatCountdown(Math.max(0, expiryMs - now))
    : null;
  const expiredByClock = expiryMs ? now > expiryMs : false;
  const effectiveStage: Stage =
    stage === "waiting" && expiredByClock ? "expired" : stage;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <header className="flex items-center justify-between">
        <Logo href="/dashboard" size="md" />
      </header>

      <Link
        href="/checkout"
        className="mt-8 inline-flex items-center gap-2 text-sm text-text-secondary transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Cancel and pick another method
      </Link>

      <div className="mt-6">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          SEND <span className="gradient-text">{payCurrencyLabel}</span> TO ACTIVATE{" "}
          {planName.toUpperCase()}
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Send the exact amount below to the wallet address. Your subscription
          activates automatically the moment funds clear on-chain — usually a
          few minutes.
        </p>
      </div>

      <StatusBanner stage={effectiveStage} paymentStatusLabel={paymentStatusLabel} />

      <div className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
        <QrCard qrUrl={qrUrl} payAddress={payAddress} />

        <div className="space-y-5">
          <AmountCard
            payAmount={payAmount}
            payCurrencyLabel={payCurrencyLabel}
            payCurrencySublabel={payCurrencySublabel}
            payCurrency={payCurrency}
            amountUsd={amountUsd}
            copied={copiedField === "amount"}
            onCopy={() => copy(payAmount.toString(), "amount")}
          />

          <AddressCard
            payAddress={payAddress}
            copied={copiedField === "address"}
            onCopy={() => copy(payAddress, "address")}
          />

          {timeLeft && (
            <div className="flex items-center justify-between rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] px-4 py-3 text-sm">
              <span className="inline-flex items-center gap-2 text-amber-200">
                <Clock className="h-4 w-4" />
                Payment window
              </span>
              <span className="font-mono text-base font-semibold text-amber-100">
                {timeLeft}
              </span>
            </div>
          )}

          <TrustBadges />
        </div>
      </div>

      <Instructions
        payCurrencyLabel={payCurrencyLabel}
        payCurrencySublabel={payCurrencySublabel}
      />

      <FooterStrip />
    </div>
  );
}

function StatusBanner({
  stage,
  paymentStatusLabel,
}: {
  stage: Stage;
  paymentStatusLabel: string | null;
}) {
  const styles = stageStyles(stage);
  const Icon = styles.icon;
  return (
    <div
      className={`mt-6 flex items-center gap-3 rounded-2xl border px-5 py-4 text-sm ${styles.wrapper}`}
    >
      <Icon className={`h-5 w-5 ${styles.iconClass}`} />
      <div className="flex-1">
        <div className="font-semibold text-white">{styles.title}</div>
        <div className="text-xs text-text-secondary">
          {styles.description}
          {paymentStatusLabel && stage !== "finished" ? (
            <span className="ml-1 rounded-full bg-white/5 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-text-secondary">
              {paymentStatusLabel}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function QrCard({ qrUrl, payAddress }: { qrUrl: string; payAddress: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-violet-500/30 bg-background-secondary/50 p-6 shadow-lg shadow-violet-500/5">
      <div className="relative h-72 w-72 overflow-hidden rounded-2xl border border-white/10 bg-[#0f0f12] p-2">
        <Image
          src={qrUrl}
          alt={`QR code for wallet ${payAddress}`}
          width={320}
          height={320}
          unoptimized
          className="h-full w-full object-contain"
        />
      </div>
      <div className="text-center">
        <div className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Scan with your wallet
        </div>
        <div className="mt-1 text-xs text-text-secondary">
          Or copy the address and amount below
        </div>
      </div>
    </div>
  );
}

function AmountCard({
  payAmount,
  payCurrencyLabel,
  payCurrencySublabel,
  payCurrency,
  amountUsd,
  copied,
  onCopy,
}: {
  payAmount: number;
  payCurrencyLabel: string;
  payCurrencySublabel: string | null;
  payCurrency: string;
  amountUsd: number;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-background-secondary/40 p-5">
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
        Send exactly
      </div>
      <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-mono text-3xl font-bold text-white">
          {formatPayAmount(payAmount)}
        </span>
        <span className="text-base font-semibold text-violet-200">
          {payCurrency.toUpperCase()}
        </span>
      </div>
      <div className="mt-1 text-xs text-text-secondary">
        ≈ ${amountUsd.toFixed(2)} USD
        {payCurrencySublabel ? <> • {payCurrencySublabel}</> : null}
      </div>
      <button
        type="button"
        onClick={onCopy}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-white/[0.08]"
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5 text-emerald-300" />
            Amount copied
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" />
            Copy amount
          </>
        )}
      </button>
      <p className="mt-3 text-[11px] text-text-muted">
        Send <strong className="text-amber-200">exactly</strong> this amount in{" "}
        {payCurrencyLabel}. Sending more is fine; sending less will leave the
        invoice unpaid.
      </p>
    </div>
  );
}

function AddressCard({
  payAddress,
  copied,
  onCopy,
}: {
  payAddress: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-background-secondary/40 p-5">
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
        Wallet address
      </div>
      <div className="mt-3 break-all rounded-xl border border-white/5 bg-black/40 p-3 font-mono text-sm text-white">
        {payAddress}
      </div>
      <button
        type="button"
        onClick={onCopy}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white transition hover:opacity-95"
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5" />
            Address copied
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" />
            Copy wallet address
          </>
        )}
      </button>
    </div>
  );
}

function Instructions({
  payCurrencyLabel,
  payCurrencySublabel,
}: {
  payCurrencyLabel: string;
  payCurrencySublabel: string | null;
}) {
  return (
    <section className="mt-10 rounded-2xl border border-white/10 bg-background-secondary/30 p-6">
      <h2 className="text-base font-semibold text-white">How this works</h2>
      <ol className="mt-4 space-y-3 text-sm text-text-secondary">
        <li className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-xs font-bold text-violet-200">
            1
          </span>
          Open your {payCurrencyLabel} wallet
          {payCurrencySublabel ? ` (${payCurrencySublabel})` : ""} and start a
          new transfer.
        </li>
        <li className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-xs font-bold text-violet-200">
            2
          </span>
          Scan the QR code or paste the wallet address. Double-check the first
          and last 4 characters match.
        </li>
        <li className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-xs font-bold text-violet-200">
            3
          </span>
          Enter the <strong className="text-white">exact</strong> amount shown
          above and send the transaction.
        </li>
        <li className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-xs font-bold text-violet-200">
            4
          </span>
          Wait on this page — we&apos;ll detect the transfer automatically and
          activate your subscription once it&apos;s confirmed on-chain.
        </li>
      </ol>
    </section>
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
        Auto-activated
      </span>
      <span className="inline-flex items-center gap-1.5">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
        On-chain verified
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
          <Link href="/billing" className="hover:text-white">
            Billing
          </Link>
          <Link href="/settings" className="hover:text-white">
            Settings
          </Link>
        </div>
      </div>
    </footer>
  );
}

function mapStage(localStatus: string, paymentStatus: string | null): Stage {
  if (localStatus === "finished") return "finished";
  if (localStatus === "failed" || localStatus === "refunded") return "failed";
  if (localStatus === "expired") return "expired";
  const ps = paymentStatus?.toLowerCase();
  if (
    ps === "confirming" ||
    ps === "sending" ||
    ps === "partially_paid" ||
    ps === "confirmed"
  ) {
    return "confirming";
  }
  return "waiting";
}

function stageStyles(stage: Stage): {
  wrapper: string;
  iconClass: string;
  icon: typeof Loader2;
  title: string;
  description: string;
} {
  switch (stage) {
    case "finished":
      return {
        wrapper: "border-emerald-500/30 bg-emerald-500/10",
        iconClass: "text-emerald-300",
        icon: CheckCircle2,
        title: "Payment confirmed",
        description: "Activating your subscription — redirecting now.",
      };
    case "confirming":
      return {
        wrapper: "border-cyan-500/30 bg-cyan-500/[0.07]",
        iconClass: "text-cyan-300 animate-spin",
        icon: Loader2,
        title: "Confirming on-chain",
        description:
          "Transaction detected. Waiting for the required network confirmations.",
      };
    case "expired":
      return {
        wrapper: "border-amber-500/30 bg-amber-500/10",
        iconClass: "text-amber-300",
        icon: Clock,
        title: "Invoice expired",
        description:
          "This invoice is no longer valid. Return to checkout to create a new one.",
      };
    case "failed":
      return {
        wrapper: "border-red-500/30 bg-red-500/10",
        iconClass: "text-red-300",
        icon: Clock,
        title: "Payment failed",
        description: "Please return to checkout and try again.",
      };
    case "waiting":
    default:
      return {
        wrapper: "border-violet-500/30 bg-violet-500/[0.07]",
        iconClass: "text-violet-300 animate-spin",
        icon: Loader2,
        title: "Waiting for your transfer",
        description:
          "Send the exact amount to the address below. We're watching the chain for you.",
      };
  }
}

function formatPayAmount(amount: number): string {
  if (!Number.isFinite(amount)) return String(amount);
  if (amount >= 1) return amount.toFixed(6).replace(/\.?0+$/, "");
  return amount.toFixed(8).replace(/\.?0+$/, "");
}

function formatCountdown(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}
