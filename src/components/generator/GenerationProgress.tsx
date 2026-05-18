"use client";

import { useEffect, useRef } from "react";
import { Check, Loader2 } from "lucide-react";
import { useGenerationStore } from "@/stores/useGenerationStore";

const STAGES = [
  { key: "planning", label: "Planning app architecture" },
  { key: "screens", label: "Generating screens" },
  { key: "navigation", label: "Creating navigation" },
  { key: "components", label: "Building components" },
  { key: "preview", label: "Preparing preview" },
  { key: "finalizing", label: "Finalizing project" },
];

function getStageIndex(stage: string | null | undefined) {
  if (!stage) return 0;
  const index = STAGES.findIndex((item) => item.key === stage);
  if (index !== -1) return index;
  if (stage === "complete") return STAGES.length;
  return 0;
}

export function GenerationProgress() {
  const { streamingText, progress, isGenerating, reset } = useGenerationStore();
  const terminalRef = useRef<HTMLDivElement>(null);

  const activeStage = getStageIndex(progress?.stage);
  const lines = streamingText.split("\n").filter(Boolean);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [streamingText]);

  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      <div className="order-2 flex w-full max-w-md flex-col gap-6 lg:order-1">
        <ol className="space-y-3">
          {STAGES.map((stage, idx) => {
            const done = idx < activeStage || progress?.stage === "complete";
            const active = idx === activeStage && progress?.stage !== "complete";

            return (
              <li key={stage.key} className="flex items-center gap-3 text-sm">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full ${
                    done
                      ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30"
                      : active
                        ? "bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/30"
                        : "bg-white/[0.04] text-text-muted ring-1 ring-white/5"
                  }`}
                >
                  {done ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : active ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <span className="text-[10px]">{idx + 1}</span>
                  )}
                </span>
                <span
                  className={
                    active
                      ? "text-white"
                      : done
                        ? "text-text-secondary"
                        : "text-text-muted"
                  }
                >
                  {stage.label}
                </span>
              </li>
            );
          })}
        </ol>

        <div
          ref={terminalRef}
          className="relative h-64 overflow-y-auto rounded-xl border border-emerald-500/15 bg-black/60 p-4 font-mono text-xs leading-relaxed text-emerald-300/90"
        >
          {lines.length > 0 ? (
            <>
              <pre className="whitespace-pre-wrap break-words">
                {lines.join("\n")}
              </pre>
              <span className="inline-block h-3 w-1.5 translate-y-0.5 animate-pulse bg-emerald-300" />
            </>
          ) : (
            <span className="text-emerald-300/60">
              waiting for staged generation...
              <span className="ml-0.5 inline-block h-3 w-1.5 translate-y-0.5 animate-pulse bg-emerald-300" />
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => reset()}
          className="glass-border self-start rounded-xl bg-white/[0.02] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/[0.06]"
        >
          Cancel
        </button>
      </div>

      <div className="order-1 flex flex-1 items-center justify-center lg:order-2">
        <LivePhone
          currentMessage={progress?.message ?? "Preparing project"}
          currentPercent={progress?.percent ?? 0}
          stage={progress?.stage ?? "planning"}
          generating={isGenerating}
        />
      </div>
    </div>
  );
}

function LivePhone({
  currentMessage,
  currentPercent,
  stage,
  generating,
}: {
  currentMessage: string;
  currentPercent: number;
  stage: string;
  generating: boolean;
}) {
  const stepCards = [
    { title: "Spec", value: "4-6 screens" },
    { title: "UI", value: "Rich sections" },
    { title: "Code", value: "Chunked files" },
  ];

  return (
    <div
      className="relative h-[500px] w-[250px] rounded-[40px] border border-white/15 bg-[#0a0a0a] p-2.5"
      style={{
        boxShadow: generating
          ? "0 0 42px -10px rgba(16, 185, 129, 0.4), 0 25px 50px -12px rgba(0, 0, 0, 0.6)"
          : "0 25px 50px -12px rgba(0, 0, 0, 0.6)",
      }}
    >
      <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[32px] bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.2),_rgba(7,10,18,0.98)_55%)]">
        <div className="absolute left-1/2 top-2 z-10 h-1.5 w-20 -translate-x-1/2 rounded-full bg-black ring-1 ring-white/10" />

        <div className="border-b border-white/[0.06] px-4 pb-3 pt-8">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-300/75">
            Qorvex Pipeline
          </div>
          <div className="mt-2 text-lg font-semibold text-white">
            {currentMessage}
          </div>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-300">
            <span className="rounded-full bg-white/10 px-2 py-1 capitalize">
              {stage}
            </span>
            <span>{currentPercent}%</span>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-4 px-4 py-5">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
            <div className="text-xs uppercase tracking-[0.22em] text-slate-400">
              Current focus
            </div>
            <div className="mt-2 text-xl font-semibold text-white">
              {currentMessage}
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-violet-400 transition-all"
                style={{ width: `${Math.max(6, currentPercent)}%` }}
              />
            </div>
          </div>

          <div className="grid gap-3">
            {stepCards.map((card) => (
              <div
                key={card.title}
                className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3"
              >
                <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
                  {card.title}
                </div>
                <div className="mt-1 text-sm font-medium text-white">
                  {card.value}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-auto rounded-2xl border border-emerald-400/15 bg-emerald-400/10 p-4 text-sm text-emerald-100">
            Larger apps are generated in stages so planning, screen design, and file assembly can recover independently.
          </div>
        </div>
      </div>
    </div>
  );
}
