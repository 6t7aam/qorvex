import Anthropic from "@anthropic-ai/sdk";
import { usdToCredits } from "@/lib/ai-credits";
import type {
  AICostEstimateInput,
  AIProvider,
  AITextGenerationOptions,
  AITextGenerationResult,
  AIUsage,
} from "@/lib/ai/types";

const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5";
const INPUT_COST_PER_MILLION =
  Number(process.env.ANTHROPIC_INPUT_COST_PER_MILLION ?? "3");
const OUTPUT_COST_PER_MILLION =
  Number(process.env.ANTHROPIC_OUTPUT_COST_PER_MILLION ?? "15");

function createAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY environment variable is not set. Please configure it to generate apps.",
    );
  }

  return new Anthropic({
    apiKey,
    baseURL: process.env.ANTHROPIC_BASE_URL || undefined,
  });
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
    const anthropic = createAnthropicClient();
    const response = await anthropic.messages.create({
      model: this.model,
      max_tokens: options.maxTokens ?? 8000,
      temperature: options.temperature ?? 0.2,
      system: options.systemPrompt,
      messages: [{ role: "user", content: options.prompt }],
    });

    const text = response.content
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("");

    const promptTokens =
      response.usage?.input_tokens ??
      estimatePromptTokens(`${options.systemPrompt}\n${options.prompt}`);
    const completionTokens =
      response.usage?.output_tokens ?? estimatePromptTokens(text);

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
