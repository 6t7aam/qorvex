import { NextResponse, type NextRequest } from "next/server";
import { getAIProvider, type AIProvider } from "@/lib/ai";
import { beginAIUsageSession } from "@/lib/ai-usage.server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { withTimeout } from "@/lib/with-timeout";
import {
  getProjectPreviewModel,
  getVisibleProjectFiles,
  mergeProjectPreview,
  parseProjectChatHistoryFromFiles,
  parseProjectPreviewFromFiles,
  withProjectChatHistoryFile,
  withProjectPreviewFile,
  type ProjectChatHistoryMessage,
  type ProjectPreviewModel,
} from "@/lib/project-artifacts";
import type { Project, UserProfile } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatIntent = "simple_chat" | "lightweight_edit" | "heavy_edit";

interface ChatBody {
  message: string;
  projectId: string | null;
  currentFiles?: Record<string, string>;
  projectName?: string;
  projectPrompt?: string;
}

interface EditResponsePayload {
  message: string;
  versionSummary: string;
  updatedPreview?: Partial<ProjectPreviewModel>;
  updatedFiles?: Record<string, string>;
}

const HEAVY_EDIT_SYSTEM_PROMPT = `You are Qorvex, the AI editor for an already-generated React Native Expo app.
Return one strict JSON object only:
{
  "message": "Short assistant reply describing the edit",
  "versionSummary": "One-sentence version note",
  "updatedPreview": {
    "appName": "string",
    "description": "string",
    "theme": {
      "primary": "string",
      "secondary": "string",
      "accent": "string",
      "background": "string"
    },
    "navigation": {
      "type": "tabs" | "stack" | "mixed",
      "tabs": ["string"]
    },
    "screens": [
      {
        "id": "string",
        "title": "string",
        "subtitle": "string",
        "sections": [
          {
            "type": "hero" | "stats" | "list" | "chart" | "actions" | "empty",
            "title": "string",
            "body": "string",
            "value": "string",
            "cta": "string",
            "items": [{ "label": "string", "value": "string" }]
          }
        ]
      }
    ],
    "components": ["string"],
    "sampleData": {}
  },
  "updatedFiles": {
    "path/to/file.tsx": "complete file contents"
  }
}

Rules:
- Make targeted edits only. Do not regenerate the whole app unless the request clearly requires it.
- Keep responses compact and deterministic.
- Only include files that changed.
- Keep file contents complete, not diffs.
- Use updatedPreview when screens, layout, navigation, styling, or sample data change.
- No markdown, no code fences, no commentary outside JSON.`;

const LIGHTWEIGHT_EDIT_SYSTEM_PROMPT = `You are Qorvex, the AI editor for a React Native Expo app.
The user is making a small, targeted change (colors, copy, sample data, single-section layout).
Return one strict JSON object only:
{
  "message": "Short reply describing the change",
  "versionSummary": "One-sentence version note",
  "updatedPreview": {
    "appName": "string (optional)",
    "description": "string (optional)",
    "theme": {
      "primary": "CSS color string (e.g. #7c3aed)",
      "secondary": "CSS color string",
      "accent": "CSS color string",
      "background": "CSS color string — single value only (hex like #ADD8E6, rgb(...), or a single named color like lightblue)"
    },
    "navigation": { "type": "tabs", "tabs": ["string"] },
    "screens": [ ...same shape as the existing preview screens... ],
    "components": ["string"],
    "sampleData": {}
  }
}

Rules:
- Do NOT touch project files. Use updatedPreview only.
- Theme color fields MUST be plain CSS color strings. Never objects or
  multi-word values. "light blue" must be written as "#ADD8E6" or
  "lightblue" (no space). When the user names a color, output a real hex
  that matches that name.
- When you say in your "message" that you changed a color, the value in
  updatedPreview.theme MUST actually be that color. Do not claim one
  color and write a different one.
- Only include the preview fields you actually changed; omitted fields
  keep their previous value.
- Keep the response under ~400 tokens.
- No markdown, no code fences, no commentary outside JSON.`;

const SIMPLE_CHAT_SYSTEM_PROMPT = `You are Qorvex, a friendly AI editor for a React Native Expo app.
Reply in the same language the user wrote in. Be concise (1-3 sentences).
Do NOT return JSON. Do NOT propose code changes unless the user explicitly asks for one.
If asked who you are, say you are Qorvex, the AI editor for their React Native Expo app, and offer one example of what they can ask next.`;

const SIMPLE_CHAT_PATTERNS: RegExp[] = [
  /^\s*(привет|здравствуй|здравствуйте|хай|hi|hello|hey|hola|salut|ola|ciao|yo)\b/i,
  /как\s+тебя\s+зовут/i,
  /кто\s+ты/i,
  /что\s+ты\s+(умеешь|можешь|делаешь)/i,
  /^\s*(спасибо|thanks|thank you|merci|gracias)\b/i,
  /who\s+are\s+you/i,
  /what\s+can\s+you\s+do/i,
  /what'?s\s+your\s+name/i,
  /help\b/i,
  /^\s*(yes|no|ok|okay|sure|да|нет|хорошо|ясно)\s*[!?.]*\s*$/i,
];

const HEAVY_EDIT_PATTERNS: RegExp[] = [
  /\b(add|create|generate|build|implement|introduce|insert)\b/i,
  /\b(добавь|создай|сгенерируй|реализуй|внедри|сделай новый|добавить)\b/i,
  /\b(screen|page|tab|navigation|route|flow|feature|module|component|api|backend|store|model|schema)\b/i,
  /\b(экран|страница|вкладк|навигация|поток|фича|модуль|компонент|api|бэкенд|стор|модель)\b/i,
  /\b(refactor|restructure|rewrite|redesign|переработай|перепиши|перестрой|переделай)\b/i,
  /\b(login|signup|auth|profile|chat|onboarding|cart|checkout|payment|profile|регистрац|логин|авториз|чат|онбординг|корзин|оплат|профил)\b/i,
];

function classifyIntent(message: string): ChatIntent {
  const trimmed = message.trim();
  const length = trimmed.length;

  for (const pattern of SIMPLE_CHAT_PATTERNS) {
    if (pattern.test(trimmed)) return "simple_chat";
  }

  if (length <= 20 && !/[?!.]/.test(trimmed)) {
    // Very short utterances with no punctuation are usually conversational.
    return "simple_chat";
  }

  if (trimmed.endsWith("?") && length <= 80) {
    // Short questions ("что это такое?") — treat as chat unless they hit
    // the heavy patterns below.
    let heavyHit = false;
    for (const pattern of HEAVY_EDIT_PATTERNS) {
      if (pattern.test(trimmed)) {
        heavyHit = true;
        break;
      }
    }
    if (!heavyHit) return "simple_chat";
  }

  for (const pattern of HEAVY_EDIT_PATTERNS) {
    if (pattern.test(trimmed)) return "heavy_edit";
  }

  return "lightweight_edit";
}

function intentLabel(intent: ChatIntent): string {
  if (intent === "simple_chat") return "Thinking";
  if (intent === "lightweight_edit") return "Updating preview";
  return "Editing files";
}

function cleanJsonText(raw: string) {
  return raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

function truncate(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max - 3).trim()}...` : value;
}

function compactWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function pickRelevantFiles(message: string, files: Record<string, string>) {
  const visibleFiles = getVisibleProjectFiles(files);
  const keywords = compactWhitespace(message)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2);

  const scored = visibleFiles.map((path) => {
    const content = (files[path] ?? "").toLowerCase();
    const score = keywords.reduce((total, keyword) => {
      const pathHit = path.toLowerCase().includes(keyword) ? 3 : 0;
      const contentHit = content.includes(keyword) ? 1 : 0;
      return total + pathHit + contentHit;
    }, 0);
    return { path, score };
  });

  const relevant = scored
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 6)
    .map((item) => item.path);

  if (relevant.length > 0) return relevant;

  return visibleFiles.slice(0, 6);
}

function summarizeFiles(files: Record<string, string>) {
  return getVisibleProjectFiles(files)
    .slice(0, 20)
    .map((path) => {
      const content = files[path] ?? "";
      const lineCount = content.split("\n").length;
      return `- ${path} (${lineCount} lines)`;
    })
    .join("\n");
}

function buildSnippets(message: string, files: Record<string, string>) {
  return pickRelevantFiles(message, files)
    .map((path) => {
      const content = files[path] ?? "";
      const snippet = truncate(content.split("\n").slice(0, 60).join("\n"), 2500);
      return `=== ${path} ===\n${snippet}`;
    })
    .join("\n\n");
}

function extractPreviewSummary(preview: ProjectPreviewModel) {
  return JSON.stringify(
    {
      appName: preview.appName,
      description: preview.description,
      navigation: preview.navigation,
      screens: preview.screens.map((screen) => ({
        id: screen.id,
        title: screen.title,
        subtitle: screen.subtitle,
        sectionTitles: screen.sections.map((section) => section.title).slice(0, 5),
      })),
      components: preview.components,
    },
    null,
    2,
  );
}

function safeParseEditResponse(text: string): EditResponsePayload | null {
  const cleaned = cleanJsonText(text);
  try {
    return JSON.parse(cleaned) as EditResponsePayload;
  } catch {
    return null;
  }
}

function buildHistory(
  currentHistory: ProjectChatHistoryMessage[],
  userMessage: string,
  assistantMessage: string,
) {
  const nextHistory = [
    ...currentHistory,
    {
      id: `u-${Date.now()}`,
      role: "user" as const,
      content: userMessage,
      createdAt: new Date().toISOString(),
    },
    {
      id: `a-${Date.now() + 1}`,
      role: "assistant" as const,
      content: assistantMessage,
      createdAt: new Date().toISOString(),
    },
  ];

  return nextHistory.slice(-24);
}

interface ProjectContext {
  project: Project | null;
  files: Record<string, string>;
  preview: ProjectPreviewModel;
  history: ProjectChatHistoryMessage[];
}

function buildLightweightUserPrompt(
  message: string,
  context: ProjectContext,
  projectName?: string,
  projectPrompt?: string,
) {
  const recentHistory = context.history
    .slice(-4)
    .map((entry) => `${entry.role.toUpperCase()}: ${truncate(entry.content, 300)}`)
    .join("\n");

  return `Project name: ${context.project?.name ?? projectName ?? context.preview.appName}
Project description: ${
    context.project?.description ??
    context.project?.prompt ??
    projectPrompt ??
    context.preview.description
  }
User edit request: ${message}

Current preview summary:
${extractPreviewSummary(context.preview)}

Recent edit history:
${recentHistory || "(no previous edits yet)"}`;
}

function buildHeavyUserPrompt(
  message: string,
  context: ProjectContext,
  projectName?: string,
  projectPrompt?: string,
) {
  const recentHistory = context.history
    .slice(-6)
    .map((entry) => `${entry.role.toUpperCase()}: ${truncate(entry.content, 500)}`)
    .join("\n");

  return `Project name: ${context.project?.name ?? projectName ?? context.preview.appName}
Project description: ${
    context.project?.description ??
    context.project?.prompt ??
    projectPrompt ??
    context.preview.description
  }
User edit request: ${message}

Current preview summary:
${extractPreviewSummary(context.preview)}

Project file summary:
${summarizeFiles(context.files)}

Relevant file snippets:
${buildSnippets(message, context.files)}

Recent edit history:
${recentHistory || "(no previous edits yet)"}`;
}

function buildSimpleChatUserPrompt(
  message: string,
  context: ProjectContext | null,
  projectName?: string,
) {
  const appName =
    context?.project?.name ?? projectName ?? context?.preview.appName ?? "your app";
  return `User message: ${message}

Open project: ${appName}
Reply in the same language as the user message. Keep it short.`;
}

export async function POST(request: NextRequest) {
  let provider: AIProvider;
  try {
    provider = getAIProvider();
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "AI provider is not configured.",
      },
      { status: 503 },
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 500 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: ChatBody;
  try {
    body = (await request.json()) as ChatBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const trimmedMessage = body.message?.trim();
  if (!trimmedMessage) {
    return NextResponse.json({ error: "Missing message" }, { status: 400 });
  }

  const intent = classifyIntent(trimmedMessage);

  const admin = createAdminClient();
  const { data: profileData } = await admin
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single<UserProfile>();

  if (!profileData) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  let project: Project | null = null;
  let files: Record<string, string> = body.currentFiles ?? {};

  if (body.projectId) {
    const { data: projectData } = await admin
      .from("projects")
      .select("*")
      .eq("id", body.projectId)
      .eq("user_id", user.id)
      .single<Project>();

    if (!projectData) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    project = projectData;
    files = (project.generated_code ?? {}) as Record<string, string>;
  }

  // Edits require generated files. simple_chat does not.
  if (intent !== "simple_chat" && Object.keys(files).length === 0) {
    return NextResponse.json(
      { error: "No generated files found for this project yet." },
      { status: 400 },
    );
  }

  const preview =
    Object.keys(files).length === 0
      ? null
      : (parseProjectPreviewFromFiles(files) ??
        getProjectPreviewModel({
          files,
          projectName: project?.name ?? body.projectName ?? "Qorvex App",
          prompt: project?.prompt ?? body.projectPrompt ?? "",
          colors:
            project?.colors ?? {
              primary: "#7c3aed",
              secondary: "#06b6d4",
              accent: "#f59e0b",
            },
        }));

  const history =
    Object.keys(files).length === 0
      ? []
      : parseProjectChatHistoryFromFiles(files);

  const context: ProjectContext | null = preview
    ? { project, files, preview, history }
    : null;

  let usageSession:
    | Awaited<ReturnType<typeof beginAIUsageSession>>
    | null = null;

  let generationId: string | null = null;

  if (project && intent !== "simple_chat") {
    const { data: generationRow } = await admin
      .from("generations")
      .insert({
        user_id: user.id,
        project_id: project.id,
        prompt: trimmedMessage,
        model: provider.model,
        provider: provider.providerId,
        status: "processing",
      })
      .select("id")
      .maybeSingle<{ id: string }>();

    generationId = generationRow?.id ?? null;
  }

  try {
    usageSession = await beginAIUsageSession({
      admin,
      userId: user.id,
      plan: profileData.plan,
      abuseDetected: profileData.abuse_detected ?? false,
    });

    // ----- simple_chat fast path ---------------------------------------
    if (intent === "simple_chat") {
      const userPrompt = buildSimpleChatUserPrompt(
        trimmedMessage,
        context,
        body.projectName,
      );

      const estimate = provider.estimateUsage({
        prompt: `${SIMPLE_CHAT_SYSTEM_PROMPT}\n${userPrompt}`,
        maxTokens: 320,
      });
      const stageBudget = await usageSession.ensureCreditsAvailable(
        estimate.creditsUsed,
        "chat reply",
      );
      if (!stageBudget.allowed) {
        return NextResponse.json(
          {
            error:
              stageBudget.message ??
              "Your remaining daily AI credits are too low to continue right now.",
            upgradeRequired: true,
            intent,
          },
          { status: 403 },
        );
      }

      const result = await withTimeout(
        provider.generateText({
          systemPrompt: SIMPLE_CHAT_SYSTEM_PROMPT,
          prompt: userPrompt,
          maxTokens: 320,
          temperature: 0.4,
          thinkingBudget: 0,
        }),
        15000,
        "Chat reply timed out. Please try again.",
      );
      await usageSession.recordUsage(result.usage);

      const reply =
        result.text.trim() ||
        "Я Qorvex — AI-редактор твоего приложения. Спроси, что изменить, и я помогу.";

      // Save to chat history (only if we have a project / files to attach it to).
      if (project && context) {
        const nextHistory = buildHistory(context.history, trimmedMessage, reply);
        const nextFiles = withProjectChatHistoryFile(context.files, nextHistory);
        await admin
          .from("projects")
          .update({ generated_code: nextFiles })
          .eq("id", project.id);

        return NextResponse.json({
          message: reply,
          versionSummary: "",
          intent,
          history: nextHistory,
        });
      }

      return NextResponse.json({
        message: reply,
        versionSummary: "",
        intent,
      });
    }

    // ----- lightweight_edit / heavy_edit shared edit path --------------
    if (!context) {
      return NextResponse.json(
        { error: "No project context available for editing." },
        { status: 400 },
      );
    }

    const isHeavy = intent === "heavy_edit";
    const systemPrompt = isHeavy
      ? HEAVY_EDIT_SYSTEM_PROMPT
      : LIGHTWEIGHT_EDIT_SYSTEM_PROMPT;
    const userPrompt = isHeavy
      ? buildHeavyUserPrompt(
          trimmedMessage,
          context,
          body.projectName,
          body.projectPrompt,
        )
      : buildLightweightUserPrompt(
          trimmedMessage,
          context,
          body.projectName,
          body.projectPrompt,
        );
    const maxTokens = isHeavy ? 7000 : 1600;
    const timeoutMs = isHeavy ? 90_000 : 35_000;
    const timeoutMessage = isHeavy
      ? "Project edit is taking longer than 90 seconds — the AI did not finish in time. Try a smaller change or retry."
      : "Project edit timed out after 35 seconds. Try again or describe a smaller change.";

    const estimate = provider.estimateUsage({
      prompt: `${systemPrompt}\n${userPrompt}`,
      maxTokens,
    });
    const stageBudget = await usageSession.ensureCreditsAvailable(
      estimate.creditsUsed,
      isHeavy ? "heavy project edit" : "preview edit",
    );

    if (!stageBudget.allowed) {
      if (generationId) {
        await admin
          .from("generations")
          .update({
            status: "failed",
            error: stageBudget.message ?? "Insufficient daily AI credits",
          })
          .eq("id", generationId);
      }

      return NextResponse.json(
        {
          error:
            stageBudget.message ??
            "Your remaining daily AI credits are too low to continue editing this project right now.",
          upgradeRequired: true,
          intent,
        },
        { status: 403 },
      );
    }

    const result = await withTimeout(
      provider.generateText({
        systemPrompt,
        prompt: userPrompt,
        maxTokens,
        temperature: 0.2,
        thinkingBudget: intent === "heavy_edit" ? 4096 : 1024,
      }),
      timeoutMs,
      timeoutMessage,
    );
    await usageSession.recordUsage(result.usage);

    const parsed = safeParseEditResponse(result.text);
    if (!parsed) {
      if (generationId) {
        await admin
          .from("generations")
          .update({
            status: "failed",
            prompt_tokens: result.usage.promptTokens,
            completion_tokens: result.usage.completionTokens,
            tokens_used: result.usage.totalTokens,
            estimated_cost_usd: result.usage.estimatedCostUsd,
            error: "Could not parse AI edit response",
          })
          .eq("id", generationId);
      }

      return NextResponse.json(
        {
          error: "Qorvex could not parse the AI edit response. Please try again.",
          intent,
        },
        { status: 502 },
      );
    }

    const mergedPreview = parsed.updatedPreview
      ? mergeProjectPreview(context.preview, parsed.updatedPreview)
      : context.preview;
    const mergedFiles = {
      ...context.files,
      ...(isHeavy ? (parsed.updatedFiles ?? {}) : {}),
    };
    const nextHistory = buildHistory(
      context.history,
      trimmedMessage,
      parsed.message || parsed.versionSummary || "Project updated.",
    );
    const filesWithPreview = withProjectPreviewFile(mergedFiles, mergedPreview);
    const nextFiles = withProjectChatHistoryFile(filesWithPreview, nextHistory);

    if (project) {
      await admin
        .from("projects")
        .update({ generated_code: nextFiles })
        .eq("id", project.id);

      // Only heavy edits write a version snapshot — lightweight preview
      // tweaks are not worth a new app_versions row.
      if (isHeavy) {
        const { data: latestVersion } = await admin
          .from("app_versions")
          .select("version_number")
          .eq("project_id", project.id)
          .order("version_number", { ascending: false })
          .limit(1)
          .maybeSingle<{ version_number: number }>();

        await admin.from("app_versions").insert({
          project_id: project.id,
          version_number: (latestVersion?.version_number ?? 0) + 1,
          prompt: parsed.versionSummary
            ? `${trimmedMessage}\n\nSummary: ${parsed.versionSummary}`
            : trimmedMessage,
          generated_code: nextFiles,
        });
      }
    }

    if (generationId) {
      await admin
        .from("generations")
        .update({
          status: "completed",
          provider: result.usage.provider,
          model: result.usage.model,
          prompt_tokens: result.usage.promptTokens,
          completion_tokens: result.usage.completionTokens,
          tokens_used: result.usage.totalTokens,
          estimated_cost_usd: result.usage.estimatedCostUsd,
          error: null,
        })
        .eq("id", generationId);
    }

    return NextResponse.json({
      message: parsed.message || "Your project has been updated.",
      versionSummary:
        parsed.versionSummary ||
        (isHeavy
          ? "Saved a new project edit version."
          : "Updated preview only."),
      updatedPreview: mergedPreview,
      updatedFiles: nextFiles,
      history: nextHistory,
      intent,
      stage: intentLabel(intent),
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Qorvex could not update the project.";

    if (generationId) {
      await admin
        .from("generations")
        .update({
          status: "failed",
          error: message,
        })
        .eq("id", generationId);
    }

    const upgradeRequired = message.includes("daily AI credits");
    const retryable =
      message.includes("Another AI request") ||
      message.includes("too quickly") ||
      message.includes("timed out");

    return NextResponse.json(
      {
        error: message,
        upgradeRequired,
        retryable,
        intent,
      },
      { status: upgradeRequired ? 403 : retryable ? 429 : 502 },
    );
  } finally {
    if (usageSession) {
      try {
        await usageSession.release();
      } catch (error) {
        console.error("[generate chat] usage session release failed:", error);
      }
    }
  }
}
