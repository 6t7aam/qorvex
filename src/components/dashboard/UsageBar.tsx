import { Zap } from "lucide-react";
import { formatResetCountdown } from "@/lib/ai-credits";

interface UsageBarProps {
  usedCredits: number;
  limitCredits: number;
  dailyRemainingCredits: number;
  bonusCredits: number;
  totalAvailableCredits: number;
  estimatedCostUsd: number;
  resetAt: string;
  plan?: "free" | "pro" | "max";
}

export function UsageBar({
  usedCredits,
  limitCredits,
  dailyRemainingCredits,
  bonusCredits,
  totalAvailableCredits,
  estimatedCostUsd,
  resetAt,
  plan = "free",
}: UsageBarProps) {
  const hasLimit = limitCredits > 0;
  const pct = Math.min(
    100,
    Math.round((usedCredits / Math.max(limitCredits, 1)) * 100),
  );

  const barGradient =
    pct >= 92
      ? "from-rose-500 via-red-400 to-orange-400"
      : pct >= 70
      ? "from-amber-400 via-orange-400 to-rose-400"
      : "from-violet-500 via-fuchsia-400 to-cyan-400";

  return (
    <div className="card-surface relative overflow-hidden rounded-2xl p-5">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-violet-500/15 blur-3xl"
      />
      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-white">
            <span className="relative flex h-6 w-6 items-center justify-center rounded-lg bg-violet-500/15 ring-1 ring-violet-500/30">
              <Zap className="h-3 w-3 text-violet-300" />
            </span>
            {totalAvailableCredits.toLocaleString()} AI credits available
          </div>
          <div className="mt-1 text-xs text-text-muted">
            <span className="rounded-md bg-white/[0.05] px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-text-secondary">
              {plan}
            </span>{" "}
            • {dailyRemainingCredits.toLocaleString()} daily +{" "}
            {bonusCredits.toLocaleString()} bonus • resets in{" "}
            {formatResetCountdown(resetAt)}
          </div>
        </div>
        <div className="text-left sm:text-right">
          <div className="text-xs uppercase tracking-wider text-text-muted">
            Estimated cost
          </div>
          <div className="text-sm font-semibold text-white tabular-nums">
            ${estimatedCostUsd.toFixed(3)}
          </div>
        </div>
      </div>

      <div className="relative mt-4 grid gap-3 text-xs sm:grid-cols-3">
        <div className="group rounded-xl bg-white/[0.03] px-3 py-2 transition-colors hover:bg-white/[0.06]">
          <div className="text-text-muted">Daily remaining</div>
          <div className="mt-1 font-semibold tabular-nums text-white">
            {dailyRemainingCredits.toLocaleString()}
          </div>
        </div>
        <div className="group rounded-xl bg-white/[0.03] px-3 py-2 transition-colors hover:bg-white/[0.06]">
          <div className="text-text-muted">Bonus credits</div>
          <div className="mt-1 font-semibold tabular-nums text-white">
            {bonusCredits.toLocaleString()}
          </div>
        </div>
        <div className="group rounded-xl bg-white/[0.03] px-3 py-2 transition-colors hover:bg-white/[0.06]">
          <div className="text-text-muted">Used today</div>
          <div className="mt-1 font-semibold tabular-nums text-white">
            {hasLimit
              ? `${usedCredits.toLocaleString()} / ${limitCredits.toLocaleString()}`
              : `${usedCredits.toLocaleString()} used`}
          </div>
        </div>
      </div>

      <div className="relative mt-4 h-2.5 overflow-hidden rounded-full bg-white/[0.05]">
        <div
          className={`relative h-full rounded-full bg-gradient-to-r ${barGradient} bg-[length:200%_100%] animate-gradient-shift shadow-[0_0_18px_rgba(168,85,247,0.45)] transition-all duration-700`}
          style={{ width: `${pct}%` }}
        >
          <span className="absolute inset-y-0 right-0 w-12 -skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer-x" />
        </div>
      </div>
      <div className="relative mt-1.5 text-right text-[10px] tabular-nums text-text-muted">
        {pct}% used
      </div>
    </div>
  );
}
