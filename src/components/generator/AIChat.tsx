"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  getFileDescription,
  getVisibleProjectFiles,
  parseProjectChatHistoryFromFiles,
  type ProjectChatHistoryMessage,
} from "@/lib/project-artifacts";

type ChatMessage = ProjectChatHistoryMessage;

const SUGGESTIONS = [
  "Add login and signup screens",
  "Make the UI more premium",
  "Add seller chat",
  "Improve marketplace listings",
  "Add profile settings",
  "Add onboarding screens",
];

interface AIChatProps {
  projectId: string | null;
  currentFiles: Record<string, string>;
  projectName?: string;
  projectPrompt?: string;
  onFilesUpdate?: (files: Record<string, string>) => void;
  onUpdatingChange?: (updating: boolean) => void;
}

type ChatIntent = "simple_chat" | "lightweight_edit" | "heavy_edit";

interface ChatResponsePayload {
  message?: string;
  versionSummary?: string;
  updatedPreview?: Record<string, unknown>;
  updatedFiles?: Record<string, string>;
  history?: ChatMessage[];
  intent?: ChatIntent;
  stage?: string;
  error?: string;
  retryable?: boolean;
  upgradeRequired?: boolean;
}

function clientClassifyIntent(message: string): ChatIntent {
  const trimmed = message.trim();
  const simpleChat: RegExp[] = [
    /^\s*(привет|здравствуй|здравствуйте|хай|hi|hello|hey|hola|salut|ola|ciao|yo)\b/i,
    /как\s+тебя\s+зовут/i,
    /кто\s+ты/i,
    /что\s+ты\s+(умеешь|можешь|делаешь)/i,
    /who\s+are\s+you/i,
    /what\s+can\s+you\s+do/i,
    /what'?s\s+your\s+name/i,
    /^\s*help\b/i,
    /^\s*(спасибо|thanks|thank you|merci|gracias)\b/i,
  ];
  if (simpleChat.some((rx) => rx.test(trimmed))) return "simple_chat";
  if (trimmed.length <= 20 && !/[?!.]/.test(trimmed)) return "simple_chat";

  const heavy: RegExp[] = [
    /\b(add|create|generate|build|implement|introduce|insert)\b/i,
    /\b(добавь|создай|сгенерируй|реализуй|внедри|добавить)\b/i,
    /\b(screen|page|tab|navigation|route|flow|feature|module|component|api|backend)\b/i,
    /\b(экран|страница|вкладк|навигация|поток|фича|модуль|компонент|api|бэкенд)\b/i,
    /\b(refactor|rewrite|redesign|переработай|перепиши|переделай)\b/i,
  ];
  if (heavy.some((rx) => rx.test(trimmed))) return "heavy_edit";
  return "lightweight_edit";
}

function statusLabel(intent: ChatIntent): string {
  if (intent === "simple_chat") return "Thinking...";
  if (intent === "lightweight_edit") return "Updating preview...";
  return "Editing files...";
}

function createSummaryMessage(
  files: Record<string, string>,
  projectName?: string,
  projectPrompt?: string,
): ChatMessage {
  return {
    id: "summary",
    role: "assistant",
    content: buildSummaryMessage(files, projectName, projectPrompt),
    createdAt: new Date(0).toISOString(),
  };
}

function buildInitialMessages(
  files: Record<string, string>,
  projectName?: string,
  projectPrompt?: string,
) {
  const summary = createSummaryMessage(files, projectName, projectPrompt);
  const history = parseProjectChatHistoryFromFiles(files);
  return [summary, ...history];
}

export function AIChat({
  projectId,
  currentFiles,
  projectName,
  projectPrompt,
  onFilesUpdate,
  onUpdatingChange,
}: AIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    buildInitialMessages(currentFiles, projectName, projectPrompt),
  );
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const currentFilesRef = useRef(currentFiles);
  const shouldAutoScrollRef = useRef(true);
  const previousMessageCountRef = useRef(messages.length);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const messageCountChanged = previousMessageCountRef.current !== messages.length;
    previousMessageCountRef.current = messages.length;

    if (!messageCountChanged && !sending) return;

    if (shouldAutoScrollRef.current) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: messageCountChanged ? "smooth" : "auto",
      });
    }
  }, [messages, sending]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  useEffect(() => {
    currentFilesRef.current = currentFiles;
  }, [currentFiles]);

  const hasPersistedHistory = useMemo(
    () => messages.length > 1,
    [messages.length],
  );

  function handleScroll() {
    const container = scrollRef.current;
    if (!container) return;

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    shouldAutoScrollRef.current = distanceFromBottom < 96;
  }

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    shouldAutoScrollRef.current = true;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
    };

    const assistantPlaceholder: ChatMessage = {
      id: `a-${Date.now()}`,
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
    };

    const guessedIntent = clientClassifyIntent(trimmed);
    const guessedIsEdit = guessedIntent !== "simple_chat";
    setMessages((prev) => [...prev, userMsg, assistantPlaceholder]);
    setInput("");
    setSending(true);
    setStatus(statusLabel(guessedIntent));
    setLastFailedMessage(null);
    if (guessedIsEdit) onUpdatingChange?.(true);

    try {
      const response = await fetch("/api/generate/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          projectId,
          currentFiles: currentFilesRef.current,
          projectName,
          projectPrompt,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | ChatResponsePayload
        | null;

      if (!response.ok) {
        const errorMessage =
          payload?.error ??
          "Sorry, something went wrong updating your app. Please try again.";

        toast.error(errorMessage);
        setLastFailedMessage(trimmed);
        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantPlaceholder.id
              ? { ...message, content: errorMessage }
              : message,
          ),
        );
        return;
      }

      const intent = payload?.intent ?? guessedIntent;
      if (intent === "heavy_edit") {
        setStatus("Saving version...");
      }

      const nextFiles = payload?.updatedFiles ?? currentFilesRef.current;
      if (payload?.updatedFiles && onFilesUpdate) {
        currentFilesRef.current = payload.updatedFiles;
        // Always propagate updated files to the parent so the preview re-renders.
        onFilesUpdate(payload.updatedFiles);
      }

      const nextMessages: ChatMessage[] =
        payload?.history && payload.history.length > 0
          ? [createSummaryMessage(nextFiles, projectName, projectPrompt), ...payload.history]
          : [
              ...messages.filter((message) => message.id !== assistantPlaceholder.id),
              userMsg,
              {
                id: assistantPlaceholder.id,
                role: "assistant",
                content:
                  payload?.message ??
                  payload?.versionSummary ??
                  "Your project has been updated.",
                createdAt: new Date().toISOString(),
              },
            ];

      setMessages(nextMessages);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Sorry, the request failed.";
      toast.error(errorMessage);
      setLastFailedMessage(trimmed);
      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantPlaceholder.id
            ? { ...message, content: `Error: ${errorMessage}` }
            : message,
        ),
      );
    } finally {
      setSending(false);
      setStatus(null);
      if (guessedIsEdit) onUpdatingChange?.(false);
    }
  }

  function retryLastMessage() {
    if (!lastFailedMessage) return;
    void send(lastFailedMessage);
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))]">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        tabIndex={0}
        className="flex-1 min-h-0 space-y-4 overflow-y-auto overscroll-contain scroll-smooth px-4 py-6 pr-3 lg:px-5"
      >
        {messages.map((message, index) => (
          <MessageBubble
            key={message.id}
            message={message}
            isSummary={index === 0}
          />
        ))}
      </div>

      {!hasPersistedHistory && (
        <div className="shrink-0 border-t border-white/5 px-4 py-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setInput(suggestion)}
                className="glass-border shrink-0 rounded-full bg-white/[0.02] px-3 py-1.5 text-xs text-text-secondary transition hover:bg-white/[0.06] hover:text-white"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void send(input);
        }}
        className="shrink-0 border-t border-white/5 bg-background/95 p-3 backdrop-blur"
      >
        <div className="relative flex items-end gap-2 rounded-2xl border border-white/10 bg-background-secondary/70 p-2 shadow-2xl shadow-black/20">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void send(input);
              }
            }}
            placeholder="Describe what you want to change..."
            rows={1}
            disabled={sending}
            className="block max-h-40 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-white placeholder:text-text-muted focus:outline-none disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="flex h-10 min-w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500 text-white transition hover:bg-violet-400 disabled:opacity-50"
            aria-label="Send message"
          >
            {sending ? (
              <span className="text-[11px] font-semibold">...</span>
            ) : (
              <ArrowUp className="h-4 w-4" />
            )}
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between gap-3 text-[10px] uppercase tracking-wider text-text-muted">
          <span className="flex items-center gap-2">
            {sending && status ? (
              <>
                <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-violet-400" />
                <span className="text-violet-300">{status}</span>
              </>
            ) : (
              "Powered by Claude AI"
            )}
          </span>
          {lastFailedMessage && !sending ? (
            <button
              type="button"
              onClick={retryLastMessage}
              className="rounded-full border border-violet-400/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-violet-200 transition hover:bg-violet-500/10"
            >
              Retry
            </button>
          ) : (
            <span>Enter to send, Shift+Enter for a new line</span>
          )}
        </div>
      </form>
    </div>
  );
}

function MessageBubble({
  message,
  isSummary,
}: {
  message: ChatMessage;
  isSummary?: boolean;
}) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[82%] whitespace-pre-line rounded-2xl rounded-br-md bg-violet-500/90 px-4 py-2.5 text-sm leading-relaxed text-white shadow-lg shadow-violet-900/20">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-violet-200 ring-1 ring-violet-500/30">
        <Sparkles className="h-3.5 w-3.5" />
      </div>
      <div
        className={`max-w-[86%] whitespace-pre-line rounded-2xl rounded-tl-md border px-4 py-2.5 text-sm leading-relaxed ${
          isSummary
            ? "border-violet-500/20 bg-violet-500/8 text-white shadow-xl shadow-violet-950/10"
            : "border-white/5 bg-background-secondary/60 text-text-primary"
        }`}
      >
        {message.content ? message.content : <Cursor />}
      </div>
    </div>
  );
}

function Cursor() {
  return (
    <span className="inline-block h-3 w-1.5 translate-y-0.5 animate-pulse bg-violet-300" />
  );
}

function buildSummaryMessage(
  files: Record<string, string>,
  projectName?: string,
  projectPrompt?: string,
): string {
  const appName = extractAppName(files, projectName);
  const fileLines = getVisibleProjectFiles(files)
    .slice(0, 8)
    .map((path) => `- ${path} - ${getFileDescription(path)}`)
    .join("\n");
  const features = detectFeatures(files);
  const featuresText =
    features.length > 0
      ? features.map((feature) => `- ${feature}`).join("\n")
      : "- A clean starter ready to extend";
  const suggestionsText = suggestNextSteps(files)
    .map((suggestion, index) => `${index + 1}. ${suggestion}`)
    .join("\n");

  return `${appName} is open in the Qorvex editor.${projectPrompt ? `\n\nOriginal idea\n${projectPrompt}` : ""}

Files
${fileLines || "- No generated files found yet"}

What is already included
${featuresText}

Good next edits
${suggestionsText}

Describe the change you want and I will update the project for you.`;
}

function extractAppName(files: Record<string, string>, fallback?: string): string {
  const appJson = files["app.json"];
  if (appJson) {
    try {
      const parsed = JSON.parse(appJson) as { expo?: { name?: string } };
      if (parsed?.expo?.name) return parsed.expo.name;
    } catch {}
  }

  const pkg = files["package.json"];
  if (pkg) {
    try {
      const parsed = JSON.parse(pkg) as { name?: string };
      if (parsed?.name) return parsed.name;
    } catch {}
  }

  return fallback || "Your app";
}

function detectFeatures(files: Record<string, string>): string[] {
  const features: string[] = [];
  const visibleFiles = getVisibleProjectFiles(files);
  const allContent = visibleFiles.map((path) => files[path] ?? "").join("\n");

  if (/@supabase\/supabase-js|supabase\./i.test(allContent)) {
    features.push("Supabase auth and data integration");
  }
  if (visibleFiles.some((path) => path.includes("(tabs)"))) {
    features.push("Tab navigation with Expo Router");
  }
  if (/nativewind|className=/i.test(allContent)) {
    features.push("NativeWind or Tailwind-style UI");
  }
  if (/loading|ActivityIndicator|Skeleton/i.test(allContent)) {
    features.push("Loading states");
  }
  if (/empty/i.test(allContent)) {
    features.push("Empty-state handling");
  }
  if (visibleFiles.some((path) => path.toLowerCase().includes("profile"))) {
    features.push("Profile or settings screen");
  }

  return features;
}

function suggestNextSteps(files: Record<string, string>): string[] {
  const visibleFiles = getVisibleProjectFiles(files);
  const allContent = visibleFiles.map((path) => files[path] ?? "").join("\n");
  const suggestions: string[] = [];

  if (!visibleFiles.some((path) => path.toLowerCase().includes("login"))) {
    suggestions.push("Add explicit login and signup screens");
  }
  if (!visibleFiles.some((path) => path.toLowerCase().includes("profile"))) {
    suggestions.push("Add a profile tab with account settings");
  }
  if (!/chart|progress|stats/i.test(allContent)) {
    suggestions.push("Make the main dashboard more data-rich and visual");
  }
  if (!/empty|loading/i.test(allContent)) {
    suggestions.push("Add loading and empty states for key screens");
  }
  if (suggestions.length < 4) {
    suggestions.push("Refine the visual style for your target audience");
  }

  return suggestions.slice(0, 4);
}
