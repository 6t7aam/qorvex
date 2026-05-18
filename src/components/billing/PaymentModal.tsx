"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Check,
  Copy,
  FileText,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { PLANS } from "@/lib/constants";

interface PaymentModalProps {
  plan: "pro" | "max";
  userId: string;
  onClose: () => void;
  onSubmitted?: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

function generateOrderId() {
  const n = Math.floor(100000 + Math.random() * 900000);
  return `ORDER-${n}`;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function readJsonSafely(response: Response) {
  try {
    return (await response.json()) as { success?: boolean; error?: string };
  } catch {
    return null;
  }
}

function getFriendlySubmitError(error: unknown) {
  if (error instanceof DOMException && error.name === "AbortError") {
    return "Submitting payment timed out. Please try again.";
  }

  if (
    error instanceof Error &&
    error.message.toLowerCase().includes("network")
  ) {
    return "Submitting payment failed because the network request did not complete. Please try again.";
  }

  return "We couldn't submit your payment. Please try again.";
}

export function PaymentModal({
  plan,
  userId,
  onClose,
  onSubmitted,
}: PaymentModalProps) {
  const router = useRouter();
  const config = plan === "max" ? PLANS.MAX : PLANS.PRO;
  const amount = config.price;

  const [orderId] = useState<string>(() => generateOrderId());
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const cardNumber =
    process.env.NEXT_PUBLIC_PAYMENT_CARD_NUMBER ?? "Set NEXT_PUBLIC_PAYMENT_CARD_NUMBER";
  const cardName =
    process.env.NEXT_PUBLIC_PAYMENT_CARD_NAME ?? "Set NEXT_PUBLIC_PAYMENT_CARD_NAME";
  const bankName =
    process.env.NEXT_PUBLIC_PAYMENT_BANK_NAME ?? "Set NEXT_PUBLIC_PAYMENT_BANK_NAME";

  const isImage = useMemo(
    () => !!file && file.type.startsWith("image/"),
    [file],
  );

  const preview = useMemo<string | null>(() => {
    if (!file || !isImage) return null;
    return URL.createObjectURL(file);
  }, [file, isImage]);

  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !isSubmitting) onClose();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [isSubmitting, onClose]);

  function copy(value: string, field: string) {
    if (!value) return;
    navigator.clipboard
      .writeText(value)
      .then(() => {
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 1000);
      })
      .catch(() => toast.error("Could not copy to clipboard"));
  }

  function handleFile(picked: File | null | undefined) {
    if (!picked) return;
    if (!ACCEPTED_TYPES.includes(picked.type)) {
      toast.error("Unsupported file type. Use JPG, PNG, WebP or PDF.");
      return;
    }
    if (picked.size > MAX_FILE_SIZE) {
      toast.error("File is larger than 10 MB.");
      return;
    }
    setFile(picked);
  }

  async function handleSubmit() {
    if (isSubmitting) return;
    if (!file) {
      toast.error("Please upload your payment screenshot first.");
      return;
    }
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("plan", plan);
      formData.append("orderId", orderId);
      formData.append("userId", userId);
      formData.append("screenshot", file);

      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 65_000);

      console.log("[payment-modal] submitting manual payment", {
        plan,
        orderId,
        userId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      });

      const response = await fetch("/api/manual-payments", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      }).finally(() => window.clearTimeout(timeoutId));

      const payload = await readJsonSafely(response);
      console.log("[payment-modal] submit response", {
        status: response.status,
        ok: response.ok,
        payload,
      });

      if (!response.ok || !payload?.success) {
        const message =
          payload?.error ??
          "We couldn't submit your payment. Please try again.";
        toast.error(message);
        return;
      }

      router.refresh();
      toast.success("Payment submitted for review.");
      onSubmitted?.();
      onClose();
    } catch (err) {
      console.error("[payment-modal] submit threw:", err);
      toast.error(getFriendlySubmitError(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        key="payment-modal"
        className="fixed inset-0 z-[200] flex items-center justify-center px-4 py-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <button
          type="button"
          aria-label="Close payment modal"
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={() => {
            if (!isSubmitting) onClose();
          }}
        />

        <motion.div
          role="dialog"
          aria-modal="true"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.18 }}
          className="glass-border relative z-[201] max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-background-secondary p-6 shadow-2xl shadow-black/60"
        >
          <button
            type="button"
            onClick={() => {
              if (!isSubmitting) onClose();
            }}
            disabled={isSubmitting}
            className="absolute right-4 top-4 rounded-md p-1 text-text-muted transition hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          <div>
            <h2 className="text-lg font-semibold text-white">
              Complete your payment
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              Transfer the amount below and upload your payment screenshot.
            </p>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-text-muted">
                  Plan
                </div>
                <div className="mt-0.5 text-base font-semibold text-white">
                  {config.name}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs uppercase tracking-wider text-text-muted">
                  Amount
                </div>
                <div className="mt-0.5 text-base font-semibold text-emerald-300">
                  ${amount.toFixed(2)}
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3 text-sm">
              <span className="text-text-muted">Order ID</span>
              <span className="font-mono text-amber-300">{orderId}</span>
            </div>
            <p className="mt-1 text-[11px] text-text-muted">
              Include the order ID in your payment comment.
            </p>
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              Send payment to
            </div>
            <div className="mt-3 space-y-2">
              <PaymentRow
                label="Card number"
                value={cardNumber}
                copied={copiedField === "card"}
                onCopy={() => copy(cardNumber, "card")}
              />
              <PaymentRow
                label="Recipient name"
                value={cardName}
                copied={copiedField === "name"}
                onCopy={() => copy(cardName, "name")}
              />
              <PaymentRow
                label="Bank"
                value={bankName}
                copied={copiedField === "bank"}
                onCopy={() => copy(bankName, "bank")}
              />
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-200">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              Include in your payment comment:{" "}
              <span className="font-mono font-semibold text-amber-100">
                {orderId}
              </span>
            </span>
          </div>

          <div className="mt-5">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              Upload payment screenshot
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES.join(",")}
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />

            {!file ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  handleFile(e.dataTransfer.files?.[0] ?? null);
                }}
                className={`mt-3 flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed px-4 py-8 text-sm transition ${
                  dragOver
                    ? "border-violet-400/70 bg-violet-500/[0.06] text-white"
                    : "border-white/15 bg-white/[0.02] text-text-secondary hover:border-violet-400/50 hover:text-white"
                }`}
              >
                <Upload className="h-5 w-5" />
                <span className="font-medium">Click to upload or drag and drop</span>
                <span className="text-[11px] text-text-muted">
                  JPG, PNG, WebP, or PDF up to 10 MB
                </span>
              </button>
            ) : (
              <div className="mt-3 flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.05] p-3">
                {preview ? (
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/30">
                    {/* preview thumbnail uses a blob URL, so unoptimized */}
                    <Image
                      src={preview}
                      alt="Screenshot preview"
                      fill
                      sizes="64px"
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/30 text-text-muted">
                    <FileText className="h-6 w-6" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-300" />
                    <span className="truncate text-sm font-medium text-white">
                      {file.name}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-text-muted">
                    {formatBytes(file.size)} • {file.type || "file"}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    disabled={isSubmitting}
                    className="mt-2 text-xs font-medium text-violet-300 transition hover:text-violet-200 disabled:opacity-50"
                  >
                    Choose a different file
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!file || isSubmitting}
            className="gradient-bg mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting…
              </>
            ) : (
              <>Submit Payment →</>
            )}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function PaymentRow({
  label,
  value,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-black/30 px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-wider text-text-muted">
          {label}
        </div>
        <div className="mt-0.5 truncate font-mono text-sm text-white">
          {value}
        </div>
      </div>
      <button
        type="button"
        onClick={onCopy}
        className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1.5 text-[11px] font-medium text-white transition hover:bg-white/[0.08]"
        aria-label={`Copy ${label}`}
      >
        {copied ? (
          <>
            <Check className="h-3 w-3 text-emerald-300" />
            Copied
          </>
        ) : (
          <>
            <Copy className="h-3 w-3" />
            Copy
          </>
        )}
      </button>
    </div>
  );
}
