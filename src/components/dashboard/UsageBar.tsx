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

  const barColor =
    pct >= 92 ? "bg-red-500" : pct >= 70 ? "bg-amber-400" : "bg-emerald-500";

  return (
    <div className="glass-border rounded-2xl bg-background-secondary/40 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-sm font-medium text-white">
            {totalAvailableCredits.toLocaleString()} AI credits available
          </div>
          <div className="mt-1 text-xs text-text-muted">
            {plan.toUpperCase()} plan • {dailyRemainingCredits.toLocaleString()} daily +{" "}
            {bonusCredits.toLocaleString()} bonus • resets in{" "}
            {formatResetCountdown(resetAt)}
          </div>
        </div>
        <div className="text-left sm:text-right">
          <div className="text-xs uppercase tracking-wider text-text-muted">
            Estimated cost
          </div>
          <div className="text-sm font-semibold text-white">
            ${estimatedCostUsd.toFixed(3)}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 text-xs sm:grid-cols-3">
        <div className="rounded-xl bg-white/[0.03] px-3 py-2">
          <div className="text-text-muted">Daily remaining</div>
          <div className="mt-1 font-semibold text-white">
            {dailyRemainingCredits.toLocaleString()}
          </div>
        </div>
        <div className="rounded-xl bg-white/[0.03] px-3 py-2">
          <div className="text-text-muted">Bonus credits</div>
          <div className="mt-1 font-semibold text-white">
            {bonusCredits.toLocaleString()}
          </div>
        </div>
        <div className="rounded-xl bg-white/[0.03] px-3 py-2">
          <div className="text-text-muted">Used today</div>
          <div className="mt-1 font-semibold text-white">
            {hasLimit
              ? `${usedCredits.toLocaleString()} / ${limitCredits.toLocaleString()}`
              : `${usedCredits.toLocaleString()} used`}
          </div>
        </div>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.04]">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
