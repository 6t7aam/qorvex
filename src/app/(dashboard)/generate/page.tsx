"use client";

import { Suspense, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
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
import {
  INITIAL_APP_GENERATION_COST,
  creditsToUsd,
} from "@/lib/ai-credits";
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
  const dailyRemainingCredits = usage?.dailyRemainingCredits ?? 0;
  const bonusCredits = usage?.bonusCredits ?? 0;
  const planLimit = usage?.limitCredits ?? 0;
  const used = usage?.usedCredits ?? 0;

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
  const initialGenerationCostUsd = creditsToUsd(INITIAL_APP_GENERATION_COST);

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
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
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
          <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-2">
            <div className="min-h-0 overflow-hidden border-r border-white/5">
              <AIChat
                key={`${useGenerationStore.getState().currentProjectId ?? "draft"}-${filesRecord[".qorvex/chat-history.json"]?.length ?? 0}`}
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
            <div className="flex min-h-0 items-center justify-center overflow-hidden p-8">
              <MobilePreview
                generatedFiles={filesRecord}
                projectName={projectName}
                projectPrompt={currentPrompt}
                colors={{ primary, secondary: "#06b6d4", accent: "#f59e0b" }}
              />
            </div>
          </div>
        </div>
        <UpgradeModal />
      </>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-5xl px-6 py-10 sm:px-8 lg:px-10">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-text-secondary transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Link>

        {/* Hero header */}
        <div className="mt-8 mb-10">
          <h1 className="text-4xl font-bold text-white sm:text-5xl">
            What do you want to build?
          </h1>
          <p className="mt-3 text-base text-text-secondary">
            Describe your app in plain English. The more detail, the better the
            result.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* PROMPT TEXTAREA — HERO ELEMENT */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-white">
              Describe your app
            </label>
            <div className="group relative rounded-2xl p-[1.5px] transition-all focus-within:[background:linear-gradient(135deg,#7c3aed,#a855f7,#06b6d4,#7c3aed)] focus-within:[background-size:300%_300%] focus-within:animate-gradient-shift">
              <div className="rounded-2xl bg-background-secondary/60 backdrop-blur">
                <textarea
                  value={currentPrompt}
                  disabled={isGenerating}
                  onChange={(e) => setPrompt(e.target.value.slice(0, 3000))}
                  placeholder="Describe your app idea… e.g. 'A fitness tracker app where users can log workouts, track calories, view progress charts, and connect with friends for challenges'"
                  rows={6}
                  className="block w-full resize-none rounded-2xl bg-transparent px-6 py-5 text-base leading-relaxed text-white placeholder:text-text-muted/60 focus:outline-none disabled:opacity-60"
                  style={{ minHeight: 200 }}
                />
                <div className="flex items-center justify-between border-t border-white/5 px-6 py-3">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${charFeedback.color} ${charFeedback.textColor}`}
                  >
                    <Wand2 className="h-3 w-3" />
                    {charFeedback.label}
                  </span>
                  <span className="text-xs text-text-muted">
                    {currentPrompt.length}/3000
                  </span>
                </div>
              </div>
            </div>

            {isLargeGenerationRequest ? (
              <div className="rounded-2xl border border-violet-400/20 bg-violet-500/10 px-4 py-3 text-sm text-violet-100">
                Generating a larger app may take longer. Qorvex is optimizing
                the project architecture in stages.
              </div>
            ) : null}

            {user ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="font-medium text-white">
                      {usage
                        ? `${usage.totalAvailableCredits.toLocaleString()} AI credits available`
                        : "Loading your AI credit balance..."}
                    </div>
                    <div className="mt-1 text-xs text-text-muted">
                      {usage
                        ? `${usage.plan.toUpperCase()} plan • ${dailyRemainingCredits.toLocaleString()} daily + ${bonusCredits.toLocaleString()} bonus • resets in ${resetCountdown}`
                        : "Daily credits reset every 24 hours at 00:00 UTC."}
                    </div>
                    <div className="mt-1 text-xs text-cyan-200">
                      Initial generation costs{" "}
                      {INITIAL_APP_GENERATION_COST.toLocaleString()} credits.
                    </div>
                    {usage &&
                    usage.totalAvailableCredits < INITIAL_APP_GENERATION_COST ? (
                      <div className="mt-1 text-xs text-amber-200">
                        You need at least{" "}
                        {INITIAL_APP_GENERATION_COST.toLocaleString()} AI credits
                        to generate an app.
                      </div>
                    ) : null}
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="text-xs uppercase tracking-wider text-text-muted">
                      Initial generation cost
                    </div>
                    <div className="text-sm font-semibold text-white">
                      {INITIAL_APP_GENERATION_COST.toLocaleString()} credits
                    </div>
                    <div className="mt-1 text-xs text-text-muted">
                      ~${initialGenerationCostUsd.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Example prompts */}
            {!currentPrompt && (
              <div className="space-y-2">
                <p className="text-xs text-text-muted">Try one of these:</p>
                <div className="flex flex-wrap gap-2">
                  {EXAMPLE_PROMPTS.map((ex) => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => setPrompt(ex)}
                      className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-text-secondary transition-all hover:border-white/25 hover:bg-white/[0.06] hover:text-white"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* TEMPLATE SELECTOR */}
          <div className="space-y-4">
            <label className="text-sm font-semibold text-white">
              Start from a template (optional)
            </label>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setTemplateId(null)}
                className={`shrink-0 rounded-xl border px-5 py-3 text-sm font-medium transition-all ${
                  templateId === null
                    ? "border-violet-500 bg-violet-600 text-white shadow-lg shadow-violet-500/20"
                    : "border-white/10 bg-white/[0.03] text-text-secondary hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
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
                    className={`shrink-0 rounded-xl border px-5 py-3 text-sm font-medium transition-all ${
                      active
                        ? "border-violet-500 bg-violet-600 text-white shadow-lg shadow-violet-500/20"
                        : "border-white/10 bg-white/[0.03] text-text-secondary hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <span className="text-base">{tpl.icon}</span>
                      {tpl.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* COLOR SWATCHES */}
          <div className="space-y-4">
            <label className="text-sm font-semibold text-white">
              App color theme
            </label>
            <div className="flex flex-wrap gap-4">
              {COLORS.map((c) => {
                const active = primary === c.value;
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setPrimary(c.value)}
                    aria-label={c.name}
                    title={c.name}
                    className={`relative rounded-xl transition-all duration-200 ${
                      active
                        ? "ring-2 ring-white ring-offset-2 ring-offset-background-primary scale-110"
                        : "hover:scale-110"
                    }`}
                    style={{
                      width: 44,
                      height: 44,
                      backgroundColor: c.value,
                    }}
                  >
                    {active && (
                      <Check className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* FEATURES CHECKLIST — 2 column grid */}
          <div className="space-y-4">
            <label className="text-sm font-semibold text-white">
              Key features to include
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {FEATURE_OPTIONS.map((feature) => {
                const active = features.includes(feature);
                return (
                  <label
                    key={feature}
                    className={`flex cursor-pointer items-center gap-4 rounded-2xl border px-5 py-4 text-sm transition-all ${
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
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg transition-all ${
                        active
                          ? "bg-gradient-to-br from-violet-500 to-violet-600 text-white"
                          : "border border-white/20 bg-transparent"
                      }`}
                    >
                      {active && <Check className="h-3 w-3" />}
                    </span>
                    {feature}
                  </label>
                );
              })}
            </div>
          </div>

          {/* PLATFORM SELECTOR */}
          <div className="space-y-4">
            <label className="text-sm font-semibold text-white">
              Target platform
            </label>
            <div className="inline-flex rounded-2xl border border-white/10 bg-white/[0.03] p-1.5">
              {PLATFORMS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPlatform(p.value)}
                  className={`rounded-xl px-6 py-2.5 text-sm font-medium transition-all ${
                    platform === p.value
                      ? "bg-violet-600 text-white shadow-md"
                      : "text-text-secondary hover:text-white"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* TIPS — COLLAPSIBLE SECTION BELOW */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
            <button
              type="button"
              onClick={() => setTipsOpen((v) => !v)}
              className="flex w-full items-center justify-between px-6 py-4 text-sm font-semibold text-white transition hover:bg-white/[0.03]"
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
              <div className="border-t border-white/5 px-6 pb-5 pt-4">
                <ul className="space-y-3">
                  {TIPS.map((tip) => (
                    <li
                      key={tip}
                      className="flex items-start gap-3 text-sm text-text-secondary"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* ERROR */}
          {error && (
            <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-200">
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* GENERATE BUTTON */}
          <div className="pt-2">
            {limitCheck.allowed ? (
              <button
                type="submit"
                disabled={!currentPrompt.trim() || isGenerating}
                className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl px-8 py-5 text-lg font-bold text-white shadow-xl transition-all hover:shadow-2xl hover:shadow-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-xl"
              >
                {/* Shimmer overlay */}
                <span
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)",
                    backgroundSize: "200% 100%",
                    animation: "shimmer 1.8s ease-in-out infinite",
                  }}
                />
                <Sparkles className="relative h-5 w-5" />
                <span className="relative">Generate App with AI</span>
                <span className="relative ml-1">→</span>
                <style>{`
                  @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                  }
                `}</style>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setUpgradeModal(true)}
                title="You need at least 2,000 AI credits to generate an app."
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-8 py-5 text-lg font-bold text-amber-200 transition hover:bg-amber-500/20"
              >
                You need 2,000 credits to generate
              </button>
            )}
            <div className="mt-4 text-center">
              {planLimit < 0 ? (
                <p className="text-sm text-text-muted">
                  Daily AI credits are optimized for the Max plan
                </p>
              ) : (
                <p className="text-sm text-text-muted">
                  {used.toLocaleString()} of {planLimit.toLocaleString()} daily
                  AI credits used
                  {Number.isFinite(totalAvailableCredits) &&
                  totalAvailableCredits > 0 &&
                  limitCheck.allowed
                    ? ` · ${totalAvailableCredits.toLocaleString()} total available (${dailyRemainingCredits.toLocaleString()} daily + ${bonusCredits.toLocaleString()} bonus)`
                    : ""}
                </p>
              )}
            </div>
          </div>
        </form>
      </div>
      <UpgradeModal />
    </>
  );
}
