import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  accent?: "violet" | "cyan";
}

export function StatsCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = "violet",
}: StatsCardProps) {
  const ring =
    accent === "violet"
      ? "bg-violet-500/10 ring-violet-500/20 text-violet-300"
      : "bg-cyan-500/10 ring-cyan-500/20 text-cyan-300";
  return (
    <div className="glass-border rounded-2xl bg-background-secondary/40 p-5">
      <div className="flex items-center justify-between">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl ring-1 ${ring}`}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-4 text-3xl font-bold text-white">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wider text-text-muted">
        {label}
      </div>
      {hint && <div className="mt-1 text-xs text-text-secondary">{hint}</div>}
    </div>
  );
}
