import { usdToCredits } from "@/lib/ai-credits";
import type {
  AICostEstimateInput,
  AIProvider,
  AITextGenerationOptions,
  AITextGenerationResult,
  AIUsage,
} from "@/lib/ai/types";

const DEFAULT_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
const INPUT_COST_PER_MILLION = Number(
  process.env.GEMINI_INPUT_COST_PER_MILLION ?? "0.30",
);
const OUTPUT_COST_PER_MILLION = Number(
  process.env.GEMINI_OUTPUT_COST_PER_MILLION ?? "2.50",
);

interface GeminiPart {
  text?: string;
}

interface GeminiCandidate {
  content?: {
    parts?: GeminiPart[];
  };
}

interface GeminiUsageMetadata {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
}

interface GeminiGenerateContentResponse {
  candidates?: GeminiCandidate[];
  usageMetadata?: GeminiUsageMetadata;
}

function requireApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY environment variable is not set. Please configure it to generate apps.",
    );
  }
  return apiKey;
}

function estimatePromptTokens(prompt: string) {
  return Math.max(1, Math.ceil(prompt.length / 4));
}

function buildUsage(
  model: string,
  promptTokens: number,
  completionTokens: number,
): AIUsage {
  const estimatedCostUsd =
    (promptTokens / 1_000_000) * INPUT_COST_PER_MILLION +
    (completionTokens / 1_000_000) * OUTPUT_COST_PER_MILLION;

  return {
    provider: "gemini",
    model,
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens,
    estimatedCostUsd,
    creditsUsed: usdToCredits(estimatedCostUsd),
  };
}

function extractText(payload: GeminiGenerateContentResponse | null): string {
  if (!payload?.candidates?.length) return "";

  return payload.candidates
    .flatMap((candidate) => candidate.content?.parts ?? [])
    .map((part) => part.text ?? "")
    .join("")
    .trim();
}

function normalizeThinkingBudget(value?: number): number | undefined {
  if (typeof value !== "number" || Number.isNaN(value)) return undefined;
  if (value === -1) return -1;
  return Math.max(0, Math.min(24576, Math.round(value)));
}

export class GeminiProvider implements AIProvider {
  readonly providerId = "gemini";
  readonly model = DEFAULT_MODEL;

  async generateText(
    options: AITextGenerationOptions,
  ): Promise<AITextGenerationResult> {
    const apiKey = requireApiKey();
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: options.systemPrompt }],
          },
          contents: [
            {
              role: "user",
              parts: [{ text: options.prompt }],
            },
          ],
          store: false,
          generationConfig: {
            temperature: options.temperature ?? 0.2,
            maxOutputTokens: options.maxTokens ?? 8000,
            responseMimeType: options.responseMimeType,
            responseJsonSchema:
              options.responseMimeType === "application/json"
                ? options.responseSchema
                : undefined,
            thinkingConfig:
              normalizeThinkingBudget(options.thinkingBudget) !== undefined
                ? {
                    thinkingBudget: normalizeThinkingBudget(
                      options.thinkingBudget,
                    ),
                  }
                : undefined,
          },
        }),
      },
    );

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(
        `Gemini request failed (${response.status} ${response.statusText}). ${text.slice(0, 500)}`.trim(),
      );
    }

    const payload = (await response.json().catch(() => null)) as
      | GeminiGenerateContentResponse
      | null;
    const text = extractText(payload);

    const promptTokens =
      payload?.usageMetadata?.promptTokenCount ??
      estimatePromptTokens(`${options.systemPrompt}\n${options.prompt}`);
    const completionTokens =
      payload?.usageMetadata?.candidatesTokenCount ?? estimatePromptTokens(text);

    return {
      text,
      usage: buildUsage(this.model, promptTokens, completionTokens),
    };
  }

  estimateUsage(input: AICostEstimateInput): AIUsage {
    const promptTokens = estimatePromptTokens(input.prompt);
    const completionTokens = Math.max(1, input.maxTokens);
    return buildUsage(this.model, promptTokens, completionTokens);
  }
}
