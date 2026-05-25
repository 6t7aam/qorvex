"use client";

import { Suspense, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronUp,
  CircleAlert,
  Sparkles,
  Wand2,
} from "lucide-react";
import { useGenerationStore } from "@/stores/useGenerationStore";
import { useAppStore } from "@/stores/useAppStore";
import { useUIStore } from "@/stores/useUIStore";
import { INITIAL_APP_GENERATION_COST } from "@/lib/ai-credits";
import { useDailyUsage } from "@/hooks/useDailyUsage";
import type { GeneratedFile, UserProfile } from "@/types";
import { GenerationProgress } from "@/components/generator/GenerationProgress";
import { MobilePreview } from "@/components/generator/MobilePreview";
import { AIChat } from "@/components/generator/AIChat";
import { UpgradeModal } from "@/components/billing/UpgradeModal";

const COLORS: { name: string; value: string }[] = [
  { name: "Violet", value: "#7c3aed" },
  { name: "Cyan", value: "#06b6d4" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Green", value: "#10b981" },
  { name: "Orange", value: "#f97316" },
  { name: "Pink", value: "#ec4899" },
  { name: "Red", value: "#ef4444" },
  { name: "Yellow", value: "#eab308" },
];

const FEATURE_OPTIONS = [
  "User Authentication",
  "Push Notifications",
  "Dark Mode",
  "Offline Support",
  "Search Functionality",
  "User Profiles",
  "Social Sharing",
  "Analytics Dashboard",
];

const PLATFORMS: { value: "ios" | "android" | "both"; label: string }[] = [
  { value: "ios", label: "iOS" },
  { value: "android", label: "Android" },
  { value: "both", label: "Both" },
];

const TIPS = [
  "Mention the core flow (e.g. 'log a workout', 'reserve a table')",
  "Name two or three key screens you want",
  "Call out auth, push, or offline support if you need them",
  "Describe the look and feel — vibrant, minimal, dark, etc.",
];

const EXAMPLE_PROMPTS = [
  "A meditation app with breathing exercises and a streak system",
  "A peer-to-peer marketplace with seller chats",
  "A finance dashboard for tracking expenses by category",
];

const APP_TEMPLATES = [
  { id: "fitness", name: "Fitness", icon: "💪" },
  { id: "todo", name: "To-Do", icon: "✅" },
  { id: "social", name: "Social", icon: "💬" },
  { id: "food", name: "Food", icon: "🍽" },
  { id: "finance", name: "Finance", icon: "📈" },
  { id: "ecommerce", name: "Shop", icon: "🛒" },
];

function getCharFeedback(len: number): {
  label: string;
  color: string;
  textColor: string;
} {
  if (len < 120)
    return {
      label: "Add more detail",
      color: "bg-white/5",
      textColor: "text-text-muted",
    };
  if (len < 800)
    return {
      label: "Good detail",
      color: "bg-emerald-500/20",
      textColor: "text-emerald-400",
    };
  return {
    label: "Great prompt",
    color: "bg-violet-500/20",
    textColor: "text-violet-400",
  };
}

export default function GeneratePage() {
  return (
    <Suspense fallback={null}>
      <GeneratePageInner />
    </Suspense>
  );
}

function GeneratePageInner() {
  const searchParams = useSearchParams();
  const initialTemplate = searchParams.get("template");

  const user = useAppStore((s) => s.user) as UserProfile | null;
  const setUpgradeModal = useUIStore((s) => s.setUpgradeModal);
  const { usage, isLoading: usageLoading, resetCountdown } = useDailyUsage();

  const {
    currentPrompt,
    isGenerating,
    generatedFiles,
    upgradeRequired,
    error,
    startGenerationFlow,
    setPrompt,
    reset,
  } = useGenerationStore();

  const [templateId, setTemplateId] = useState<string | null>(
    initialTemplate ?? null,
  );
  const [primary, setPrimary] = useState<string>(COLORS[0].value);
  const [features, setFeatures] = useState<string[]>(["User Authentication"]);
  const [platform, setPlatform] = useState<"ios" | "android" | "both">("both");
  const [tipsOpen, setTipsOpen] = useState(false);

  useEffect(() => {
    if (upgradeRequired) setUpgradeModal(true);
  }, [upgradeRequired, setUpgradeModal]);

  const limitCheck = user
    ? {
        allowed: usageLoading
          ? true
          : (usage?.totalAvailableCredits ?? 0) >= INITIAL_APP_GENERATION_COST,
      }
    : { allowed: true };
  const totalAvailableCredits = user
    ? usage?.totalAvailableCredits ?? 0
    : Infinity;
  const planLimit = usage?.limitCredits ?? 0;
  const used = usage?.usedCredits ?? 0;
  const usageSummaryText =
    usageLoading || (user && !usage)
      ? "Loading daily AI credits..."
      : planLimit > 0
        ? `${used.toLocaleString()}/${planLimit.toLocaleString()} daily credits used${
            Number.isFinite(totalAvailableCredits) &&
            totalAvailableCredits > 0 &&
            limitCheck.allowed
              ? ` · ${totalAvailableCredits.toLocaleString()} total available · resets in ${resetCountdown}`
              : ""
          }`
        : "Daily AI credits will appear here shortly.";

  const filesRecord = useMemo<Record<string, string>>(() => {
    return generatedFiles.reduce<Record<string, string>>((acc, file) => {
      acc[file.path] = file.content;
      return acc;
    }, {});
  }, [generatedFiles]);

  const projectName = currentPrompt
    ? currentPrompt.split(/\s+/).slice(0, 4).join(" ")
    : "Your app";

  const charFeedback = getCharFeedback(currentPrompt.length);
  const isLargeGenerationRequest =
    currentPrompt.length > 900 || features.length > 6;

  function toggleFeature(name: string) {
    setFeatures((prev) =>
      prev.includes(name) ? prev.filter((f) => f !== name) : [...prev, name],
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentPrompt.trim()) return;
    if (user && !usageLoading && !limitCheck.allowed) {
      setUpgradeModal(true);
      return;
    }

    await startGenerationFlow({
      prompt: currentPrompt.trim(),
      templateId,
      colors: {
        primary,
        secondary: "#06b6d4",
        accent: "#f59e0b",
      },
      features,
      platform,
    });
  }

  if (isGenerating) {
    return (
      <>
        <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <GenerationProgress />
        </div>
        <UpgradeModal />
      </>
    );
  }

  if (generatedFiles.length > 0) {
    return (
      <>
        <div className="flex h-[calc(100vh-3.5rem)] flex-col md:h-screen">
          <header className="flex items-center justify-between border-b border-white/5 px-6 py-3">
            <button
              type="button"
              onClick={() => reset()}
              className="inline-flex items-center gap-2 text-sm text-text-secondary transition hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Start over
            </button>
            <span className="text-sm font-medium text-white">{projectName}</span>
            <Link
              href="/projects"
              className="text-sm text-violet-400 transition hover:text-violet-300"
            >
              My Projects
            </Link>
          </header>
          <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[minmax(460px,1.08fr)_minmax(420px,0.92fr)]">
            <div className="min-h-0 overflow-hidden border-r border-white/5">
              <AIChat
                projectId={useGenerationStore.getState().currentProjectId}
                currentFiles={filesRecord}
                projectName={projectName}
                projectPrompt={currentPrompt}
                onFilesUpdate={(next) => {
                  const nextFiles: GeneratedFile[] = Object.entries(next).map(
                    ([path, content]) => ({
                      path,
                      content,
                      language: path.split(".").pop() ?? "txt",
                    }),
                  );
                  useGenerationStore.setState({ generatedFiles: nextFiles });
                }}
              />
            </div>
            <div className="flex min-h-0 items-center justify-center overflow-auto p-4 sm:p-5 lg:p-6">
              <MobilePreview
                generatedFiles={filesRecord}
                projectName={projectName}
                projectPrompt={currentPrompt}
                compact
                colors={{ primary, secondary: "#06b6d4", accent: "#f59e0b" }}
              />
            </div>
          </div>
        </div>
        <UpgradeModal />
      </>
    );
  }

  const canSubmit =
    currentPrompt.trim().length > 0 && !isGenerating && limitCheck.allowed;

  function handlePromptKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    if (!canSubmit) {
      if (user && !usageLoading && !limitCheck.allowed) {
        setUpgradeModal(true);
      }
      return;
    }
    event.currentTarget.form?.requestSubmit();
  }

  return (
    <>
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(76,29,149,0.38)_0%,rgba(37,99,235,0.22)_42%,rgba(8,8,8,0.94)_100%)]" />
        <div className="pointer-events-none absolute inset-y-0 left-[-12%] w-[42rem] rounded-full bg-violet-600/22 blur-[140px]" />
        <div className="pointer-events-none absolute right-[8%] top-16 h-72 w-72 rounded-full bg-cyan-500/12 blur-[120px]" />
        <div className="pointer-events-none absolute left-[28%] top-0 h-48 w-96 bg-[linear-gradient(90deg,rgba(124,58,237,0.35),rgba(6,182,212,0.22),transparent)] blur-[90px]" />

        <div className="relative z-10 w-full px-4 py-4 sm:px-6 sm:py-6 lg:px-8 xl:px-10">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-text-secondary transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>

          <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
            <div>
              <div className="inline-flex items-center rounded-full border border-violet-400/25 bg-violet-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-200">
                Qorvex App Studio
              </div>
              <h1 className="mt-4 max-w-3xl text-3xl font-bold text-white sm:text-4xl xl:text-[3.15rem] xl:leading-[1.02]">
                What do you want to build?
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-text-secondary sm:text-lg">
                Describe the product, key screens, and vibe. Qorvex will push
                the generator toward a sharper, more app-specific result.
              </p>
            </div>
            {user ? (
              <div className="grid gap-2 sm:grid-cols-3 xl:min-w-[540px]">
                <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 backdrop-blur-xl">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-text-muted">
                    Available
                  </div>
                  <div className="mt-1 text-lg font-semibold text-white">
                    {usage ? usage.totalAvailableCredits.toLocaleString() : "…"}
                  </div>
                  <div className="text-xs text-text-secondary">AI credits</div>
                </div>
                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 backdrop-blur-xl">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-100/70">
                    Cost
                  </div>
                  <div className="mt-1 text-lg font-semibold text-white">
                    {INITIAL_APP_GENERATION_COST.toLocaleString()}
                  </div>
                  <div className="text-xs text-cyan-100/75">AI credits</div>
                </div>
                <div className="rounded-2xl border border-violet-400/20 bg-violet-500/10 px-4 py-3 backdrop-blur-xl">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-100/70">
                    Daily usage
                  </div>
                  <div className="mt-1 text-lg font-semibold text-white">
                    {planLimit < 0
                      ? "Max"
                      : `${used.toLocaleString()}/${planLimit.toLocaleString()}`}
                  </div>
                  <div className="text-xs text-violet-100/75">
                    {limitCheck.allowed ? `Resets in ${resetCountdown}` : "Refill needed"}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1.06fr)_minmax(460px,0.94fr)]"
          >
            <div className="flex flex-col gap-5">
              <div className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-black/25 shadow-[0_30px_90px_rgba(36,8,70,0.45)] backdrop-blur-2xl">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(168,85,247,0.8),rgba(34,211,238,0.7),transparent)]" />
                <div className="pointer-events-none absolute -left-24 top-10 h-56 w-56 rounded-full bg-violet-500/12 blur-[100px]" />
                <div className="rounded-[28px] bg-background-secondary/55 backdrop-blur">
                  <textarea
                    value={currentPrompt}
                    disabled={isGenerating}
                    onChange={(e) => setPrompt(e.target.value.slice(0, 3000))}
                    onKeyDown={handlePromptKeyDown}
                    placeholder="Describe your app idea… e.g. 'A fitness tracker app where users can log workouts, track calories, view progress charts, and connect with friends for challenges'"
                    rows={6}
                    className="block w-full resize-none rounded-[28px] bg-transparent px-6 py-5 pr-20 text-[17px] leading-8 text-white placeholder:text-text-muted/60 focus:outline-none disabled:opacity-60 sm:text-lg"
                    style={{ minHeight: 220 }}
                  />
                  <div className="flex items-center justify-between gap-3 border-t border-white/5 px-5 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${charFeedback.color} ${charFeedback.textColor}`}
                    >
                      <Wand2 className="h-3 w-3" />
                      {charFeedback.label}
                    </span>
                    <span className="text-xs text-text-muted">
                      {currentPrompt.length}/3000
                    </span>
                  </div>
                </div>
                {limitCheck.allowed ? (
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    aria-label="Generate app"
                    title={
                      !currentPrompt.trim()
                        ? "Describe your app first"
                        : "Generate app (Enter)"
                    }
                    className="absolute bottom-[4.35rem] right-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-violet-500 to-cyan-500 text-white shadow-[0_12px_32px_rgba(124,58,237,0.45)] transition hover:scale-[1.03] hover:from-violet-400 hover:to-cyan-400 disabled:cursor-not-allowed disabled:from-white/10 disabled:via-white/10 disabled:to-white/5 disabled:text-text-muted disabled:shadow-none"
                  >
                    {isGenerating ? (
                      <Sparkles className="h-5 w-5 animate-pulse" />
                    ) : (
                      <ArrowUp className="h-5 w-5" />
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setUpgradeModal(true)}
                    aria-label="Upgrade required"
                    title="You need at least 2,000 AI credits to generate an app."
                    className="absolute bottom-[4.35rem] right-4 flex h-12 items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/15 px-3.5 text-xs font-semibold text-amber-200 transition hover:bg-amber-500/25"
                  >
                    Upgrade
                  </button>
                )}
              </div>

              {isLargeGenerationRequest ? (
                <div className="rounded-2xl border border-violet-400/20 bg-violet-500/10 px-4 py-3 text-sm text-violet-100 shadow-[0_10px_30px_rgba(76,29,149,0.18)]">
                  Generating a larger app may take longer. Qorvex plans the
                  architecture in stages so the output stays coherent.
                </div>
              ) : null}

              {!currentPrompt && (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                  {EXAMPLE_PROMPTS.map((ex) => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => setPrompt(ex)}
                      className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-left text-sm text-text-secondary transition-all hover:border-violet-400/30 hover:bg-white/[0.06] hover:text-white"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                  <span className="leading-snug">{error}</span>
                </div>
              )}

              <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20 backdrop-blur-xl">
                <button
                  type="button"
                  onClick={() => setTipsOpen((v) => !v)}
                  className="flex w-full items-center justify-between px-5 py-4 text-sm font-semibold text-white transition hover:bg-white/[0.03]"
                >
                  <span className="inline-flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-violet-400" />
                    Tips for better results
                  </span>
                  {tipsOpen ? (
                    <ChevronUp className="h-4 w-4 text-text-muted" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-text-muted" />
                  )}
                </button>
                {tipsOpen && (
                  <ul className="grid gap-2 border-t border-white/5 px-5 py-4 text-sm text-text-secondary sm:grid-cols-2">
                    {TIPS.map((tip) => (
                      <li key={tip} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <p className="px-1 text-xs text-text-muted">{usageSummaryText}</p>
            </div>

            <div className="flex flex-col gap-5 xl:sticky xl:top-6">
              <div className="rounded-[28px] border border-white/10 bg-black/25 p-5 shadow-[0_24px_70px_rgba(5,10,35,0.45)] backdrop-blur-2xl">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-text-muted">
                    Template
                  </label>
                  <div className="mt-3 flex flex-wrap gap-2.5">
                    <button
                      type="button"
                      onClick={() => setTemplateId(null)}
                      className={`shrink-0 rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                        templateId === null
                          ? "border-violet-500 bg-violet-600 text-white shadow shadow-violet-500/20"
                          : "border-white/10 bg-white/[0.03] text-text-secondary hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
                      }`}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5" />
                        Custom
                      </span>
                    </button>
                    {APP_TEMPLATES.map((tpl) => {
                      const active = templateId === tpl.id;
                      return (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => setTemplateId(tpl.id)}
                          className={`shrink-0 rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                            active
                              ? "border-violet-500 bg-violet-600 text-white shadow shadow-violet-500/20"
                              : "border-white/10 bg-white/[0.03] text-text-secondary hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
                          }`}
                        >
                          <span className="inline-flex items-center gap-1.5">
                            <span className="text-sm">{tpl.icon}</span>
                            {tpl.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-text-muted">
                    Color theme
                  </label>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {COLORS.map((c) => {
                      const active = primary === c.value;
                      return (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => setPrimary(c.value)}
                          aria-label={c.name}
                          title={c.name}
                          className={`relative rounded-2xl transition-all duration-200 ${
                            active
                              ? "scale-105 ring-2 ring-white ring-offset-2 ring-offset-background-primary"
                              : "hover:scale-110"
                          }`}
                          style={{ width: 34, height: 34, backgroundColor: c.value }}
                        >
                          {active && (
                            <Check className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-violet-400/15 bg-violet-500/8 px-4 py-3 text-sm text-violet-100/85">
                  Qorvex now pushes the generator toward more app-specific
                  flows, richer screen content, and less generic layouts.
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-black/25 p-5 shadow-[0_24px_70px_rgba(5,10,35,0.45)] backdrop-blur-2xl">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-text-muted">
                    Key features
                  </label>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {FEATURE_OPTIONS.map((feature) => {
                      const active = features.includes(feature);
                      return (
                        <label
                          key={feature}
                          className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm transition-all ${
                            active
                              ? "border-violet-500/30 bg-violet-500/10 text-white"
                              : "border-white/10 bg-white/[0.02] text-text-secondary hover:border-white/20 hover:bg-white/[0.04]"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={active}
                            onChange={() => toggleFeature(feature)}
                            className="sr-only"
                          />
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition-all ${
                              active
                                ? "bg-gradient-to-br from-violet-500 to-violet-600 text-white"
                                : "border border-white/20 bg-transparent"
                            }`}
                          >
                            {active && <Check className="h-3 w-3" />}
                          </span>
                          <span className="truncate">{feature}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-text-muted">
                    Platform
                  </label>
                  <div className="mt-3 inline-flex rounded-2xl border border-white/10 bg-white/[0.03] p-1.5">
                    {PLATFORMS.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setPlatform(p.value)}
                        className={`rounded-xl px-5 py-2 text-sm font-medium transition-all ${
                          platform === p.value
                            ? "bg-violet-600 text-white shadow"
                            : "text-text-secondary hover:text-white"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
      <UpgradeModal />
    </>
  );
}
