import { create } from "zustand";
import type { GeneratedFile, GenerationProgress } from "@/types";
import { toGeneratedFiles } from "@/lib/project-artifacts";
import { USAGE_UPDATED_EVENT } from "@/hooks/useDailyUsage";

export interface GenerationFormPayload {
  prompt: string;
  templateId?: string | null;
  colors: { primary: string; secondary: string; accent: string };
  features: string[];
  platform: "ios" | "android" | "both";
  projectName?: string;
  requestId?: string;
}

interface GenerationStreamEvent {
  type: "notice" | "progress" | "result" | "error";
  stage?: string;
  percent?: number;
  message?: string;
  projectId?: string;
  files?: Record<string, string>;
  partial?: boolean;
  warnings?: string[];
  error?: string;
}

interface GenerationState {
  currentPrompt: string;
  isGenerating: boolean;
  progress: GenerationProgress | null;
  generatedFiles: GeneratedFile[];
  streamingText: string;
  currentProjectId: string | null;
  error: string | null;
  upgradeRequired: boolean;
  setPrompt: (prompt: string) => void;
  startGeneration: (projectId?: string | null) => void;
  updateProgress: (progress: GenerationProgress) => void;
  addFile: (file: GeneratedFile) => void;
  setStreamingText: (text: string) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  startGenerationFlow: (form: GenerationFormPayload) => Promise<void>;
}

const initialState = {
  currentPrompt: "",
  isGenerating: false,
  progress: null,
  generatedFiles: [],
  streamingText: "",
  currentProjectId: null,
  error: null,
  upgradeRequired: false,
};

function appendLog(current: string, line: string) {
  const next = [...current.split("\n").filter(Boolean), line].slice(-14);
  return next.join("\n");
}

function parseLines(buffer: string) {
  const lines = buffer.split("\n");
  const remainder = lines.pop() ?? "";
  return { lines, remainder };
}

function isResultEvent(event: GenerationStreamEvent): event is GenerationStreamEvent & {
  files: Record<string, string>;
} {
  return event.type === "result" && Boolean(event.files);
}

export const useGenerationStore = create<GenerationState>((set, get) => ({
  ...initialState,
  setPrompt: (currentPrompt) => set({ currentPrompt }),
  startGeneration: (projectId = null) =>
    set({
      isGenerating: true,
      currentProjectId: projectId,
      generatedFiles: [],
      streamingText: "",
      error: null,
      upgradeRequired: false,
      progress: { stage: "queued", percent: 0, message: "Preparing..." },
    }),
  updateProgress: (progress) => set({ progress }),
  addFile: (file) =>
    set((state) => ({ generatedFiles: [...state.generatedFiles, file] })),
  setStreamingText: (streamingText) => set({ streamingText }),
  setError: (error) => set({ error, isGenerating: false }),
  reset: () => set(initialState),
  startGenerationFlow: async (form) => {
    if (get().isGenerating) {
      return;
    }

    const requestId = form.requestId ?? crypto.randomUUID();

    set({
      isGenerating: true,
      currentPrompt: form.prompt,
      generatedFiles: [],
      streamingText: "",
      error: null,
      upgradeRequired: false,
      progress: { stage: "starting", percent: 4, message: "Sending request..." },
    });

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, requestId }),
      });

      if (response.status === 401) {
        set({
          isGenerating: false,
          error: "Please sign in to generate apps.",
        });
        return;
      }

      if (response.status === 402 || response.status === 403) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        set({
          isGenerating: false,
          upgradeRequired: true,
          error: body?.error ?? "Generation limit reached.",
        });
        return;
      }

      if (response.status === 409) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        set({
          isGenerating: false,
          error: body?.error ?? "This generation request is already running.",
        });
        return;
      }

      if (!response.ok || !response.body) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        set({
          isGenerating: false,
          error:
            body?.error ??
            `Generation failed (${response.status}).`,
        });
        return;
      }

      const projectId =
        response.headers.get("x-qorvex-project-id") ?? get().currentProjectId;
      if (projectId) set({ currentProjectId: projectId });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let receivedResult = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parsed = parseLines(buffer);
        buffer = parsed.remainder;

        for (const line of parsed.lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          let event: GenerationStreamEvent;
          try {
            event = JSON.parse(trimmed) as GenerationStreamEvent;
          } catch {
            set((state) => ({
              streamingText: appendLog(state.streamingText, trimmed),
            }));
            continue;
          }

          if (event.type === "notice" && event.message) {
            set((state) => ({
              streamingText: appendLog(state.streamingText, event.message!),
            }));
            continue;
          }

          if (event.type === "progress") {
            set((state) => ({
              progress: {
                stage: event.stage ?? "processing",
                percent: event.percent ?? 0,
                message: event.message ?? "Generating...",
              },
              streamingText: appendLog(
                state.streamingText,
                event.message ?? "Generating...",
              ),
            }));
            continue;
          }

          if (isResultEvent(event)) {
            receivedResult = true;
            window.dispatchEvent(new Event(USAGE_UPDATED_EVENT));
            set((state) => ({
              isGenerating: false,
              generatedFiles: toGeneratedFiles(event.files),
              progress: {
                stage: "complete",
                percent: 100,
                message: event.partial ? "Project completed with recovery" : "Done",
              },
              error:
                event.partial && event.warnings?.length
                  ? event.warnings.join(" | ")
                  : null,
              streamingText:
                event.warnings && event.warnings.length > 0
                  ? appendLog(
                      state.streamingText,
                      `Recovered with warnings: ${event.warnings.join(" | ")}`,
                    )
                  : state.streamingText,
            }));
            continue;
          }

          if (event.type === "error") {
            window.dispatchEvent(new Event(USAGE_UPDATED_EVENT));
            set((state) => ({
              isGenerating: false,
              error: event.error ?? "Generation failed.",
              streamingText: appendLog(
                state.streamingText,
                event.error ?? "Generation failed.",
              ),
            }));
          }
        }
      }

      if (buffer.trim()) {
        try {
          const event = JSON.parse(buffer.trim()) as GenerationStreamEvent;
          if (isResultEvent(event)) {
            receivedResult = true;
            window.dispatchEvent(new Event(USAGE_UPDATED_EVENT));
            set({
              isGenerating: false,
              generatedFiles: toGeneratedFiles(event.files),
              progress: { stage: "complete", percent: 100, message: "Done" },
              error: null,
            });
          }
        } catch {}
      }

      if (!receivedResult && !get().error) {
        set({
          isGenerating: false,
          error: "Generation ended before the final project payload was received.",
        });
      }
    } catch (err) {
      set({
        isGenerating: false,
        error: err instanceof Error ? err.message : "Generation failed.",
      });
    }
  },
}));
