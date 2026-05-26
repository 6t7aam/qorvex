"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Eye, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { withTimeout } from "@/lib/with-timeout";
import type { ManualPayment } from "@/types";

interface AdminPaymentRow extends ManualPayment {
  user_email: string | null;
  user_full_name: string | null;
}

export interface AdminCryptoPaymentRow {
  id: string;
  order_id: string;
  user_id: string;
  provider: string;
  subscription_plan: "pro" | "max";
  amount_usd: number;
  pay_currency: string | null;
  pay_amount: number | null;
  status: string;
  payment_status: string | null;
  payment_id: string | null;
  created_at: string;
  user_email: string | null;
  user_full_name: string | null;
}

interface AdminPaymentsClientProps {
  pending: AdminPaymentRow[];
  all: AdminPaymentRow[];
  crypto: AdminCryptoPaymentRow[];
}

const PAGE_SIZE = 20;

export function AdminPaymentsClient({
  pending,
  all,
  crypto,
}: AdminPaymentsClientProps) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [page, setPage] = useState(0);

  const pageCount = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const visible = useMemo(
    () => all.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE),
    [all, safePage],
  );

  async function viewScreenshot(path: string | null) {
    if (!path) {
      toast.error("No screenshot attached to this payment.");
      return;
    }
    try {
      const res = await withTimeout(
        fetch(`/api/admin/screenshot?path=${encodeURIComponent(path)}`, {
          cache: "no-store",
        }),
        10000,
        "Generating signed URL timed out.",
      );
      const body = (await res.json().catch(() => null)) as {
        success?: boolean;
        signedUrl?: string;
        error?: string;
      } | null;
      if (!res.ok || !body?.success || !body.signedUrl) {
        toast.error(body?.error ?? "Could not open screenshot");
        return;
      }
      window.open(body.signedUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Request failed");
    }
  }

  async function confirmPayment(paymentId: string) {
    if (busyId) return;
    setBusyId(paymentId);
    try {
      const res = await withTimeout(
        fetch("/api/admin/confirm-payment", {
          method: "POST",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentId }),
        }),
        15000,
        "Confirming payment timed out.",
      );
      const body = (await res.json().catch(() => null)) as {
        success?: boolean;
        error?: string;
      } | null;
      if (!res.ok || !body?.success) {
        toast.error(body?.error ?? `Confirm failed (${res.status})`);
        return;
      }
      toast.success("Payment confirmed. User has been upgraded.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Request failed");
    } finally {
      setBusyId(null);
    }
  }

  async function rejectPayment(paymentId: string) {
    if (busyId) return;
    setBusyId(paymentId);
    try {
      const res = await withTimeout(
        fetch("/api/admin/reject-payment", {
          method: "POST",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentId,
            adminNote: rejectNote.trim() || undefined,
          }),
        }),
        15000,
        "Rejecting payment timed out.",
      );
      const body = (await res.json().catch(() => null)) as {
        success?: boolean;
        error?: string;
      } | null;
      if (!res.ok || !body?.success) {
        toast.error(body?.error ?? `Reject failed (${res.status})`);
        return;
      }
      toast.success("Payment rejected.");
      setRejectingId(null);
      setRejectNote("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Request failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <section className="mt-10">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-white">Pending verification</h2>
          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-200 ring-1 ring-amber-500/30">
            {pending.length}
          </span>
        </div>

        {pending.length === 0 ? (
          <div className="glass-border mt-4 rounded-2xl bg-background-secondary/30 px-5 py-8 text-center text-sm text-text-secondary">
            Nothing pending right now.
          </div>
        ) : (
          <div className="mt-4 grid gap-3">
            {pending.map((p) => (
              <div
                key={p.id}
                className="glass-border rounded-2xl bg-background-secondary/40 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm text-amber-300">
                        {p.order_id}
                      </span>
                      <PlanBadge plan={p.plan} />
                    </div>
                    <div className="mt-1 text-sm text-white">
                      {p.user_full_name || p.user_email || p.user_id}
                    </div>
                    <div className="text-xs text-text-muted">
                      {p.user_email ?? ""} • {formatDate(p.created_at)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-emerald-300">
                      ${Number(p.amount).toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => viewScreenshot(p.screenshot_url)}
                    className="glass-border inline-flex items-center gap-1.5 rounded-xl bg-white/[0.02] px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/[0.06]"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View screenshot
                  </button>
                  <button
                    type="button"
                    onClick={() => confirmPayment(p.id)}
                    disabled={busyId === p.id}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busyId === p.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5" />
                    )}
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRejectingId(p.id);
                      setRejectNote("");
                    }}
                    disabled={busyId === p.id}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-red-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <X className="h-3.5 w-3.5" />
                    Reject
                  </button>
                </div>

                {rejectingId === p.id && (
                  <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/[0.05] p-3">
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-red-200">
                      Reason (optional, sent to user)
                    </label>
                    <textarea
                      value={rejectNote}
                      onChange={(e) => setRejectNote(e.target.value)}
                      rows={2}
                      maxLength={500}
                      className="mt-1.5 block w-full resize-none rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-text-muted focus:border-red-500/50 focus:outline-none"
                      placeholder="Wrong amount, no order ID in comment, etc."
                    />
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => rejectPayment(p.id)}
                        disabled={busyId === p.id}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-400 disabled:opacity-60"
                      >
                        {busyId === p.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : null}
                        Confirm reject
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRejectingId(null);
                          setRejectNote("");
                        }}
                        className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/[0.06]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-white">All payments</h2>
        {all.length === 0 ? (
          <div className="glass-border mt-4 rounded-2xl bg-background-secondary/30 px-5 py-8 text-center text-sm text-text-secondary">
            No payments yet.
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-background-secondary/30">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-white/[0.03] text-left text-xs uppercase tracking-wider text-text-muted">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Order</th>
                    <th className="px-4 py-2.5 font-medium">User</th>
                    <th className="px-4 py-2.5 font-medium">Plan</th>
                    <th className="px-4 py-2.5 font-medium">Amount</th>
                    <th className="px-4 py-2.5 font-medium">Status</th>
                    <th className="px-4 py-2.5 font-medium">Date</th>
                    <th className="px-4 py-2.5 font-medium">Screenshot</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((p) => (
                    <tr
                      key={p.id}
                      className="border-t border-white/5 text-text-secondary"
                    >
                      <td className="px-4 py-3 font-mono text-amber-300">
                        {p.order_id}
                      </td>
                      <td className="px-4 py-3 text-white">
                        {p.user_email ?? p.user_id}
                      </td>
                      <td className="px-4 py-3">
                        <PlanBadge plan={p.plan} />
                      </td>
                      <td className="px-4 py-3 text-emerald-300">
                        ${Number(p.amount).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="px-4 py-3">{formatDate(p.created_at)}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => viewScreenshot(p.screenshot_url)}
                          disabled={!p.screenshot_url}
                          className="text-xs font-semibold text-violet-300 transition hover:text-violet-200 disabled:opacity-40"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {pageCount > 1 && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className="glass-border rounded-lg bg-white/[0.02] px-3 py-1.5 text-white transition hover:bg-white/[0.06] disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-text-secondary">
              Page {safePage + 1} of {pageCount}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={safePage >= pageCount - 1}
              className="glass-border rounded-lg bg-white/[0.02] px-3 py-1.5 text-white transition hover:bg-white/[0.06] disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </section>

      <CryptoPaymentsSection rows={crypto} />
    </>
  );
}

function CryptoPaymentsSection({ rows }: { rows: AdminCryptoPaymentRow[] }) {
  return (
    <section className="mt-10">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold text-white">Crypto payments</h2>
        <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-semibold text-violet-200 ring-1 ring-violet-500/30">
          {rows.length}
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="glass-border mt-4 rounded-2xl bg-background-secondary/30 px-5 py-8 text-center text-sm text-text-secondary">
          No crypto payments yet.
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-background-secondary/30">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.03] text-left text-xs uppercase tracking-wider text-text-muted">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Order ID</th>
                  <th className="px-4 py-2.5 font-medium">User</th>
                  <th className="px-4 py-2.5 font-medium">Plan</th>
                  <th className="px-4 py-2.5 font-medium">Amount</th>
                  <th className="px-4 py-2.5 font-medium">Currency</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr
                    key={p.id}
                    className="border-t border-white/5 text-text-secondary"
                  >
                    <td
                      className="px-4 py-3 font-mono text-xs text-amber-300"
                      title={p.order_id}
                    >
                      <div className="max-w-[220px] truncate">{p.order_id}</div>
                      {p.payment_id && (
                        <div className="mt-0.5 text-[10px] text-text-muted">
                          pid: {p.payment_id}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-white">
                      {p.user_email ?? p.user_id}
                    </td>
                    <td className="px-4 py-3">
                      <PlanBadge plan={p.subscription_plan} />
                    </td>
                    <td className="px-4 py-3 text-emerald-300">
                      ${Number(p.amount_usd).toFixed(2)}
                      {p.pay_amount ? (
                        <div className="text-[10px] text-text-muted">
                          {Number(p.pay_amount).toFixed(8).replace(/\.?0+$/, "")}{" "}
                          {(p.pay_currency ?? "").toUpperCase()}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 uppercase">
                      {p.pay_currency ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <CryptoStatusBadge
                        status={p.status}
                        paymentStatus={p.payment_status}
                      />
                    </td>
                    <td className="px-4 py-3">{formatDate(p.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

function CryptoStatusBadge({
  status,
  paymentStatus,
}: {
  status: string;
  paymentStatus: string | null;
}) {
  let tone: "emerald" | "amber" | "cyan" | "red" | "neutral" = "neutral";
  if (status === "finished") tone = "emerald";
  else if (
    status === "confirming" ||
    status === "sending" ||
    status === "partially_paid" ||
    paymentStatus === "confirming"
  )
    tone = "cyan";
  else if (status === "failed" || status === "expired" || status === "refunded")
    tone = "red";
  else if (status === "pending" || status === "waiting") tone = "amber";

  const toneMap: Record<typeof tone, string> = {
    emerald: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30",
    amber: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30",
    cyan: "bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/30",
    red: "bg-red-500/15 text-red-300 ring-1 ring-red-500/30",
    neutral: "bg-white/10 text-text-secondary ring-1 ring-white/10",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${toneMap[tone]}`}
    >
      {status}
    </span>
  );
}

function PlanBadge({ plan }: { plan: "pro" | "max" }) {
  const className =
    plan === "max"
      ? "bg-gradient-to-r from-cyan-500/20 to-amber-400/20 text-cyan-100 ring-1 ring-cyan-400/30"
      : "bg-violet-500/15 text-violet-200 ring-1 ring-violet-500/30";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${className}`}
    >
      {plan}
    </span>
  );
}

function StatusBadge({ status }: { status: ManualPayment["status"] }) {
  const map: Record<ManualPayment["status"], string> = {
    pending: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30",
    confirmed: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30",
    rejected: "bg-red-500/15 text-red-300 ring-1 ring-red-500/30",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${map[status]}`}
    >
      {status}
    </span>
  );
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
