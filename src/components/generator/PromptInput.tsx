"use client";

import { useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";

const EXAMPLES = [
  "A fitness tracker with workout logging and progress charts",
  "A restaurant booking app with table reservations",
  "A meditation app with guided sessions and breathing exercises",
  "A habit tracker with streaks and daily check-ins",
];

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
}

export function PromptInput({
  value,
  onChange,
  placeholder = "Describe your app idea… e.g. 'A fitness tracker app where users can log workouts, track calories, and see progress charts'",
  maxLength = 500,
  disabled,
}: PromptInputProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, 120)}px`;
  }, [value]);

  return (
    <div className="space-y-3">
      <div className="group relative rounded-2xl p-[1px] transition focus-within:[background:linear-gradient(120deg,#7c3aed,#06b6d4,#7c3aed)] focus-within:[background-size:200%_200%] focus-within:animate-gradient-shift">
        <div className="rounded-2xl bg-background-secondary/60">
          <textarea
            ref={ref}
            value={value}
            disabled={disabled}
            onChange={(event) => {
              const next = event.target.value.slice(0, maxLength);
              onChange(next);
            }}
            placeholder={placeholder}
            rows={4}
            className="block w-full resize-none rounded-2xl bg-transparent px-5 py-4 text-base text-white placeholder:text-text-muted focus:outline-none disabled:opacity-60"
            style={{ minHeight: 120 }}
          />
          <div className="flex items-center justify-between border-t border-white/5 px-5 py-2 text-xs text-text-muted">
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-violet-400" />
              Be specific. Mention key screens and features.
            </span>
            <span>
              {value.length}/{maxLength}
            </span>
          </div>
        </div>
      </div>

      {!value && (
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => onChange(ex)}
              className="glass-border rounded-full bg-white/[0.02] px-3 py-1.5 text-xs text-text-secondary transition hover:bg-white/[0.06] hover:text-white"
            >
              {ex}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
