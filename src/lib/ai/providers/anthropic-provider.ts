import { usdToCredits } from "@/lib/ai-credits";
import type {
  AICostEstimateInput,
  AIProvider,
  AITextGenerationOptions,
  AITextGenerationResult,
  AIUsage,
} from "@/lib/ai/types";

// The "AnthropicProvider" name is kept for backwards compatibility, but this
// implementation talks to any OpenAI-compatible `/chat/completions` endpoint.
// `ANTHROPIC_BASE_URL` should therefore point at an OpenAI-compatible gateway
// (OmniRoute, OpenRouter, Gemini's openai bridge, etc.) — not the native
// Anthropic Messages API.

const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5";
const INPUT_COST_PER_MILLION =
  Number(process.env.ANTHROPIC_INPUT_COST_PER_MILLION ?? "3");
const OUTPUT_COST_PER_MILLION =
  Number(process.env.ANTHROPIC_OUTPUT_COST_PER_MILLION ?? "15");

interface OpenAIChatCompletion {
  choices?: Array<{
    message?: { content?: string | null };
    finish_reason?: string | null;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

function resolveBaseUrl(): string {
  const raw = (process.env.ANTHROPIC_BASE_URL ?? "").trim();
  if (!raw) return "https://api.anthropic.com/v1";
  return raw.replace(/\/$/, "");
}

function requireApiKey(): string {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY environment variable is not set. Please configure it to generate apps.",
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
    provider: "anthropic",
    model,
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens,
    estimatedCostUsd,
    creditsUsed: usdToCredits(estimatedCostUsd),
  };
}

export class AnthropicProvider implements AIProvider {
  readonly providerId = "anthropic";
  readonly model = DEFAULT_MODEL;

  async generateText(
    options: AITextGenerationOptions,
  ): Promise<AITextGenerationResult> {
    const apiKey = requireApiKey();
    const url = `${resolveBaseUrl()}/chat/completions`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: "system", content: options.systemPrompt },
          { role: "user", content: options.prompt },
        ],
        temperature: options.temperature ?? 0.2,
        max_tokens: options.maxTokens ?? 8000,
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(
        `AI provider request failed (${response.status} ${response.statusText}). ${text.slice(0, 500)}`.trim(),
      );
    }

    const payload = (await response.json().catch(() => null)) as
      | OpenAIChatCompletion
      | null;
    const text = payload?.choices?.[0]?.message?.content ?? "";

    const promptTokens =
      payload?.usage?.prompt_tokens ??
      estimatePromptTokens(`${options.systemPrompt}\n${options.prompt}`);
    const completionTokens =
      payload?.usage?.completion_tokens ?? estimatePromptTokens(text);

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
