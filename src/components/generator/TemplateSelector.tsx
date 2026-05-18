"use client";

import {
  Brain,
  CheckSquare,
  Dumbbell,
  MessageSquare,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Users,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { APP_TEMPLATES } from "@/lib/constants";

const ICON_MAP: Record<string, LucideIcon> = {
  Dumbbell,
  CheckSquare,
  MessageSquare,
  Users,
  UtensilsCrossed,
  TrendingUp,
  Brain,
  ShoppingBag,
};

interface TemplateSelectorProps {
  selectedId: string | null;
  onChange: (id: string | null) => void;
}

export function TemplateSelector({
  selectedId,
  onChange,
}: TemplateSelectorProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      <button
        type="button"
        onClick={() => onChange(null)}
        className={`shrink-0 rounded-xl border px-3 py-2 text-sm transition ${
          selectedId === null
            ? "border-violet-500/40 bg-violet-500/10 text-white"
            : "border-white/10 bg-white/[0.02] text-text-secondary hover:bg-white/[0.06] hover:text-white"
        }`}
      >
        <span className="inline-flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5" />
          None
        </span>
      </button>

      {APP_TEMPLATES.map((tpl) => {
        const Icon = ICON_MAP[tpl.icon] ?? Sparkles;
        const active = selectedId === tpl.id;
        return (
          <button
            key={tpl.id}
            type="button"
            onClick={() => onChange(tpl.id)}
            className={`shrink-0 rounded-xl border px-3 py-2 text-sm transition ${
              active
                ? "border-violet-500/40 bg-violet-500/10 text-white"
                : "border-white/10 bg-white/[0.02] text-text-secondary hover:bg-white/[0.06] hover:text-white"
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <Icon className="h-3.5 w-3.5" />
              {tpl.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
