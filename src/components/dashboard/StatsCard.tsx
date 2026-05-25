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
      ? "bg-violet-500/10 ring-violet-500/20 text-violet-300 group-hover:bg-violet-500/15"
      : "bg-cyan-500/10 ring-cyan-500/20 text-cyan-300 group-hover:bg-cyan-500/15";

  const glow =
    accent === "violet" ? "bg-violet-500/20" : "bg-cyan-500/20";

  return (
    <div className="card-surface card-hover sheen group relative overflow-hidden rounded-2xl p-5">
      <div
        aria-hidden
        className={`pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-60 ${glow}`}
      />
      <div className="flex items-center justify-between">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6 ${ring}`}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div
          aria-hidden
          className="h-1.5 w-1.5 rounded-full bg-gradient-to-br from-violet-400 to-cyan-400 opacity-60 transition-all duration-500 group-hover:opacity-100 group-hover:shadow-[0_0_14px_rgba(168,85,247,0.7)]"
        />
      </div>
      <div className="mt-4 text-3xl font-bold tabular-nums text-white">
        {value}
      </div>
      <div className="mt-1 text-xs uppercase tracking-wider text-text-muted">
        {label}
      </div>
      {hint && <div className="mt-1 text-xs text-text-secondary">{hint}</div>}
    </div>
  );
}
